-- ============================================================================
-- Vermieter-SaaS – PostgreSQL Schema (v1, MVP-Fundament)
-- Ziel-Umgebung: Supabase (PostgreSQL 15+)
-- Konventionen:
--   * UUID-Primärschlüssel (gen_random_uuid)
--   * Geldbeträge als NUMERIC(12,2) – niemals FLOAT bei Finanzen
--   * Alle Mandanten-Tabellen tragen user_id für Row Level Security
--   * updated_at wird per Trigger automatisch gepflegt
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUM-Typen
-- ----------------------------------------------------------------------------

CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'business');

CREATE TYPE subscription_status AS ENUM (
    'trialing', 'active', 'past_due', 'canceled', 'incomplete'
);

CREATE TYPE unit_type AS ENUM ('residential', 'commercial', 'parking', 'other');

CREATE TYPE deposit_type AS ENUM (
    'cash_deposit',        -- Barkaution / Kautionskonto
    'bank_guarantee',      -- Bankbürgschaft
    'deposit_insurance',   -- Kautionsversicherung
    'pledged_savings',     -- Verpfändetes Sparbuch
    'none'
);

CREATE TYPE task_interval AS ENUM (
    'once', 'weekly', 'monthly', 'quarterly', 'semiannually', 'yearly'
);

CREATE TYPE task_status AS ENUM ('open', 'done', 'overdue');

-- Umlageschlüssel gem. § 556a BGB / BetrKV
CREATE TYPE allocation_key AS ENUM (
    'living_area',     -- nach Wohn-/Nutzfläche (m²)
    'persons',         -- nach Personenzahl
    'units',           -- nach Anzahl Einheiten
    'consumption',     -- nach Verbrauch (Zählerstände)
    'ownership_share', -- nach Miteigentumsanteilen (MEA)
    'direct'           -- Direktzuordnung zu einer Einheit
);

-- Kostenarten in Anlehnung an § 2 BetrKV
CREATE TYPE operating_cost_type AS ENUM (
    'property_tax',            -- Grundsteuer
    'water_supply',            -- Wasserversorgung
    'drainage',                -- Entwässerung
    'heating',                 -- Heizung
    'hot_water',               -- Warmwasser
    'elevator',                -- Aufzug
    'street_cleaning',         -- Straßenreinigung
    'waste_disposal',          -- Müllbeseitigung
    'building_cleaning',       -- Gebäudereinigung
    'garden_maintenance',      -- Gartenpflege
    'lighting',                -- Beleuchtung (Allgemeinstrom)
    'chimney_sweep',           -- Schornsteinfeger
    'insurance',               -- Sach- und Haftpflichtversicherung
    'caretaker',               -- Hauswart
    'cable_tv_internet',       -- Kabel/Antenne
    'laundry_facilities',      -- Waschküche
    'other_operating_costs',   -- Sonstige Betriebskosten (§ 2 Nr. 17 BetrKV)
    'non_apportionable'        -- Nicht umlagefähig (Verwaltung, Instandhaltung)
);

-- ----------------------------------------------------------------------------
-- Trigger-Funktion: updated_at automatisch setzen
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1) users – Vermieter & SaaS-Abo-Status
--    Hinweis Supabase: auth.users hält die Credentials; diese Tabelle ist das
--    öffentliche Profil + Abo-Daten, verknüpft 1:1 über dieselbe UUID.
-- ----------------------------------------------------------------------------

CREATE TABLE users (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                TEXT NOT NULL UNIQUE
                         CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    full_name            TEXT NOT NULL,
    company_name         TEXT,                          -- optional: Firmierung
    phone                TEXT,
    -- Absenderdaten für Mahnungen / Abrechnungen (Briefkopf)
    address_street       TEXT,
    address_zip          TEXT,
    address_city         TEXT,
    iban                 TEXT,                          -- Ziel-Konto für Mieten
    -- SaaS / Billing
    plan                 subscription_plan NOT NULL DEFAULT 'free',
    subscription_status  subscription_status NOT NULL DEFAULT 'trialing',
    stripe_customer_id   TEXT UNIQUE,
    trial_ends_at        TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 2) properties – Liegenschaften / Gebäude
-- ----------------------------------------------------------------------------

CREATE TABLE properties (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                 TEXT NOT NULL,                 -- z. B. "MFH Schützenstr. 12"
    street               TEXT NOT NULL,
    house_number         TEXT NOT NULL,
    zip                  TEXT NOT NULL CHECK (zip ~ '^[0-9]{5}$'),
    city                 TEXT NOT NULL,
    country              TEXT NOT NULL DEFAULT 'DE',
    build_year           SMALLINT CHECK (build_year BETWEEN 1800 AND 2100),
    total_living_area    NUMERIC(10,2) CHECK (total_living_area > 0),  -- m², Basis Umlage
    notes                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);

CREATE INDEX idx_properties_user ON properties(user_id);

CREATE TRIGGER trg_properties_updated
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3) units – Wohn-/Gewerbeeinheiten
-- ----------------------------------------------------------------------------

CREATE TABLE units (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id          UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Denormalisiert für RLS
    label                TEXT NOT NULL,                 -- z. B. "EG links", "WE 03"
    unit_type            unit_type NOT NULL DEFAULT 'residential',
    floor                TEXT,                          -- "EG", "1. OG", "DG"
    living_area          NUMERIC(8,2) CHECK (living_area > 0),   -- m²
    rooms                NUMERIC(3,1) CHECK (rooms > 0),         -- 2.5 Zimmer möglich
    ownership_share      NUMERIC(10,4),                 -- MEA (z. B. 125.5000 / 1000)
    notes                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (property_id, label)
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_user ON units(user_id);

CREATE TRIGGER trg_units_updated
    BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 4) tenants – Mietverhältnisse
--    Modelliert das Mietverhältnis (nicht nur die Person): move_out_date NULL
--    = aktives Verhältnis. Historie bleibt für NK-Abrechnung erhalten
--    (zeitanteilige Abrechnung bei Mieterwechsel!).
-- ----------------------------------------------------------------------------

CREATE TABLE tenants (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id                   UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name                TEXT NOT NULL,
    last_name                 TEXT NOT NULL,
    email                     TEXT CHECK (email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    phone                     TEXT,
    persons_count             SMALLINT NOT NULL DEFAULT 1 CHECK (persons_count > 0), -- Umlageschlüssel "Personen"
    -- Vertragsdaten
    move_in_date              DATE NOT NULL,
    move_out_date             DATE CHECK (move_out_date IS NULL OR move_out_date >= move_in_date),
    cold_rent                 NUMERIC(12,2) NOT NULL CHECK (cold_rent >= 0),          -- aktuelle Kaltmiete
    operating_costs_advance   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (operating_costs_advance >= 0), -- NK-Vorauszahlung
    heating_costs_advance     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (heating_costs_advance >= 0),   -- optional separat
    rent_due_day              SMALLINT NOT NULL DEFAULT 3 CHECK (rent_due_day BETWEEN 1 AND 28),     -- Fälligkeit (§ 556b BGB: 3. Werktag)
    -- Kaution
    deposit_type              deposit_type NOT NULL DEFAULT 'cash_deposit',
    deposit_amount            NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
    deposit_paid              BOOLEAN NOT NULL DEFAULT false,
    iban                      TEXT,                     -- für Kautions-/Guthaben-Rückzahlung
    notes                     TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_unit ON tenants(unit_id);
CREATE INDEX idx_tenants_user ON tenants(user_id);
-- Schneller Zugriff auf aktive Mietverhältnisse (Mieteingangskontrolle)
CREATE INDEX idx_tenants_active ON tenants(unit_id) WHERE move_out_date IS NULL;

-- Pro Einheit maximal EIN aktives Mietverhältnis
CREATE UNIQUE INDEX uq_tenants_one_active_per_unit
    ON tenants(unit_id) WHERE move_out_date IS NULL;

CREATE TRIGGER trg_tenants_updated
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 5) task_templates – Vorlagen für wiederkehrende Aufgaben
--    Beispiele:
--      * "Mieteingangskontrolle" – monthly, day_of_month=1
--      * "Wasseruhren ablesen"   – yearly, month_of_year=12, day_of_month=28
-- ----------------------------------------------------------------------------

CREATE TABLE task_templates (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Scope: NULL = gilt global für den Vermieter; sonst je Objekt/Einheit
    property_id          UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id              UUID REFERENCES units(id) ON DELETE CASCADE,
    title                TEXT NOT NULL,
    description          TEXT,
    interval             task_interval NOT NULL,
    day_of_month         SMALLINT CHECK (day_of_month BETWEEN 1 AND 31),
    month_of_year        SMALLINT CHECK (month_of_year BETWEEN 1 AND 12),   -- nur bei yearly/semiannually relevant
    lead_time_days       SMALLINT NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0), -- Task X Tage vor Fälligkeit erzeugen
    next_run_at          DATE,                          -- vom Scheduler gepflegt
    is_active            BOOLEAN NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- unit gehört logisch zu property; nie unit ohne Kontext-Konsistenz prüfen wir in App/Trigger,
    -- aber yearly braucht einen Monat:
    CONSTRAINT chk_yearly_needs_month
        CHECK (interval NOT IN ('yearly') OR month_of_year IS NOT NULL)
);

CREATE INDEX idx_task_templates_user ON task_templates(user_id);
CREATE INDEX idx_task_templates_next_run ON task_templates(next_run_at) WHERE is_active;

CREATE TRIGGER trg_task_templates_updated
    BEFORE UPDATE ON task_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 6) generated_tasks – Konkrete To-Dos
--    Erzeugt per pg_cron/Edge Function aus task_templates ODER manuell/ad-hoc
--    (template_id dann NULL). Status 'overdue' setzt ein täglicher Job für
--    alle offenen Tasks mit due_date < CURRENT_DATE.
-- ----------------------------------------------------------------------------

CREATE TABLE generated_tasks (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id          UUID REFERENCES task_templates(id) ON DELETE SET NULL,
    property_id          UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id              UUID REFERENCES units(id) ON DELETE CASCADE,
    title                TEXT NOT NULL,
    description          TEXT,
    due_date             DATE NOT NULL,
    status               task_status NOT NULL DEFAULT 'open',
    completed_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Konsistenz: erledigt <=> Zeitstempel vorhanden
    CONSTRAINT chk_completed_consistency
        CHECK ((status = 'done') = (completed_at IS NOT NULL))
);

CREATE INDEX idx_generated_tasks_user_status ON generated_tasks(user_id, status);
CREATE INDEX idx_generated_tasks_due ON generated_tasks(due_date) WHERE status = 'open';
-- Idempotenz: verhindert Duplikate, wenn der Scheduler doppelt läuft
CREATE UNIQUE INDEX uq_generated_tasks_template_due
    ON generated_tasks(template_id, due_date) WHERE template_id IS NOT NULL;

CREATE TRIGGER trg_generated_tasks_updated
    BEFORE UPDATE ON generated_tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 7) operating_costs_records – Belege für die Nebenkostenabrechnung
--    Jede Zeile = eine Rechnung/ein Beleg innerhalb eines Abrechnungszeitraums.
--    Der NK-Wizard aggregiert je Kostenart + Umlageschlüssel und verteilt
--    zeitanteilig auf die Mietverhältnisse (tenants.move_in/move_out).
-- ----------------------------------------------------------------------------

CREATE TABLE operating_costs_records (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id          UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    -- Bei allocation_key = 'direct': Kosten exakt einer Einheit zuordnen
    unit_id              UUID REFERENCES units(id) ON DELETE SET NULL,
    cost_type            operating_cost_type NOT NULL,
    allocation_key       allocation_key NOT NULL DEFAULT 'living_area',
    -- Abrechnungszeitraum (i. d. R. Kalenderjahr, § 556 Abs. 3 BGB: max. 12 Monate)
    billing_period_start DATE NOT NULL,
    billing_period_end   DATE NOT NULL,
    amount               NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    is_apportionable     BOOLEAN NOT NULL DEFAULT true,  -- umlagefähig ja/nein
    vendor               TEXT,                           -- Rechnungssteller
    invoice_number       TEXT,
    invoice_date         DATE,
    receipt_url          TEXT,                           -- Beleg in Supabase Storage
    notes                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_billing_period
        CHECK (billing_period_end > billing_period_start
               AND billing_period_end <= billing_period_start + INTERVAL '12 months'),
    CONSTRAINT chk_direct_needs_unit
        CHECK (allocation_key <> 'direct' OR unit_id IS NOT NULL)
);

CREATE INDEX idx_occ_records_property_period
    ON operating_costs_records(property_id, billing_period_start, billing_period_end);
CREATE INDEX idx_occ_records_user ON operating_costs_records(user_id);

CREATE TRIGGER trg_occ_records_updated
    BEFORE UPDATE ON operating_costs_records
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (Supabase Multi-Tenancy)
-- Muster: jeder Vermieter sieht ausschließlich seine eigenen Daten.
-- ----------------------------------------------------------------------------

ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties              ENABLE ROW LEVEL SECURITY;
ALTER TABLE units                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_costs_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self ON users
    FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY properties_owner ON properties
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY units_owner ON units
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY tenants_owner ON tenants
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY task_templates_owner ON task_templates
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY generated_tasks_owner ON generated_tasks
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY occ_records_owner ON operating_costs_records
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

COMMIT;

-- ============================================================================
-- AUSBLICK SESSION 2 (bewusst noch nicht enthalten):
--   * rent_payments      – Soll/Ist-Mieteingänge je Mietverhältnis & Monat
--                          (Grundlage für Mieteingangskontrolle & Verzugserkennung)
--   * dunning_letters    – erzeugte Mahnungen (Stufe 1/2/3, PDF-URL, Versanddatum)
--   * meter_readings     – Zählerstände für allocation_key = 'consumption'
--   * billing_statements – finalisierte NK-Abrechnungen (Snapshot je Mieter/Jahr)
-- ============================================================================
