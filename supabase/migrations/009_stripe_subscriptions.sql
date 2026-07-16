-- ============================================================================
-- 009_stripe_subscriptions.sql
-- Stripe-Abo-Integration, Etappe 1:
--   * users um Stripe-Abo-Felder erweitern
--   * Tarif-Enum (subscription_plan) auf die tefter-Pakete umstellen
--   * Testzeitraum (14 Tage) automatisch bei der Registrierung setzen
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Neue Abo-Spalten auf users
-- ----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS subscription_id      TEXT,
    ADD COLUMN IF NOT EXISTS price_id             TEXT,
    ADD COLUMN IF NOT EXISTS current_period_end   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

-- ----------------------------------------------------------------------------
-- 2) subscription_plan-Enum migrieren
--    alt: 'free','starter','pro','business'
--    neu: 'trial','bronze','silber','gold','platin','enterprise'
--    Bestehende Nutzer werden ausnahmslos auf 'trial' gesetzt.
-- ----------------------------------------------------------------------------
ALTER TABLE users ALTER COLUMN plan DROP DEFAULT;

ALTER TYPE subscription_plan RENAME TO subscription_plan_old;

CREATE TYPE subscription_plan AS ENUM (
    'trial', 'bronze', 'silber', 'gold', 'platin', 'enterprise'
);

-- Alle bestehenden Werte auf 'trial' abbilden.
ALTER TABLE users
    ALTER COLUMN plan TYPE subscription_plan
    USING 'trial'::subscription_plan;

ALTER TABLE users ALTER COLUMN plan SET DEFAULT 'trial';

DROP TYPE subscription_plan_old;

-- ----------------------------------------------------------------------------
-- 3) Testzeitraum: 14 Tage ab Registrierung
--    Default für neue Zeilen + Backfill bestehender NULL-Werte.
-- ----------------------------------------------------------------------------
ALTER TABLE users
    ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '14 days');

UPDATE users
SET trial_ends_at = now() + interval '14 days'
WHERE trial_ends_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4) handle_new_user-Trigger
--    Legt bei jeder Registrierung (auth.users INSERT) automatisch das
--    öffentliche Profil an und setzt den 14-Tage-Testzeitraum. SECURITY DEFINER,
--    damit der Insert die RLS umgeht. ON CONFLICT DO NOTHING, damit der
--    bestehende App-seitige Upsert (ensureUserRecord) kollisionsfrei bleibt.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        id, email, full_name, plan, subscription_status, trial_ends_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), ''),
        'trial',
        'trialing',
        now() + interval '14 days'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
