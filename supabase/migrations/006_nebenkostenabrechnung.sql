-- ============================================================================
-- Migration 006 – Nebenkostenabrechnung (Wizard)
-- Aufbauend auf 001/005. Ausführen im Supabase SQL Editor.
--   * tenant_person_periods – Personenzahl-Historie je Mietverhältnis
--   * billing_runs          – Abrechnungsläufe je Objekt & Zeitraum
--   * billing_statements     – Einzelabrechnungen je Mieter (Snapshot + PDF)
--   * operating_costs_records – §35a-Spalten (Lohnanteil + Kategorie)
--   * Storage-Bucket „statements"
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- ENUMs
-- ----------------------------------------------------------------------------
CREATE TYPE type_35a_category AS ENUM (
    'none',
    'household_service',   -- haushaltsnahe Dienstleistung (§ 35a Abs. 2 EStG)
    'craftsman_service'    -- Handwerkerleistung (§ 35a Abs. 3 EStG)
);

CREATE TYPE billing_run_status AS ENUM ('draft', 'finalized');

-- ----------------------------------------------------------------------------
-- operating_costs_records: §35a-Anteile
-- ----------------------------------------------------------------------------
ALTER TABLE operating_costs_records
    ADD COLUMN IF NOT EXISTS labor_cost_35a NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (labor_cost_35a >= 0),
    ADD COLUMN IF NOT EXISTS type_35a type_35a_category NOT NULL DEFAULT 'none';

-- ----------------------------------------------------------------------------
-- tenant_person_periods – tagesgenaue Personenzahl-Historie
-- ----------------------------------------------------------------------------
CREATE TABLE tenant_person_periods (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    valid_from    DATE NOT NULL,
    valid_to      DATE NOT NULL,
    persons_count SMALLINT NOT NULL CHECK (persons_count > 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_tpp_range CHECK (valid_to >= valid_from)
);

CREATE INDEX idx_tpp_tenant ON tenant_person_periods(tenant_id, valid_from);
CREATE INDEX idx_tpp_user ON tenant_person_periods(user_id);

CREATE TRIGGER trg_tpp_updated
    BEFORE UPDATE ON tenant_person_periods
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- billing_runs – ein Abrechnungslauf je Objekt & Zeitraum
-- ----------------------------------------------------------------------------
CREATE TABLE billing_runs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    status        billing_run_status NOT NULL DEFAULT 'finalized',
    total_costs   NUMERIC(12,2) NOT NULL DEFAULT 0,
    tenant_count  INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_billing_run_period CHECK (period_end > period_start)
);

CREATE INDEX idx_billing_runs_user ON billing_runs(user_id);
CREATE INDEX idx_billing_runs_property ON billing_runs(property_id, period_start);

CREATE TRIGGER trg_billing_runs_updated
    BEFORE UPDATE ON billing_runs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- billing_statements – Einzelabrechnung je Mieter (Snapshot + PDF)
-- ----------------------------------------------------------------------------
CREATE TABLE billing_statements (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    billing_run_id         UUID NOT NULL REFERENCES billing_runs(id) ON DELETE CASCADE,
    tenant_id              UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    unit_id                UUID REFERENCES units(id) ON DELETE SET NULL,
    total_share            NUMERIC(12,2) NOT NULL DEFAULT 0,  -- Betriebskostenanteil (ohne Heizung)
    heating_costs          NUMERIC(12,2) NOT NULL DEFAULT 0,
    prepayments_operating  NUMERIC(12,2) NOT NULL DEFAULT 0,
    prepayments_heating    NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance                NUMERIC(12,2) NOT NULL DEFAULT 0,  -- > 0 = Nachzahlung
    labor_35a_household    NUMERIC(12,2) NOT NULL DEFAULT 0,
    labor_35a_craftsman    NUMERIC(12,2) NOT NULL DEFAULT 0,
    line_items             JSONB NOT NULL DEFAULT '[]',
    pdf_url                TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_statements_run ON billing_statements(billing_run_id);
CREATE INDEX idx_billing_statements_user ON billing_statements(user_id);
CREATE INDEX idx_billing_statements_tenant ON billing_statements(tenant_id);

CREATE TRIGGER trg_billing_statements_updated
    BEFORE UPDATE ON billing_statements
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- Storage-Bucket „statements" (privat)
--   Pfad: {user_id}/{statement_id}.pdf
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('statements', 'statements', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "statements_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'statements'
           AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "statements_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'statements'
                AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "statements_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'statements'
           AND (storage.foldername(name))[1] = (SELECT auth.uid()::text))
    WITH CHECK (bucket_id = 'statements'
                AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "statements_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'statements'
           AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE tenant_person_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_runs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_statements    ENABLE ROW LEVEL SECURITY;

CREATE POLICY tpp_owner ON tenant_person_periods
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY billing_runs_owner ON billing_runs
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY billing_statements_owner ON billing_statements
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT tablename FROM pg_tables WHERE schemaname='public'
--     AND tablename IN ('tenant_person_periods','billing_runs','billing_statements');
--   SELECT id, public FROM storage.buckets WHERE id='statements';
-- ============================================================================
