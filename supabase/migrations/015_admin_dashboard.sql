-- ============================================================================
-- 015_admin_dashboard.sql
-- Admin-Dashboard (/admin).
--   * users.is_admin – wird ausschließlich per SQL gesetzt (kein UI).
--   * admin_stats() / admin_stats_by_city() – SECURITY-DEFINER-Aggregate über
--     ALLE Nutzer (RLS-übergreifend), aber nur Summen/Gruppierungen, KEINE
--     personenbezogenen Einzeldaten. Jede Funktion prüft intern das is_admin-
--     Flag des Aufrufers und wirft sonst eine Exception.
-- Idempotent – gefahrlos mehrfach ausführbar.
-- ============================================================================

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- ----------------------------------------------------------------------------
-- Interner Wächter: ist der aktuelle Aufrufer Admin?
--   SECURITY DEFINER, damit die users-Zeile RLS-übergreifend gelesen werden
--   kann. Nur intern von den Aggregatfunktionen genutzt.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_caller()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_admin FROM users WHERE id = auth.uid()),
        false
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin_caller() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_caller() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_stats() – Gesamtzahlen über alle Nutzer.
--   Zugriffsstatus (trial/active/readonly/locked) wird exakt wie
--   getAccessStatus (packages/core) berechnet (Kulanzfrist 7 Tage).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;

    WITH status AS (
        SELECT
            CASE
                WHEN subscription_status = 'active' THEN 'active'
                WHEN subscription_status = 'trialing' AND subscription_id IS NOT NULL THEN 'active'
                WHEN cancel_at_period_end AND current_period_end IS NOT NULL
                     AND current_period_end > now() THEN 'active'
                WHEN subscription_status = 'past_due' AND current_period_end IS NOT NULL
                     AND now() < current_period_end + interval '7 days' THEN 'active'
                WHEN subscription_status <> 'canceled' AND trial_ends_at IS NOT NULL
                     AND trial_ends_at > now() THEN 'trial'
                WHEN access_until IS NOT NULL AND access_until > now() THEN 'readonly'
                ELSE 'locked'
            END AS access_status,
            created_at
        FROM users
    ),
    active_tenancies AS (
        SELECT cold_rent, operating_costs_advance, heating_costs_advance
        FROM tenants
        WHERE move_out_date IS NULL
    )
    SELECT jsonb_build_object(
        'users_total', (SELECT count(*) FROM status),
        'users_trial', (SELECT count(*) FROM status WHERE access_status = 'trial'),
        'users_active', (SELECT count(*) FROM status WHERE access_status = 'active'),
        'users_readonly', (SELECT count(*) FROM status WHERE access_status = 'readonly'),
        'users_last_7', (SELECT count(*) FROM status WHERE created_at >= now() - interval '7 days'),
        'users_last_30', (SELECT count(*) FROM status WHERE created_at >= now() - interval '30 days'),
        'properties_total', (SELECT count(*) FROM properties),
        'units_total', (SELECT count(*) FROM units),
        'active_tenancies', (SELECT count(*) FROM active_tenancies),
        'sum_cold_rent', COALESCE((SELECT sum(cold_rent) FROM active_tenancies), 0),
        'sum_prepayments', COALESCE((SELECT sum(operating_costs_advance + heating_costs_advance) FROM active_tenancies), 0)
    )
    INTO result;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_stats_by_city() – Kennzahlen je Stadt (normalisiert: getrimmt +
--   vereinheitlichte Groß-/Kleinschreibung).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_stats_by_city()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(rows)), '[]'::jsonb)
    INTO result
    FROM (
        SELECT
            initcap(btrim(p.city)) AS city,
            count(DISTINCT p.id) AS properties,
            count(DISTINCT u.id) AS units,
            count(t.id) FILTER (WHERE t.move_out_date IS NULL) AS active_tenancies,
            CASE
                WHEN COALESCE(sum(u.living_area) FILTER (
                        WHERE t.move_out_date IS NULL AND u.living_area > 0), 0) > 0
                THEN round(
                        sum(t.cold_rent) FILTER (
                            WHERE t.move_out_date IS NULL AND u.living_area > 0)
                        / sum(u.living_area) FILTER (
                            WHERE t.move_out_date IS NULL AND u.living_area > 0),
                        2)
                ELSE NULL
            END AS avg_rent_per_sqm
        FROM properties p
        LEFT JOIN units u ON u.property_id = p.id
        LEFT JOIN tenants t ON t.unit_id = u.id
        GROUP BY initcap(btrim(p.city))
        ORDER BY count(DISTINCT u.id) DESC, city
    ) rows;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_stats_by_city() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_stats_by_city() TO authenticated, service_role;

COMMIT;

-- PostgREST-Schema-Cache neu laden, damit die RPCs sofort erreichbar sind.
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFIKATION (im SQL Editor, als Admin-Nutzer):
--   UPDATE users SET is_admin = true WHERE email = 'DEINE@MAIL';
--   SELECT admin_stats();
--   SELECT admin_stats_by_city();
--   -- Als Nicht-Admin müssen beide mit „Nicht autorisiert" fehlschlagen.
-- ============================================================================
