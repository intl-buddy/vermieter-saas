-- ============================================================================
-- 013_onboarding.sql
-- Geführtes Onboarding für neue Nutzer.
--   * users.onboarding_completed – steuert die Auto-Weiterleitung nach dem
--     Login auf /willkommen (nur solange false).
--   * Bestandsnutzer mit mindestens einem Objekt gelten als eingerichtet und
--     werden auf true gesetzt, damit sie das Onboarding nicht erneut sehen.
-- Idempotent – gefahrlos mehrfach ausführbar.
-- ============================================================================

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Bestandsnutzer mit mindestens einem Objekt haben das Onboarding faktisch
-- schon hinter sich.
UPDATE users u
SET onboarding_completed = true
WHERE onboarding_completed = false
  AND EXISTS (SELECT 1 FROM properties p WHERE p.user_id = u.id);

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='users' AND column_name='onboarding_completed';
--   SELECT onboarding_completed, count(*) FROM users GROUP BY 1;
-- ============================================================================
