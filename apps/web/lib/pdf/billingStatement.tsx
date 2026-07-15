import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "../format";

export type StatementPositionPdf = {
  costType: string;
  totalCost: number;
  allocationLabel: string;
  share: number;
};

export type StatementPdfData = {
  sender: {
    fullName: string;
    companyName: string | null;
    addressStreet: string | null;
    addressZip: string | null;
    addressCity: string | null;
  };
  recipient: { name: string; lastName: string; street: string; zipCity: string };
  objekt: string;
  einheit: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  positions: StatementPositionPdf[];
  heatingCosts: number;
  totalShare: number;
  prepaymentsOperating: number;
  prepaymentsHeating: number;
  balance: number;
  labor35aHousehold: number;
  labor35aCraftsman: number;
  payment: { iban: string | null; bankName: string | null; bic: string | null };
  paymentDeadline: string;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingLeft: 71,
    paddingRight: 57,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    color: "#111111",
  },
  senderBlock: { alignItems: "flex-end", marginBottom: 24 },
  senderLine: { fontSize: 10, color: "#333333" },
  returnLine: { fontSize: 7, color: "#555555", textDecoration: "underline", marginBottom: 4 },
  recipientBlock: { marginBottom: 6, minHeight: 56 },
  recipientLine: { fontSize: 11 },
  dateLine: { textAlign: "right", marginTop: 12, marginBottom: 20 },
  subject: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 14 },
  paragraph: { marginBottom: 10 },
  table: { marginTop: 4, marginBottom: 8 },
  th: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 3,
    marginBottom: 3,
  },
  row: { flexDirection: "row", paddingVertical: 2 },
  cCost: { width: "40%" },
  cTotal: { width: "22%", textAlign: "right" },
  cKey: { width: "20%" },
  cShare: { width: "18%", textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#111111",
    paddingTop: 3,
    marginTop: 2,
  },
  lblRight: { width: "82%", textAlign: "right", paddingRight: 8 },
  valRight: { width: "18%", textAlign: "right" },
  section35a: {
    marginTop: 14,
    padding: 8,
    backgroundColor: "#f5f5f7",
    borderRadius: 4,
  },
  bank: { marginTop: 6, paddingLeft: 12 },
});

function subject(data: StatementPdfData): string {
  const period = `${formatDate(data.periodStart)} – ${formatDate(data.periodEnd)}`;
  return `Nebenkostenabrechnung ${period} – ${data.objekt}, ${data.einheit}`;
}

function StatementDocument({ data }: { data: StatementPdfData }) {
  const { sender, recipient, payment } = data;
  const subtotal = data.totalShare + data.heatingCosts;
  const prepayTotal = data.prepaymentsOperating + data.prepaymentsHeating;
  const isNachzahlung = data.balance > 0;
  const total35a = data.labor35aHousehold + data.labor35aCraftsman;
  const returnParts = [
    sender.fullName,
    sender.addressStreet,
    [sender.addressZip, sender.addressCity].filter(Boolean).join(" "),
  ].filter(Boolean);

  return (
    <Document title={subject(data)} author={sender.fullName}>
      <Page size="A4" style={styles.page}>
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

        <Text style={styles.returnLine}>{returnParts.join(", ")}</Text>
        <View style={styles.recipientBlock}>
          <Text style={styles.recipientLine}>{recipient.name}</Text>
          <Text style={styles.recipientLine}>{recipient.street}</Text>
          <Text style={styles.recipientLine}>{recipient.zipCity}</Text>
        </View>

        <Text style={styles.dateLine}>
          {sender.addressCity ? `${sender.addressCity}, den ` : "Den "}
          {formatDate(data.issueDate)}
        </Text>

        <Text style={styles.subject}>{subject(data)}</Text>
        <Text style={styles.paragraph}>
          Sehr geehrte/r Frau/Herr {recipient.lastName}, nachfolgend erhalten Sie
          die Abrechnung Ihrer Betriebs- und Heizkosten für den genannten
          Zeitraum.
        </Text>

        {/* Kostenpositionen */}
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.cCost, styles.bold]}>Kostenart</Text>
            <Text style={[styles.cTotal, styles.bold]}>Gesamtkosten</Text>
            <Text style={[styles.cKey, styles.bold]}>Schlüssel</Text>
            <Text style={[styles.cShare, styles.bold]}>Ihr Anteil</Text>
          </View>
          {data.positions.map((p, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.cCost}>{p.costType}</Text>
              <Text style={styles.cTotal}>{formatCurrency(p.totalCost)}</Text>
              <Text style={styles.cKey}>{p.allocationLabel}</Text>
              <Text style={styles.cShare}>{formatCurrency(p.share)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={styles.cCost}>Heizkosten (Messdienst)</Text>
            <Text style={styles.cTotal}>–</Text>
            <Text style={styles.cKey}>Verbrauch</Text>
            <Text style={styles.cShare}>{formatCurrency(data.heatingCosts)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.lblRight, styles.bold]}>Zwischensumme</Text>
            <Text style={[styles.valRight, styles.bold]}>
              {formatCurrency(subtotal)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.lblRight}>
              abzüglich geleisteter Vorauszahlungen
            </Text>
            <Text style={styles.valRight}>−{formatCurrency(prepayTotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.lblRight, styles.bold]}>
              {isNachzahlung ? "Nachzahlung" : "Guthaben"}
            </Text>
            <Text style={[styles.valRight, styles.bold]}>
              {formatCurrency(Math.abs(data.balance))}
            </Text>
          </View>
        </View>

        {isNachzahlung ? (
          <View>
            <Text style={styles.paragraph}>
              Bitte überweisen Sie den Nachzahlungsbetrag von{" "}
              {formatCurrency(data.balance)} bis zum{" "}
              {formatDate(data.paymentDeadline)} auf folgendes Konto:
            </Text>
            <View style={styles.bank}>
              {payment.bankName ? (
                <Text>Bank: {payment.bankName}</Text>
              ) : null}
              <Text>IBAN: {payment.iban ?? "(bitte im Profil hinterlegen)"}</Text>
              {payment.bic ? <Text>BIC: {payment.bic}</Text> : null}
              <Text>Kontoinhaber: {sender.fullName}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.paragraph}>
            Das Guthaben von {formatCurrency(Math.abs(data.balance))} wird mit der
            nächsten Mietzahlung verrechnet bzw. auf Ihr Konto erstattet.
          </Text>
        )}

        {/* § 35a */}
        {total35a > 0 ? (
          <View style={styles.section35a}>
            <Text style={styles.bold}>Ausweis nach § 35a EStG</Text>
            <Text>
              Haushaltsnahe Dienstleistungen (§ 35a Abs. 2):{" "}
              {formatCurrency(data.labor35aHousehold)}
            </Text>
            <Text>
              Handwerkerleistungen (§ 35a Abs. 3):{" "}
              {formatCurrency(data.labor35aCraftsman)}
            </Text>
            <Text style={{ marginTop: 4, color: "#555555" }}>
              Die enthaltenen Lohn-/Arbeitskosten können Sie ggf. steuerlich
              geltend machen (§ 35a EStG).
            </Text>
          </View>
        ) : null}

        <Text style={{ marginTop: 14, fontSize: 8, color: "#777777" }}>
          Die dieser Abrechnung zugrunde liegenden Belege können nach Vereinbarung
          eingesehen werden (Belegeinsichtsrecht).
        </Text>
      </Page>
    </Document>
  );
}

export async function renderBillingStatementPdf(
  data: StatementPdfData,
): Promise<Uint8Array> {
  return renderToBuffer(<StatementDocument data={data} />);
}
