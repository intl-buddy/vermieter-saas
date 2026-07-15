-- ============================================================================
-- Migration 008 – billing_statements: Spalten-Bereinigung
--   * total_35a_household / total_35a_craftsman: historisch, durch
--     labor_35a_household / labor_35a_craftsman ersetzt und ungenutzt → DROP.
--   * occupancy_start / occupancy_end / occupancy_days bleiben (nullable) und
--     werden ab jetzt vom Abschluss-Schritt befüllt (Miettage im Snapshot).
-- ============================================================================

BEGIN;

ALTER TABLE billing_statements
    DROP COLUMN IF EXISTS total_35a_household,
    DROP COLUMN IF EXISTS total_35a_craftsman;

-- occupancy-Spalten sicherstellen (nullable), falls auf Alt-DB nicht vorhanden.
ALTER TABLE billing_statements
    ADD COLUMN IF NOT EXISTS occupancy_start DATE,
    ADD COLUMN IF NOT EXISTS occupancy_end   DATE,
    ADD COLUMN IF NOT EXISTS occupancy_days  INTEGER;

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='billing_statements'
--       AND column_name IN ('total_35a_household','total_35a_craftsman',
--                           'occupancy_start','occupancy_end','occupancy_days');
--   -- erwartet: nur die drei occupancy-Spalten
-- ============================================================================
