-- ============================================================================
-- 012_schema_guard.sql
-- Schema-Wächter für /api/health.
--   PostgREST stellt `information_schema` nicht direkt zur Verfügung. Diese
--   Funktion nimmt die Liste der erwarteten Spalten (aus packages/core,
--   EXPECTED_COLUMNS) entgegen und gibt genau die zurück, die in der DB
--   FEHLEN. So erkennt der Healthcheck eine vergessene Migration, statt sie
--   später als kryptischen PostgREST-Fehler im Nutzerpfad auftauchen zu lassen.
--
-- Sicherheit: SECURITY DEFINER (damit information_schema vollständig sichtbar
-- ist), aber EXECUTE ausschließlich für service_role. Der Healthcheck ruft die
-- Funktion mit dem Service-Role-Key auf; anon/authenticated können das Schema
-- darüber nicht ausspähen.
-- Idempotent – gefahrlos mehrfach ausführbar.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.missing_schema_columns(expected jsonb)
RETURNS TABLE (missing_table text, missing_column text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
    SELECT e.tbl, e.col
    FROM jsonb_to_recordset(expected) AS e(tbl text, col text)
    WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name   = e.tbl
          AND c.column_name  = e.col
    );
$$;

-- Standardmäßig darf PUBLIC jede neue Funktion ausführen – hier explizit
-- entziehen und nur der service_role erlauben.
REVOKE ALL ON FUNCTION public.missing_schema_columns(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.missing_schema_columns(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.missing_schema_columns(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.missing_schema_columns(jsonb) TO service_role;

COMMENT ON FUNCTION public.missing_schema_columns(jsonb) IS
    'Schema-Wächter für /api/health: liefert aus der übergebenen Liste '
    '[{"tbl":"users","col":"access_until"}, …] die in public fehlenden Spalten.';

COMMIT;

-- PostgREST-Schema-Cache neu laden, damit die neue Funktion sofort per RPC
-- erreichbar ist (sonst antwortet /api/health bis zum nächsten Reload mit
-- „degraded – RPC fehlt"). Supabase macht das per Event-Trigger meist selbst.
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFIKATION (im SQL Editor):
--   SELECT * FROM public.missing_schema_columns(
--     '[{"tbl":"users","col":"access_until"},
--       {"tbl":"users","col":"gibt_es_nicht"}]'::jsonb);
--   -- erwartet: genau eine Zeile → users / gibt_es_nicht
-- ============================================================================
