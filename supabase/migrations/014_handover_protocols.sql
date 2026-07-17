-- ============================================================================
-- 014_handover_protocols.sql
-- Wohnungsübergabeprotokoll (Einzug/Auszug).
--   * handover_protocols – ein Protokoll je Übergabe. Räume, Zählerstände und
--     Schlüssel als JSONB (mobile-first Wizard, Schritt-für-Schritt als Entwurf).
--   * Fotos liegen im privaten Bucket „protocols" ({user_id}/{protocol_id}/...),
--     der Pfad steht je Raum in rooms[].photos.
--   * Historie bleibt an der Einheit (unit_id) erhalten – auch nach
--     Mieterwechsel (tenant_id ON DELETE SET NULL, tenant_name als Snapshot).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- ENUMs
-- ----------------------------------------------------------------------------
CREATE TYPE handover_type AS ENUM ('move_in', 'move_out');
CREATE TYPE handover_status AS ENUM ('draft', 'completed');

-- ----------------------------------------------------------------------------
-- handover_protocols
-- ----------------------------------------------------------------------------
CREATE TABLE handover_protocols (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Mieter aus dem Bestand (optional). Bleibt beim Mieterwechsel erhalten:
    -- SET NULL statt CASCADE, damit die Historie an der Einheit nicht verschwindet.
    tenant_id           UUID REFERENCES tenants(id) ON DELETE SET NULL,
    unit_id             UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    -- Name/E-Mail als Snapshot: für manuelle Eingabe (Einzug vor Mieteranlage)
    -- und damit die Historie nach Mieterlöschung lesbar bleibt.
    tenant_name         TEXT NOT NULL DEFAULT '',
    tenant_email        TEXT,
    type                handover_type NOT NULL,
    protocol_date       DATE NOT NULL DEFAULT current_date,

    -- [{ name, condition: 'good'|'used'|'defective', defects, photos: [{path}] }]
    rooms               JSONB NOT NULL DEFAULT '[]',
    -- [{ type: 'strom'|'gas'|'wasser_kalt'|'wasser_warm'|'heizung', number, value }]
    meter_readings      JSONB NOT NULL DEFAULT '[]',
    -- [{ label, count }]
    keys                JSONB NOT NULL DEFAULT '[]',

    notes               TEXT,
    signature_landlord  TEXT, -- PNG-DataURL
    signature_tenant    TEXT, -- PNG-DataURL
    pdf_url             TEXT,
    status              handover_status NOT NULL DEFAULT 'draft',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_handover_protocols_user ON handover_protocols(user_id);
CREATE INDEX idx_handover_protocols_unit ON handover_protocols(unit_id, protocol_date);
CREATE INDEX idx_handover_protocols_tenant ON handover_protocols(tenant_id);

CREATE TRIGGER trg_handover_protocols_updated
    BEFORE UPDATE ON handover_protocols
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (owner-only)
-- ----------------------------------------------------------------------------
ALTER TABLE handover_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY handover_protocols_owner ON handover_protocols
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Storage-Bucket „protocols" (privat) – PDF und Fotos
--   Pfad: {user_id}/{protocol_id}/protokoll.pdf  bzw.
--         {user_id}/{protocol_id}/fotos/{uuid}.jpg
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('protocols', 'protocols', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "protocols_select_own" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'protocols'
           AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "protocols_insert_own" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'protocols'
                AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "protocols_update_own" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'protocols'
           AND (storage.foldername(name))[1] = (SELECT auth.uid()::text))
    WITH CHECK (bucket_id = 'protocols'
                AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
CREATE POLICY "protocols_delete_own" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'protocols'
           AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

COMMIT;

-- ============================================================================
-- VERIFIKATION:
--   SELECT tablename FROM pg_tables WHERE tablename='handover_protocols';
--   SELECT id, public FROM storage.buckets WHERE id='protocols';
-- ============================================================================
