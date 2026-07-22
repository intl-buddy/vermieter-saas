import type { SupabaseServerClient } from "../supabase/server";

/**
 * Lädt für die Vorlagen-Auswahl den kompletten Objekt-→-Einheit-→-Mieter-Baum
 * des eingeloggten Nutzers sowie sein Absenderprofil (Vermieter). RLS stellt
 * sicher, dass nur eigene Datensätze geladen werden.
 *
 * Der Baum wird an die Client-Auswahl übergeben; dort werden aus der Auswahl
 * die Formularfelder vorbefüllt.
 */

export type VorlagenTenant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  move_in_date: string;
  move_out_date: string | null;
  cold_rent: number;
  operating_costs_advance: number;
  heating_costs_advance: number;
  advance_mode: string;
  deposit_amount: number;
  deposit_type: string;
  iban: string | null;
};

export type VorlagenUnit = {
  id: string;
  label: string;
  floor: string | null;
  rooms: number | null;
  living_area: number | null;
  unit_type: string;
  tenants: VorlagenTenant[];
};

export type VorlagenProperty = {
  id: string;
  name: string;
  street: string;
  house_number: string;
  zip: string;
  city: string;
  rent_iban: string | null;
  units: VorlagenUnit[];
};

export type VorlagenSender = {
  fullName: string;
  companyName: string | null;
  addressStreet: string | null;
  addressZip: string | null;
  addressCity: string | null;
  iban: string | null;
  bankName: string | null;
  bic: string | null;
};

export type VorlagenData = {
  properties: VorlagenProperty[];
  sender: VorlagenSender;
};

/** Lädt Objekte inkl. Einheiten und (aktueller) Mieter sowie das Absenderprofil. */
export async function loadVorlagenData(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<VorlagenData> {
  const [{ data: properties }, { data: profile }] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id, name, street, house_number, zip, city, rent_iban, units(id, label, floor, rooms, living_area, unit_type, tenants(id, first_name, last_name, email, move_in_date, move_out_date, cold_rent, operating_costs_advance, heating_costs_advance, advance_mode, deposit_amount, deposit_type, iban))",
      )
      .order("name", { ascending: true }),
    supabase
      .from("users")
      .select(
        "full_name, company_name, address_street, address_zip, address_city, iban, bank_name, bic",
      )
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const mapped: VorlagenProperty[] = (properties ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    street: p.street,
    house_number: p.house_number,
    zip: p.zip,
    city: p.city,
    rent_iban: p.rent_iban,
    units: (p.units ?? [])
      .map((u) => ({
        id: u.id,
        label: u.label,
        floor: u.floor,
        rooms: u.rooms,
        living_area: u.living_area,
        unit_type: u.unit_type,
        tenants: (u.tenants ?? []).map((t) => ({
          id: t.id,
          first_name: t.first_name,
          last_name: t.last_name,
          email: t.email,
          move_in_date: t.move_in_date,
          move_out_date: t.move_out_date,
          cold_rent: t.cold_rent,
          operating_costs_advance: t.operating_costs_advance,
          heating_costs_advance: t.heating_costs_advance,
          advance_mode: t.advance_mode,
          deposit_amount: t.deposit_amount,
          deposit_type: t.deposit_type,
          iban: t.iban,
        })),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "de")),
  }));

  return {
    properties: mapped,
    sender: {
      fullName: profile?.full_name ?? "",
      companyName: profile?.company_name ?? null,
      addressStreet: profile?.address_street ?? null,
      addressZip: profile?.address_zip ?? null,
      addressCity: profile?.address_city ?? null,
      iban: profile?.iban ?? null,
      bankName: profile?.bank_name ?? null,
      bic: profile?.bic ?? null,
    },
  };
}
