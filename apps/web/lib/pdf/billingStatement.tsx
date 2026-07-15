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
  costLabel: string;
  totalCost: number;
  allocationKey: string;
  /** Gesamteinheiten (Nenner). null → Spalte leer (alte Läufe). */
  basisTotal: number | null;
  /** €/Einheit, ungerundet. null → leer. */
  unitPrice: number | null;
  /** Ihre Einheiten (Zähler). null → leer. */
  basisTenant: number | null;
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
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  tenant: {
    unitLabel: string;
    floor: string | null;
    unitArea: number;
    personsDisplay: string;
    wohnzeitFrom: string;
    wohnzeitTo: string;
    wohntage: number;
    ihreFlaechentage: number;
    ihrePersonentage: number;
  };
  object: {
    gesamtWohnflaeche: number;
    abrechnungstage: number;
    flaechentageGesamt: number;
    personentageGesamt: number;
    usedArea: boolean;
    usedPersons: boolean;
  };
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

const NF2 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
const NF4 = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});
const nUnits = (x: number | null) => (x == null ? "" : NF2.format(x));
const nPrice = (x: number | null) => (x == null ? "" : NF4.format(x));

function kuerzel(key: string): string {
  switch (key) {
    case "living_area":
    case "consumption":
      return "m²×T";
    case "persons":
      return "P×T";
    case "units":
      return "WE";
    case "ownership_share":
      return "MEA×T";
    case "direct":
      return "direkt";
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingLeft: 57,
    paddingRight: 45,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
    color: "#111111",
  },
  senderBlock: { alignItems: "flex-end", marginBottom: 20 },
  senderLine: { fontSize: 9, color: "#333333" },
  returnLine: {
    fontSize: 7,
    color: "#555555",
    textDecoration: "underline",
    marginBottom: 4,
  },
  recipientBlock: { marginBottom: 4, minHeight: 52 },
  recipientLine: { fontSize: 10 },
  dateLine: { textAlign: "right", marginTop: 10, marginBottom: 16 },
  subject: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 12 },
  paragraph: { marginBottom: 10 },
  bold: { fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 4 },

  // Abrechnungsdaten (zwei Spalten)
  dataRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  dataCol: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f5f5f7",
    borderRadius: 4,
  },
  dRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1 },
  dLabel: { color: "#555555" },
  dValue: { textAlign: "right" },

  // Haupttabelle
  th: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 3,
    marginBottom: 3,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
  },
  cCost: { width: "22%" },
  cTotal: { width: "13%", textAlign: "right" },
  cKey: { width: "11%" },
  cUnits: { width: "14%", textAlign: "right" },
  cPrice: { width: "13%", textAlign: "right" },
  cMine: { width: "13%", textAlign: "right" },
  cShare: { width: "14%", textAlign: "right" },
  thText: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  cell: { fontSize: 8 },
  cellSmall: { fontSize: 7, color: "#555555" },
  sumRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#111111",
    paddingTop: 3,
    marginTop: 2,
  },
  sumLabel: { width: "72%", textAlign: "right", paddingRight: 6 },
  sumVal: { width: "14%", textAlign: "right" },

  // Ergebnisblock
  resultBox: {
    marginTop: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: "#d1d1d6",
    borderRadius: 4,
  },
  rRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1 },
  rTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#111111",
    marginTop: 3,
    paddingTop: 3,
  },
  bank: { marginTop: 6, paddingLeft: 10 },
  section35a: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f5f5f7",
    borderRadius: 4,
  },
});

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dRow}>
      <Text style={styles.dLabel}>{label}</Text>
      <Text style={styles.dValue}>{value}</Text>
    </View>
  );
}

function StatementDocument({ data }: { data: StatementPdfData }) {
  const { sender, recipient, tenant, object, payment } = data;
  const summeIhreKosten = data.totalShare + data.heatingCosts;
  const prepayTotal = data.prepaymentsOperating + data.prepaymentsHeating;
  const isNachzahlung = data.balance > 0;
  const total35a = data.labor35aHousehold + data.labor35aCraftsman;
  const subject = `Betriebskostenabrechnung vom ${formatDate(
    data.periodStart,
  )} bis ${formatDate(data.periodEnd)} – ${data.objekt}`;
  const returnParts = [
    sender.fullName,
    sender.addressStreet,
    [sender.addressZip, sender.addressCity].filter(Boolean).join(" "),
  ].filter(Boolean);

  return (
    <Document title={subject} author={sender.fullName}>
      <Page size="A4" style={styles.page}>
        {/* Kopf */}
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
        <Text style={styles.subject}>{subject}</Text>

        {/* Abrechnungsdaten */}
        <View style={styles.dataRow}>
          <View style={styles.dataCol}>
            <Text style={styles.sectionTitle}>Ihre Angaben</Text>
            <DataRow label="Einheit" value={tenant.unitLabel || "–"} />
            <DataRow label="Lage / Etage" value={tenant.floor || "–"} />
            <DataRow
              label="Wohnfläche"
              value={`${nUnits(tenant.unitArea)} m²`}
            />
            <DataRow label="Personen" value={tenant.personsDisplay} />
            <DataRow
              label="Wohnzeit"
              value={`${formatDate(tenant.wohnzeitFrom)} – ${formatDate(
                tenant.wohnzeitTo,
              )}`}
            />
            <DataRow label="Ihre Wohntage" value={`${tenant.wohntage}`} />
          </View>
          <View style={styles.dataCol}>
            <Text style={styles.sectionTitle}>Verteilgrundlagen des Objekts</Text>
            <DataRow
              label="Gesamtwohnfläche"
              value={`${nUnits(object.gesamtWohnflaeche)} m²`}
            />
            <DataRow
              label="Abrechnungstage"
              value={`${object.abrechnungstage}`}
            />
            {object.usedArea ? (
              <>
                <DataRow
                  label="Flächentage gesamt"
                  value={nUnits(object.flaechentageGesamt)}
                />
                <DataRow
                  label="Ihre Flächentage"
                  value={nUnits(tenant.ihreFlaechentage)}
                />
              </>
            ) : null}
            {object.usedPersons ? (
              <>
                <DataRow
                  label="Personentage gesamt"
                  value={nUnits(object.personentageGesamt)}
                />
                <DataRow
                  label="Ihre Personentage"
                  value={nUnits(tenant.ihrePersonentage)}
                />
              </>
            ) : null}
          </View>
        </View>

        {/* Haupttabelle mit Rechenweg */}
        <View style={styles.th}>
          <Text style={[styles.cCost, styles.thText]}>Kostenart</Text>
          <Text style={[styles.cTotal, styles.thText]}>Gesamtkosten</Text>
          <Text style={[styles.cKey, styles.thText]}>Schlüssel</Text>
          <Text style={[styles.cUnits, styles.thText]}>Gesamt-Einh.</Text>
          <Text style={[styles.cPrice, styles.thText]}>€/Einheit</Text>
          <Text style={[styles.cMine, styles.thText]}>Ihre Einh.</Text>
          <Text style={[styles.cShare, styles.thText]}>Ihr Anteil</Text>
        </View>
        {data.positions.map((p, i) => (
          <View style={styles.tr} key={i}>
            <Text style={[styles.cCost, styles.cell]}>{p.costLabel}</Text>
            <Text style={[styles.cTotal, styles.cell]}>
              {formatCurrency(p.totalCost)}
            </Text>
            <Text style={[styles.cKey, styles.cell]}>
              {kuerzel(p.allocationKey)}
            </Text>
            <Text style={[styles.cUnits, styles.cell]}>
              {nUnits(p.basisTotal)}
            </Text>
            <Text style={[styles.cPrice, styles.cell]}>
              {nPrice(p.unitPrice)}
            </Text>
            <Text style={[styles.cMine, styles.cell]}>
              {nUnits(p.basisTenant)}
            </Text>
            <Text style={[styles.cShare, styles.cell, styles.bold]}>
              {formatCurrency(p.share)}
            </Text>
          </View>
        ))}
        {/* Heizkosten-Zeile */}
        <View style={styles.tr}>
          <Text style={[styles.cCost, styles.cell]}>
            Heiz-/Warmwasserkosten
          </Text>
          <Text style={{ width: "51%", ...styles.cellSmall }}>
            lt. Abrechnung Ihres Messdienstleisters (direkte Zuordnung)
          </Text>
          <Text style={[styles.cShare, styles.cell, styles.bold]}>
            {formatCurrency(data.heatingCosts)}
          </Text>
        </View>
        {/* Summenzeile */}
        <View style={styles.sumRow}>
          <Text style={[styles.sumLabel, styles.bold]}>Summe Ihre Kosten</Text>
          <Text style={{ width: "14%" }} />
          <Text style={[styles.sumVal, styles.bold]}>
            {formatCurrency(summeIhreKosten)}
          </Text>
        </View>

        {/* Ergebnisblock */}
        <View style={styles.resultBox}>
          <View style={styles.rRow}>
            <Text>Ihre Betriebskosten</Text>
            <Text>{formatCurrency(data.totalShare)}</Text>
          </View>
          <View style={styles.rRow}>
            <Text>Ihre Heizkosten</Text>
            <Text>{formatCurrency(data.heatingCosts)}</Text>
          </View>
          <View style={styles.rRow}>
            <Text style={styles.bold}>Summe</Text>
            <Text style={styles.bold}>{formatCurrency(summeIhreKosten)}</Text>
          </View>
          <View style={styles.rRow}>
            <Text>
              geleistete Vorauszahlungen (Soll) – NK{" "}
              {formatCurrency(data.prepaymentsOperating)} / HK{" "}
              {formatCurrency(data.prepaymentsHeating)}
            </Text>
            <Text>−{formatCurrency(prepayTotal)}</Text>
          </View>
          <View style={styles.rTotal}>
            <Text style={styles.bold}>
              {isNachzahlung ? "Nachzahlung" : "Guthaben"}
            </Text>
            <Text style={styles.bold}>
              {formatCurrency(Math.abs(data.balance))}
            </Text>
          </View>
        </View>

        {isNachzahlung ? (
          <View>
            <Text style={{ marginTop: 10 }}>
              Bitte überweisen Sie den Nachzahlungsbetrag von{" "}
              {formatCurrency(data.balance)} bis zum{" "}
              {formatDate(data.paymentDeadline)} auf folgendes Konto:
            </Text>
            <View style={styles.bank}>
              {payment.bankName ? (
                <Text>Bank: {payment.bankName}</Text>
              ) : null}
              <Text>
                IBAN: {payment.iban ?? "(bitte im Profil hinterlegen)"}
              </Text>
              {payment.bic ? <Text>BIC: {payment.bic}</Text> : null}
              <Text>Kontoinhaber: {sender.fullName}</Text>
            </View>
          </View>
        ) : (
          <Text style={{ marginTop: 10 }}>
            Das Guthaben von {formatCurrency(Math.abs(data.balance))} wird Ihnen
            erstattet bzw. mit der nächsten Mietzahlung verrechnet.
          </Text>
        )}

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
            <Text style={{ marginTop: 3, color: "#555555" }}>
              Die enthaltenen Lohn-/Arbeitskosten können Sie ggf. steuerlich
              geltend machen (§ 35a EStG).
            </Text>
          </View>
        ) : null}

        <Text style={{ marginTop: 12, fontSize: 8, color: "#777777" }}>
          Die dieser Abrechnung zugrunde liegenden Belege können nach
          Vereinbarung eingesehen werden (Belegeinsichtsrecht).
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
