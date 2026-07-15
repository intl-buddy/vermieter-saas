import type { Database } from "@repo/core";

type CostType = Database["public"]["Enums"]["operating_cost_type"];
type AllocationKey = Database["public"]["Enums"]["allocation_key"];

export const COST_TYPE_LABELS: Record<CostType, string> = {
  property_tax: "Grundsteuer",
  water_supply: "Wasserversorgung",
  drainage: "Entwässerung",
  heating: "Heizung",
  hot_water: "Warmwasser",
  elevator: "Aufzug",
  street_cleaning: "Straßenreinigung",
  waste_disposal: "Müllbeseitigung",
  building_cleaning: "Gebäudereinigung",
  garden_maintenance: "Gartenpflege",
  lighting: "Beleuchtung (Allgemeinstrom)",
  chimney_sweep: "Schornsteinfeger",
  insurance: "Versicherung",
  caretaker: "Hauswart",
  cable_tv_internet: "Kabel / Antenne",
  laundry_facilities: "Waschküche",
  other_operating_costs: "Sonstige Betriebskosten",
  non_apportionable: "Nicht umlagefähig",
};

export const COST_TYPE_OPTIONS: { value: CostType; label: string }[] = (
  Object.keys(COST_TYPE_LABELS) as CostType[]
).map((value) => ({ value, label: COST_TYPE_LABELS[value] }));

export const ALLOCATION_LABELS: Record<AllocationKey, string> = {
  living_area: "Wohnfläche",
  persons: "Personenzahl",
  units: "Anzahl Einheiten",
  consumption: "Verbrauch",
  ownership_share: "Miteigentumsanteile",
  direct: "Direktzuordnung",
};

// „direct" braucht eine Einheit (chk_direct_needs_unit) – im Belegdialog ohne
// Einheitsauswahl daher nicht angeboten.
export const ALLOCATION_OPTIONS: { value: AllocationKey; label: string }[] = [
  "living_area",
  "persons",
  "units",
  "consumption",
  "ownership_share",
].map((value) => ({
  value: value as AllocationKey,
  label: ALLOCATION_LABELS[value as AllocationKey],
}));

export const VAT_RATES = [19, 7, 0] as const;
