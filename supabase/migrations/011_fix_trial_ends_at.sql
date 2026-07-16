-- ============================================================================
-- 011_fix_trial_ends_at.sql
-- Bugfix: Neue Accounts im aktiven Testzeitraum hatten teils kein
-- trial_ends_at gesetzt und wurden dadurch fälschlich als „ohne Schreibzugriff"
-- behandelt. Diese Migration:
--   * stellt den Spalten-Default sicher,
--   * stellt den handle_new_user-Trigger sicher (setzt trial_ends_at),
--   * füllt bestehende NULL-Werte auf created_at + 14 Tage nach.
-- Idempotent – gefahrlos mehrfach ausführbar.
-- ============================================================================

-- 1) Default für neue Zeilen sicherstellen.
ALTER TABLE users
    ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '14 days');

-- 2) Trigger-Funktion erneut anlegen (setzt Testzeitraum bei Registrierung).
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

-- 3) Bestehende Accounts ohne Testzeitraum nachtragen: created_at + 14 Tage.
--    Nur unberührte Accounts (kein Abo, keine Lesefrist), damit niemand
--    versehentlich einen neuen Trial „geschenkt" bekommt.
UPDATE users
SET trial_ends_at = created_at + interval '14 days'
WHERE trial_ends_at IS NULL
  AND subscription_id IS NULL
  AND access_until IS NULL;
