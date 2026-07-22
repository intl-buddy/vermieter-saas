import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  buildMietvertragDoc,
  type Anlage,
  type Block,
  type MietvertragData,
  type Section,
} from "./mietvertragContent";

export type { MietvertragData } from "./mietvertragContent";

export const GREEN = "#2a9549";
export const INK = "#1a1a1a";
export const MUTED = "#5a5a5a";
const LINE = "#c9c9c9";

export const styles = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 58,
    paddingHorizontal: 60,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.45,
    color: INK,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  rule: {
    alignSelf: "center",
    width: 132,
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    marginTop: 6,
    marginBottom: 18,
  },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  partyCol: { width: "47%" },
  partyLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  partyName: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  partyLine: { fontSize: 10, color: INK },
  partySub: { fontSize: 8.5, color: MUTED, marginTop: 1 },
  intro: { marginBottom: 6, textAlign: "justify" },
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 7,
  },
  clause: { marginBottom: 5, textAlign: "justify" },
  address: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    marginVertical: 4,
  },
  listRow: { flexDirection: "row", marginBottom: 2, paddingLeft: 12 },
  bullet: { width: 12 },
  listText: { flex: 1 },
  moneyBox: { marginVertical: 6, paddingLeft: 12, paddingRight: 4 },
  moneyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1.5,
  },
  moneyTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: INK,
    marginTop: 3,
    paddingTop: 3,
  },
  moneyLabel: { color: INK },
  moneyLabelBold: { fontFamily: "Helvetica-Bold" },
  moneyValue: { fontFamily: "Helvetica" },
  moneyValueBold: { fontFamily: "Helvetica-Bold" },
  bankBox: { marginVertical: 6, paddingLeft: 12 },
  bankRow: { flexDirection: "row", marginBottom: 1 },
  bankLabel: { width: 90, color: MUTED },
  bankValue: { flex: 1 },
  subheading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    marginTop: 9,
    marginBottom: 3,
  },
  pageNo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    paddingTop: 14,
  },
  pageNoText: {
    textAlign: "center",
    fontSize: 8,
    color: MUTED,
    lineHeight: 1,
  },
  // Unterschriften
  signWrap: { marginTop: 34 },
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  signCell: { width: "47%" },
  signLine: { borderBottomWidth: 1, borderBottomColor: INK, height: 26 },
  signCaption: { fontSize: 8.5, color: MUTED, marginTop: 3 },
  // Anlagen
  anlageCover: { marginBottom: 16 },
  anlageKicker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: GREEN,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  anlageTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    marginTop: 4,
  },
  anlageRule: {
    width: 90,
    borderBottomWidth: 2,
    borderBottomColor: GREEN,
    marginTop: 6,
  },
  // SEPA
  sepaRow: { flexDirection: "row", marginBottom: 10 },
  sepaLabel: { width: 130, color: MUTED, fontSize: 9.5 },
  sepaField: { flex: 1, borderBottomWidth: 1, borderBottomColor: LINE, minHeight: 14 },
});

export function renderBlock(block: Block, key: number) {
  switch (block.t) {
    case "clause":
      return (
        <Text key={key} style={styles.clause}>
          {block.text}
        </Text>
      );
    case "address":
      return (
        <Text key={key} style={styles.address}>
          {block.text}
        </Text>
      );
    case "list":
      return (
        <View key={key}>
          {block.items.map((it, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.bullet}>–</Text>
              <Text style={styles.listText}>{it}</Text>
            </View>
          ))}
        </View>
      );
    case "money":
      return (
        <View key={key} style={styles.moneyBox}>
          {block.rows.map((r, i) => (
            <View key={i} style={styles.moneyRow}>
              <Text style={styles.moneyLabel}>{r.label}</Text>
              <Text style={styles.moneyValue}>{r.value}</Text>
            </View>
          ))}
          <View style={styles.moneyTotal}>
            <Text style={styles.moneyLabelBold}>{block.total.label}</Text>
            <Text style={styles.moneyValueBold}>{block.total.value}</Text>
          </View>
        </View>
      );
    case "bank":
      return (
        <View key={key} style={styles.bankBox}>
          {block.rows.map((r, i) => (
            <View key={i} style={styles.bankRow}>
              <Text style={styles.bankLabel}>{r.label}</Text>
              <Text style={styles.bankValue}>{r.value}</Text>
            </View>
          ))}
        </View>
      );
    case "subheading":
      return (
        <Text key={key} style={styles.subheading}>
          {block.text}
        </Text>
      );
    case "sepa":
      return <SepaForm key={key} glaeubiger={block.glaeubiger} />;
  }
}

export function SectionView({ section }: { section: Section }) {
  return (
    <View>
      <View wrap={false}>
        <Text style={styles.sectionHeading}>{section.heading}</Text>
      </View>
      {section.blocks.map((b, i) => renderBlock(b, i))}
    </View>
  );
}

function SepaForm({ glaeubiger }: { glaeubiger: string }) {
  const rows: { label: string; value?: string }[] = [
    { label: "Gläubiger (Vermieter)", value: glaeubiger },
    { label: "Mandatsreferenz" },
    { label: "Kontoinhaber" },
    { label: "IBAN" },
    { label: "BIC" },
  ];
  return (
    <View>
      <Text style={styles.clause}>
        Ich ermächtige den Vermieter, Zahlungen von meinem Konto mittels
        Lastschrift einzuziehen. Zugleich weise ich mein Kreditinstitut an, die
        vom Vermieter auf mein Konto gezogenen Lastschriften einzulösen.
      </Text>
      <View style={{ marginTop: 12 }}>
        {rows.map((r, i) => (
          <View key={i} style={styles.sepaRow}>
            <Text style={styles.sepaLabel}>{r.label}</Text>
            <Text style={styles.sepaField}>{r.value ?? " "}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.signRow, { marginTop: 18 }]}>
        <View style={styles.signCell}>
          <View style={styles.signLine} />
          <Text style={styles.signCaption}>Ort, Datum</Text>
        </View>
        <View style={styles.signCell}>
          <View style={styles.signLine} />
          <Text style={styles.signCaption}>Unterschrift Kontoinhaber</Text>
        </View>
      </View>
    </View>
  );
}

export function SignatureBlock() {
  return (
    <View style={styles.signWrap} wrap={false}>
      <View style={styles.signRow}>
        <View style={styles.signCell}>
          <View style={styles.signLine} />
          <Text style={styles.signCaption}>Ort, Datum</Text>
        </View>
        <View style={styles.signCell}>
          <View style={styles.signLine} />
          <Text style={styles.signCaption}>Ort, Datum</Text>
        </View>
      </View>
      <View style={styles.signRow}>
        <View style={styles.signCell}>
          <View style={styles.signLine} />
          <Text style={styles.signCaption}>Unterschrift Vermieter</Text>
        </View>
        <View style={styles.signCell}>
          <View style={styles.signLine} />
          <Text style={styles.signCaption}>Unterschrift Mieter</Text>
        </View>
      </View>
    </View>
  );
}

export function AnlageView({ anlage }: { anlage: Anlage }) {
  return (
    <View break>
      <View style={styles.anlageCover}>
        <Text style={styles.anlageKicker}>Anlage {anlage.nummer}</Text>
        <Text style={styles.anlageTitle}>{anlage.titel}</Text>
        <View style={styles.anlageRule} />
      </View>
      {anlage.blocks.map((b, i) => renderBlock(b, i))}
    </View>
  );
}

function MietvertragDocument({ data }: { data: MietvertragData }) {
  const doc = buildMietvertragDoc(data);
  const p = doc.parties;
  return (
    <Document
      title={`Wohnraummietvertrag – ${p.mieterName}`}
      author={p.vermieterName}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Wohnraummietvertrag</Text>
        <View style={styles.rule} />

        <View style={styles.partiesRow}>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Vermieter</Text>
            <Text style={styles.partyName}>{p.vermieterName}</Text>
            <Text style={styles.partyLine}>{p.vermieterAnschrift}</Text>
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Mieter</Text>
            <Text style={styles.partyName}>{p.mieterName}</Text>
            <Text style={styles.partyLine}>{p.mieterAnschrift}</Text>
            <Text style={styles.partySub}>
              geboren am {p.mieterGeburtsdatum}
            </Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Zwischen den vorstehend genannten Parteien wird der folgende
          Wohnraummietvertrag geschlossen:
        </Text>

        {doc.sections.map((s, i) => (
          <SectionView key={i} section={s} />
        ))}

        <SignatureBlock />

        {doc.anlagen.map((a, i) => (
          <AnlageView key={i} anlage={a} />
        ))}

        <View style={styles.pageNo} fixed>
          <Text
            style={styles.pageNoText}
            render={({ pageNumber, totalPages }) =>
              `Seite ${pageNumber} von ${totalPages}`
            }
          />
          {(data.footerEnabled ?? true) ? (
            <Text
              style={{
                textAlign: "center",
                fontSize: 8,
                color: "#999999",
                marginTop: 2,
              }}
            >
              Erstellt mit tefter · tefter.de
            </Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

export async function renderMietvertragPdf(
  data: MietvertragData,
): Promise<Uint8Array> {
  return renderToBuffer(<MietvertragDocument data={data} />);
}
