-- ============================================================================
-- Migration 007 – Vorauszahlungs-Modus & Herkunft der Vorauszahlungen
--   * tenants.advance_mode: 'split' (NK + HK getrennt) oder 'combined'
--     (Betriebskosten gesamt; heating_costs_advance dann 0).
--   * billing_statements.prepayments_source: 'calculated' | 'manual'
--     (Nachvollziehbarkeit manuell eingetragener Vorauszahlungen im Wizard).
-- ============================================================================

BEGIN;

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS advance_mode TEXT NOT NULL DEFAULT 'split'
        CHECK (advance_mode IN ('split', 'combined'));

ALTER TABLE billing_statements
    ADD COLUMN IF NOT EXISTS prepayments_source TEXT NOT NULL DEFAULT 'calculated'
        CHECK (prepayments_source IN ('calculated', 'manual'));

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='tenants' AND column_name='advance_mode';
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='billing_statements' AND column_name='prepayments_source';
-- ============================================================================
