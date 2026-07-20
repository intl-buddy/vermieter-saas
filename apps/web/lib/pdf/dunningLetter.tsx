import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatCurrency, formatDate, formatMonth } from "../format";
import { PdfFooter } from "./pdfFooter";

export type DunningChargeRow = {
  period: string; // YYYY-MM-DD (1. des Monats)
  dueDate: string;
  openAmount: number;
};

export type DunningLetterData = {
  level: number; // 1..3
  issuedAt: string;
  paymentDeadline: string;
  amountDue: number; // Summe offener Mieten (Snapshot der Mahnung)
  fee: number; // Mahngebühr
  charges: DunningChargeRow[];
  sender: {
    fullName: string;
    companyName: string | null;
    addressStreet: string | null;
    addressZip: string | null;
    addressCity: string | null;
  };
  recipient: {
    name: string; // "Vorname Nachname"
    lastName: string;
    street: string; // Straße + Hausnummer der Einheit
    zipCity: string; // "PLZ Ort"
    unitLabel: string;
  };
  payment: {
    iban: string | null; // properties.rent_iban ?? users.iban
    bankName: string | null;
    bic: string | null;
  };
  footerEnabled?: boolean;
};

/** Betreff-Textbaustein je Mahnstufe. */
function subjectFor(level: number): string {
  if (level <= 1) return "Zahlungserinnerung – ausstehende Mietzahlung";
  if (level === 2) return "Mahnung – ausstehende Mietzahlung";
  return "Letzte Mahnung – ausstehende Mietzahlung";
}

/** Einleitungsabsatz je Mahnstufe. */
function introFor(level: number): string {
  if (level <= 1) {
    return "bei der Durchsicht unserer Unterlagen ist uns aufgefallen, dass die nachfolgend aufgeführten Mietzahlungen noch offen sind. Sicherlich haben Sie dies übersehen. Wir bitten Sie, den offenen Betrag bis zum unten genannten Termin auszugleichen.";
  }
  if (level === 2) {
    return "trotz unserer Zahlungserinnerung sind die nachfolgend aufgeführten Mietforderungen weiterhin offen. Sie befinden sich mit diesen Zahlungen in Verzug. Wir fordern Sie hiermit auf, den offenen Betrag einschließlich der angefallenen Mahngebühr bis zum unten genannten Termin zu begleichen.";
  }
  return "trotz mehrfacher Aufforderung haben Sie die nachfolgend aufgeführten Mietforderungen bislang nicht ausgeglichen. Wir setzen Ihnen hiermit eine letzte Frist zur Zahlung des Gesamtbetrags.";
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingLeft: 71, // ~25 mm
    paddingRight: 57, // ~20 mm
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.4,
    color: "#111111",
  },
  senderBlock: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  senderLine: {
    fontSize: 10,
    color: "#333333",
  },
  returnLine: {
    fontSize: 7,
    color: "#555555",
    textDecoration: "underline",
    marginBottom: 4,
  },
  recipientBlock: {
    marginBottom: 6,
    minHeight: 60,
  },
  recipientLine: {
    fontSize: 11,
  },
  dateLine: {
    textAlign: "right",
    marginTop: 12,
    marginBottom: 24,
  },
  subject: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 16,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: "justify",
  },
  table: {
    marginTop: 6,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 3,
    marginBottom: 3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2,
  },
  cellPeriod: { width: "45%" },
  cellDue: { width: "27%" },
  cellAmount: { width: "28%", textAlign: "right" },
  headerText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#111111",
    paddingTop: 3,
    marginTop: 2,
  },
  totalLabel: { width: "72%", textAlign: "right", paddingRight: 8 },
  totalLabelBold: {
    width: "72%",
    textAlign: "right",
    paddingRight: 8,
    fontFamily: "Helvetica-Bold",
  },
  totalValue: { width: "28%", textAlign: "right" },
  totalValueBold: {
    width: "28%",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  bankBlock: {
    marginTop: 6,
    marginBottom: 12,
    paddingLeft: 12,
  },
  bankLine: { fontSize: 11 },
  signatureName: {
    marginTop: 28,
  },
});

function DunningLetterDocument({ data }: { data: DunningLetterData }) {
  const { sender, recipient, payment } = data;
  const total = data.amountDue + data.fee;
  const cityForDate = sender.addressCity ?? "";
  const returnParts = [
    sender.fullName,
    sender.addressStreet,
    [sender.addressZip, sender.addressCity].filter(Boolean).join(" "),
  ].filter(Boolean);

  return (
    <Document
      title={`Mahnung Stufe ${data.level} – ${recipient.name}`}
      author={sender.fullName}
    >
      <Page size="A4" style={styles.page}>
        {/* Absenderblock rechts oben */}
        <View style={styles.senderBlock}>
          <Text style={styles.senderLine}>{sender.fullName}</Text>
          {sender.companyName ? (
            <Text style={styles.senderLine}>{sender.companyName}</Text>
          ) : null}
          {sender.addressStreet ? (
            <Text style={styles.senderLine}>{sender.addressStreet}</Text>
          ) : null}
          <Text style={styles.senderLine}>
            {[sender.addressZip, sender.addressCity].filter(Boolean).join(" ")}
          </Text>
        </View>

        {/* Kleine Rücksende-Absenderzeile über dem Empfängerblock */}
        <Text style={styles.returnLine}>{returnParts.join(", ")}</Text>

        {/* Empfängerblock links */}
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientLine}>{recipient.name}</Text>
          <Text style={styles.recipientLine}>{recipient.street}</Text>
          <Text style={styles.recipientLine}>{recipient.zipCity}</Text>
        </View>

        {/* Ort / Datum rechts */}
        <Text style={styles.dateLine}>
          {cityForDate ? `${cityForDate}, den ` : "Den "}
          {formatDate(data.issuedAt)}
        </Text>

        {/* Betreff fett */}
        <Text style={styles.subject}>{subjectFor(data.level)}</Text>

        {/* Anrede + Einleitung */}
        <Text style={styles.paragraph}>
          Sehr geehrte/r Frau/Herr {recipient.lastName},
        </Text>
        <Text style={styles.paragraph}>{introFor(data.level)}</Text>

        {/* Forderungstabelle */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cellPeriod, styles.headerText]}>Zeitraum</Text>
            <Text style={[styles.cellDue, styles.headerText]}>Fällig am</Text>
            <Text style={[styles.cellAmount, styles.headerText]}>
              Offener Betrag
            </Text>
          </View>

          {data.charges.length > 0 ? (
            data.charges.map((row) => (
              <View style={styles.tableRow} key={row.period}>
                <Text style={styles.cellPeriod}>
                  Miete {formatMonth(row.period)}
                </Text>
                <Text style={styles.cellDue}>{formatDate(row.dueDate)}</Text>
                <Text style={styles.cellAmount}>
                  {formatCurrency(row.openAmount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.cellPeriod}>Offene Mietforderungen</Text>
              <Text style={styles.cellDue}>–</Text>
              <Text style={styles.cellAmount}>
                {formatCurrency(data.amountDue)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Summe offener Mieten</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(data.amountDue)}
            </Text>
          </View>
          {data.fee > 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.totalLabel}>Mahngebühr</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.fee)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelBold}>Gesamtforderung</Text>
            <Text style={styles.totalValueBold}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Zahlungsaufforderung + Bankverbindung */}
        <Text style={styles.paragraph}>
          Bitte überweisen Sie den Gesamtbetrag von {formatCurrency(total)} bis
          spätestens {formatDate(data.paymentDeadline)} auf das folgende Konto:
        </Text>
        <View style={styles.bankBlock}>
          {payment.bankName ? (
            <Text style={styles.bankLine}>Bank: {payment.bankName}</Text>
          ) : null}
          <Text style={styles.bankLine}>
            IBAN: {payment.iban ?? "(bitte im Profil hinterlegen)"}
          </Text>
          {payment.bic ? (
            <Text style={styles.bankLine}>BIC: {payment.bic}</Text>
          ) : null}
          <Text style={styles.bankLine}>Kontoinhaber: {sender.fullName}</Text>
          <Text style={styles.bankLine}>
            Verwendungszweck: Mietrückstand {recipient.unitLabel}
          </Text>
        </View>

        {/* Stufe-3-Absatz: Kündigungsandrohung */}
        {data.level >= 3 ? (
          <Text style={styles.paragraph}>
            Sollte der Gesamtbetrag nicht fristgerecht bei uns eingehen, behalten
            wir uns vor, das Mietverhältnis gemäß § 543 Abs. 2 Nr. 3 in Verbindung
            mit § 569 Abs. 3 BGB fristlos zu kündigen und die Forderung
            gerichtlich geltend zu machen. Die hierdurch entstehenden weiteren
            Kosten hätten Sie zu tragen.
          </Text>
        ) : null}

        {/* Überschneidungsklausel */}
        <Text style={styles.paragraph}>
          Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben,
          betrachten Sie dieses bitte als gegenstandslos.
        </Text>

        {/* Grußformel + Unterschriftszeile */}
        <Text>Mit freundlichen Grüßen</Text>
        <Text style={styles.signatureName}>{sender.fullName}</Text>

        <PdfFooter enabled={data.footerEnabled} />
      </Page>
    </Document>
  );
}

/** Rendert das Mahnschreiben als PDF und gibt die Bytes zurück. */
export async function renderDunningLetterPdf(
  data: DunningLetterData,
): Promise<Uint8Array> {
  return renderToBuffer(<DunningLetterDocument data={data} />);
}
