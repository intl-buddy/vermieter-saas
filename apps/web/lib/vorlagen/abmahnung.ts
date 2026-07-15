/**
 * Textbausteine der Abmahnung. Zentral gehalten, damit die Client-Vorschau und
 * der PDF-Renderer exakt dieselben Formulierungen verwenden.
 */

export type AbmahnungVariantKey =
  | "zahlung"
  | "gegenstaende"
  | "rauchen"
  | "laerm";

export type AbmahnungVariant = {
  key: AbmahnungVariantKey;
  /** Auswahllabel (Radio). */
  label: string;
  /** Grund im Betreff: „Abmahnung wegen {grund} – …". */
  grund: string;
  /** Vorbefüllter, editierbarer Sachverhalt (Absatz 1). */
  sachverhalt: string;
};

export const ABMAHNUNG_VARIANTS: AbmahnungVariant[] = [
  {
    key: "zahlung",
    label: "Unpünktliche Mietzahlung",
    grund: "unpünktlicher Mietzahlung",
    sachverhalt:
      "Die Miete ist gemäß § 556b Abs. 1 BGB bzw. Ihrem Mietvertrag spätestens bis zum dritten Werktag eines jeden Monats im Voraus zu entrichten. Ihre Mietzahlungen gingen wiederholt verspätet ein. Die fortgesetzt unpünktliche Mietzahlung stellt eine erhebliche Verletzung Ihrer vertraglichen Pflichten dar.",
  },
  {
    key: "gegenstaende",
    label: "Ablagerung von Gegenständen in Gemeinschaftsflächen",
    grund: "Ablagerung von Gegenständen in Gemeinschaftsflächen",
    sachverhalt:
      "Sie haben Müll bzw. private Gegenstände in den Gemeinschaftsflächen des Hauses (u. a. Treppenhaus, Flure, Hof) abgestellt. Dies verstößt gegen die Hausordnung, beeinträchtigt die übrigen Hausbewohner und stellt eine Blockierung von Flucht- und Rettungswegen und damit eine Gefahr im Brandfall dar.",
  },
  {
    key: "rauchen",
    label: "Rauchen in Gemeinschaftsflächen",
    grund: "Rauchens in Gemeinschaftsflächen",
    sachverhalt:
      "Sie haben wiederholt in den Gemeinschaftsflächen des Hauses (u. a. Treppenhaus, Flure, Kellergänge) geraucht. Das Rauchen in diesen Bereichen verstößt gegen die Hausordnung, belästigt die übrigen Hausbewohner durch Rauch und Geruch erheblich und beeinträchtigt zugleich den Brandschutz, da sich in den Fluren Flucht- und Rettungswege befinden.",
  },
  {
    key: "laerm",
    label: "Lärmbelästigung",
    grund: "Lärmbelästigung",
    sachverhalt:
      "Aus Ihrer Wohnung ging wiederholt erhebliche Lärmbelästigung aus, insbesondere während der in der Hausordnung festgelegten Ruhezeiten. Durch das fortgesetzte Verursachen von Lärm stören Sie den Hausfrieden und beeinträchtigen die übrigen Hausbewohner in ihrem berechtigten Ruhebedürfnis. Ein solcher vertragswidriger Gebrauch der Mietsache verpflichtet Sie gemäß § 541 BGB zur Unterlassung.",
  },
];

/** Absatz 3 – Rechtsfolgen-Hinweis (wörtlich, unveränderlich). */
export const ABMAHNUNG_RECHTSFOLGEN =
  "Sollten Sie diesem Verlangen nicht nachkommen oder sich das beanstandete Verhalten wiederholen, behalten wir uns ausdrücklich weitere rechtliche Schritte vor – bis hin zur fristlosen Kündigung des Mietverhältnisses gemäß § 543 Abs. 1, Abs. 3 BGB bzw. zur ordentlichen Kündigung nach § 573 Abs. 2 Nr. 1 BGB.";

/** Absatz 4 – Gesprächsangebot. */
export const ABMAHNUNG_GESPRAECH =
  "Selbstverständlich sind wir an einem ungestörten und dauerhaften Mietverhältnis interessiert. Sollte es zu diesem Vorgang Fragen oder aus Ihrer Sicht Klärungsbedarf geben, stehen wir Ihnen für ein persönliches Gespräch gerne zur Verfügung.";

export function abmahnungByKey(key: string): AbmahnungVariant {
  return ABMAHNUNG_VARIANTS.find((v) => v.key === key) ?? ABMAHNUNG_VARIANTS[0]!;
}
