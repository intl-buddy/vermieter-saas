-- ============================================================================
-- Migration 023 – Konto-Verknüpfung (OA Hausverwaltung)
--
-- Freigabe-Modell OHNE Passwort-Weitergabe: Ein Eigentümer (owner) verknüpft
-- sein Konto mit einer Hausverwaltung (manager). Der Manager erhält damit
-- lesenden UND schreibenden Zugriff auf die nutzerbezogenen Daten des Owners –
-- durchgesetzt über die zentrale Funktion `has_account_access`, die in allen
-- RLS-Policies der Mandanten-Tabellen an die Stelle von `user_id = auth.uid()`
-- tritt.
--
-- Ausgenommen bleiben:
--   * support_tickets / ticket_messages  – Tickets bleiben privat.
--   * Schreibzugriff auf users (Abo/Konto) – nur der Owner selbst.
--
-- Ausführen mit `npm run db:migrate` bzw. im Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Tabelle account_links
-- ----------------------------------------------------------------------------

CREATE TYPE account_link_status AS ENUM ('active', 'revoked');

CREATE TABLE public.account_links (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Eigentümer, der seinen Zugriff freigibt.
    owner_user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- Ziel-Hausverwaltung (Freigabe erfolgt an eine E-Mail, nicht an ein Konto).
    manager_email    TEXT NOT NULL DEFAULT 'info@oa-hausverwaltung.de',
    -- Wird beim ersten Login des Managers per E-Mail-Abgleich aufgelöst.
    manager_user_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status           account_link_status NOT NULL DEFAULT 'active',
    granted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at       TIMESTAMPTZ
);

CREATE INDEX idx_account_links_owner ON public.account_links(owner_user_id);
CREATE INDEX idx_account_links_manager
    ON public.account_links(manager_user_id) WHERE manager_user_id IS NOT NULL;

-- Höchstens EIN aktiver Link je Owner + Manager-E-Mail.
CREATE UNIQUE INDEX uq_account_links_active
    ON public.account_links(owner_user_id, manager_email) WHERE status = 'active';

ALTER TABLE public.account_links ENABLE ROW LEVEL SECURITY;

-- Der Owner sieht und verwaltet ausschließlich seine eigenen Links.
CREATE POLICY account_links_owner ON public.account_links
    FOR ALL USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());

-- Der Manager darf die ihm zugeordneten Links lesen (für die Kontoauswahl).
CREATE POLICY account_links_manager_read ON public.account_links
    FOR SELECT USING (manager_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2) Zugriffs-Helfer: has_account_access(target)
--    true, wenn der Aufrufer selbst der Owner ist ODER ein aktiver Link
--    existiert, der ihn als Manager dieses Owners ausweist.
--    SECURITY DEFINER, damit die RLS-Prüfung account_links lesen darf, ohne
--    dass der Manager direkte Leserechte auf jede Zeile braucht.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_account_access(target_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT
        auth.uid() = target_user_id
        OR EXISTS (
            SELECT 1
            FROM public.account_links al
            WHERE al.owner_user_id = target_user_id
              AND al.manager_user_id = auth.uid()
              AND al.status = 'active'
        );
$$;

REVOKE ALL ON FUNCTION public.has_account_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_account_access(UUID) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3) Manager-Auflösung + Liste der verwalteten Konten
--    Ordnet offene Links (manager_user_id IS NULL) per E-Mail-Abgleich dem
--    aufrufenden Manager zu und liefert dann seine aktiven Owner-Konten.
--    SECURITY DEFINER: das UPDATE + der JOIN auf users laufen unter erhöhten
--    Rechten, die Auflösung greift aber nur bei exakt passender E-Mail.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.my_managed_accounts()
RETURNS TABLE (
    owner_user_id UUID,
    owner_name    TEXT,
    owner_email   TEXT,
    granted_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    caller_email TEXT;
BEGIN
    SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();

    IF caller_email IS NOT NULL THEN
        UPDATE public.account_links
           SET manager_user_id = auth.uid()
         WHERE manager_user_id IS NULL
           AND status = 'active'
           AND lower(manager_email) = lower(caller_email);
    END IF;

    RETURN QUERY
        SELECT al.owner_user_id, u.full_name, u.email, al.granted_at
          FROM public.account_links al
          JOIN public.users u ON u.id = al.owner_user_id
         WHERE al.manager_user_id = auth.uid()
           AND al.status = 'active'
         ORDER BY u.full_name;
END;
$$;

REVOKE ALL ON FUNCTION public.my_managed_accounts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_managed_accounts() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4) RLS der Mandanten-Tabellen von "user_id = auth.uid()" auf
--    "has_account_access(user_id)" umstellen (SELECT/INSERT/UPDATE/DELETE über
--    FOR ALL). support_tickets / ticket_messages bleiben BEWUSST unverändert.
-- ----------------------------------------------------------------------------

-- 001: properties, units, tenants, task_templates, generated_tasks, occ_records
DROP POLICY IF EXISTS properties_owner ON public.properties;
CREATE POLICY properties_owner ON public.properties
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

DROP POLICY IF EXISTS units_owner ON public.units;
CREATE POLICY units_owner ON public.units
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

DROP POLICY IF EXISTS tenants_owner ON public.tenants;
CREATE POLICY tenants_owner ON public.tenants
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

DROP POLICY IF EXISTS task_templates_owner ON public.task_templates;
CREATE POLICY task_templates_owner ON public.task_templates
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

DROP POLICY IF EXISTS generated_tasks_owner ON public.generated_tasks;
CREATE POLICY generated_tasks_owner ON public.generated_tasks
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

DROP POLICY IF EXISTS occ_records_owner ON public.operating_costs_records;
CREATE POLICY occ_records_owner ON public.operating_costs_records
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

-- 002: rent_charges, rent_payments, dunning_letters
DROP POLICY IF EXISTS rent_charges_owner ON public.rent_charges;
CREATE POLICY rent_charges_owner ON public.rent_charges
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

DROP POLICY IF EXISTS rent_payments_owner ON public.rent_payments;
CREATE POLICY rent_payments_owner ON public.rent_payments
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

DROP POLICY IF EXISTS dunning_letters_owner ON public.dunning_letters;
CREATE POLICY dunning_letters_owner ON public.dunning_letters
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

-- 006: tenant_person_periods, billing_runs, billing_statements
DROP POLICY IF EXISTS tpp_owner ON public.tenant_person_periods;
CREATE POLICY tpp_owner ON public.tenant_person_periods
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

DROP POLICY IF EXISTS billing_runs_owner ON public.billing_runs;
CREATE POLICY billing_runs_owner ON public.billing_runs
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

DROP POLICY IF EXISTS billing_statements_owner ON public.billing_statements;
CREATE POLICY billing_statements_owner ON public.billing_statements
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

-- 014: handover_protocols
DROP POLICY IF EXISTS handover_protocols_owner ON public.handover_protocols;
CREATE POLICY handover_protocols_owner ON public.handover_protocols
    FOR ALL USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

-- ----------------------------------------------------------------------------
-- 5) users: Lesen für verknüpfte Manager freigeben (Profil für PDFs, Gating,
--    Namen), Schreiben (Abo/Konto) aber dem Owner vorbehalten.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS users_self ON public.users;

CREATE POLICY users_read ON public.users
    FOR SELECT USING (public.has_account_access(id));
CREATE POLICY users_insert ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY users_update ON public.users
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY users_delete ON public.users
    FOR DELETE USING (id = auth.uid());

-- ----------------------------------------------------------------------------
-- 6) Storage-Policies: den privaten Buckets denselben Zugriffsbegriff geben.
--    Pfadkonvention aller Buckets: {owner_user_id}/...  → erster Ordner.
-- ----------------------------------------------------------------------------

-- dunning
DROP POLICY IF EXISTS "dunning_select_own" ON storage.objects;
DROP POLICY IF EXISTS "dunning_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "dunning_update_own" ON storage.objects;
DROP POLICY IF EXISTS "dunning_delete_own" ON storage.objects;
CREATE POLICY "dunning_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'dunning'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "dunning_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'dunning'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "dunning_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'dunning'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid))
    WITH CHECK (bucket_id = 'dunning'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "dunning_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'dunning'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));

-- receipts
DROP POLICY IF EXISTS "receipts_select_own" ON storage.objects;
DROP POLICY IF EXISTS "receipts_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "receipts_update_own" ON storage.objects;
DROP POLICY IF EXISTS "receipts_delete_own" ON storage.objects;
CREATE POLICY "receipts_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'receipts'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "receipts_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'receipts'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "receipts_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'receipts'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid))
    WITH CHECK (bucket_id = 'receipts'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "receipts_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'receipts'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));

-- statements
DROP POLICY IF EXISTS "statements_select_own" ON storage.objects;
DROP POLICY IF EXISTS "statements_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "statements_update_own" ON storage.objects;
DROP POLICY IF EXISTS "statements_delete_own" ON storage.objects;
CREATE POLICY "statements_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'statements'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "statements_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'statements'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "statements_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'statements'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid))
    WITH CHECK (bucket_id = 'statements'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "statements_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'statements'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));

-- protocols
DROP POLICY IF EXISTS "protocols_select_own" ON storage.objects;
DROP POLICY IF EXISTS "protocols_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "protocols_update_own" ON storage.objects;
DROP POLICY IF EXISTS "protocols_delete_own" ON storage.objects;
CREATE POLICY "protocols_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'protocols'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "protocols_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'protocols'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "protocols_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'protocols'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid))
    WITH CHECK (bucket_id = 'protocols'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "protocols_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'protocols'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));

COMMIT;

-- ============================================================================
-- VERIFIKATION nach dem Einspielen:
--   SELECT tablename FROM pg_tables WHERE tablename = 'account_links';
--   SELECT proname FROM pg_proc WHERE proname IN
--     ('has_account_access','my_managed_accounts');
--   SELECT policyname, tablename FROM pg_policies
--     WHERE schemaname = 'public' AND qual LIKE '%has_account_access%';
-- ============================================================================
