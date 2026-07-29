-- ============================================================================
-- Migration 026 – Selbstlöschung des Kontos
--
-- Fügt users.deletion_requested_at hinzu. Setzt ein Nutzer die Löschung in den
-- Einstellungen aktiv aus, wird hier der Zeitpunkt vermerkt. Der tägliche
-- Lebenszyklus-Lauf (POST /api/cron/lifecycle) löscht das Konto endgültig,
-- sobald der Zeitpunkt länger als 7 Tage (DELETION_GRACE_DAYS) zurückliegt –
-- über DIESELBE Löschroutine wie beim Ablauf der Lesefrist. Ein erfolgreicher
-- Login innerhalb der Frist setzt das Feld wieder auf NULL (Abbruch).
--
-- Ausführen mit `npm run db:migrate` bzw. im Supabase SQL Editor.
-- ============================================================================

BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.deletion_requested_at IS
    'Zeitpunkt der vom Nutzer selbst angeforderten Konto-Löschung. NULL = keine '
    'Löschung vorgemerkt. Löschung erfolgt nach 7 Tagen Karenz im Lifecycle-Lauf; '
    'ein Login innerhalb der Frist setzt das Feld zurück auf NULL.';

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='users' AND column_name='deletion_requested_at';
-- ============================================================================
