-- ============================================================================
-- Migration 022 – PDF-Fußzeile abschaltbar
-- Aufbauend auf 001 (users). Ausführen im Supabase SQL Editor bzw. via
-- `npm run db:migrate`.
--
-- Alle erzeugten PDFs (NK-Abrechnung, Mahnung, Vorlagen, Übergabeprotokoll)
-- tragen eine dezente Fußzeile „Erstellt mit tefter · tefter.de". Über dieses
-- Flag (Einstellungen → Dokumente) kann sie je Nutzer abgeschaltet werden.
-- ============================================================================

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pdf_footer_enabled BOOLEAN NOT NULL DEFAULT true;

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='users' AND column_name='pdf_footer_enabled';
-- ============================================================================
