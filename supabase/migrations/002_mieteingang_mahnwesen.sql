-- ============================================================================
-- Migration 002 – Mieteingang & Mahnwesen
-- Aufbauend auf schema.sql (v1). Ausführen im Supabase SQL Editor.
-- Entscheidungen (Session 2026-07):
--   * Soll-Stellungen als Snapshot je Monat (Mieterhöhungen wirken ab Folgemonat)
--   * Zahlungen: manuell + CSV-Import vorbereitet (import_hash für Dedup)
--   * Zuordnung Zahlungen -> Monate: automatisch FIFO (berechnet, nicht gespeichert)
--   * Mahnwesen: 3 Stufen (Zahlungserinnerung, Mahnung, letzte Mahnung)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- ENUM-Typen
-- ----------------------------------------------------------------------------

CREATE TYPE charge_source AS ENUM ('auto', 'manual');

CREATE TYPE payment_source AS ENUM ('manual', 'csv_import');

CREATE TYPE payer_type AS ENUM (
    'tenant',      -- Mieter selbst
    'jobcenter',   -- Direktzahlung Jobcenter / Sozialamt (§ 22 SGB II)
    'other'        -- Bürge, Angehörige, sonstige
);

CREATE TYPE dunning_status AS ENUM (
    'draft',       -- erzeugt, noch nicht versendet
    'sent',        -- versendet
    'resolved',    -- Forderung beglichen
    'obsolete'     -- gegenstandslos (z. B. Storno, Kulanz)
);

-- ----------------------------------------------------------------------------
-- 1) rent_charges – Soll-Stellungen (eine Zeile je Mietverhältnis & Monat)
--    Beträge sind ein SNAPSHOT aus tenants zum Erzeugungszeitpunkt.
-- ----------------------------------------------------------------------------

CREATE TABLE rent_charges (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period                    DATE NOT NULL,          -- immer der 1. des Monats
    due_date                  DATE NOT NULL,          -- Fälligkeit (tenants.rent_due_day)
    cold_rent                 NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cold_rent >= 0),
    operating_costs_advance   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (operating_costs_advance >= 0),
    heating_costs_advance     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (heating_costs_advance >= 0),
    total_amount              NUMERIC(12,2) GENERATED ALWAYS AS
                              (cold_rent + operating_costs_advance + heating_costs_advance) STORED,
    source                    charge_source NOT NULL DEFAULT 'auto',
    notes                     TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_period_first_of_month CHECK (EXTRACT(DAY FROM period) = 1),
    -- Idempotenz: pro Mietverhältnis & Monat genau eine Soll-Stellung
    CONSTRAINT uq_charge_tenant_period UNIQUE (tenant_id, period)
);

CREATE INDEX idx_rent_charges_user ON rent_charges(user_id);
CREATE INDEX idx_rent_charges_tenant_period ON rent_charges(tenant_id, period);

CREATE TRIGGER trg_rent_charges_updated
    BEFORE UPDATE ON rent_charges
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 2) rent_payments – Ist-Zahlungen
--    Bewusst NICHT an einen Monat gekoppelt (Teilzahlungen, Sammelzahlungen).
--    CSV-Import vorbereitet: source, import_hash (Dedup), bank_reference.
-- ----------------------------------------------------------------------------

CREATE TABLE rent_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount <> 0),  -- negativ = Rückbuchung/Storno
    paid_at         DATE NOT NULL,                               -- Wertstellung
    payer           payer_type NOT NULL DEFAULT 'tenant',
    source          payment_source NOT NULL DEFAULT 'manual',
    bank_reference  TEXT,                                        -- Verwendungszweck aus dem Kontoauszug
    import_hash     TEXT,                                        -- Hash der CSV-Zeile; verhindert Doppel-Import
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rent_payments_user ON rent_payments(user_id);
CREATE INDEX idx_rent_payments_tenant_date ON rent_payments(tenant_id, paid_at);
-- Dedup nur für importierte Zeilen erzwingen
CREATE UNIQUE INDEX uq_rent_payments_import_hash
    ON rent_payments(import_hash) WHERE import_hash IS NOT NULL;

CREATE TRIGGER trg_rent_payments_updated
    BEFORE UPDATE ON rent_payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3) dunning_letters – Mahnungen (3 Stufen)
-- ----------------------------------------------------------------------------

CREATE TABLE dunning_letters (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    level             SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 3),
    -- 1 = Zahlungserinnerung, 2 = Mahnung, 3 = letzte Mahnung (ggf. Kündigungsandrohung)
    issued_at         DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_deadline  DATE NOT NULL,
    amount_due        NUMERIC(12,2) NOT NULL CHECK (amount_due > 0),  -- offener Betrag zum Mahnzeitpunkt
    fee               NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
    covered_periods   DATE[] NOT NULL DEFAULT '{}',                   -- gemahnte Monate (Nachvollziehbarkeit)
    status            dunning_status NOT NULL DEFAULT 'draft',
    pdf_url           TEXT,                                           -- Supabase Storage
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_deadline_after_issue CHECK (payment_deadline > issued_at)
);

CREATE INDEX idx_dunning_user ON dunning_letters(user_id);
CREATE INDEX idx_dunning_tenant ON dunning_letters(tenant_id, level);

CREATE TRIGGER trg_dunning_updated
    BEFORE UPDATE ON dunning_letters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 4) Salden-View – Gesamtsaldo je Mietverhältnis
--    security_invoker: RLS der Basistabellen greift auch durch die View.
-- ----------------------------------------------------------------------------

CREATE VIEW tenant_balances
WITH (security_invoker = true) AS
SELECT
    t.id                                   AS tenant_id,
    t.user_id,
    t.unit_id,
    t.first_name,
    t.last_name,
    COALESCE(c.total_due, 0)               AS total_due,
    COALESCE(p.total_paid, 0)              AS total_paid,
    COALESCE(c.total_due, 0)
      - COALESCE(p.total_paid, 0)          AS balance          -- > 0 = Rückstand
FROM tenants t
LEFT JOIN (
    SELECT tenant_id, SUM(total_amount) AS total_due
    FROM rent_charges GROUP BY tenant_id
) c ON c.tenant_id = t.id
LEFT JOIN (
    SELECT tenant_id, SUM(amount) AS total_paid
    FROM rent_payments GROUP BY tenant_id
) p ON p.tenant_id = t.id;

-- ----------------------------------------------------------------------------
-- 5) FIFO-Zuordnung – offene Soll-Stellungen je Mietverhältnis
--    Älteste Forderung wird zuerst getilgt. Berechnet, nicht gespeichert.
--    open_amount = Anteil der Soll-Stellung, der nach FIFO noch offen ist.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION open_charges(p_tenant_id UUID)
RETURNS TABLE (
    charge_id    UUID,
    period       DATE,
    due_date     DATE,
    total_amount NUMERIC(12,2),
    open_amount  NUMERIC(12,2)
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    WITH paid AS (
        SELECT COALESCE(SUM(amount), 0) AS total_paid
        FROM rent_payments
        WHERE tenant_id = p_tenant_id
    ),
    ordered AS (
        SELECT
            c.id, c.period, c.due_date, c.total_amount,
            SUM(c.total_amount) OVER (ORDER BY c.period) AS cum_due
        FROM rent_charges c
        WHERE c.tenant_id = p_tenant_id
    )
    SELECT
        o.id,
        o.period,
        o.due_date,
        o.total_amount,
        LEAST(o.total_amount, GREATEST(0, o.cum_due - p.total_paid))::NUMERIC(12,2) AS open_amount
    FROM ordered o CROSS JOIN paid p
    WHERE (o.cum_due - p.total_paid) > 0
    ORDER BY o.period;
$$;

-- ----------------------------------------------------------------------------
-- 6) Monatliche Soll-Stellungs-Generierung (für pg_cron)
--    SECURITY DEFINER: läuft ohne User-Session (Cron), umgeht RLS bewusst.
--    Idempotent durch uq_charge_tenant_period.
--    Vereinfachung MVP: volle Monate (kein anteiliger Ein-/Auszugsmonat).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_monthly_charges()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period     DATE := date_trunc('month', CURRENT_DATE)::DATE;
    v_period_end DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    v_count      INTEGER;
BEGIN
    INSERT INTO rent_charges (
        user_id, tenant_id, period, due_date,
        cold_rent, operating_costs_advance, heating_costs_advance, source
    )
    SELECT
        t.user_id,
        t.id,
        v_period,
        (v_period + (t.rent_due_day - 1) * INTERVAL '1 day')::DATE,
        t.cold_rent,
        t.operating_costs_advance,
        t.heating_costs_advance,
        'auto'
    FROM tenants t
    WHERE t.move_in_date <= v_period_end
      AND (t.move_out_date IS NULL OR t.move_out_date >= v_period)
    ON CONFLICT (tenant_id, period) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Cron-Job: am 1. jedes Monats um 03:00 Uhr (einmalig einrichten):
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   SELECT cron.schedule('generate-rent-charges', '0 3 1 * *',
--          $$SELECT generate_monthly_charges();$$);
-- Für den laufenden Monat sofort erzeugen:
--   SELECT generate_monthly_charges();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

ALTER TABLE rent_charges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dunning_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY rent_charges_owner ON rent_charges
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY rent_payments_owner ON rent_payments
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY dunning_letters_owner ON dunning_letters
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

COMMIT;

-- ============================================================================
-- VERIFIKATION nach dem Einspielen:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'
--     AND tablename IN ('rent_charges','rent_payments','dunning_letters');
--   SELECT generate_monthly_charges();   -- erzeugt Soll für aktive Mietverhältnisse
--   SELECT * FROM tenant_balances;
-- ============================================================================
