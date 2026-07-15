import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatDate } from "../format";
import {
  DateLine,
  RecipientBlock,
  ReturnLine,
  SenderBlock,
  letterStyles,
  type LetterRecipient,
  type LetterSender,
} from "./letterShared";

export const WOHNUNGSGEBER_HINWEIS =
  "Diese Bestätigung wird zur Vorlage bei der Meldebehörde ausgestellt. Hinweis: Es ist verboten, eine Wohnanschrift für eine Anmeldung anzubieten oder zur Verfügung zu stellen, obwohl ein tatsächlicher Bezug der Wohnung weder stattfindet noch beabsichtigt ist (§ 19 Abs. 6 BMG).";

export type WohnungsgeberData = {
  sender: LetterSender;
  recipient: LetterRecipient;
  issuedAt: string;
  wohnungsgeber: string;
  wohnungAnschrift: string;
  einheit: string;
  einzugsdatum: string;
  meldepflichtige: string; // mehrzeilig
};

const styles = StyleSheet.create({
  intro: { marginBottom: 14, textAlign: "justify" },
  table: {
    borderWidth: 1,
    borderColor: "#111111",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
  },
  rowLast: { flexDirection: "row" },
  labelCell: {
    width: "40%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#111111",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  valueCell: { width: "60%", padding: 6, fontSize: 10 },
  hint: {
    marginTop: 4,
    marginBottom: 20,
    fontSize: 10,
    textAlign: "justify",
  },
  signatureLabel: { fontSize: 9, color: "#555555", marginTop: 2 },
});

function TableRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string[];
  last?: boolean;
}) {
  return (
    <View style={last ? styles.rowLast : styles.row}>
      <Text style={styles.labelCell}>{label}</Text>
      <View style={styles.valueCell}>
        {value.map((line, i) => (
          <Text key={i}>{line || " "}</Text>
        ))}
      </View>
    </View>
  );
}

function WohnungsgeberDocument({ data }: { data: WohnungsgeberData }) {
  const { sender, recipient } = data;
  const meldeLines = data.meldepflichtige.split("\n");

  return (
    <Document
      title={`Wohnungsgeberbestätigung – ${recipient.name}`}
      author={sender.fullName}
    >
      <Page size="A4" style={letterStyles.page}>
        <SenderBlock sender={sender} />
        <ReturnLine sender={sender} />
        <RecipientBlock recipient={recipient} />
        <DateLine city={sender.addressCity} date={data.issuedAt} />

        <Text style={letterStyles.subject}>
          Wohnungsgeberbestätigung gemäß § 19 Bundesmeldegesetz (BMG)
        </Text>

        <Text style={styles.intro}>
          Hiermit wird gemäß § 19 Abs. 1 Bundesmeldegesetz (BMG) der/den
          nachstehend genannten meldepflichtigen Person(en) bestätigt, dass
          diese in die nachfolgend bezeichnete Wohnung eingezogen ist/sind:
        </Text>

        <View style={styles.table}>
          <TableRow label="Wohnungsgeber" value={[data.wohnungsgeber]} />
          <TableRow
            label="Anschrift der Wohnung"
            value={[data.wohnungAnschrift]}
          />
          <TableRow label="Wohnung / Einheit" value={[data.einheit]} />
          <TableRow
            label="Datum des Einzugs"
            value={[formatDate(data.einzugsdatum)]}
          />
          <TableRow
            label="Meldepflichtige Person(en)"
            value={meldeLines}
            last
          />
        </View>

        <Text style={styles.hint}>{WOHNUNGSGEBER_HINWEIS}</Text>

        <Text style={{ marginTop: 24 }}>
          {sender.addressCity ? `${sender.addressCity}, den ` : ""}
          {formatDate(data.issuedAt)}
        </Text>
        <Text style={{ marginTop: 28 }}>
          _______________________________________
        </Text>
        <Text style={styles.signatureLabel}>
          Unterschrift Wohnungsgeber ({sender.fullName})
        </Text>
      </Page>
    </Document>
  );
}

export async function renderWohnungsgeberPdf(
  data: WohnungsgeberData,
): Promise<Uint8Array> {
  return renderToBuffer(<WohnungsgeberDocument data={data} />);
}
