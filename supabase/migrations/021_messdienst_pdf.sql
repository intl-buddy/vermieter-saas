-- ============================================================================
-- Migration 021 – Messdienst-Einzelabrechnung als Anlage
-- Aufbauend auf 006 (billing_statements). Ausführen im Supabase SQL Editor bzw.
-- via `npm run db:migrate`.
--
-- Im Heizkosten-Schritt des NK-Wizards kann je Mietverhältnis optional die
-- Einzelabrechnung des Messdienstleisters (z. B. Techem, ista) als PDF
-- hochgeladen werden. Sie wird beim Finalisieren an das Mieter-PDF angehängt.
-- Der Storage-Pfad (Bucket „statements", {user_id}/messdienst/...) wird hier
-- referenziert.
-- ============================================================================

BEGIN;

ALTER TABLE billing_statements
    ADD COLUMN IF NOT EXISTS messdienst_pdf_url TEXT;

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='billing_statements' AND column_name='messdienst_pdf_url';
-- ============================================================================
