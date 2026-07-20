import type { SupabaseServerClient } from "../supabase/server";
import {
  parseRooms,
  parseMeters,
  parseKeys,
  CONDITION_LABELS,
  METER_LABELS,
  TYPE_LABELS,
  MAX_PHOTOS_IN_PDF,
} from "../../app/protokolle/types";
import type { HandoverPdfData, HandoverPdfRoom } from "./handoverProtocol";

const PROTOCOLS_BUCKET = "protocols";

/** Lädt ein Foto aus dem Storage und wandelt es in eine Data-URL (fürs PDF). */
async function photoToDataUrl(
  supabase: SupabaseServerClient,
  path: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PROTOCOLS_BUCKET)
    .download(path);
  if (error || !data) return null;
  const mime = data.type || "image/jpeg";
  const base64 = Buffer.from(await data.arrayBuffer()).toString("base64");
  return `data:${mime};base64,${base64}`;
}

/**
 * Stellt alle Daten für das Protokoll-PDF zusammen: Protokoll + Einheit +
 * Objekt + Absenderprofil, und lädt je Raum bis zu MAX_PHOTOS_IN_PDF Fotos als
 * Data-URLs. RLS-gescoped über den übergebenen User-Client.
 */
export async function loadHandoverProtocolData(
  supabase: SupabaseServerClient,
  protocolId: string,
): Promise<HandoverPdfData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: protocol } = await supabase
    .from("handover_protocols")
    .select(
      "id, user_id, unit_id, tenant_name, type, protocol_date, rooms, meter_readings, keys, notes, signature_landlord, signature_tenant",
    )
    .eq("id", protocolId)
    .maybeSingle();

  if (!protocol || protocol.user_id !== user.id) return null;

  // Einheit + Objekt
  const { data: unit } = await supabase
    .from("units")
    .select("id, label, floor, property_id")
    .eq("id", protocol.unit_id)
    .maybeSingle();

  let objektName = "";
  let objektAddress = "";
  if (unit) {
    const { data: property } = await supabase
      .from("properties")
      .select("name, street, house_number, zip, city")
      .eq("id", unit.property_id)
      .maybeSingle();
    if (property) {
      objektName = property.name;
      objektAddress = `${property.street} ${property.house_number}, ${property.zip} ${property.city}`;
    }
  }

  // Absenderprofil (Vermieter)
  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, company_name, address_street, address_zip, address_city, pdf_footer_enabled",
    )
    .eq("id", user.id)
    .maybeSingle();

  // Räume inkl. Fotos (max. MAX_PHOTOS_IN_PDF je Raum als Data-URL)
  const rooms = parseRooms(protocol.rooms);
  const pdfRooms: HandoverPdfRoom[] = [];
  for (const room of rooms) {
    const chosen = room.photos.slice(0, MAX_PHOTOS_IN_PDF);
    const dataUrls: string[] = [];
    for (const p of chosen) {
      const url = await photoToDataUrl(supabase, p.path);
      if (url) dataUrls.push(url);
    }
    pdfRooms.push({
      name: room.name,
      conditionLabel: CONDITION_LABELS[room.condition],
      defects: room.defects,
      photos: dataUrls,
      photoTotal: room.photos.length,
    });
  }

  const meters = parseMeters(protocol.meter_readings).map((m) => ({
    typeLabel: METER_LABELS[m.type],
    number: m.number,
    value: m.value,
  }));

  const keys = parseKeys(protocol.keys);

  return {
    sender: {
      fullName: profile?.full_name ?? "",
      companyName: profile?.company_name ?? null,
      addressStreet: profile?.address_street ?? null,
      addressZip: profile?.address_zip ?? null,
      addressCity: profile?.address_city ?? null,
    },
    typeLabel: TYPE_LABELS[protocol.type],
    date: protocol.protocol_date,
    objektName,
    objektAddress,
    unitLabel: unit?.label ?? "",
    unitFloor: unit?.floor ?? null,
    tenantName: protocol.tenant_name,
    rooms: pdfRooms,
    meters,
    keys,
    notes: protocol.notes,
    signatureLandlord: protocol.signature_landlord,
    signatureTenant: protocol.signature_tenant,
    signatureCity: profile?.address_city ?? null,
    footerEnabled: profile?.pdf_footer_enabled ?? true,
  };
}
