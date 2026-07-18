-- ============================================================================
-- 019_support_tickets.sql
-- Hilfebereich / Support-Tickets.
--   * support_tickets – ein Ticket je Anliegen (Kategorie, Betreff, erste
--     Nachricht, Status, interne Admin-Notiz).
--   * ticket_messages – Verlauf: Rückfragen des Nutzers und Antworten des
--     Supports. Die erste Nachricht steht am Ticket selbst (support_tickets.message).
--   * RLS: Nutzer sehen/erstellen ausschließlich EIGENE Tickets und dürfen nur
--     eigene Rückfragen (sender='user') schreiben. Der Admin-Zugriff über ALLE
--     Nutzer läuft über SECURITY-DEFINER-Funktionen mit is_admin-Prüfung –
--     kein direkter tabellenweiter Zugriff.
--   * Der E-Mail-Versand (Brevo) passiert in der App, nicht in der DB.
-- Idempotent – gefahrlos mehrfach ausführbar.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- ENUMs
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE ticket_category AS ENUM ('frage', 'problem', 'idee', 'abrechnung');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_sender AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- support_tickets
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject     TEXT NOT NULL,
    category    ticket_category NOT NULL,
    message     TEXT NOT NULL,
    status      ticket_status NOT NULL DEFAULT 'open',
    admin_note  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user
    ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status
    ON support_tickets(status, created_at DESC);

DROP TRIGGER IF EXISTS trg_support_tickets_updated ON support_tickets;
CREATE TRIGGER trg_support_tickets_updated
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- ticket_messages (Verlauf)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender      ticket_sender NOT NULL,
    message     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket
    ON ticket_messages(ticket_id, created_at);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--   support_tickets: Nutzer sehen & erstellen nur eigene Tickets. KEIN UPDATE/
--   DELETE für Nutzer – Statuswechsel und Notizen laufen über Admin-Funktionen.
--   ticket_messages: Nutzer sehen den Verlauf eigener Tickets und dürfen nur
--   eigene Rückfragen (sender='user') anhängen. Admin-Nachrichten kommen über
--   die SECURITY-DEFINER-Funktion (RLS-übergreifend).
-- ----------------------------------------------------------------------------
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_tickets_select_own ON support_tickets;
CREATE POLICY support_tickets_select_own ON support_tickets
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS support_tickets_insert_own ON support_tickets;
CREATE POLICY support_tickets_insert_own ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ticket_messages_select_own ON ticket_messages;
CREATE POLICY ticket_messages_select_own ON ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets t
            WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS ticket_messages_insert_own ON ticket_messages;
CREATE POLICY ticket_messages_insert_own ON ticket_messages
    FOR INSERT WITH CHECK (
        sender = 'user'
        AND EXISTS (
            SELECT 1 FROM support_tickets t
            WHERE t.id = ticket_messages.ticket_id AND t.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- admin_list_tickets() – alle Tickets aller Nutzer inkl. Verlauf, mit
--   E-Mail und Plan des Nutzers. Nur für Admins.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_tickets()
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
            'id', st.id,
            'user_id', st.user_id,
            'user_email', u.email,
            'user_plan', u.plan,
            'subject', st.subject,
            'category', st.category,
            'status', st.status,
            'admin_note', st.admin_note,
            'message', st.message,
            'created_at', st.created_at,
            'updated_at', st.updated_at,
            'messages', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', m.id,
                        'sender', m.sender,
                        'message', m.message,
                        'created_at', m.created_at
                    ) ORDER BY m.created_at
                )
                FROM ticket_messages m
                WHERE m.ticket_id = st.id
            ), '[]'::jsonb)
        )
        ORDER BY GREATEST(
            st.updated_at,
            COALESCE(
                (SELECT max(m.created_at) FROM ticket_messages m WHERE m.ticket_id = st.id),
                st.updated_at
            )
        ) DESC
    ), '[]'::jsonb)
    INTO result
    FROM support_tickets st
    JOIN users u ON u.id = st.user_id;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_tickets() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_tickets() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_reply_ticket(uuid, text) – Support-Antwort in den Verlauf schreiben
--   (sender='admin'). Gibt E-Mail und Betreff des Nutzers zurück, damit die
--   App die Antwort per Brevo zustellen kann. Nur für Admins.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_reply_ticket(p_ticket_id uuid, p_message text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_email   text;
    v_subject text;
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;
    IF p_message IS NULL OR btrim(p_message) = '' THEN
        RAISE EXCEPTION 'Leere Nachricht';
    END IF;

    SELECT st.user_id, u.email, st.subject
    INTO v_user_id, v_email, v_subject
    FROM support_tickets st
    JOIN users u ON u.id = st.user_id
    WHERE st.id = p_ticket_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Ticket nicht gefunden';
    END IF;

    INSERT INTO ticket_messages (ticket_id, sender, message)
    VALUES (p_ticket_id, 'admin', btrim(p_message));

    -- Aktivität am Ticket vermerken (sortiert die Liste nach oben).
    UPDATE support_tickets SET updated_at = now() WHERE id = p_ticket_id;

    RETURN jsonb_build_object(
        'user_id', v_user_id,
        'user_email', v_email,
        'subject', v_subject
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reply_ticket(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reply_ticket(uuid, text) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_set_ticket_status(uuid, ticket_status) – Status wechseln. Nur Admins.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_ticket_status(p_ticket_id uuid, p_status ticket_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;
    UPDATE support_tickets SET status = p_status WHERE id = p_ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_ticket_status(uuid, ticket_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_ticket_status(uuid, ticket_status) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- admin_set_ticket_note(uuid, text) – interne Notiz setzen (nur Admin sichtbar).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_ticket_note(p_ticket_id uuid, p_note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Nicht autorisiert';
    END IF;
    UPDATE support_tickets
    SET admin_note = NULLIF(btrim(COALESCE(p_note, '')), '')
    WHERE id = p_ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_ticket_note(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_ticket_note(uuid, text) TO authenticated, service_role;

COMMIT;

-- PostgREST-Schema-Cache neu laden, damit Tabellen und RPCs sofort erreichbar sind.
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFIKATION:
--   SELECT tablename FROM pg_tables WHERE tablename IN ('support_tickets','ticket_messages');
--   -- Als Admin:  SELECT admin_list_tickets();
--   -- Als Nicht-Admin muss admin_list_tickets() mit „Nicht autorisiert" fehlschlagen.
-- ============================================================================
