-- ============================================================================
-- 018_terms_consent.sql
-- Zustimmung zu AGB / Datenschutz / AVV bei der Registrierung.
--   * users.terms_accepted_at – Zeitpunkt der Zustimmung.
--   * handle_new_user-Trigger übernimmt den Zeitpunkt aus den bei signUp
--     gesetzten User-Metadaten (raw_user_meta_data.terms_accepted_at).
-- Idempotent – gefahrlos mehrfach ausführbar.
-- ============================================================================

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Trigger-Funktion neu anlegen: setzt zusätzlich terms_accepted_at aus den
-- Metadaten (leer → NULL). Rest unverändert (Profil + 14-Tage-Testzeitraum).
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        id, email, full_name, plan, subscription_status, trial_ends_at,
        terms_accepted_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), ''),
        'trial',
        'trialing',
        now() + interval '14 days',
        NULLIF(NEW.raw_user_meta_data ->> 'terms_accepted_at', '')::timestamptz
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='users' AND column_name='terms_accepted_at';
-- ============================================================================
