// Umlagefähige Kostenarten nach § 2 BetrKV mit deutschem Label und Kurzinfo.
// Reihenfolge und Labels gemäß Checkliste. „non_apportionable" ist bewusst
// nicht enthalten (Checkliste zeigt nur umlagefähige Kostenarten).

export type CostTypeInfo = {
  key: string;
  label: string;
  info: string;
};

export const UMLAGEFAEHIGE_KOSTENARTEN: CostTypeInfo[] = [
  {
    key: "property_tax",
    label: "Grundsteuer",
    info: "Die vom Finanzamt festgesetzte Grundsteuer B. Voll umlagefähig. Bei Nachforderungen aus Vorjahren: dem Jahr zuordnen, für das sie erhoben wird.",
  },
  {
    key: "water_supply",
    label: "Wasserversorgung",
    info: "Frischwasserkosten inkl. Grund-/Zählergebühren, Miete und Wartung von Wasserzählern sowie Betrieb einer hauseigenen Wasserversorgung. NICHT umlagefähig: Reparaturen an Leitungen.",
  },
  {
    key: "drainage",
    label: "Entwässerung",
    info: "Gebühren für Haus- und Grundstücksentwässerung (Schmutz- und Niederschlagswasser) sowie Betrieb einer Entwässerungspumpe. NICHT umlagefähig: Sanierung oder Reparatur von Abwasserleitungen.",
  },
  {
    key: "heating",
    label: "Heizung",
    info: "Brennstoffkosten, Wartung, Messdienst, Betriebsstrom der Anlage. NICHT umlagefähig: Reparaturen und Instandhaltung. Verteilung erfolgt über die Messdienst-Abrechnung (Schritt 3).",
  },
  {
    key: "hot_water",
    label: "Warmwasser",
    info: "Kosten der zentralen Warmwasserversorgung (Brennstoff, Betriebsstrom, Wartung, Messdienst). NICHT umlagefähig: Instandhaltung. Verteilung überwiegend verbrauchsabhängig über den Messdienst (Schritt 3).",
  },
  {
    key: "elevator",
    label: "Aufzug",
    info: "Betriebsstrom, Wartung, TÜV-Prüfung, Notrufbereitschaft und Reinigung. NICHT umlagefähig: Reparaturen und Instandsetzung des Aufzugs.",
  },
  {
    key: "street_cleaning",
    label: "Straßenreinigung",
    info: "Öffentliche Straßenreinigungsgebühren sowie Winterdienst (Räum- und Streupflicht), auch durch beauftragte Dienstleister. Der Lohnanteil ist § 35a-relevant.",
  },
  {
    key: "waste_disposal",
    label: "Müllbeseitigung",
    info: "Müllabfuhrgebühren, Kosten der Müllmengenerfassung sowie Betrieb von Müllschluckern/-kompressoren. NICHT umlagefähig: einmalige Entrümpelungen.",
  },
  {
    key: "building_cleaning",
    label: "Gebäudereinigung",
    info: "Reinigung gemeinschaftlich genutzter Flächen (Treppenhaus, Flure, Keller) und Ungezieferbekämpfung. Der Lohnanteil ist § 35a-relevant. NICHT umlagefähig: Reinigung nach Sanierungen.",
  },
  {
    key: "garden_maintenance",
    label: "Gartenpflege",
    info: "Pflege von Gartenflächen, Wegen und Spielplätzen sowie Erneuerung von Pflanzen. NICHT umlagefähig: erstmalige Anlage des Gartens. Der Lohnanteil ist § 35a-relevant.",
  },
  {
    key: "lighting",
    label: "Beleuchtung / Allgemeinstrom",
    info: "Stromkosten der Außen- und Gemeinschaftsbeleuchtung (Flure, Keller, Hof). NICHT umlagefähig: Erneuerung von Leuchten oder der Elektroinstallation.",
  },
  {
    key: "chimney_sweep",
    label: "Schornsteinfeger",
    info: "Kehrgebühren und Immissionsmessungen, soweit nicht bereits in den Heizkosten enthalten. NICHT umlagefähig: Reparaturen am Schornstein.",
  },
  {
    key: "insurance",
    label: "Sach- und Haftpflichtversicherung",
    info: "Gebäude-, Haftpflicht- und Glasversicherung. NICHT umlagefähig: Rechtsschutz- und Mietausfallversicherung.",
  },
  {
    key: "caretaker",
    label: "Hauswart",
    info: "Lohn für laufende Tätigkeiten (Reinigung, Kontrolle, Gartenpflege). NICHT umlagefähig: Verwaltungs- und Reparaturtätigkeiten – ggf. Rechnungsanteil herausrechnen. Der Lohnanteil ist § 35a-relevant.",
  },
  {
    key: "cable_tv_internet",
    label: "Kabel / Antenne",
    info: "Betrieb der Gemeinschaftsantenne bzw. Kabelanlage und Grundgebühren des Anschlusses. NICHT umlagefähig: Errichtung der Anlage. Hinweis: Die Umlage über die Nebenkosten ist seit Juli 2024 nur noch eingeschränkt zulässig.",
  },
  {
    key: "laundry_facilities",
    label: "Wäschepflege",
    info: "Betriebskosten gemeinschaftlicher Wascheinrichtungen: Strom, Wartung und Reinigung der Waschküche. NICHT umlagefähig: Anschaffung oder Reparatur der Geräte.",
  },
  {
    key: "other_operating_costs",
    label: "Sonstige Betriebskosten",
    info: "Nur umlagefähig, wenn im Mietvertrag ausdrücklich benannt (z. B. Dachrinnenreinigung, Legionellenprüfung, Wartung von Rauchmeldern).",
  },
];
