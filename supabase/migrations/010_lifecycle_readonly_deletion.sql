-- ============================================================================
-- 010_lifecycle_readonly_deletion.sql
-- Abo-Lebenszyklus, Etappe 2:
--   * Lesemodus-Fenster (access_until) nach Abo-Ende / Trial-Ablauf
--   * Erinnerungs-/Löschzeitstempel
--   * DSGVO-Löschprotokoll ohne Personenbezug
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Neue Lebenszyklus-Spalten auf users
--    access_until      – Ende des Lesezugriffs (now()+6 Monate bei Abo-Ende/Trial)
--    deletion_warned_at – letzte Löschankündigungs-Mail
--    deleted_at        – Soft-Marker (wird gesetzt, unmittelbar bevor gelöscht wird)
-- ----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS access_until       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deletion_warned_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at         TIMESTAMPTZ;

-- Häufige Lebenszyklus-Abfragen (readonly-Nutzer, Löschkandidaten).
CREATE INDEX IF NOT EXISTS idx_users_access_until ON users (access_until);

-- ----------------------------------------------------------------------------
-- 2) DSGVO-Löschprotokoll
--    Nur ein SHA-256-Hash der user_id + Zeitpunkt – kein Personenbezug, aber
--    Nachweis, dass und wann gelöscht wurde. Kein RLS-Zugriff für Endnutzer.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deletion_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_hash TEXT NOT NULL,
    deleted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;
-- Absichtlich keine Policy: nur der Service-Role-Key (Cron) schreibt/liest.

-- ----------------------------------------------------------------------------
-- Hinweis zum täglichen Lauf
-- ----------------------------------------------------------------------------
-- Der Lebenszyklus (Trial→Lesemodus, Erinnerungsmails, Löschung) wird NICHT in
-- der DB, sondern in der Route  POST /api/cron/lifecycle  ausgeführt (dort sind
-- Brevo- und Stripe-SDK verfügbar). Auslösung: täglicher Coolify-Scheduled-Task
--   curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" \
--        https://<domain>/api/cron/lifecycle
-- Details siehe CLAUDE.md. (Alternativ ließe sich der Aufruf via pg_cron + pg_net
-- anstoßen; der Scheduled-Task ist hier der robustere, besser sichtbare Weg.)
