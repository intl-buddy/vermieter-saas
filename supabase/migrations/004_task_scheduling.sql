-- ============================================================================
-- Migration 004 – Aufgaben-Automatik
-- Aufbauend auf 001 (task_templates, generated_tasks). Ausführen im Supabase
-- SQL Editor. Erzeugt fällige Aufgaben aus Vorlagen und markiert Überfällige.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) generate_tasks_from_templates()
--    Legt für alle aktiven Vorlagen die im laufenden Monat fällige Aufgabe an.
--    SECURITY DEFINER: läuft ohne User-Session (Cron), umgeht RLS bewusst.
--    Idempotent über den Unique-Index uq_generated_tasks_template_due.
--    Intervalle:
--      * monthly       – jeden Monat
--      * yearly        – nur wenn month_of_year = aktueller Monat
--      * quarterly     – alle 3 Monate ab month_of_year (erstes Auftreten)
--      * semiannually  – alle 6 Monate ab month_of_year
--      * weekly/once    – im MVP ignoriert
--    Fälligkeitstag = day_of_month des laufenden Monats; ist der Tag größer als
--    das Monatsende, wird der letzte Tag des Monats verwendet.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_tasks_from_templates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_month    integer := EXTRACT(MONTH FROM CURRENT_DATE)::integer;
    v_first    date    := date_trunc('month', CURRENT_DATE)::date;
    v_last_day integer := EXTRACT(
        DAY FROM (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')
    )::integer;
    v_count    integer;
BEGIN
    INSERT INTO generated_tasks (
        user_id, template_id, property_id, unit_id,
        title, description, due_date, status
    )
    SELECT
        t.user_id,
        t.id,
        t.property_id,
        t.unit_id,
        t.title,
        t.description,
        -- Fälligkeitstag auf das Monatsende begrenzen
        (v_first + (LEAST(COALESCE(t.day_of_month, 1), v_last_day) - 1))::date,
        'open'
    FROM task_templates t
    WHERE t.is_active
      AND (
            t.interval = 'monthly'
        OR (t.interval = 'yearly'       AND t.month_of_year = v_month)
        OR (t.interval = 'quarterly'
            AND ((v_month - COALESCE(t.month_of_year, 1)) % 3 + 3) % 3 = 0)
        OR (t.interval = 'semiannually'
            AND ((v_month - COALESCE(t.month_of_year, 1)) % 6 + 6) % 6 = 0)
      )
    ON CONFLICT (template_id, due_date) WHERE template_id IS NOT NULL
        DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2) mark_overdue_tasks()
--    Setzt offene Aufgaben mit vergangenem Fälligkeitsdatum auf 'overdue'.
--    SECURITY DEFINER: läuft ohne User-Session (Cron), umgeht RLS bewusst.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION mark_overdue_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE generated_tasks
    SET status = 'overdue'
    WHERE status = 'open'
      AND due_date < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

COMMIT;

-- ============================================================================
-- CRON-Jobs (einmalig einrichten):
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   -- Fällige Aufgaben aus Vorlagen erzeugen: täglich 02:00 Uhr
--   SELECT cron.schedule('generate-tasks', '0 2 * * *',
--          $$SELECT generate_tasks_from_templates();$$);
--   -- Überfällige Aufgaben markieren: täglich 02:10 Uhr
--   SELECT cron.schedule('mark-overdue-tasks', '10 2 * * *',
--          $$SELECT mark_overdue_tasks();$$);
--
-- Sofort testen:
--   SELECT generate_tasks_from_templates();
--   SELECT mark_overdue_tasks();
-- ============================================================================
