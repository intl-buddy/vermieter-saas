import { formatDate } from "../format";
import { MV_SECTIONS, BETRKV_INTRO, BETRKV_ITEMS } from "./mietvertragSections";
import { HAUSORDNUNG_TEXT } from "./hausordnungText";
import { LUEFTUNGSHINWEISE_TEXT } from "./lueftungshinweiseText";

// --------------------------------------------------------------------------
// Datenmodell
// --------------------------------------------------------------------------

export type Staffel = { ab: string; miete: number };

export type MietvertragData = {
  vermieterName: string;
  vermieterAnschrift: string;
  mieterName: string;
  mieterAnschrift: string;
  mieterGeburtsdatum: string; // ISO oder ""

  objektAdresseLage: string;
  zimmer: string;
  kuechen: number;
  baeder: number;
  keller: boolean;
  balkon: boolean;

  stellplatz: boolean;
  stellplatzBez: string;
  stellplatzMiete: number;

  mietbeginn: string; // ISO oder ""

  grundmiete: number;
  betriebskosten: number;
  heizkosten: number;
  advanceMode: string; // split | combined

  mietart: string; // standard | staffel | index
  staffeln: Staffel[];

  kontoinhaber: string;
  iban: string;
  bic: string;

  depositType: string;
  depositAmount: number;

  besondere: string;

  anlagen: {
    betrkv: boolean;
    sepa: boolean;
    hausordnung: boolean;
    lueftung: boolean;
  };
};

// --------------------------------------------------------------------------
// Blöcke
// --------------------------------------------------------------------------

export type Block =
  | { t: "clause"; text: string }
  | { t: "address"; text: string }
  | { t: "list"; items: string[] }
  | { t: "money"; rows: MoneyRow[]; total: MoneyRow }
  | { t: "bank"; rows: MoneyRow[] }
  | { t: "subheading"; text: string }
  | { t: "sepa"; glaeubiger: string };

type MoneyRow = { label: string; value: string };

export type Section = { heading: string; blocks: Block[] };
export type Anlage = { nummer: number; titel: string; blocks: Block[] };
export type MietvertragDoc = {
  parties: {
    vermieterName: string;
    vermieterAnschrift: string;
    mieterName: string;
    mieterAnschrift: string;
    mieterGeburtsdatum: string;
  };
  sections: Section[];
  anlagen: Anlage[];
};

// --------------------------------------------------------------------------
// Hilfen
// --------------------------------------------------------------------------

const eurFmt = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const eur = (n: number) => `${eurFmt.format(n)} EUR`;
const dash = (iso: string) => (iso ? formatDate(iso) : "____________");
const fill = (v: string) => v || "____________";

const byNum = new Map(MV_SECTIONS.map((s) => [s.num, s]));
const paras = (num: number) => byNum.get(num)?.paragraphs ?? [];
const para = (num: number, prefix: string) =>
  paras(num).find((p) => p.startsWith(prefix)) ?? "";

/** Verweise auf nicht beigefügte Anlagen neutral formulieren. */
function fixRefs(text: string, a: MietvertragData["anlagen"]): string {
  let t = text;
  if (!a.betrkv)
    t = t.replace(
      "Die Betriebskostenverordnung ist als Anlage 1 beigefügt.",
      "Maßgeblich ist der Betriebskostenkatalog des § 2 der Betriebskostenverordnung (BetrKV).",
    );
  if (!a.sepa)
    t = t.replace(
      "die dazu in Anlage 2 erforderliche Einzugsermächtigung",
      "die dazu erforderliche Einzugsermächtigung",
    );
  if (!a.hausordnung) {
    t = t.replace(
      "die diesem Vertrag als Anlage 3 beigeheftet ist",
      "die der Vermieter gesondert bekannt gibt",
    );
    t = t.replace(
      "in der als Anlage 3 beigefügten Hausordnung",
      "in der Hausordnung",
    );
  }
  if (!a.lueftung)
    t = t.replace(
      /die in Anlage 4 beigefügten Allgemeinen Hinweise/g,
      "die Allgemeinen Hinweise",
    );
  // Anlage 5 (Nachhaltigkeit) wird nicht angeboten.
  t = t.replace(
    "die in Anlage 5 aufgeführten Maßnahmen umsetzen",
    "entsprechende Maßnahmen im Rahmen des wirtschaftlich Angemessenen umsetzen",
  );
  return t;
}

/** Erste Sätze von § 8.1 abhängig von der Kautionsart. */
function kautionSatz(type: string, amount: number): string {
  switch (type) {
    case "bank_guarantee":
      return `stellt als Mietsicherheit eine selbstschuldnerische Bürgschaft in Höhe von ${eur(amount)}`;
    case "deposit_insurance":
      return `stellt als Mietsicherheit eine Kautionsversicherung in Höhe von ${eur(amount)}`;
    case "pledged_savings":
      return `stellt als Mietsicherheit ein verpfändetes Sparguthaben in Höhe von ${eur(amount)}`;
    case "cash_deposit":
    default:
      return `hinterlegt eine Barkaution in Höhe von ${eur(amount)}`;
  }
}

// --------------------------------------------------------------------------
// Einfache Dokumente (Hausordnung, Lüftungshinweise) parsen
// --------------------------------------------------------------------------

function parseSimpleDoc(raw: string): Block[] {
  const lines = raw.split("\n");
  const blocks: Block[] = [];
  let group: string[] = [];
  const flush = () => {
    if (group.length) {
      blocks.push({ t: "clause", text: group.join(" ").replace(/\s+/g, " ").trim() });
      group = [];
    }
  };
  // erste nicht-leere Zeile ist der Titel → wird im Deckblatt gezeigt
  let titleSkipped = false;
  for (const line of lines) {
    const l = line.trim();
    if (!titleSkipped) {
      if (l) titleSkipped = true;
      continue;
    }
    if (l === "") {
      flush();
    } else if (l.startsWith("# ")) {
      flush();
      blocks.push({ t: "subheading", text: l.slice(2).trim() });
    } else {
      group.push(l);
    }
  }
  flush();
  return blocks;
}

// --------------------------------------------------------------------------
// Aufbau des Vertrags
// --------------------------------------------------------------------------

export function buildMietvertragDoc(data: MietvertragData): MietvertragDoc {
  const a = data.anlagen;
  const combined = data.advanceMode === "combined";
  const clause = (num: number, prefix: string): Block => ({
    t: "clause",
    text: fixRefs(para(num, prefix), a),
  });

  const sections: Section[] = [];

  // § 1 Mietsache
  const roomItems: string[] = [`${data.zimmer || "____"} Zimmer`];
  if (data.kuechen > 0)
    roomItems.push(`${data.kuechen} Küche${data.kuechen > 1 ? "n" : ""}`);
  if (data.baeder > 0)
    roomItems.push(`${data.baeder} Bad/WC${data.baeder > 1 ? " (mehrere)" : ""}`);
  if (data.keller) roomItems.push("Kellerraum");
  if (data.balkon) roomItems.push("Balkon/Terrasse");

  const s1: Block[] = [
    {
      t: "clause",
      text: "(1.1) Der Vermieter überlässt dem Mieter zu Wohnzwecken die nachfolgend bezeichnete Wohnung:",
    },
    { t: "address", text: fill(data.objektAdresseLage) },
    { t: "clause", text: "Die Wohnung besteht aus den folgenden Räumen:" },
    { t: "list", items: roomItems },
  ];
  if (data.stellplatz) {
    s1.push({
      t: "clause",
      text: `Mitvermietet wird ein Stellplatz bzw. eine Garage${
        data.stellplatzBez ? ` mit der Bezeichnung „${data.stellplatzBez}“` : ""
      }.`,
    });
  }
  s1.push(clause(1, "Der Standard"));
  s1.push(clause(1, "(1.2)"));
  sections.push({ heading: "§ 1 Mietsache", blocks: s1 });

  // § 2 Mietdauer
  sections.push({
    heading: "§ 2 Mietdauer",
    blocks: [
      {
        t: "clause",
        text: fixRefs(para(2, "(2.1)"), a).replace("01.01.2024", dash(data.mietbeginn)),
      },
      clause(2, "(2.2)"),
    ],
  });

  // § 3 Wohnungsübergabe
  sections.push({
    heading: `§ 3 ${byNum.get(3)?.title ?? "Wohnungsübergabe"}`,
    blocks: paras(3).map((p) => ({ t: "clause", text: fixRefs(p, a) })),
  });

  // § 4 Miete
  const moneyRows: MoneyRow[] = [
    { label: "Grundmiete", value: eur(data.grundmiete) },
  ];
  if (combined) {
    moneyRows.push({
      label: "Nebenkostenvorauszahlung",
      value: eur(data.betriebskosten + data.heizkosten),
    });
  } else {
    moneyRows.push({
      label: "Betriebskostenvorauszahlung",
      value: eur(data.betriebskosten),
    });
    moneyRows.push({
      label: "Heizkosten-/Warmwasservorauszahlung",
      value: eur(data.heizkosten),
    });
  }
  if (data.stellplatz) {
    moneyRows.push({
      label: "Miete für Stellplatz/Garage",
      value: eur(data.stellplatzMiete),
    });
  }
  const gesamt =
    data.grundmiete +
    data.betriebskosten +
    data.heizkosten +
    (data.stellplatz ? data.stellplatzMiete : 0);
  sections.push({
    heading: "§ 4 Miete",
    blocks: [
      {
        t: "clause",
        text: "(4.1) Der Mieter leistet – vorbehaltlich einer Anpassung nach § 5 – an den Vermieter folgende monatliche Zahlungen:",
      },
      {
        t: "money",
        rows: moneyRows,
        total: { label: "Gesamtmiete", value: eur(gesamt) },
      },
      clause(4, "(4.2)"),
      clause(4, "(4.3)"),
    ],
  });

  // § 5 Zukünftige Mieterhöhungen – variantenabhängig
  sections.push({ heading: "§ 5 Zukünftige Mieterhöhungen", blocks: mietartBlocks(data) });

  // § 6 Betriebskosten
  sections.push({
    heading: "§ 6 Betriebskosten",
    blocks: paras(6).map((p) => ({ t: "clause", text: fixRefs(p, a) })),
  });

  // § 7 Mietzahlungen
  const bankRows: MoneyRow[] = [
    { label: "Kontoinhaber", value: fill(data.kontoinhaber) },
    { label: "IBAN", value: fill(data.iban) },
  ];
  if (data.bic) bankRows.push({ label: "BIC", value: data.bic });
  sections.push({
    heading: "§ 7 Mietzahlungen",
    blocks: [
      {
        t: "clause",
        text: "(7.1) Die Miete nach § 4.1 ist monatlich im Voraus, spätestens bis zum dritten Werktag eines jeden Monats kostenfrei auf das nachstehende Konto des Vermieters zu entrichten. Für die Rechtzeitigkeit der Zahlung ist der Eingang auf dem Konto des Vermieters maßgeblich.",
      },
      { t: "bank", rows: bankRows },
      clause(7, "(7.2)"),
      clause(7, "(7.3)"),
      clause(7, "(7.4)"),
    ],
  });

  // § 8 Sicherheitsleistung
  const s8: Block[] = [];
  if (data.depositType === "none") {
    s8.push({
      t: "clause",
      text: "(8.1) Eine Mietsicherheit (Kaution) wird nicht vereinbart.",
    });
  } else {
    s8.push({
      t: "clause",
      text: para(8, "(8.1)").replace(
        "Der Mieter hinterlegt eine Barkaution in Höhe von 1.800,00 EUR (zwei Kaltmieten)",
        `Der Mieter ${kautionSatz(data.depositType, data.depositAmount)}`,
      ),
    });
    for (const p of ["(8.2)", "(8.3)", "(8.4)", "(8.5)", "(8.6)", "(8.7)"]) {
      s8.push(clause(8, p));
    }
  }
  sections.push({ heading: "§ 8 Sicherheitsleistung", blocks: s8 });

  // §§ 9–24 (Boilerplate)
  for (let n = 9; n <= 24; n++) {
    sections.push({
      heading: `§ ${n} ${byNum.get(n)?.title ?? ""}`.trim(),
      blocks: paras(n).map((p) => ({ t: "clause", text: fixRefs(p, a) })),
    });
  }

  // § 25 Besondere Vereinbarungen (neu)
  sections.push({
    heading: "§ 25 Besondere Vereinbarungen",
    blocks: [{ t: "clause", text: data.besondere.trim() || "Keine." }],
  });

  // § 26 Schlussbestimmungen (ehem. § 25) – umnummeriert, Anlagenliste ersetzt
  const schlussParas = paras(25)
    .filter((p) => !p.startsWith("(25.5)"))
    .map((p) => ({
      t: "clause" as const,
      text: fixRefs(p.replace(/^\(25\./, "(26."), a),
    }));
  schlussParas.push({ t: "clause", text: anlagenListe(a) });
  sections.push({ heading: "§ 26 Schlussbestimmungen", blocks: schlussParas });

  // Anlagen (feste Nummern: 1 BetrKV, 2 SEPA, 3 Hausordnung, 4 Lüftung)
  const anlagen: Anlage[] = [];
  if (a.betrkv) {
    anlagen.push({
      nummer: 1,
      titel: "Betriebskostenverordnung",
      blocks: [
        { t: "subheading", text: "Betriebskosten gemäß § 2 Betriebskostenverordnung" },
        { t: "clause", text: BETRKV_INTRO },
        ...BETRKV_ITEMS.map((it) => ({ t: "clause" as const, text: it })),
      ],
    });
  }
  if (a.sepa) {
    anlagen.push({
      nummer: 2,
      titel: "SEPA-Lastschriftmandat",
      blocks: [{ t: "sepa", glaeubiger: data.vermieterName }],
    });
  }
  if (a.hausordnung) {
    anlagen.push({
      nummer: 3,
      titel: "Hausordnung",
      blocks: parseSimpleDoc(HAUSORDNUNG_TEXT),
    });
  }
  if (a.lueftung) {
    anlagen.push({
      nummer: 4,
      titel: "Hinweise zur Belüftung und Beheizung",
      blocks: parseSimpleDoc(LUEFTUNGSHINWEISE_TEXT),
    });
  }

  return {
    parties: {
      vermieterName: fill(data.vermieterName),
      vermieterAnschrift: fill(data.vermieterAnschrift),
      mieterName: fill(data.mieterName),
      mieterAnschrift: fill(data.mieterAnschrift),
      mieterGeburtsdatum: dash(data.mieterGeburtsdatum),
    },
    sections,
    anlagen,
  };
}

/** Blöcke für § 5 je nach gewählter Mietart. */
function mietartBlocks(data: MietvertragData): Block[] {
  if (data.mietart === "staffel") {
    const items: string[] = [
      `ab Mietbeginn (${dash(data.mietbeginn)}): ${eur(data.grundmiete)} (Grundmiete gemäß § 4.1)`,
      ...data.staffeln.map((s) => `ab ${dash(s.ab)}: ${eur(s.miete)}`),
    ];
    return [
      {
        t: "clause",
        text: "(5.1) Die Grundmiete gemäß § 4.1 wird als Staffelmiete gemäß § 557a BGB vereinbart.",
      },
      {
        t: "clause",
        text: "(5.2) Für die Grundmiete werden die folgenden Staffeln vereinbart. Die jeweilige Miete gilt ab dem genannten Zeitpunkt:",
      },
      { t: "list", items },
      {
        t: "clause",
        text: "(5.3) Während der Laufzeit einer Staffelmiete ist eine Erhöhung nach den §§ 558–559b BGB ausgeschlossen. Bei einer längeren Mindestlaufzeit oder Befristung des Mietvertrages kann der Mieter zum Ablauf von 4 Jahren seit Abschluss der Staffelmietvereinbarung den Mietvertrag erstmals mit der gesetzlichen Frist kündigen.",
      },
    ];
  }
  if (data.mietart === "index") {
    return [
      {
        t: "clause",
        text: "(5.1) Die Grundmiete gemäß § 4.1 wird als Indexmiete gemäß § 557b BGB vereinbart. Erhöht oder ermäßigt sich seit dem Vertragsbeginn der vom Statistischen Bundesamt herausgegebene Verbraucherpreisindex für Deutschland (Basisjahr 2020 = 100), so kann sich die Grundmiete im gleichen prozentualen Verhältnis erhöhen oder ermäßigen. Das gleiche gilt für jede erneute Änderung des Verbraucherpreisindex.",
      },
      {
        t: "clause",
        text: "(5.2) Eine Anpassung der Miete an die Änderung des Verbraucherpreisindex ist frühestens nach Ablauf von 12 Monaten seit Vertragsbeginn oder der letzten Änderung möglich. Die geänderte Miete ist vom Beginn des übernächsten Monats nach dem Zugang der Änderungserklärung des Vermieters oder Mieters zur Zahlung fällig. Die Erklärung, die in Textform abgegeben werden kann, hat die jeweils eingetretene Änderung des vereinbarten Index anzugeben.",
      },
      {
        t: "clause",
        text: "(5.3) Während der Geltungsdauer der Indexmiete ist eine Erhöhung der Miete nach § 558 BGB ausgeschlossen. § 559 BGB findet nur Anwendung bei baulichen Maßnahmen aufgrund von Umständen, die der Vermieter nicht zu vertreten hat.",
      },
    ];
  }
  // Standard (§ 558 BGB)
  return [
    {
      t: "clause",
      text: "Zukünftige Mieterhöhungen richten sich nach den gesetzlichen Bestimmungen der §§ 558 ff. BGB.",
    },
  ];
}

/** Anlagenliste für § 26.5 anhand der beigefügten Anlagen. */
function anlagenListe(a: MietvertragData["anlagen"]): string {
  const parts: string[] = [];
  if (a.betrkv) parts.push("Anlage 1 – Betriebskostenverordnung");
  if (a.sepa) parts.push("Anlage 2 – SEPA-Lastschriftmandat");
  if (a.hausordnung) parts.push("Anlage 3 – Hausordnung");
  if (a.lueftung) parts.push("Anlage 4 – Hinweise zur Belüftung und Beheizung");
  if (parts.length === 0) return "(26.5) Diesem Vertrag sind keine Anlagen beigefügt.";
  return `(26.5) Diesem Vertrag sind die folgenden Anlagen beigefügt: ${parts.join("; ")}.`;
}
