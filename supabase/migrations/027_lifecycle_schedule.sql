-- ============================================================================
-- Migration 027 – Einplanung des täglichen Lebenszyklus-Laufs
--
-- BEFUND: Der tägliche Lebenszyklus (Trial→Lesemodus, Erinnerungsmails,
-- Löschung nach Lesefrist bzw. nach Selbstlöschung, siehe 010/026) war NIE
-- eingeplant. Die Route POST /api/cron/lifecycle existiert und funktioniert,
-- aber es gab weder einen pg_cron-Eintrag noch einen Coolify-Scheduled-Task –
-- der Lauf fand also nie statt.
--
-- LÖSUNG: pg_cron ruft täglich die SQL-Funktion run_lifecycle() auf; diese
-- stößt über pg_net (HTTP) die geschützte Route an. Die eigentliche Logik
-- (Kandidaten ermitteln, access_until setzen, Mails via Brevo, Stripe-Kündigung,
-- Storage-Löschung, endgültige Löschung) bleibt bewusst in der Route: Sie nutzt
-- die getestete TS-/@repo/core-Logik (getAccessStatus etc.). Diese Logik in SQL
-- zu duplizieren würde eine zweite Wahrheit schaffen, die abdriften kann – daher
-- ist run_lifecycle() ein schlanker, zuverlässiger Auslöser, KEINE zweite
-- Löschlogik.
--
-- KONFIGURATION (einmalig, NICHT im Repo – Secret bleibt aus Git heraus):
--   ALTER DATABASE postgres SET app.settings.cron_secret = '<CRON_SECRET>';
--   ALTER DATABASE postgres SET app.settings.site_url    = 'https://app.tefter.de';
--   -- danach neue Sessions (pg_cron-Worker) lesen die Werte automatisch.
--   -- app.settings.cron_secret MUSS dem Env-Wert CRON_SECRET der App entsprechen.
--
-- Ausführen mit `npm run db:migrate` bzw. im Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) pg_net aktivieren (HTTP aus der DB heraus). Guard: schlägt die Aktivierung
--    fehl (z. B. Extension im Image nicht verfügbar), bleibt die Migration
--    erfolgreich – der Cron-Job wird dann unten übersprungen.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net konnte nicht aktiviert werden (%). run_lifecycle() funktioniert ohne pg_net nicht.', SQLERRM;
END $$;

-- ----------------------------------------------------------------------------
-- 2) run_lifecycle(): stößt die Lifecycle-Route per HTTP an (Bearer-Secret).
--    Dual-Kontext: von pg_cron OHNE auth.uid() (erlaubt) und von einem Admin
--    (erlaubt); ein eingeloggter Nicht-Admin wird abgelehnt.
--    Secret und Basis-URL kommen aus DB-Settings (siehe Kopf), nicht aus Git.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_lifecycle()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_secret text := current_setting('app.settings.cron_secret', true);
    v_base   text := current_setting('app.settings.site_url', true);
    v_req_id bigint;
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;

    IF v_secret IS NULL OR v_secret = '' THEN
        RAISE EXCEPTION 'app.settings.cron_secret ist nicht gesetzt – siehe Migration 027 / CLAUDE.md.';
    END IF;
    IF v_base IS NULL OR v_base = '' THEN
        RAISE EXCEPTION 'app.settings.site_url ist nicht gesetzt – siehe Migration 027 / CLAUDE.md.';
    END IF;

    -- pg_net ist asynchron: Der Request wird eingereiht und von einem
    -- Hintergrund-Worker verschickt; die Route arbeitet idempotent.
    SELECT net.http_post(
        url := v_base || '/api/cron/lifecycle',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || v_secret,
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 300000
    ) INTO v_req_id;

    RETURN v_req_id;
END $$;

REVOKE ALL ON FUNCTION public.run_lifecycle() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_lifecycle() TO service_role;

-- ----------------------------------------------------------------------------
-- 3) Täglich 03:30 einplanen. Setzt pg_cron UND pg_net voraus. Fehlt eine der
--    Extensions, wird der Job übersprungen (RAISE NOTICE) – dann Extension
--    aktivieren und diesen DO-Block erneut ausführen.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE 'pg_cron nicht aktiv – daily-lifecycle-Job wurde NICHT eingerichtet.';
    ELSIF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        RAISE NOTICE 'pg_net nicht aktiv – daily-lifecycle-Job wurde NICHT eingerichtet.';
    ELSE
        -- Vorhandenen Job gleichen Namens zuerst entfernen (idempotent).
        PERFORM cron.unschedule('daily-lifecycle')
        WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-lifecycle');

        PERFORM cron.schedule(
            'daily-lifecycle',
            '30 3 * * *',
            'SELECT public.run_lifecycle();'
        );
    END IF;
END $$;

COMMIT;

-- PostgREST-Schema-Cache neu laden (run_lifecycle als RPC sofort erreichbar).
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFIKATION:
--   -- Settings gesetzt?
--   SELECT current_setting('app.settings.site_url', true);
--   -- Job eingeplant?
--   SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'daily-lifecycle';
--   -- Manueller Anstoß über die DB (löst den HTTP-Call aus):
--   SELECT public.run_lifecycle();
--   -- Letzte pg_net-Antworten prüfen:
--   SELECT status_code, content FROM net._http_response ORDER BY id DESC LIMIT 3;
--   -- Manueller Anstoß direkt gegen die Route (Report als JSON):
--   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" \
--        https://app.tefter.de/api/cron/lifecycle
-- ============================================================================
