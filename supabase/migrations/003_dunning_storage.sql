-- ============================================================================
-- Migration 003 – Storage-Bucket für Mahn-PDFs
-- Aufbauend auf 002. Ausführen im Supabase SQL Editor.
-- Privater Bucket "dunning"; Zugriff nur auf eigene Objekte.
-- Pfadkonvention: {user_id}/{dunning_id}.pdf  → erster Pfadteil = user_id.
-- ============================================================================

BEGIN;

-- Privaten Bucket anlegen (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dunning', 'dunning', false)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- RLS-Policies auf storage.objects (RLS ist in Supabase bereits aktiv).
-- Jeder authentifizierte Nutzer darf ausschließlich Objekte im eigenen
-- Ordner ({user_id}/...) im Bucket "dunning" verwalten.
-- ----------------------------------------------------------------------------

CREATE POLICY "dunning_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'dunning'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

CREATE POLICY "dunning_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'dunning'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

CREATE POLICY "dunning_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'dunning'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    )
    WITH CHECK (
        bucket_id = 'dunning'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

CREATE POLICY "dunning_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'dunning'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT id, public FROM storage.buckets WHERE id = 'dunning';
--   SELECT policyname FROM pg_policies
--     WHERE schemaname='storage' AND tablename='objects'
--       AND policyname LIKE 'dunning_%';
-- ============================================================================
