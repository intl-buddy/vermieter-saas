import { Document, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
  styles,
  SectionView,
  SignatureBlock,
  AnlageView,
} from "./mietvertrag";
import {
  buildGewerbemietvertragDoc,
  type GewerbemietvertragData,
} from "./gewerbemietvertragContent";

export type { GewerbemietvertragData } from "./gewerbemietvertragContent";

function GewerbemietvertragDocument({
  data,
}: {
  data: GewerbemietvertragData;
}) {
  const doc = buildGewerbemietvertragDoc(data);
  const p = doc.parties;
  return (
    <Document
      title={`Geschäftsraummietvertrag – ${p.mieterFirma}`}
      author={p.vermieterName}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Geschäftsraummietvertrag</Text>
        <View style={styles.rule} />

        <View style={styles.partiesRow}>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Vermieter</Text>
            <Text style={styles.partyName}>{p.vermieterName}</Text>
            <Text style={styles.partyLine}>{p.vermieterAnschrift}</Text>
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Mieter</Text>
            <Text style={styles.partyName}>{p.mieterFirma}</Text>
            {p.mieterVertreter ? (
              <Text style={styles.partySub}>
                vertreten durch {p.mieterVertreter}
              </Text>
            ) : null}
            <Text style={styles.partyLine}>{p.mieterAnschrift}</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Zwischen den vorstehend genannten Parteien wird der folgende
          Geschäftsraummietvertrag geschlossen:
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

export async function renderGewerbemietvertragPdf(
  data: GewerbemietvertragData,
): Promise<Uint8Array> {
  return renderToBuffer(<GewerbemietvertragDocument data={data} />);
}
