import { commercialLeaseEndDate } from "@repo/core";
import { formatDate } from "../format";
import {
  parseSimpleDoc,
  type Block,
  type Section,
  type Anlage,
} from "./mietvertragContent";
import { BETRKV_INTRO, BETRKV_ITEMS } from "./mietvertragSections";
import { HAUSORDNUNG_TEXT } from "./hausordnungText";

// ============================================================================
// Geschäftsraummietvertrag – Datenmodell + Aufbau des Vertragsdokuments.
//
// Grundlage: templates/gewerbemietvertrag_volltext.txt. Die Klauseln werden
// wörtlich übernommen; Platzhalter (…-Linien) durch die Formulardaten ersetzt.
// Die eingeklammerten „(Anmerkung: …)" der Vorlage werden NICHT gedruckt,
// sondern erscheinen im Formular als ⓘ-Hinweise.
// ============================================================================

export type GewerbeRaum = { etage: string; beschreibung: string };
export type GewerbeStaffel = { ab: string; miete: number };

export type GewerbemietvertragData = {
  vermieterName: string;
  vermieterAnschrift: string;
  mieterFirma: string;
  mieterVertreter: string;
  mieterAnschrift: string;

  // Ziffer 1 – Mieträume
  objektAdresse: string; // Straße, Hausnummer, PLZ
  raeume: GewerbeRaum[];
  mietflaeche: number; // qm
  schluessel: string;

  // Ziffer 2 – Mietzweck (Pflicht)
  mietzweck: string;

  // Ziffer 3 – Ausstattung / Rückbau
  renovierungsbeduerftig: boolean; // Übernahmezustand
  rueckgabeRenoviert: boolean; // true = renoviert, false = gleicher Zustand
  inventar: string;

  // Ziffer 4 – Mietzeit (feste Laufzeit + Verlängerungsoption)
  mietbeginn: string; // ISO
  laufzeitJahre: number;
  verlaengerungAnzahl: number;
  verlaengerungJahre: number;

  // Ziffer 6 – Mietzins
  nettoGrundmiete: number;
  bankName: string;
  kontoinhaber: string;
  iban: string;
  bic: string;
  betriebskosten: number;
  sonstigeKostenBez: string;
  sonstigeKostenBetrag: number;
  ustOption: boolean; // § 9 UStG

  // Ziffer 7 – Anpassung des Mietzinses
  anpassung: string; // staffel | index | standard
  staffeln: GewerbeStaffel[];

  // Ziffer 8 – Kaution
  kaution: number;

  // Ziffer 11 – Instandhaltungsgrenzen
  instandEinzelfall: number;
  instandJahr: number;

  // Ziffer 14 – Außenreklame
  aussenreklame: string;
  // Ziffer 15 – ausgenommene Sachen
  ausgenommeneSachen: string;
  // Ziffer 16 – Wettbewerbsschutz
  wettbewerbsschutz: string; // gewaehren | ausschliessen

  // Ziffer 17/18
  besondere: string;
  gerichtsstand: string;

  anlagen: {
    betrkv: boolean;
    sepa: boolean;
    hausordnung: boolean;
  };

  footerEnabled?: boolean;
};

export type GewerbeParties = {
  vermieterName: string;
  vermieterAnschrift: string;
  mieterFirma: string;
  mieterVertreter: string;
  mieterAnschrift: string;
};

export type GewerbemietvertragDoc = {
  parties: GewerbeParties;
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
const fill = (v: string) => (v && v.trim() ? v.trim() : "____________");

// --------------------------------------------------------------------------
// Aufbau
// --------------------------------------------------------------------------

export function buildGewerbemietvertragDoc(
  data: GewerbemietvertragData,
): GewerbemietvertragDoc {
  const sections: Section[] = [];

  // 1. Mieträume ------------------------------------------------------------
  const raumItems = data.raeume
    .filter((r) => r.etage.trim() || r.beschreibung.trim())
    .map((r) => `${fill(r.etage)}: ${fill(r.beschreibung)}`);
  const s1: Block[] = [
    {
      t: "clause",
      text: `1.1 Vermietet werden im Haus ${fill(data.objektAdresse)} (Straße, Hausnummer, PLZ) folgende Räume:`,
    },
  ];
  if (raumItems.length > 0) {
    s1.push({ t: "list", items: raumItems });
  }
  s1.push({
    t: "clause",
    text: `Die Mietfläche beträgt ${data.mietflaeche > 0 ? eurQm(data.mietflaeche) : "____"} qm.`,
  });
  s1.push({
    t: "clause",
    text: "1.2 Für die oben genannten Räume erhält der Mieter folgende Schlüssel:",
  });
  s1.push({ t: "address", text: fill(data.schluessel) });
  s1.push({
    t: "clause",
    text: "1.3 Mieter und Vermieter haben das Mietobjekt gemeinsam eingehend besichtigt. Dabei sind keine Mängel aufgefallen. Der Mieter übernimmt die Mietsache wie besichtigt. Die Parteien verpflichten sich, bei Übergabe ein Übergabeprotokoll zu fertigen, welches von den Parteien bzw. den bevollmächtigten Vertretern unterzeichnet wird. Das Übergabeprotokoll konkretisiert den Zustand der Mietsache und wird Bestandteil des Vertrages.",
  });
  s1.push({
    t: "clause",
    text: "1.4 Schäden an diesen Räumen sind dem Vermieter unverzüglich anzuzeigen.",
  });
  s1.push({
    t: "clause",
    text: "1.5 Die anderen Flächen des Gebäudes, die nicht zum Mietobjekt gehören, sind nicht mitvermietet. Der Mieter darf diese gemeinsam mit den weiteren Mietern gemäß der Hausordnung nutzen.",
  });
  sections.push({ heading: "1. Mieträume", blocks: s1 });

  // 2. Mietzweck ------------------------------------------------------------
  sections.push({
    heading: "2. Mietzweck",
    blocks: [
      {
        t: "clause",
        text: `Die Vermietung erfolgt zur ausschließlichen Nutzung als ${fill(data.mietzweck)}.`,
      },
      {
        t: "clause",
        text: "Eine Änderung der vertraglich vereinbarten Nutzung ist von der Zustimmung des Vermieters abhängig, die nur aus wichtigem Grund verweigert werden darf. Ein wichtiger Grund besteht insbesondere in einer Konkurrenzsituation zu anderen Mietern.",
      },
      {
        t: "clause",
        text: "Der Vermieter behält sich vor, seine Zustimmung nur gegen einen angemessenen Mietzuschlag zu erteilen, sofern die gewünschte neue Nutzung des Mietobjekts zu einer intensiveren Beanspruchung führt oder nach Ansicht des Vermieters die Vermietbarkeit weiterer Einheiten im Gebäude beeinträchtigt wird.",
      },
      {
        t: "clause",
        text: "Der Mieter ist dazu verpflichtet, alle für seinen Betrieb erforderlichen behördlichen Genehmigungen und Konzessionen, sofern sie auf ihn und sein Unternehmen bezogen sind, auf eigene Kosten einzuholen.",
      },
    ],
  });

  // 3. Ausstattung der Mieträume / Rückbauverpflichtung ---------------------
  const uebernahme = data.renovierungsbeduerftig
    ? "in renovierungsbedürftigem Zustand"
    : "in nicht renovierungsbedürftigem Zustand";
  const rueckgabe = data.rueckgabeRenoviert
    ? "renovierten"
    : "gleichen";
  const s3: Block[] = [
    {
      t: "clause",
      text: `3.1 Der Mieter übernimmt die Räume ${uebernahme}. Die Räume werden wie besichtigt vermietet und sind nach Beendigung des Mietverhältnisses im ${rueckgabe} Zustand zu verlassen.`,
    },
  ];
  if (data.inventar.trim()) {
    s3.push({ t: "clause", text: "Die Mieträume enthalten folgendes Inventar:" });
    s3.push({ t: "address", text: data.inventar.trim() });
  }
  s3.push({
    t: "clause",
    text: "3.2 Werden bauliche Veränderungen an der Mietsache (Einbauten, Umbauten, Ausbauten) durch den Mieter vorgenommen, verpflichtet er sich, diese spätestens bis zur Beendigung des Mietverhältnisses beseitigt zu haben.",
  });
  sections.push({
    heading: "3. Ausstattung der Mieträume / Rückbauverpflichtung",
    blocks: s3,
  });

  // 4. Mietzeit und ordentliche Kündigung -----------------------------------
  const ende = commercialLeaseEndDate(data.mietbeginn, data.laufzeitJahre);
  const verlaengerung =
    data.verlaengerungAnzahl > 0 && data.verlaengerungJahre > 0
      ? `Das Mietverhältnis verlängert sich um jeweils ${data.verlaengerungJahre} Jahr(e), bis zu ${data.verlaengerungAnzahl}-mal, falls es nicht mindestens sechs Monate vor Ablauf durch eingeschriebenen Brief gekündigt wird. Für die Rechtzeitigkeit ist entscheidend der Zugang des Kündigungsschreibens.`
      : "Das Mietverhältnis verlängert sich jeweils um ein Jahr, falls es nicht mindestens sechs Monate vor Ablauf durch eingeschriebenen Brief gekündigt wird. Für die Rechtzeitigkeit ist entscheidend der Zugang des Kündigungsschreibens.";
  sections.push({
    heading: "4. Mietzeit und ordentliche Kündigung",
    blocks: [
      {
        t: "clause",
        text: `Das Mietverhältnis beginnt am ${dash(data.mietbeginn)} und endet am ${ende ? dash(ende) : "____________"}.`,
      },
      { t: "clause", text: verlaengerung },
      {
        t: "clause",
        text: "Es handelt sich um ein befristetes Mietverhältnis, das vorbehaltlich der vorstehenden Verlängerungsklausel mit Fristablauf endet. Während der Mietdauer kann nur aus wichtigem Grund gekündigt werden.",
      },
    ],
  });

  // 5. Fristlose Kündigung --------------------------------------------------
  sections.push({
    heading: "5. Fristlose Kündigung",
    blocks: [
      {
        t: "clause",
        text: "5.1 Der Vermieter ist berechtigt, das Mietverhältnis fristlos zu kündigen, unter anderem wenn",
      },
      {
        t: "list",
        items: [
          "der Mieter mit zwei Monatsmieten in Verzug ist oder",
          "der Mieter trotz Mahnung das Mietobjekt weiterhin vertragswidrig nutzt oder",
          "nach Vertragsschluss eine wesentliche Verschlechterung in den wirtschaftlichen Verhältnissen des Mieters eintritt. Diese werden vermutet, wenn Pfändungen oder sonstige Zwangsvollstreckungsmaßnahmen ausgebracht werden, die die Ansprüche des Vermieters gefährden.",
        ],
      },
      {
        t: "clause",
        text: "5.2 Die gesetzlichen Kündigungsrechte ohne Fristsetzung aus §§ 543 II Nr. 1, 569 I BGB bleiben unberührt.",
      },
      {
        t: "clause",
        text: "5.3 Im Übrigen ist jede Partei zur fristlosen Kündigung aus wichtigem Grunde berechtigt, wenn der Vertragspartner eine wesentliche Vertragspflicht trotz vorheriger Abmahnung wiederholt verletzt.",
      },
    ],
  });

  // 6. Mietzins -------------------------------------------------------------
  const moneyRows = [{ label: "Netto-Grundmiete (monatlich)", value: eur(data.nettoGrundmiete) }];
  if (data.betriebskosten > 0) {
    moneyRows.push({
      label: "Betriebskosten (Vorauszahlung)",
      value: eur(data.betriebskosten),
    });
  }
  if (data.sonstigeKostenBetrag > 0) {
    moneyRows.push({
      label: `Sonstige Kosten${data.sonstigeKostenBez.trim() ? ` (${data.sonstigeKostenBez.trim()})` : ""}`,
      value: eur(data.sonstigeKostenBetrag),
    });
  }
  const monatlichNetto =
    data.nettoGrundmiete + data.betriebskosten + data.sonstigeKostenBetrag;
  const s6: Block[] = [
    {
      t: "clause",
      text: `6.1 Die monatliche Netto-Grundmiete beträgt ${eur(data.nettoGrundmiete)}. Sie ist im Voraus, spätestens am 3. Werktag jeden Monats, kostenfrei an den Vermieter auf dessen Konto bei der ${fill(data.bankName)} zu zahlen.`,
    },
    {
      t: "bank",
      rows: [
        { label: "Kontoinhaber", value: fill(data.kontoinhaber) },
        { label: "IBAN", value: fill(data.iban) },
        ...(data.bic ? [{ label: "BIC", value: data.bic }] : []),
      ],
    },
    {
      t: "clause",
      text: "Folgende Nebenabgaben hat der Mieter innerhalb eines Monats nach erfolgter Rechnungsstellung zusätzlich zu entrichten:",
    },
    {
      t: "money",
      rows: moneyRows,
      total: { label: "Monatlich (netto)", value: eur(monatlichNetto) },
    },
    {
      t: "clause",
      text: "Die anteiligen Heizkosten werden entsprechend der Heizkostenverordnung abgerechnet.",
    },
    {
      t: "clause",
      text: "6.2 Optiert der Vermieter zur Umsatzsteuer, hat der Mieter auf die vereinbarte Gesamtmiete die Umsatzsteuer in der jeweils gesetzlichen Höhe zu bezahlen.",
    },
  ];
  if (data.ustOption) {
    const brutto = monatlichNetto * 1.19;
    s6.push({
      t: "clause",
      text: `Der Vermieter optiert nach § 9 UStG zur Umsatzsteuer. Auf die vereinbarte Gesamtmiete ist zzgl. Umsatzsteuer in gesetzlicher Höhe zu zahlen. Zur Information (derzeit 19 %): ${eur(monatlichNetto)} netto zzgl. ${eur(brutto - monatlichNetto)} USt = ${eur(brutto)} brutto.`,
    });
  }
  sections.push({ heading: "6. Mietzins", blocks: s6 });

  // 7. Anpassung des Mietzinses --------------------------------------------
  sections.push({
    heading: "7. Anpassung des Mietzinses",
    blocks: anpassungBlocks(data),
  });

  // 8. Mietkaution ----------------------------------------------------------
  sections.push({
    heading: "8. Mietkaution",
    blocks: [
      {
        t: "clause",
        text: `Der Mieter zahlt eine Kaution in Höhe von ${eur(data.kaution)}. Die Kaution ist vom Vermieter auf einem gesondert geführten Konto aufzubewahren. Eine Verzinsungspflicht des Vermieters für die Kaution wird ausgeschlossen.`,
      },
    ],
  });

  // 9. Bauliche Veränderungen, Ausbesserungen -------------------------------
  sections.push({
    heading: "9. Bauliche Veränderungen, Ausbesserungen",
    blocks: [
      {
        t: "clause",
        text: "9.1 Bauliche Veränderungen an den Mieträumen darf der Mieter nur nach Vorliegen der schriftlichen Zustimmung des Vermieters vornehmen lassen. Die Zustimmung darf verweigert werden, wenn ein wichtiger Grund vorliegt.",
      },
      {
        t: "clause",
        text: "9.2 Ausbesserungen und bauliche Veränderungen, die zur Erhaltung des Gebäudes, zur Abwendung drohender Gefahren oder zur Beseitigung von Schäden dienen, darf der Vermieter ohne Zustimmung des Mieters vornehmen lassen. Sollten diese Arbeiten aus anderen Gründen vorgenommen werden, so bedarf es einer Zustimmung des Mieters dann nicht, wenn sie den Mieter nur unwesentlich beeinträchtigen. In diesen Fällen entstehen keine Schadensersatzansprüche und Ansprüche zur Mietminderung.",
      },
      {
        t: "clause",
        text: "9.3 Von beabsichtigten baulichen Tätigkeiten am Gebäude, die den Mieter beeinträchtigen könnten, hat der Vermieter ihn so rechtzeitig zu verständigen, dass der Mieter Vorkehrungen zur Weiterführung seines Betriebes treffen kann. Unterbleibt diese Benachrichtigung, so kann dem Mieter ein Anspruch auf Schadensersatz/Mietminderung entstehen.",
      },
    ],
  });

  // 10. Betreten der Mietsache ----------------------------------------------
  sections.push({
    heading: "10. Betreten der Mietsache",
    blocks: [
      {
        t: "clause",
        text: "Der Vermieter darf die Geschäftsräume nach vorheriger Ankündigung während der Geschäftszeiten, bei Gefahr im Verzug auch in Abwesenheit des Mieters, betreten, um sich vom Zustand der Räume zu überzeugen. Dieses Recht kann auch durch einen Bevollmächtigten ausgeübt werden.",
      },
    ],
  });

  // 11. Instandhaltung/Instandsetzung, Schönheitsreparaturen ----------------
  sections.push({
    heading:
      "11. Instandhaltung / Instandsetzung der Mieträume, Schönheitsreparaturen",
    blocks: [
      {
        t: "clause",
        text: `11.1 Der Mieter erklärt sich bereit, die Instandhaltung (Wartung) und Instandsetzung (Reparaturen) an der Mietsache innerhalb der Mieträume bis zu einem Betrag von ${eur(data.instandEinzelfall)} je Einzelfall zu übernehmen. Fallen mehrere Wartungs- und Reparaturarbeiten an, übernimmt der Mieter insgesamt im Jahr die dafür benötigten Kosten nur bis zu einem Betrag von ${eur(data.instandJahr)}. Handelt es sich um die Instandhaltung und Instandsetzung des Gebäudes (Dach und Fach), der damit verbundenen technischen Einrichtungen und Anlagen sowie der Außenanlagen, obliegt diese Pflicht dem Vermieter.`,
      },
      {
        t: "clause",
        text: "11.2 Schönheitsreparaturen, wie das Streichen der Wände und Decken oder die sonstige Neubehandlung oder Reinigung von z. B. Wänden, Decken, Fenstern, Türen oder Heizkörpern, werden vom Mieter vorgenommen.",
      },
    ],
  });

  // 12. Versicherungen ------------------------------------------------------
  sections.push({
    heading: "12. Versicherungen",
    blocks: [
      {
        t: "clause",
        text: "Der Mieter ist verpflichtet, auf seine Kosten folgende Versicherungen abzuschließen (z. B. Betriebshaftpflichtversicherung, Glasversicherung usw.; Doppelversicherungen durch Vermieter und Mieter sollten vermieden werden). Der Mieter wird dem Vermieter den Bestand dieser Versicherungen auf Anforderung nachweisen.",
      },
    ],
  });

  // 13. Untervermietung, Nachmieter -----------------------------------------
  sections.push({
    heading: "13. Untervermietung, Nachmieter",
    blocks: [
      {
        t: "clause",
        text: "13.1 Eine Untervermietung ist nur mit schriftlicher Zustimmung des Vermieters gestattet. Die Zustimmung kann verweigert werden, wenn ein wichtiger Grund vorliegt. Sie kann aus wichtigem Grund widerrufen werden.",
      },
      {
        t: "clause",
        text: "13.2 Der Mieter ist berechtigt, einen Nachmieter zu stellen, der in den Mietvertrag zu den gleichen Bedingungen innerhalb der Restlaufzeit des Vertrages eintritt, sofern gegen die Bonität des Nachmieters, gegen dessen Person und die Branche (auch im Hinblick auf einen etwaigen Konkurrenzschutz) keine Einwendungen bestehen. Der Vermieter ist verpflichtet, mit diesem Mieter zu unveränderten Bedingungen einen Vertrag für die Restlaufzeit abzuschließen.",
      },
    ],
  });

  // 14. Außenreklame --------------------------------------------------------
  const s14: Block[] = [
    {
      t: "clause",
      text: "14.1 Der Mieter ist berechtigt, an bestimmten Teilen der Außenfront des Gebäudes Firmenschilder, Leuchtreklame sowie Schaukästen und Warenautomaten anzubringen, soweit der Gesamteindruck der Gebäudefront dadurch nicht beeinträchtigt wird:",
    },
    { t: "address", text: fill(data.aussenreklame) },
    {
      t: "clause",
      text: "Das Anbringen dieser Außenreklame erfolgt auf Kosten des Mieters und nach vorheriger Abstimmung mit dem Vermieter. Die gesetzlichen und ortspolizeilichen Vorschriften über Außenreklame sind zu beachten.",
    },
    {
      t: "clause",
      text: "14.2 Die Pflicht aus Ziffer 3 dieses Mietvertrages bei Mietende gilt sinngemäß.",
    },
    {
      t: "clause",
      text: "14.3 Verlegt der Mieter nach Beendigung des Mietverhältnisses seinen Betrieb, so ist er berechtigt, ein halbes Jahr an der Eingangstür ein Hinweisschild anzubringen.",
    },
  ];
  sections.push({ heading: "14. Außenreklame", blocks: s14 });

  // 15. Sachen des Mieters --------------------------------------------------
  const s15: Block[] = [
    {
      t: "clause",
      text: "15.1 Der Mieter versichert, dass die Sachen, die er in die Mieträume einbringen wird, in seinem freien Eigentum stehen, abgesehen von handelsüblichen Eigentumsvorbehalten.",
    },
  ];
  if (data.ausgenommeneSachen.trim()) {
    s15.push({ t: "clause", text: "15.2 Folgende Sachen sind hiervon ausgenommen:" });
    s15.push({ t: "address", text: data.ausgenommeneSachen.trim() });
  } else {
    s15.push({
      t: "clause",
      text: "15.2 Von der vorstehenden Versicherung sind keine Sachen ausgenommen.",
    });
  }
  sections.push({ heading: "15. Sachen des Mieters", blocks: s15 });

  // 16. Wettbewerbsschutz ---------------------------------------------------
  const wettbewerb =
    data.wettbewerbsschutz === "gewaehren"
      ? `Der Vermieter verpflichtet sich, während der Mietzeit weder auf dem Mietgrundstück noch auf ihm gehörenden Nachbargrundstücken (${fill(data.objektAdresse)}) gewerbliche Räume an einen Mitbewerber des Mieters zu vermieten. Diese Verpflichtung erstreckt sich nicht auf den Fall einer Änderung des Nutzungszwecks der Mieträume.`
      : "Der Vermieter räumt keinen Konkurrenzschutz ein.";
  sections.push({
    heading: "16. Wettbewerbsschutz",
    blocks: [{ t: "clause", text: wettbewerb }],
  });

  // 17. Besondere Vereinbarungen --------------------------------------------
  sections.push({
    heading: "17. Besondere Vereinbarungen",
    blocks: [{ t: "clause", text: data.besondere.trim() || "Keine." }],
  });

  // 18. Gerichtsstand -------------------------------------------------------
  sections.push({
    heading: "18. Gerichtsstand, außergerichtliche Streitbeilegung",
    blocks: [
      { t: "clause", text: `Gerichtsstand ist ${fill(data.gerichtsstand)}.` },
    ],
  });

  // 19. Sonstiges -----------------------------------------------------------
  sections.push({
    heading: "19. Sonstiges",
    blocks: [
      { t: "clause", text: "19.1 Mündliche Nebenabreden zu diesem Vertrag bestehen nicht." },
      {
        t: "clause",
        text: "19.2 Änderungen oder Ergänzungen des Vertrages sind nur wirksam, wenn sie schriftlich vereinbart werden.",
      },
      {
        t: "clause",
        text: "19.3 Ist oder wird eine Bestimmung dieses Vertrages unwirksam, so berührt dies die Wirksamkeit des Vertrages nicht.",
      },
    ],
  });

  // Anlagen -----------------------------------------------------------------
  const anlagen: Anlage[] = [];
  if (data.anlagen.betrkv) {
    anlagen.push({
      nummer: 1,
      titel: "Betriebskostenverordnung",
      blocks: [
        {
          t: "subheading",
          text: "Betriebskosten gemäß § 2 Betriebskostenverordnung",
        },
        { t: "clause", text: BETRKV_INTRO },
        ...BETRKV_ITEMS.map((it) => ({ t: "clause" as const, text: it })),
      ],
    });
  }
  if (data.anlagen.sepa) {
    anlagen.push({
      nummer: 2,
      titel: "SEPA-Lastschriftmandat",
      blocks: [{ t: "sepa", glaeubiger: data.vermieterName }],
    });
  }
  if (data.anlagen.hausordnung) {
    anlagen.push({
      nummer: 3,
      titel: "Hausordnung",
      blocks: parseSimpleDoc(HAUSORDNUNG_TEXT),
    });
  }

  return {
    parties: {
      vermieterName: fill(data.vermieterName),
      vermieterAnschrift: fill(data.vermieterAnschrift),
      mieterFirma: fill(data.mieterFirma),
      mieterVertreter: data.mieterVertreter.trim(),
      mieterAnschrift: fill(data.mieterAnschrift),
    },
    sections,
    anlagen,
  };
}

/** qm-Zahl deutsch formatieren (ohne EUR). */
function eurQm(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Blöcke für Ziffer 7 je nach gewählter Anpassungsart. */
function anpassungBlocks(data: GewerbemietvertragData): Block[] {
  if (data.anpassung === "staffel") {
    const items = [
      `ab Vertragsbeginn (${dash(data.mietbeginn)}): ${eur(data.nettoGrundmiete)} (Grundmiete gemäß Ziffer 6.1)`,
      ...data.staffeln
        .filter((s) => s.ab)
        .map((s) => `ab ${dash(s.ab)}: ${eur(s.miete)}`),
    ];
    return [
      {
        t: "clause",
        text: "7.1 Die Grundmiete gemäß Ziffer 6.1 wird als Staffelmiete vereinbart.",
      },
      {
        t: "clause",
        text: "7.2 Folgende Staffeln für die Grundmiete werden vereinbart:",
      },
      { t: "list", items },
      {
        t: "clause",
        text: "7.3 Während der Laufzeit einer Staffelmiete ist eine Erhöhung nach den §§ 558–559b BGB ausgeschlossen. Bei einer längeren Mindestlaufzeit oder Befristung des Mietvertrages kann der Mieter zum Ablauf von 4 Jahren seit Abschluss der Staffelmietvereinbarung den Mietvertrag erstmals mit der gesetzlichen Frist kündigen.",
      },
    ];
  }
  if (data.anpassung === "index") {
    return [
      {
        t: "clause",
        text: "7.1 Erhöht oder ermäßigt sich seit dem Vertragsbeginn der vom Statistischen Bundesamt herausgegebene Verbraucherpreisindex für Deutschland (Basisjahr 2020 = 100), so kann sich die Grundmiete gemäß Ziffer 6.1 im gleichen prozentualen Verhältnis erhöhen oder ermäßigen. Das gleiche gilt für jede erneute Änderung des Verbraucherpreisindex.",
      },
      {
        t: "clause",
        text: "7.2 Eine Anpassung der Miete an die Änderung des Verbraucherpreisindex ist frühestens nach Ablauf von 12 Monaten seit Vertragsbeginn oder der letzten Änderung möglich. Die geänderte Miete ist vom Beginn des übernächsten Monats nach dem Zugang der Änderungserklärung des Vermieters oder Mieters zur Zahlung fällig. In der Erklärung, die in Textform abgegeben werden kann, ist die jeweils eingetretene Änderung des vereinbarten Index anzugeben.",
      },
      {
        t: "clause",
        text: "7.3 Während der Geltungsdauer der Indexmiete ist eine Erhöhung der Miete nach § 558 BGB ausgeschlossen. § 559 BGB findet nur Anwendung bei baulichen Maßnahmen aufgrund von Umständen, die der Vermieter nicht zu vertreten hat.",
      },
    ];
  }
  // Standard – § 558 BGB
  return [
    {
      t: "clause",
      text: "Zukünftige Mieterhöhungen richten sich nach den gesetzlichen Bestimmungen der §§ 558 ff. BGB.",
    },
  ];
}
