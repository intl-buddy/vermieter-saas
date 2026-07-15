-- ============================================================================
-- Migration 005 – Belege: Zusatzspalten + Storage-Bucket „receipts"
-- Aufbauend auf 001 (operating_costs_records). Ausführen im Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Zusatzspalten für die Belegerfassung / EÜR
--    paid_date    – Zahlungsdatum (Basis für die EÜR nach Zufluss-/Abflussprinzip)
--    gross_amount – Rechnungsbetrag brutto
--    vat_rate     – Umsatzsteuersatz in Prozent (19 / 7 / 0)
-- ----------------------------------------------------------------------------

ALTER TABLE operating_costs_records
    ADD COLUMN IF NOT EXISTS paid_date    DATE,
    ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12,2)
        CHECK (gross_amount IS NULL OR gross_amount >= 0),
    ADD COLUMN IF NOT EXISTS vat_rate     SMALLINT
        CHECK (vat_rate IS NULL OR vat_rate IN (0, 7, 19));

CREATE INDEX IF NOT EXISTS idx_occ_records_paid_date
    ON operating_costs_records(user_id, paid_date);

-- ----------------------------------------------------------------------------
-- 2) Privater Storage-Bucket „receipts"
--    Pfadkonvention: {user_id}/{record_id}/{dateiname}
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "receipts_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

CREATE POLICY "receipts_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

CREATE POLICY "receipts_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    )
    WITH CHECK (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

CREATE POLICY "receipts_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
    );

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='operating_costs_records'
--       AND column_name IN ('paid_date','gross_amount','vat_rate');
--   SELECT id, public FROM storage.buckets WHERE id='receipts';
-- ============================================================================
