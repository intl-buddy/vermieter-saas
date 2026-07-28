-- ============================================================================
-- Migration 025 – Digitaler Ordner: Dokumente je Objekt
--
-- Zwei Tabellen für den „Digitalen Ordner" auf der Objektseite:
--   • property_folders   – frei verschachtelbare Ordner je Objekt.
--   • property_documents  – hochgeladene Dateien (Metadaten; die Datei selbst
--                           liegt im privaten Storage-Bucket „property-documents").
--
-- RLS auf beiden Tabellen über public.has_account_access(user_id), damit auch
-- verknüpfte Hausverwaltungen (OA-Verknüpfung, Migration 023) Dokumente sehen
-- und pflegen können. Der Storage-Bucket bekommt dieselben Policies wie die
-- übrigen Buckets (has_account_access auf dem ersten Pfadsegment = user_id).
--
-- Pfadkonvention im Bucket: {user_id}/{property_id}/{document_id}/{dateiname}
--
-- Ausführen mit `npm run db:migrate` bzw. im Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Ordner
-- ----------------------------------------------------------------------------

CREATE TABLE public.property_folders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id      UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    parent_folder_id UUID REFERENCES public.property_folders(id) ON DELETE CASCADE,
    name             TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Eindeutiger Ordnername je Ebene. Ein funktionaler Index mit COALESCE behandelt
-- die Wurzelebene (parent_folder_id IS NULL) korrekt als eine gemeinsame Ebene –
-- ein einfaches UNIQUE(...) würde NULL-Parents als jeweils verschieden werten.
CREATE UNIQUE INDEX uq_property_folders_name
    ON public.property_folders (
        property_id,
        COALESCE(parent_folder_id, '00000000-0000-0000-0000-000000000000'::uuid),
        name
    );

CREATE INDEX idx_property_folders_property
    ON public.property_folders(property_id, parent_folder_id);
CREATE INDEX idx_property_folders_user
    ON public.property_folders(user_id);

ALTER TABLE public.property_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY property_folders_owner ON public.property_folders
    FOR ALL
    USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

-- ----------------------------------------------------------------------------
-- 2) Dokumente (Metadaten)
-- ----------------------------------------------------------------------------

CREATE TABLE public.property_documents (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    property_id  UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    -- NULL = Wurzelebene des Objekts.
    folder_id    UUID REFERENCES public.property_folders(id) ON DELETE CASCADE,
    file_name    TEXT NOT NULL CHECK (char_length(trim(file_name)) BETWEEN 1 AND 200),
    storage_path TEXT NOT NULL,
    mime_type    TEXT NOT NULL,
    size_bytes   BIGINT NOT NULL CHECK (size_bytes >= 0),
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_documents_property
    ON public.property_documents(property_id, folder_id);
CREATE INDEX idx_property_documents_user
    ON public.property_documents(user_id);

ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY property_documents_owner ON public.property_documents
    FOR ALL
    USING (public.has_account_access(user_id))
    WITH CHECK (public.has_account_access(user_id));

-- ----------------------------------------------------------------------------
-- 3) Privater Storage-Bucket „property-documents"
--    Policies analog zu den bestehenden Buckets (Migration 023):
--    has_account_access auf dem ersten Pfadsegment (= user_id).
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "property_documents_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'property-documents'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "property_documents_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'property-documents'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "property_documents_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'property-documents'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid))
    WITH CHECK (bucket_id = 'property-documents'
                AND public.has_account_access(((storage.foldername(name))[1])::uuid));
CREATE POLICY "property_documents_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'property-documents'
           AND public.has_account_access(((storage.foldername(name))[1])::uuid));

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT to_regclass('public.property_folders'), to_regclass('public.property_documents');
--   SELECT id, public FROM storage.buckets WHERE id='property-documents';
--   SELECT policyname FROM pg_policies
--     WHERE tablename='objects' AND policyname LIKE 'property_documents_%';
-- ============================================================================
