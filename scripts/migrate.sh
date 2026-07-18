#!/usr/bin/env bash
# ============================================================================
# scripts/migrate.sh – Migrationen gegen die Live-DB einspielen.
#
# Liest supabase/migrations/, vergleicht sie mit der Tracking-Tabelle
# schema_migrations in der Produktions-DB (via ssh + docker exec + psql),
# zeigt ausstehende Migrationen an und spielt sie nach einer Rückfrage in
# aufsteigender Reihenfolge ein. Zum Schluss wird /api/health geprüft.
#
# Konfiguration: .env.deploy im Repo-Wurzelverzeichnis (gitignored). Vorlage:
# .env.deploy.example.
#
# Aufruf:  npm run db:migrate
# ============================================================================
set -euo pipefail

# --- Repo-Wurzel & Konfiguration -------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MIG_DIR="$ROOT_DIR/supabase/migrations"
ENV_FILE="$ROOT_DIR/.env.deploy"

# Baseline: Migrationen bis einschließlich dieser Nummer gelten beim ersten
# Lauf als bereits ausgeführt (sie sind längst in der Produktion). Alles
# darüber wird als ausstehend erkannt.
BASELINE_THROUGH=16

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ $ENV_FILE fehlt. Lege sie nach dem Muster von .env.deploy.example an." >&2
  exit 1
fi

# .env.deploy laden (alle Zuweisungen exportieren).
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

# Optionale Werte mit Standardwerten.
DB_USER="${DB_USER:-supabase_admin}"
DB_NAME="${DB_NAME:-postgres}"
HEALTH_URL="${HEALTH_URL:-https://app.tefter.de}"

# Pflichtwerte prüfen.
missing=()
[[ -n "${SSH_HOST:-}" ]]            || missing+=("SSH_HOST")
[[ -n "${DB_CONTAINER_FILTER:-}" ]] || missing+=("DB_CONTAINER_FILTER")
[[ -n "${DB_PASSWORD:-}" ]]         || missing+=("DB_PASSWORD")
if (( ${#missing[@]} > 0 )); then
  echo "✗ In .env.deploy fehlen: ${missing[*]}" >&2
  exit 1
fi

# --- Remote-psql-Helfer -----------------------------------------------------
# Führt psql im Supabase-DB-Container auf dem Server aus. SQL kommt über stdin
# (Pipe oder Datei-Redirect), zusätzliche psql-Flags als erstes Argument.
remote_psql() {
  ssh "$SSH_HOST" "docker exec -i -e PGPASSWORD='$DB_PASSWORD' \
\$(docker ps -qf name='$DB_CONTAINER_FILTER' | head -n1) \
psql $1 -U '$DB_USER' -d '$DB_NAME'"
}

# Einzelnen Skalar/Spaltenwert abfragen (tuples-only, unaligned).
query() {
  printf '%s' "$1" | remote_psql "-tA -v ON_ERROR_STOP=1"
}

echo "→ Verbinde mit $SSH_HOST (Container: $DB_CONTAINER_FILTER, DB: $DB_NAME)"

# --- Tracking-Tabelle sicherstellen / Baseline setzen ----------------------
table_exists="$(query "SELECT to_regclass('public.schema_migrations') IS NOT NULL;" | tr -d '[:space:]')"

if [[ "$table_exists" != "t" ]]; then
  printf 'Erststart: Tracking-Tabelle schema_migrations wird angelegt und 001–%03d als Baseline markiert.\n' "$BASELINE_THROUGH"
  printf 'CREATE TABLE IF NOT EXISTS public.schema_migrations (name text PRIMARY KEY, executed_at timestamptz NOT NULL DEFAULT now());' \
    | remote_psql "-q -v ON_ERROR_STOP=1"

  baseline_values=""
  for f in "$MIG_DIR"/*.sql; do
    base="$(basename "$f")"
    num="${base%%_*}"
    # Führende Nullen als Dezimalzahl interpretieren.
    if [[ "$num" =~ ^[0-9]+$ ]] && (( 10#$num <= BASELINE_THROUGH )); then
      baseline_values+="('$base', now()),"
    fi
  done
  baseline_values="${baseline_values%,}"
  if [[ -n "$baseline_values" ]]; then
    printf 'INSERT INTO public.schema_migrations(name, executed_at) VALUES %s ON CONFLICT (name) DO NOTHING;' "$baseline_values" \
      | remote_psql "-q -v ON_ERROR_STOP=1"
  fi
fi

# --- Ausstehende Migrationen ermitteln -------------------------------------
executed="$(printf 'SELECT name FROM public.schema_migrations;' | remote_psql "-tA -v ON_ERROR_STOP=1")"

pending=()
for f in "$MIG_DIR"/*.sql; do
  base="$(basename "$f")"
  if ! grep -qxF "$base" <<< "$executed"; then
    pending+=("$f")
  fi
done

# --- /api/health-Prüfung ----------------------------------------------------
check_health() {
  echo "→ Prüfe $HEALTH_URL/api/health"
  local out
  if out="$(curl -fsS "$HEALTH_URL/api/health")"; then
    echo "  $out"
  else
    echo "  ⚠️ /api/health nicht erreichbar oder nicht ok (degraded/error?). Bitte manuell prüfen."
  fi
}

if (( ${#pending[@]} == 0 )); then
  echo "✓ Keine ausstehenden Migrationen – die Datenbank ist aktuell."
  check_health
  exit 0
fi

echo ""
echo "Ausstehende Migrationen (${#pending[@]}):"
for f in "${pending[@]}"; do
  echo "  • $(basename "$f")"
done
echo ""

# --- Rückfrage --------------------------------------------------------------
read -r -p "Ausführen? (y/n) " answer
if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
  echo "Abgebrochen – nichts geändert."
  exit 0
fi

# --- Einspielen -------------------------------------------------------------
for f in "${pending[@]}"; do
  base="$(basename "$f")"
  echo "▶ $base"
  if remote_psql "-q -v ON_ERROR_STOP=1" < "$f"; then
    printf "INSERT INTO public.schema_migrations(name) VALUES ('%s') ON CONFLICT (name) DO NOTHING;" "$base" \
      | remote_psql "-q -v ON_ERROR_STOP=1"
    echo "  ✓ eingespielt und vermerkt"
  else
    echo "  ✗ Fehler bei $base – Abbruch. Bereits eingespielte Migrationen bleiben vermerkt." >&2
    exit 1
  fi
done

echo ""
echo "✓ Alle ausstehenden Migrationen eingespielt."
check_health
