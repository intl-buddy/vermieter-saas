-- ============================================================================
-- Migration 020 – Direktzuordnung an ein Mietverhältnis
-- Aufbauend auf 001 (operating_costs_records). Ausführen im Supabase SQL Editor
-- bzw. via `npm run db:migrate`.
--
-- Bisher konnte der Umlageschlüssel „direct" nur einer EINHEIT zugeordnet
-- werden (chk_direct_needs_unit). Neu: Direktzuordnung wahlweise an eine
-- Einheit ODER an ein Mietverhältnis (tenant_id). Bei tenant_id verteilt die
-- NK-Berechnung die Kosten zu 100 % auf dieses Mietverhältnis – unabhängig von
-- den Miettagen.
-- ============================================================================

BEGIN;

-- Neue nullable-Spalte: Direktzuordnung an ein Mietverhältnis.
ALTER TABLE operating_costs_records
    ADD COLUMN IF NOT EXISTS tenant_id UUID
        REFERENCES tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_occ_records_tenant
    ON operating_costs_records(tenant_id);

-- „direct" verlangt jetzt entweder eine Einheit ODER ein Mietverhältnis.
ALTER TABLE operating_costs_records
    DROP CONSTRAINT IF EXISTS chk_direct_needs_unit;
ALTER TABLE operating_costs_records
    ADD CONSTRAINT chk_direct_needs_unit
        CHECK (
            allocation_key <> 'direct'
            OR unit_id IS NOT NULL
            OR tenant_id IS NOT NULL
        );

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='operating_costs_records' AND column_name='tenant_id';
--   SELECT conname FROM pg_constraint WHERE conname='chk_direct_needs_unit';
-- ============================================================================
