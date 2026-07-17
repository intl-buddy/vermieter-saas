-- ============================================================================
-- 017_admin_analytics.sql
-- Admin-Analytics Phase 1 (/novipazar).
--   * admin_metrics_snapshots – täglicher Verlaufs-Snapshot (MRR & Volumina).
--   * admin_price_catalog – Spiegel der price_id → Monatsbeitrag/Intervall.
--     Die Preise liegen im PLANS-Objekt (Code) und die price_ids in Env-Vars;
--     der nächtliche DB-Job kennt beides nicht. Der Katalog wird deshalb von
--     der Route (Admin-Besuch) via admin_sync_price_catalog() aktuell gehalten,
--     sodass capture_admin_snapshot() den MRR ohne App berechnen kann.
--   * SECURITY-DEFINER-Aggregatfunktionen mit is_admin-Prüfung – keine
--     Einzeldaten, nur Summen/Verteilungen.
--   * pg_cron: täglicher Snapshot 04:00.
-- Idempotent – gefahrlos mehrfach ausführbar.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Tabellen
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_metrics_snapshots (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date      DATE NOT NULL UNIQUE,
    users_total        INTEGER NOT NULL DEFAULT 0,
    users_trial        INTEGER NOT NULL DEFAULT 0,
    users_active_sub   INTEGER NOT NULL DEFAULT 0,
    users_readonly     INTEGER NOT NULL DEFAULT 0,
    mrr_gross          NUMERIC(12,2) NOT NULL DEFAULT 0,
    objects_total      INTEGER NOT NULL DEFAULT 0,
    units_total        INTEGER NOT NULL DEFAULT 0,
    tenancies_active   INTEGER NOT NULL DEFAULT 0,
    dunnings_total     INTEGER NOT NULL DEFAULT 0,
    billing_runs_total INTEGER NOT NULL DEFAULT 0,
    protocols_total    INTEGER NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nur über SECURITY-DEFINER-Funktionen zugänglich (kein direkter Endnutzer-Zugriff).
ALTER TABLE admin_metrics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS admin_price_catalog (
    price_id         TEXT PRIMARY KEY,
    monthly_gross    NUMERIC(12,2) NOT NULL DEFAULT 0,
    billing_interval TEXT NOT NULL DEFAULT 'monthly'
        CHECK (billing_interval IN ('monthly', 'yearly'))
);
ALTER TABLE admin_price_catalog ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- admin_sync_price_catalog(jsonb) – Katalog aus PLANS+Env aktuell halten.
--   Erwartet [{"price_id":"price_…","monthly_gross":9.99,"interval":"monthly"}].
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_sync_price_catalog(p_entries jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;

    INSERT INTO admin_price_catalog (price_id, monthly_gross, billing_interval)
    SELECT
        e.price_id,
        e.monthly_gross,
        COALESCE(e.billing_interval, 'monthly')
    FROM jsonb_to_recordset(p_entries)
        AS e(price_id text, monthly_gross numeric, billing_interval text)
    WHERE e.price_id IS NOT NULL
    ON CONFLICT (price_id) DO UPDATE
        SET monthly_gross = EXCLUDED.monthly_gross,
            billing_interval = EXCLUDED.billing_interval;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_sync_price_catalog(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_sync_price_catalog(jsonb) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Zugriffsstatus je Nutzer als wiederverwendbarer Ausdruck (wie getAccessStatus,
-- Kulanz 7 Tage). Als Set-Returning-Helper für die Aggregate.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_user_access_status()
RETURNS TABLE (user_id uuid, access_status text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        id,
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
        END,
        created_at
    FROM users;
$$;

REVOKE ALL ON FUNCTION public.admin_user_access_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_user_access_status() TO service_role;

-- ----------------------------------------------------------------------------
-- capture_admin_snapshot() – schreibt den Tages-Snapshot (idempotent).
--   Dual-Kontext: von pg_cron OHNE Auth aufgerufen (erlaubt) und von der Route
--   durch einen Admin (erlaubt); ein eingeloggter Nicht-Admin wird abgelehnt.
--   MRR aus admin_price_catalog (siehe Kopf).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.capture_admin_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Cron hat keine auth.uid(); ein eingeloggter Aufrufer muss Admin sein.
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;

    INSERT INTO admin_metrics_snapshots AS s (
        snapshot_date, users_total, users_trial, users_active_sub, users_readonly,
        mrr_gross, objects_total, units_total, tenancies_active,
        dunnings_total, billing_runs_total, protocols_total
    )
    SELECT
        current_date,
        (SELECT count(*) FROM users),
        (SELECT count(*) FROM admin_user_access_status() WHERE access_status = 'trial'),
        (SELECT count(*) FROM admin_user_access_status() WHERE access_status = 'active'),
        (SELECT count(*) FROM admin_user_access_status() WHERE access_status = 'readonly'),
        COALESCE((
            SELECT sum(cnt * c.monthly_gross)
            FROM (
                SELECT price_id, count(*) AS cnt
                FROM users
                WHERE subscription_status = 'active'
                   OR (subscription_status = 'trialing' AND subscription_id IS NOT NULL)
                GROUP BY price_id
            ) subs
            JOIN admin_price_catalog c ON c.price_id = subs.price_id
        ), 0),
        (SELECT count(*) FROM properties),
        (SELECT count(*) FROM units),
        (SELECT count(*) FROM tenants WHERE move_out_date IS NULL),
        (SELECT count(*) FROM dunning_letters),
        (SELECT count(*) FROM billing_runs),
        (SELECT count(*) FROM handover_protocols)
    ON CONFLICT (snapshot_date) DO UPDATE SET
        users_total = EXCLUDED.users_total,
        users_trial = EXCLUDED.users_trial,
        users_active_sub = EXCLUDED.users_active_sub,
        users_readonly = EXCLUDED.users_readonly,
        mrr_gross = EXCLUDED.mrr_gross,
        objects_total = EXCLUDED.objects_total,
        units_total = EXCLUDED.units_total,
        tenancies_active = EXCLUDED.tenancies_active,
        dunnings_total = EXCLUDED.dunnings_total,
        billing_runs_total = EXCLUDED.billing_runs_total,
        protocols_total = EXCLUDED.protocols_total;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_admin_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_admin_snapshot() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_metrics_history() – Snapshots als JSON (für den MRR-Verlauf).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_metrics_history()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(r) ORDER BY r.snapshot_date), '[]'::jsonb)
    INTO result
    FROM (
        SELECT snapshot_date, mrr_gross, users_total, users_active_sub
        FROM admin_metrics_snapshots
        ORDER BY snapshot_date
    ) r;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_metrics_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_metrics_history() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_funnel_stats() – Registrierungen/Woche, Aktivierung, Onboarding,
--   Trial→Paid (Konversion + Ø Tage, approximiert).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_funnel_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;

    SELECT jsonb_build_object(
        'users_total', (SELECT count(*) FROM users),
        'users_with_object', (SELECT count(DISTINCT user_id) FROM properties),
        'users_with_active_tenancy', (SELECT count(DISTINCT user_id) FROM tenants WHERE move_out_date IS NULL),
        'onboarding_completed', (SELECT count(*) FROM users WHERE onboarding_completed),
        'users_with_sub', (SELECT count(*) FROM users WHERE subscription_id IS NOT NULL),
        'avg_trial_to_paid_days', (
            SELECT round(avg(days))
            FROM (
                SELECT GREATEST(
                    0,
                    (u.current_period_end
                        - CASE WHEN c.billing_interval = 'yearly'
                               THEN interval '12 months' ELSE interval '1 month' END
                    )::date - u.created_at::date
                ) AS days
                FROM users u
                LEFT JOIN admin_price_catalog c ON c.price_id = u.price_id
                WHERE u.subscription_id IS NOT NULL
                  AND u.current_period_end IS NOT NULL
            ) d
        ),
        'registrations_weekly', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object('week_start', w::date, 'count', COALESCE(c.cnt, 0))
                ORDER BY w
            ), '[]'::jsonb)
            FROM generate_series(
                date_trunc('week', now()) - interval '11 weeks',
                date_trunc('week', now()),
                interval '1 week'
            ) w
            LEFT JOIN (
                SELECT date_trunc('week', created_at) AS wk, count(*) AS cnt
                FROM users GROUP BY 1
            ) c ON c.wk = w
        )
    ) INTO result;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_funnel_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_funnel_stats() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_feature_usage() – Gesamtzähler + „davon letzte 30 Tage" je Feature.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_feature_usage()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    cutoff timestamptz := now() - interval '30 days';
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;

    SELECT jsonb_build_object(
        'dunnings', jsonb_build_object(
            'total', (SELECT count(*) FROM dunning_letters),
            'last_30', (SELECT count(*) FROM dunning_letters WHERE created_at >= cutoff)),
        'billing_runs', jsonb_build_object(
            'total', (SELECT count(*) FROM billing_runs),
            'last_30', (SELECT count(*) FROM billing_runs WHERE created_at >= cutoff)),
        'protocols', jsonb_build_object(
            'total', (SELECT count(*) FROM handover_protocols),
            'last_30', (SELECT count(*) FROM handover_protocols WHERE created_at >= cutoff)),
        'receipts', jsonb_build_object(
            'total', (SELECT count(*) FROM operating_costs_records),
            'last_30', (SELECT count(*) FROM operating_costs_records WHERE created_at >= cutoff)),
        'tasks', jsonb_build_object(
            'total', (SELECT count(*) FROM generated_tasks),
            'last_30', (SELECT count(*) FROM generated_tasks WHERE created_at >= cutoff))
    ) INTO result;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_feature_usage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_feature_usage() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_portfolio_distribution() – Nutzer nach Einheitenzahl (Paketgrenzen).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_portfolio_distribution()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;

    WITH counts AS (
        SELECT u.id,
               COALESCE(c.units, 0) AS units
        FROM users u
        LEFT JOIN (
            SELECT user_id, count(*) AS units FROM units GROUP BY user_id
        ) c ON c.user_id = u.id
    ),
    bucketed AS (
        SELECT CASE
            WHEN units = 0 THEN '0'
            WHEN units BETWEEN 1 AND 3 THEN '1-3'
            WHEN units BETWEEN 4 AND 5 THEN '4-5'
            WHEN units BETWEEN 6 AND 10 THEN '6-10'
            WHEN units BETWEEN 11 AND 20 THEN '11-20'
            ELSE '21+'
        END AS bucket
        FROM counts
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('bucket', b.bucket, 'count', COALESCE(cnt.c, 0))
        ORDER BY b.ord
    ), '[]'::jsonb)
    INTO result
    FROM (VALUES ('0',1),('1-3',2),('4-5',3),('6-10',4),('11-20',5),('21+',6)) AS b(bucket, ord)
    LEFT JOIN (
        SELECT bucket, count(*) AS c FROM bucketed GROUP BY bucket
    ) cnt ON cnt.bucket = b.bucket;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_portfolio_distribution() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_portfolio_distribution() TO authenticated, service_role;

COMMIT;

-- PostgREST-Schema-Cache neu laden.
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- Initialen Snapshot einmalig erzeugen (MRR erst nach erstem Katalog-Sync > 0).
-- ----------------------------------------------------------------------------
SELECT public.capture_admin_snapshot();

-- ----------------------------------------------------------------------------
-- pg_cron: täglicher Snapshot 04:00. Setzt voraus, dass die Extension pg_cron
-- aktiviert ist (Supabase: Database → Extensions → pg_cron). Ist sie nicht
-- aktiv, wird der Job übersprungen – dann Extension aktivieren und diesen
-- DO-Block erneut ausführen.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'admin-daily-snapshot',
            '0 4 * * *',
            'SELECT public.capture_admin_snapshot();'
        );
    ELSE
        RAISE NOTICE 'pg_cron nicht aktiv – täglicher Snapshot-Job wurde NICHT eingerichtet.';
    END IF;
END $$;

-- ============================================================================
-- VERIFIKATION (als Admin):
--   SELECT admin_metrics_history();
--   SELECT admin_funnel_stats();
--   SELECT admin_feature_usage();
--   SELECT admin_portfolio_distribution();
--   SELECT * FROM cron.job WHERE jobname = 'admin-daily-snapshot';
-- ============================================================================
