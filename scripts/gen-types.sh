#!/usr/bin/env bash
# ============================================================================
# scripts/gen-types.sh – database.types.ts sicher aus der Live-DB erzeugen.
#
# Erzeugt die TypeScript-Typen mit postgres-meta (ohne installierte
# Supabase-CLI) direkt auf dem Server: per ssh startet ein einmaliger
# `docker run` das postgres-meta-Image im Generierungsmodus
# (PG_META_GENERATE_TYPES=typescript). Es verbindet sich über das
# Docker-Netz mit dem Supabase-DB-Container und schreibt die Typen nach stdout.
#
# Sicher gegen Leerlauf: Die Ausgabe landet zuerst in einer Temp-Datei und wird
# erst nach einer Plausibilitätsprüfung (nicht leer, enthält „export type
# Database") über packages/core/src/database.types.ts gelegt. Schlägt irgendein
# Schritt fehl, bleibt die bestehende Datei UNVERÄNDERT.
#
# Konfiguration: .env.deploy im Repo-Wurzelverzeichnis (gitignored, dieselbe
# Datei wie für scripts/migrate.sh). Vorlage: .env.deploy.example.
#
# Aufruf:  npm run gen-types
# ============================================================================
set -euo pipefail

# --- Repo-Wurzel & Konfiguration -------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.deploy"
OUT_FILE="$ROOT_DIR/packages/core/src/database.types.ts"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ $ENV_FILE fehlt. Lege sie nach dem Muster von .env.deploy.example an." >&2
  exit 1
fi

# .env.deploy laden (alle Zuweisungen exportieren).
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

# Optionale Werte mit Standardwerten (können in .env.deploy übersteuert werden).
DB_USER="${DB_USER:-supabase_admin}"
DB_NAME="${DB_NAME:-postgres}"
PG_META_IMAGE="${PG_META_IMAGE:-public.ecr.aws/supabase/postgres-meta:v0.96.6}"
PG_META_NETWORK="${PG_META_NETWORK:-f80nqvlu9w3pmn80or3b4kz7}"
PG_META_DB_HOST="${PG_META_DB_HOST:-supabase-db-f80nqvlu9w3pmn80or3b4kz7}"
PG_META_DB_PORT="${PG_META_DB_PORT:-5432}"
PG_META_SCHEMAS="${PG_META_SCHEMAS:-public}"

# Pflichtwerte prüfen.
missing=()
[[ -n "${SSH_HOST:-}" ]]    || missing+=("SSH_HOST")
[[ -n "${DB_PASSWORD:-}" ]] || missing+=("DB_PASSWORD")
if (( ${#missing[@]} > 0 )); then
  echo "✗ In .env.deploy fehlen: ${missing[*]}" >&2
  exit 1
fi

# --- Passwort für die URL prozentkodieren (ASCII-sicher) -------------------
urlencode() {
  local string="$1" strlen pos c o
  strlen=${#string}
  local LC_ALL=C
  for (( pos = 0; pos < strlen; pos++ )); do
    c=${string:pos:1}
    case "$c" in
      [-_.~a-zA-Z0-9]) o="$c" ;;
      *) printf -v o '%%%02X' "'$c" ;;
    esac
    printf '%s' "$o"
  done
}

DB_PASSWORD_ENC="$(urlencode "$DB_PASSWORD")"
PG_META_DB_URL="postgresql://${DB_USER}:${DB_PASSWORD_ENC}@${PG_META_DB_HOST}:${PG_META_DB_PORT}/${DB_NAME}"

echo "→ Erzeuge Typen über $SSH_HOST"
echo "  Image:  $PG_META_IMAGE"
echo "  Netz:   $PG_META_NETWORK"
echo "  DB:     ${DB_USER}@${PG_META_DB_HOST}:${PG_META_DB_PORT}/${DB_NAME} (Schema: $PG_META_SCHEMAS)"

# --- Temp-Dateien & Aufräumen ----------------------------------------------
TMP_OUT="$(mktemp)"
TMP_ERR="$(mktemp)"
cleanup() { rm -f "$TMP_OUT" "$TMP_ERR"; }
trap cleanup EXIT

# --- postgres-meta im Generierungsmodus starten ----------------------------
# Die Werte sind serverseitig in Single-Quotes gefasst; das prozentkodierte
# Passwort enthält keine Single-Quotes mehr.
if ! ssh "$SSH_HOST" "docker run --rm --network '$PG_META_NETWORK' \
  -e PG_META_DB_URL='$PG_META_DB_URL' \
  -e PG_META_GENERATE_TYPES=typescript \
  -e PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS='$PG_META_SCHEMAS' \
  '$PG_META_IMAGE'" >"$TMP_OUT" 2>"$TMP_ERR"; then
  echo "✗ Typgenerierung fehlgeschlagen (ssh / docker run)." >&2
  echo "  Fehlerausgabe:" >&2
  sed 's/^/    /' "$TMP_ERR" >&2
  echo "  → $OUT_FILE bleibt UNVERÄNDERT." >&2
  exit 1
fi

# --- Plausibilitätsprüfung der Ausgabe -------------------------------------
if [[ ! -s "$TMP_OUT" ]]; then
  echo "✗ Leere Ausgabe von postgres-meta." >&2
  echo "  Fehlerausgabe:" >&2
  sed 's/^/    /' "$TMP_ERR" >&2
  echo "  → $OUT_FILE bleibt UNVERÄNDERT." >&2
  exit 1
fi

if ! grep -q "export type Database" "$TMP_OUT"; then
  echo "✗ Ausgabe sieht nicht nach TypeScript-Typen aus (kein 'export type Database')." >&2
  echo "  Erste Zeilen der Ausgabe:" >&2
  head -n 20 "$TMP_OUT" | sed 's/^/    /' >&2
  echo "  → $OUT_FILE bleibt UNVERÄNDERT." >&2
  exit 1
fi

lines="$(wc -l < "$TMP_OUT" | tr -d '[:space:]')"
if (( lines < 50 )); then
  echo "✗ Ausgabe unplausibel kurz ($lines Zeilen)." >&2
  echo "  → $OUT_FILE bleibt UNVERÄNDERT." >&2
  exit 1
fi

# --- Erst jetzt die Zieldatei ersetzen -------------------------------------
mv "$TMP_OUT" "$OUT_FILE"
echo "✓ $OUT_FILE aktualisiert ($lines Zeilen)."
echo "  Bitte 'git diff' prüfen und das Ergebnis committen."
