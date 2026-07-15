"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@repo/core";
import { createClient } from "../../lib/supabase/server";
import { parseDecimal, parseIntStrict } from "../../lib/parse";

type UnitType = Database["public"]["Enums"]["unit_type"];
type DepositType = Database["public"]["Enums"]["deposit_type"];

const UNIT_TYPES: readonly UnitType[] = [
  "residential",
  "commercial",
  "parking",
  "other",
];
const DEPOSIT_TYPES: readonly DepositType[] = [
  "cash_deposit",
  "bank_guarantee",
  "deposit_insurance",
  "pledged_savings",
  "none",
];

const ZIP_REGEX = /^[0-9]{5}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FormState = {
  error?: string;
  success?: string;
};

/**
 * Übersetzt Postgres-Fehler (Unique-/Check-Verletzungen) in deutsche Texte.
 * `messages.unique` bzw. `messages.check` liefern den kontextspezifischen Text.
 */
function describeDbError(
  error: PostgrestError,
  messages: { unique?: string; check?: string },
): string {
  if (error.code === "23505" && messages.unique) return messages.unique;
  if (error.code === "23514" && messages.check) return messages.check;
  return `Speichern fehlgeschlagen: ${error.message}`;
}

async function requireUserId(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  return { userId: user.id };
}

// ---------------------------------------------------------------------------
// Gemeinsame Feldvalidierung für Objekte
// ---------------------------------------------------------------------------

type PropertyFields = {
  name: string;
  street: string;
  house_number: string;
  zip: string;
  city: string;
  build_year: number | null;
  total_living_area: number | null;
  notes: string | null;
};

function readPropertyFields(
  formData: FormData,
): { data: PropertyFields } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const street = String(formData.get("street") ?? "").trim();
  const houseNumber = String(formData.get("house_number") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const buildYearRaw = String(formData.get("build_year") ?? "").trim();
  const areaRaw = String(formData.get("total_living_area") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !street || !houseNumber || !zip || !city) {
    return { error: "Bitte alle Pflichtfelder ausfüllen." };
  }
  if (!ZIP_REGEX.test(zip)) {
    return { error: "Die PLZ muss aus genau 5 Ziffern bestehen." };
  }

  let buildYear: number | null = null;
  if (buildYearRaw) {
    const parsed = parseIntStrict(buildYearRaw);
    if (parsed === null || Number.isNaN(parsed) || parsed < 1800 || parsed > 2100) {
      return { error: "Baujahr muss zwischen 1800 und 2100 liegen." };
    }
    buildYear = parsed;
  }

  let area: number | null = null;
  if (areaRaw) {
    const parsed = parseDecimal(areaRaw);
    if (parsed === null || Number.isNaN(parsed) || parsed <= 0) {
      return { error: "Die Wohnfläche muss eine Zahl größer als 0 sein." };
    }
    area = parsed;
  }

  return {
    data: {
      name,
      street,
      house_number: houseNumber,
      zip,
      city,
      build_year: buildYear,
      total_living_area: area,
      notes: notes || null,
    },
  };
}

const PROPERTY_DB_MESSAGES = {
  unique: "Es existiert bereits ein Objekt mit diesem Namen.",
  check:
    "Eingaben ungültig: Bitte PLZ (5 Ziffern), Baujahr (1800–2100) und Wohnfläche prüfen.",
};

export async function createProperty(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const fields = readPropertyFields(formData);
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .insert({ user_id: auth.userId, ...fields.data });

  if (error) {
    return { error: describeDbError(error, PROPERTY_DB_MESSAGES) };
  }

  revalidatePath("/objekte");
  return { success: "Objekt wurde angelegt." };
}

export async function updateProperty(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Objekt konnte nicht ermittelt werden." };

  const fields = readPropertyFields(formData);
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update(fields.data)
    .eq("id", id);

  if (error) {
    return { error: describeDbError(error, PROPERTY_DB_MESSAGES) };
  }

  revalidatePath("/objekte");
  revalidatePath(`/objekte/${id}`);
  return { success: "Objekt wurde aktualisiert." };
}

// ---------------------------------------------------------------------------
// Einheiten
// ---------------------------------------------------------------------------

type UnitFields = {
  label: string;
  unit_type: UnitType;
  floor: string | null;
  living_area: number | null;
  rooms: number | null;
  notes: string | null;
};

function readUnitFields(
  formData: FormData,
): { data: UnitFields } | { error: string } {
  const label = String(formData.get("label") ?? "").trim();
  const unitTypeRaw = String(formData.get("unit_type") ?? "").trim();
  const floor = String(formData.get("floor") ?? "").trim();
  const livingAreaRaw = String(formData.get("living_area") ?? "").trim();
  const roomsRaw = String(formData.get("rooms") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!label) {
    return { error: "Bitte eine Bezeichnung für die Einheit angeben." };
  }
  const unitType = UNIT_TYPES.includes(unitTypeRaw as UnitType)
    ? (unitTypeRaw as UnitType)
    : "residential";

  let livingArea: number | null = null;
  if (livingAreaRaw) {
    const parsed = parseDecimal(livingAreaRaw);
    if (parsed === null || Number.isNaN(parsed) || parsed <= 0) {
      return { error: "Die Wohnfläche muss eine Zahl größer als 0 sein." };
    }
    livingArea = parsed;
  }

  let rooms: number | null = null;
  if (roomsRaw) {
    const parsed = parseDecimal(roomsRaw);
    if (parsed === null || Number.isNaN(parsed) || parsed <= 0) {
      return { error: "Die Zimmeranzahl muss eine Zahl größer als 0 sein." };
    }
    rooms = parsed;
  }

  return {
    data: {
      label,
      unit_type: unitType,
      floor: floor || null,
      living_area: livingArea,
      rooms,
      notes: notes || null,
    },
  };
}

const UNIT_DB_MESSAGES = {
  unique: "Es existiert bereits eine Einheit mit dieser Bezeichnung in diesem Objekt.",
  check: "Eingaben ungültig: Bitte Wohnfläche und Zimmeranzahl prüfen.",
};

export async function createUnit(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const propertyId = String(formData.get("property_id") ?? "").trim();
  if (!propertyId) return { error: "Objekt konnte nicht ermittelt werden." };

  const fields = readUnitFields(formData);
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const { error } = await supabase.from("units").insert({
    user_id: auth.userId,
    property_id: propertyId,
    ...fields.data,
  });

  if (error) {
    return { error: describeDbError(error, UNIT_DB_MESSAGES) };
  }

  revalidatePath(`/objekte/${propertyId}`);
  return { success: "Einheit wurde angelegt." };
}

export async function updateUnit(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const propertyId = String(formData.get("property_id") ?? "").trim();
  if (!id || !propertyId) {
    return { error: "Einheit konnte nicht ermittelt werden." };
  }

  const fields = readUnitFields(formData);
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const { error } = await supabase.from("units").update(fields.data).eq("id", id);

  if (error) {
    return { error: describeDbError(error, UNIT_DB_MESSAGES) };
  }

  revalidatePath(`/objekte/${propertyId}`);
  return { success: "Einheit wurde aktualisiert." };
}

// ---------------------------------------------------------------------------
// Mietverhältnisse (Mieter)
// ---------------------------------------------------------------------------

export async function createTenant(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const unitId = String(formData.get("unit_id") ?? "").trim();
  const propertyId = String(formData.get("property_id") ?? "").trim();
  if (!unitId) return { error: "Einheit konnte nicht ermittelt werden." };

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const personsRaw = String(formData.get("persons_count") ?? "").trim();
  const moveInDate = String(formData.get("move_in_date") ?? "").trim();
  const coldRentRaw = String(formData.get("cold_rent") ?? "").trim();
  const ocaRaw = String(formData.get("operating_costs_advance") ?? "").trim();
  const hcaRaw = String(formData.get("heating_costs_advance") ?? "").trim();
  const rentDueDayRaw = String(formData.get("rent_due_day") ?? "").trim();
  const depositTypeRaw = String(formData.get("deposit_type") ?? "").trim();
  const depositAmountRaw = String(formData.get("deposit_amount") ?? "").trim();

  if (!firstName || !lastName || !moveInDate || !coldRentRaw) {
    return {
      error:
        "Bitte Vorname, Nachname, Einzugsdatum und Kaltmiete ausfüllen.",
    };
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return { error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }

  const coldRent = parseDecimal(coldRentRaw);
  if (coldRent === null || Number.isNaN(coldRent) || coldRent < 0) {
    return { error: "Die Kaltmiete muss eine Zahl ≥ 0 sein." };
  }

  const operatingCostsAdvance = ocaRaw ? parseDecimal(ocaRaw) : 0;
  const heatingCostsAdvance = hcaRaw ? parseDecimal(hcaRaw) : 0;
  const depositAmount = depositAmountRaw ? parseDecimal(depositAmountRaw) : 0;
  if (
    operatingCostsAdvance === null ||
    Number.isNaN(operatingCostsAdvance) ||
    operatingCostsAdvance < 0 ||
    heatingCostsAdvance === null ||
    Number.isNaN(heatingCostsAdvance) ||
    heatingCostsAdvance < 0 ||
    depositAmount === null ||
    Number.isNaN(depositAmount) ||
    depositAmount < 0
  ) {
    return { error: "Vorauszahlungen und Kaution müssen Zahlen ≥ 0 sein." };
  }

  const personsCount = personsRaw ? parseIntStrict(personsRaw) : 1;
  if (personsCount === null || Number.isNaN(personsCount) || personsCount < 1) {
    return { error: "Die Personenzahl muss mindestens 1 betragen." };
  }

  const rentDueDay = rentDueDayRaw ? parseIntStrict(rentDueDayRaw) : 3;
  if (
    rentDueDay === null ||
    Number.isNaN(rentDueDay) ||
    rentDueDay < 1 ||
    rentDueDay > 28
  ) {
    return { error: "Der Fälligkeitstag muss zwischen 1 und 28 liegen." };
  }

  const depositType = DEPOSIT_TYPES.includes(depositTypeRaw as DepositType)
    ? (depositTypeRaw as DepositType)
    : "cash_deposit";

  const supabase = await createClient();
  const { error } = await supabase.from("tenants").insert({
    user_id: auth.userId,
    unit_id: unitId,
    first_name: firstName,
    last_name: lastName,
    email: email || null,
    phone: phone || null,
    persons_count: personsCount,
    move_in_date: moveInDate,
    cold_rent: coldRent,
    operating_costs_advance: operatingCostsAdvance,
    heating_costs_advance: heatingCostsAdvance,
    rent_due_day: rentDueDay,
    deposit_type: depositType,
    deposit_amount: depositAmount,
  });

  if (error) {
    return {
      error: describeDbError(error, {
        unique:
          "Für diese Einheit besteht bereits ein aktives Mietverhältnis. Bitte zuerst das bestehende beenden (Auszugsdatum setzen).",
        check:
          "Eingaben ungültig: Bitte Beträge, Personenzahl (≥ 1) und Fälligkeitstag (1–28) prüfen.",
      }),
    };
  }

  if (propertyId) {
    revalidatePath(`/objekte/${propertyId}`);
  }
  return { success: "Mietverhältnis wurde angelegt." };
}

/** Aktualisiert die Stammdaten eines Mietverhältnisses. */
export async function updateTenant(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const propertyId = String(formData.get("property_id") ?? "").trim();
  if (!id) return { error: "Mietverhältnis konnte nicht ermittelt werden." };

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const personsRaw = String(formData.get("persons_count") ?? "").trim();
  const moveInDate = String(formData.get("move_in_date") ?? "").trim();
  const coldRentRaw = String(formData.get("cold_rent") ?? "").trim();
  const ocaRaw = String(formData.get("operating_costs_advance") ?? "").trim();
  const hcaRaw = String(formData.get("heating_costs_advance") ?? "").trim();
  const rentDueDayRaw = String(formData.get("rent_due_day") ?? "").trim();
  const depositTypeRaw = String(formData.get("deposit_type") ?? "").trim();
  const depositAmountRaw = String(formData.get("deposit_amount") ?? "").trim();
  const depositPaid = String(formData.get("deposit_paid") ?? "") === "true";
  const iban = String(formData.get("iban") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!firstName || !lastName || !moveInDate || !coldRentRaw) {
    return {
      error: "Bitte Vorname, Nachname, Einzugsdatum und Kaltmiete ausfüllen.",
    };
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return { error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }

  const coldRent = parseDecimal(coldRentRaw);
  if (coldRent === null || Number.isNaN(coldRent) || coldRent < 0) {
    return { error: "Die Kaltmiete muss eine Zahl ≥ 0 sein." };
  }

  const operatingCostsAdvance = ocaRaw ? parseDecimal(ocaRaw) : 0;
  const heatingCostsAdvance = hcaRaw ? parseDecimal(hcaRaw) : 0;
  const depositAmount = depositAmountRaw ? parseDecimal(depositAmountRaw) : 0;
  if (
    operatingCostsAdvance === null ||
    Number.isNaN(operatingCostsAdvance) ||
    operatingCostsAdvance < 0 ||
    heatingCostsAdvance === null ||
    Number.isNaN(heatingCostsAdvance) ||
    heatingCostsAdvance < 0 ||
    depositAmount === null ||
    Number.isNaN(depositAmount) ||
    depositAmount < 0
  ) {
    return { error: "Vorauszahlungen und Kaution müssen Zahlen ≥ 0 sein." };
  }

  const personsCount = personsRaw ? parseIntStrict(personsRaw) : 1;
  if (personsCount === null || Number.isNaN(personsCount) || personsCount < 1) {
    return { error: "Die Personenzahl muss mindestens 1 betragen." };
  }

  const rentDueDay = rentDueDayRaw ? parseIntStrict(rentDueDayRaw) : 3;
  if (
    rentDueDay === null ||
    Number.isNaN(rentDueDay) ||
    rentDueDay < 1 ||
    rentDueDay > 28
  ) {
    return { error: "Der Fälligkeitstag muss zwischen 1 und 28 liegen." };
  }

  const depositType = DEPOSIT_TYPES.includes(depositTypeRaw as DepositType)
    ? (depositTypeRaw as DepositType)
    : "cash_deposit";

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      persons_count: personsCount,
      move_in_date: moveInDate,
      cold_rent: coldRent,
      operating_costs_advance: operatingCostsAdvance,
      heating_costs_advance: heatingCostsAdvance,
      rent_due_day: rentDueDay,
      deposit_type: depositType,
      deposit_amount: depositAmount,
      deposit_paid: depositPaid,
      iban: iban || null,
      notes: notes || null,
    })
    .eq("id", id);

  if (error) {
    return {
      error: describeDbError(error, {
        check:
          "Eingaben ungültig: Bitte Beträge, Personenzahl (≥ 1) und Fälligkeitstag (1–28) prüfen.",
      }),
    };
  }

  if (propertyId) revalidatePath(`/objekte/${propertyId}`);
  revalidatePath(`/mieteingang/${id}`);
  return { success: "Mietverhältnis wurde aktualisiert." };
}

/** Beendet ein Mietverhältnis, indem das Auszugsdatum gesetzt wird. */
export async function endTenancy(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const propertyId = String(formData.get("property_id") ?? "").trim();
  const moveOut = String(formData.get("move_out_date") ?? "").trim();
  const moveIn = String(formData.get("move_in_date") ?? "").trim();
  if (!id) return { error: "Mietverhältnis konnte nicht ermittelt werden." };
  if (!moveOut) return { error: "Bitte ein Auszugsdatum angeben." };
  if (moveIn && moveOut < moveIn) {
    return {
      error: "Das Auszugsdatum muss am oder nach dem Einzugsdatum liegen.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({ move_out_date: moveOut })
    .eq("id", id);

  if (error) {
    return {
      error: describeDbError(error, {
        check: "Das Auszugsdatum muss am oder nach dem Einzugsdatum liegen.",
      }),
    };
  }

  if (propertyId) revalidatePath(`/objekte/${propertyId}`);
  revalidatePath(`/mieteingang/${id}`);
  return { success: "Mietverhältnis wurde beendet." };
}
