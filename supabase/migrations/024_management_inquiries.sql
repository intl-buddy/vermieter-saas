-- ============================================================================
-- Migration 024 – Verwaltungsanfragen (Kontaktanfrage an die OA Hausverwaltung)
--
-- Nutzer ohne Verwaltungsvertrag können sich unverbindlich kontaktieren lassen.
-- Die Anfrage speichert Name/E-Mail/Telefon; die Benachrichtigung an die
-- Hausverwaltung erfolgt im App-Layer (Brevo). Admins sehen alle Anfragen über
-- eine SECURITY-DEFINER-RPC (gleiches Muster wie die Support-Tickets).
--
-- Ausführen mit `npm run db:migrate` bzw. im Supabase SQL Editor.
-- ============================================================================

BEGIN;

CREATE TYPE management_inquiry_status AS ENUM ('new', 'contacted', 'closed');

CREATE TABLE public.management_inquiries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT NOT NULL,
    status      management_inquiry_status NOT NULL DEFAULT 'new',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_management_inquiries_user
    ON public.management_inquiries(user_id, created_at DESC);
CREATE INDEX idx_management_inquiries_status
    ON public.management_inquiries(status, created_at DESC);

ALTER TABLE public.management_inquiries ENABLE ROW LEVEL SECURITY;

-- Der Owner sieht und legt ausschließlich eigene Anfragen an.
CREATE POLICY management_inquiries_select_own ON public.management_inquiries
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY management_inquiries_insert_own ON public.management_inquiries
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- admin_list_management_inquiries() – alle Anfragen inkl. Kontext (E-Mail des
--   Nutzers, Anzahl Objekte/Einheiten). Nur für Admins.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_management_inquiries()
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

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', mi.id,
            'user_id', mi.user_id,
            'user_email', u.email,
            'name', mi.name,
            'email', mi.email,
            'phone', mi.phone,
            'status', mi.status,
            'created_at', mi.created_at,
            'properties_count',
                (SELECT count(*) FROM properties p WHERE p.user_id = mi.user_id),
            'units_count',
                (SELECT count(*) FROM units un WHERE un.user_id = mi.user_id)
        )
        ORDER BY mi.created_at DESC
    ), '[]'::jsonb)
    INTO result
    FROM management_inquiries mi
    JOIN users u ON u.id = mi.user_id;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_management_inquiries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_management_inquiries()
    TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_set_inquiry_status(uuid, management_inquiry_status) – Status wechseln
--   (new → contacted → closed). Nur Admins.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_inquiry_status(
    p_inquiry_id uuid,
    p_status management_inquiry_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;
    UPDATE management_inquiries SET status = p_status WHERE id = p_inquiry_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_inquiry_status(uuid, management_inquiry_status)
    FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_inquiry_status(uuid, management_inquiry_status)
    TO authenticated, service_role;

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT tablename FROM pg_tables WHERE tablename = 'management_inquiries';
--   SELECT proname FROM pg_proc WHERE proname IN
--     ('admin_list_management_inquiries','admin_set_inquiry_status');
-- ============================================================================
