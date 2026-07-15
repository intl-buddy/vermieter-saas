import {
  Document,
  Page,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatDate } from "../format";
import { MIETVERTRAG_VOLLTEXT } from "./mietvertragVolltext";

export type MietvertragData = {
  vermieterName: string;
  vermieterAnschrift: string;
  mieterName: string;
  mieterAnschrift: string;
  mieterGeburtsdatum: string; // ISO oder leer
  objektAdresseLage: string;
  rooms: string; // "4" oder "____"
  mietbeginn: string; // ISO oder leer
  grundmiete: number;
  betriebskosten: number;
  heizkosten: number;
  advanceMode: string; // "split" | "combined"
  kontoinhaber: string;
  iban: string;
  depositType: string;
  depositAmount: number;
};

const eurFormatter = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Betrag im Vertragsstil, z. B. `1.300,00 EUR`. */
function eur(n: number): string {
  return `${eurFormatter.format(n)} EUR`;
}

/** Erster Satz von § 8.1 abhängig von der Kautionsart. */
function kautionSatz(type: string, amount: number): string {
  switch (type) {
    case "bank_guarantee":
      return `stellt als Mietsicherheit eine selbstschuldnerische Bürgschaft in Höhe von ${eur(amount)}`;
    case "deposit_insurance":
      return `stellt als Mietsicherheit eine Kautionsversicherung in Höhe von ${eur(amount)}`;
    case "pledged_savings":
      return `stellt als Mietsicherheit ein verpfändetes Sparguthaben in Höhe von ${eur(amount)}`;
    case "none":
      return "leistet keine Mietsicherheit; eine Kaution wird nicht vereinbart";
    case "cash_deposit":
    default:
      return `hinterlegt eine Barkaution in Höhe von ${eur(amount)}`;
  }
}

/** Baut eine rechtsbündig ausgerichtete Betragszeile auf Zielbreite `width`. */
function moneyRow(label: string, amount: number, width: number): string {
  const value = eur(amount);
  const pad = Math.max(1, width - label.length - value.length);
  return label + " ".repeat(pad) + value;
}

const dash = (iso: string) => (iso ? formatDate(iso) : "____________");

/**
 * Ersetzt die Musterwerte im wörtlichen Klauseltext durch die konkreten
 * Vertragsdaten und passt § 4 (Vorauszahlungen) an den Vorauszahlungs-Modus an.
 */
function buildContractLines(data: MietvertragData): string[] {
  let text = MIETVERTRAG_VOLLTEXT;

  // Reihenfolge beachten: „Max Mustermann" vor „Max Muster".
  text = text.split("Max Mustermann").join(data.kontoinhaber || "____________");
  text = text.split("Max Muster").join(data.vermieterName || "____________");
  text = text.replace("Musterstr. 123", data.vermieterAnschrift || "____________");
  text = text.split("Asiye Terzi").join(data.mieterName || "____________");
  text = text.replace(
    "Musterstreet 123, 3432 Custi",
    data.mieterAnschrift || "____________",
  );
  text = text.replace("01.02.1968", dash(data.mieterGeburtsdatum));
  text = text
    .split("Bruchstr. 96, 45468 Mülheim an der Ruhr, WE 1")
    .join(data.objektAdresseLage || "____________");
  text = text.split("01.01.2024").join(dash(data.mietbeginn));
  text = text.replace("Bestehend aus: 4 Zimmern", `Bestehend aus: ${data.rooms} Zimmern`);
  text = text.replace(
    "hinterlegt eine Barkaution in Höhe von 1.800,00 EUR (zwei Kaltmieten)",
    kautionSatz(data.depositType, data.depositAmount),
  );
  // IBAN steht in der Quelle über zwei Zeilen umbrochen.
  text = text.replace(
    /DE12 3655 0000 0053 2350\s*\n\s*73/g,
    data.iban || "____________________________",
  );

  const combined = data.advanceMode === "combined";
  const total = data.grundmiete + data.betriebskosten + data.heizkosten;

  // Zielbreite der Betragszeilen aus der Original-Grundmiete-Zeile ableiten.
  const rawLines = text.split("\n");
  const grundmieteLine = rawLines.find((l) => l.startsWith("Grundmiete"));
  const width = grundmieteLine ? grundmieteLine.trimEnd().length : 118;

  const out: string[] = [];
  for (const line of rawLines) {
    if (line.startsWith("Grundmiete")) {
      out.push(moneyRow("Grundmiete", data.grundmiete, width));
    } else if (line.startsWith("Betriebskostenvorauszahlung")) {
      out.push(
        combined
          ? moneyRow(
              "Nebenkostenvorauszahlung",
              data.betriebskosten + data.heizkosten,
              width,
            )
          : moneyRow("Betriebskostenvorauszahlung", data.betriebskosten, width),
      );
    } else if (line.startsWith("Heizkosten-/Warmwasservorauszahlung")) {
      // Im kombinierten Modus in der Nebenkostenzeile enthalten → entfällt.
      if (!combined) {
        out.push(
          moneyRow(
            "Heizkosten-/Warmwasservorauszahlung",
            data.heizkosten,
            width,
          ),
        );
      }
    } else if (line.startsWith("Stellplätze/Garagen (falls")) {
      out.push(
        moneyRow(
          "Stellplätze/Garagen (falls vereinbart und vorhanden)",
          0,
          width,
        ),
      );
    } else if (line.startsWith("Gesamtmiete")) {
      out.push(moneyRow("Gesamtmiete", total, width));
    } else {
      out.push(line);
    }
  }
  return out;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 46,
    paddingLeft: 26,
    paddingRight: 26,
    fontFamily: "Courier",
    fontSize: 7.5,
    lineHeight: 1.3,
    color: "#111111",
  },
  line: {},
  heading: { fontFamily: "Courier-Bold" },
  pageNumber: {
    position: "absolute",
    bottom: 22,
    left: 26,
    right: 26,
    textAlign: "center",
    fontSize: 8,
    fontFamily: "Courier",
    color: "#555555",
  },
});

const HEADING_RE = /^§ ?\d+ /;

function MietvertragDocument({ data }: { data: MietvertragData }) {
  const lines = buildContractLines(data);
  return (
    <Document
      title={`Wohnraummietvertrag – ${data.mieterName}`}
      author={data.vermieterName}
    >
      <Page size="A4" style={styles.page}>
        {lines.map((line, i) => {
          const trimmed = line.trim();
          const isHeading =
            HEADING_RE.test(trimmed) || trimmed === "Wohnraummietvertrag";
          return (
            <Text
              key={i}
              style={isHeading ? [styles.line, styles.heading] : styles.line}
            >
              {line.length > 0 ? line : " "}
            </Text>
          );
        })}
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Seite ${pageNumber} von ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export async function renderMietvertragPdf(
  data: MietvertragData,
): Promise<Uint8Array> {
  return renderToBuffer(<MietvertragDocument data={data} />);
}
