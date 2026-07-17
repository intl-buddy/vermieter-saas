-- ============================================================================
-- 016_admin_revenue.sql
-- Umsatz-Kennzahlen fürs Admin-Dashboard (/novipazar).
--   admin_revenue_stats() liefert je Stripe-price_id die Anzahl AKTIVER Abos
--   und davon die zum Periodenende gekündigten. Aktiv = subscription_status
--   'active' ODER ('trialing' mit subscription_id) – bewusst NICHT nach
--   cancel_at_period_end gefiltert: gekündigte Abos zählen bis Periodenende zum
--   MRR.
--
--   Die Funktion liefert BEWUSST nur Roh-Zählungen (price_id + Anzahl), keine
--   Beträge. Die Monatspreise stehen im PLANS-Objekt (packages/core) und die
--   price_ids in Env-Vars – beides liegt im Code, nicht in der DB. Der MRR wird
--   deshalb serverseitig in der Route aus diesen Rohdaten berechnet; so bleibt
--   PLANS die einzige Preisquelle (CLAUDE.md) und die DB kennt keine Beträge.
--
--   Keine neuen Spalten → Schema-Wächter-Liste unverändert (die Liste erfasst
--   Spalten, keine Funktionen).
-- Idempotent – gefahrlos mehrfach ausführbar.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_revenue_stats()
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

    SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
    INTO result
    FROM (
        SELECT
            price_id,
            count(*) AS subs,
            count(*) FILTER (WHERE cancel_at_period_end) AS canceling
        FROM users
        WHERE subscription_status = 'active'
           OR (subscription_status = 'trialing' AND subscription_id IS NOT NULL)
        GROUP BY price_id
    ) r;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revenue_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_revenue_stats() TO authenticated, service_role;

COMMIT;

-- PostgREST-Schema-Cache neu laden, damit die RPC sofort erreichbar ist.
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFIKATION (im SQL Editor, als Admin):
--   SELECT admin_revenue_stats();
--   -- erwartet: [{"price_id":"price_...","subs":N,"canceling":M}, …]
--   -- Als Nicht-Admin muss der Aufruf mit „Nicht autorisiert" fehlschlagen.
-- ============================================================================
