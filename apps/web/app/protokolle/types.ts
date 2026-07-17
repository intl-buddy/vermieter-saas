// Gemeinsame Typen & Labels für das Wohnungsübergabeprotokoll.
// Framework-frei (kein "use client"/"use server") – wird im Wizard (Client),
// in den Server-Actions und im PDF-Renderer genutzt.

export type HandoverType = "move_in" | "move_out";
export type HandoverStatus = "draft" | "completed";
export type RoomCondition = "good" | "used" | "defective";
export type MeterType = "strom" | "gas" | "wasser_kalt" | "wasser_warm" | "heizung";

export interface RoomPhoto {
  /** Storage-Pfad im Bucket „protocols": {user_id}/{protocol_id}/fotos/{uuid}.jpg */
  path: string;
}

export interface ProtocolRoom {
  name: string;
  condition: RoomCondition;
  defects: string;
  photos: RoomPhoto[];
}

export interface MeterReading {
  type: MeterType;
  number: string;
  value: string;
}

export interface ProtocolKey {
  label: string;
  count: number;
}

export const TYPE_LABELS: Record<HandoverType, string> = {
  move_in: "Einzug",
  move_out: "Auszug",
};

export const CONDITION_LABELS: Record<RoomCondition, string> = {
  good: "Gut",
  used: "Gebrauchsspuren",
  defective: "Mangelhaft",
};

export const METER_LABELS: Record<MeterType, string> = {
  strom: "Strom",
  gas: "Gas",
  wasser_kalt: "Wasser (kalt)",
  wasser_warm: "Wasser (warm)",
  heizung: "Heizung",
};

export const METER_TYPES: MeterType[] = [
  "strom",
  "gas",
  "wasser_kalt",
  "wasser_warm",
  "heizung",
];

/** Vorschlagsliste für Räume (hinzufüg-/entfernbar). */
export const ROOM_SUGGESTIONS = [
  "Flur",
  "Wohnzimmer",
  "Schlafzimmer",
  "Küche",
  "Bad",
  "Keller",
  "Balkon",
];

/** Max. Fotos je Raum, die ins PDF eingebettet werden (Rest nur digital). */
export const MAX_PHOTOS_IN_PDF = 4;

// ---- sichere Parser: JSONB aus der DB kommt als `unknown`/`Json` ------------

export function parseRooms(value: unknown): ProtocolRoom[] {
  if (!Array.isArray(value)) return [];
  return value.map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    const condition = o.condition;
    return {
      name: typeof o.name === "string" ? o.name : "",
      condition:
        condition === "good" || condition === "used" || condition === "defective"
          ? condition
          : "good",
      defects: typeof o.defects === "string" ? o.defects : "",
      photos: Array.isArray(o.photos)
        ? (o.photos as unknown[])
            .map((p) => {
              const po = (p ?? {}) as Record<string, unknown>;
              return typeof po.path === "string" ? { path: po.path } : null;
            })
            .filter((p): p is RoomPhoto => p !== null)
        : [],
    };
  });
}

export function parseMeters(value: unknown): MeterReading[] {
  if (!Array.isArray(value)) return [];
  return value.map((m) => {
    const o = (m ?? {}) as Record<string, unknown>;
    const t = o.type;
    return {
      type: METER_TYPES.includes(t as MeterType) ? (t as MeterType) : "strom",
      number: typeof o.number === "string" ? o.number : "",
      value: typeof o.value === "string" ? o.value : "",
    };
  });
}

export function parseKeys(value: unknown): ProtocolKey[] {
  if (!Array.isArray(value)) return [];
  return value.map((k) => {
    const o = (k ?? {}) as Record<string, unknown>;
    const count = Number(o.count);
    return {
      label: typeof o.label === "string" ? o.label : "",
      count: Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0,
    };
  });
}
