import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatDate } from "../format";
import type { LetterSender } from "./letterShared";

export type HandoverPdfRoom = {
  name: string;
  conditionLabel: string;
  defects: string;
  /** Foto-DataURLs (bereits auf max. 4 begrenzt). */
  photos: string[];
  /** Anzahl Fotos insgesamt (auch wenn nicht alle im PDF landen). */
  photoTotal: number;
};

export type HandoverPdfData = {
  sender: LetterSender;
  typeLabel: string;
  date: string;
  objektName: string;
  objektAddress: string;
  unitLabel: string;
  unitFloor: string | null;
  tenantName: string;
  rooms: HandoverPdfRoom[];
  meters: { typeLabel: string; number: string; value: string }[];
  keys: { label: string; count: number }[];
  notes: string | null;
  signatureLandlord: string | null;
  signatureTenant: string | null;
  signatureCity: string | null;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 40,
    paddingLeft: 45,
    paddingRight: 45,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
    color: "#111111",
  },
  title: { fontFamily: "Helvetica-Bold", fontSize: 15, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#555555", marginBottom: 14 },

  // Kopf-Datenbox (Parteien / Einheit / Datum)
  metaRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  metaCol: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f5f5f7",
    borderRadius: 4,
  },
  metaTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 3 },
  metaLine: { fontSize: 9, color: "#333333" },

  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginTop: 10,
    marginBottom: 6,
  },

  // Tabellen
  th: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111111",
    paddingBottom: 3,
    marginBottom: 3,
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
  },
  thText: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  cell: { fontSize: 9 },

  // Raumtabelle
  cRoom: { width: "26%" },
  cCond: { width: "22%" },
  cDefect: { width: "52%" },

  // Zählertabelle
  cMeter: { width: "34%" },
  cMeterNo: { width: "36%" },
  cMeterVal: { width: "30%", textAlign: "right" },

  // Schlüsseltabelle
  cKey: { width: "70%" },
  cKeyCount: { width: "30%", textAlign: "right" },

  // Fotos
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  photo: {
    width: 92,
    height: 69,
    objectFit: "cover",
    borderRadius: 3,
    border: "1px solid #dddddd",
  },
  photoNote: { fontSize: 7, color: "#888888", marginTop: 2 },

  notesBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: "#f5f5f7",
    borderRadius: 4,
  },

  // Unterschriften
  signRow: { flexDirection: "row", gap: 24, marginTop: 24 },
  signCol: { flex: 1 },
  signImage: { height: 54, marginBottom: 2, objectFit: "contain" },
  signLine: { borderTopWidth: 1, borderTopColor: "#111111", paddingTop: 3 },
  signLabel: { fontSize: 8, color: "#555555" },
  signName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 1 },
  muted: { color: "#888888" },
});

function MetaCol({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={styles.metaCol}>
      <Text style={styles.metaTitle}>{title}</Text>
      {lines.filter(Boolean).map((l, i) => (
        <Text key={i} style={styles.metaLine}>
          {l}
        </Text>
      ))}
    </View>
  );
}

function SignatureField({
  role,
  name,
  image,
  city,
  date,
}: {
  role: string;
  name: string;
  image: string | null;
  city: string | null;
  date: string;
}) {
  return (
    <View style={styles.signCol}>
      {image ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={image} style={styles.signImage} />
      ) : (
        <View style={{ height: 54 }} />
      )}
      <View style={styles.signLine}>
        <Text style={styles.signLabel}>
          {role}
          {city ? ` · ${city}, ` : " · "}
          {formatDate(date)}
        </Text>
        <Text style={styles.signName}>{name || "—"}</Text>
      </View>
    </View>
  );
}

function HandoverDocument({ data }: { data: HandoverPdfData }) {
  const title = `Wohnungsübergabeprotokoll – ${data.typeLabel}`;
  const senderLines = [
    data.sender.fullName,
    data.sender.companyName,
    data.sender.addressStreet,
    [data.sender.addressZip, data.sender.addressCity].filter(Boolean).join(" "),
  ].filter((v): v is string => Boolean(v));

  return (
    <Document title={title} author={data.sender.fullName}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Wohnungsübergabeprotokoll</Text>
        <Text style={styles.subtitle}>
          {data.typeLabel} · {formatDate(data.date)}
        </Text>

        {/* Kopf: Parteien / Objekt & Einheit */}
        <View style={styles.metaRow}>
          <MetaCol title="Vermieter" lines={senderLines} />
          <MetaCol title="Mieter" lines={[data.tenantName || "—"]} />
          <MetaCol
            title="Objekt & Einheit"
            lines={[
              data.objektName,
              data.objektAddress,
              `Einheit: ${data.unitLabel}${
                data.unitFloor ? ` · ${data.unitFloor}` : ""
              }`,
            ]}
          />
        </View>

        {/* Räume */}
        <Text style={styles.sectionTitle}>Räume &amp; Zustand</Text>
        <View style={styles.th}>
          <Text style={[styles.cRoom, styles.thText]}>Raum</Text>
          <Text style={[styles.cCond, styles.thText]}>Zustand</Text>
          <Text style={[styles.cDefect, styles.thText]}>Mängel / Anmerkungen</Text>
        </View>
        {data.rooms.length === 0 ? (
          <Text style={[styles.cell, styles.muted, { paddingVertical: 4 }]}>
            Keine Räume erfasst.
          </Text>
        ) : (
          data.rooms.map((room, i) => (
            <View key={i} wrap={false}>
              <View style={styles.tr}>
                <Text style={[styles.cRoom, styles.cell]}>{room.name}</Text>
                <Text style={[styles.cCond, styles.cell]}>
                  {room.conditionLabel}
                </Text>
                <Text style={[styles.cDefect, styles.cell]}>
                  {room.defects || "–"}
                </Text>
              </View>
              {room.photos.length > 0 ? (
                <View style={{ marginBottom: 6 }}>
                  <View style={styles.photoRow}>
                    {room.photos.map((src, j) => (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image key={j} src={src} style={styles.photo} />
                    ))}
                  </View>
                  {room.photoTotal > room.photos.length ? (
                    <Text style={styles.photoNote}>
                      {room.photoTotal - room.photos.length} weitere Fotos nur
                      digital verfügbar.
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))
        )}

        {/* Zählerstände */}
        <Text style={styles.sectionTitle}>Zählerstände</Text>
        <View style={styles.th}>
          <Text style={[styles.cMeter, styles.thText]}>Zähler</Text>
          <Text style={[styles.cMeterNo, styles.thText]}>Zählernummer</Text>
          <Text style={[styles.cMeterVal, styles.thText]}>Stand</Text>
        </View>
        {data.meters.length === 0 ? (
          <Text style={[styles.cell, styles.muted, { paddingVertical: 4 }]}>
            Keine Zählerstände erfasst.
          </Text>
        ) : (
          data.meters.map((m, i) => (
            <View style={styles.tr} key={i}>
              <Text style={[styles.cMeter, styles.cell]}>{m.typeLabel}</Text>
              <Text style={[styles.cMeterNo, styles.cell]}>
                {m.number || "–"}
              </Text>
              <Text style={[styles.cMeterVal, styles.cell]}>
                {m.value || "–"}
              </Text>
            </View>
          ))
        )}

        {/* Schlüssel */}
        <Text style={styles.sectionTitle}>Schlüssel</Text>
        <View style={styles.th}>
          <Text style={[styles.cKey, styles.thText]}>Art</Text>
          <Text style={[styles.cKeyCount, styles.thText]}>Anzahl</Text>
        </View>
        {data.keys.length === 0 ? (
          <Text style={[styles.cell, styles.muted, { paddingVertical: 4 }]}>
            Keine Schlüssel erfasst.
          </Text>
        ) : (
          data.keys.map((k, i) => (
            <View style={styles.tr} key={i}>
              <Text style={[styles.cKey, styles.cell]}>{k.label || "–"}</Text>
              <Text style={[styles.cKeyCount, styles.cell]}>{k.count}</Text>
            </View>
          ))
        )}

        {/* Anmerkungen */}
        {data.notes ? (
          <>
            <Text style={styles.sectionTitle}>Anmerkungen</Text>
            <View style={styles.notesBox}>
              <Text style={styles.cell}>{data.notes}</Text>
            </View>
          </>
        ) : null}

        {/* Unterschriften */}
        <View style={styles.signRow} wrap={false}>
          <SignatureField
            role="Vermieter"
            name={data.sender.fullName}
            image={data.signatureLandlord}
            city={data.signatureCity}
            date={data.date}
          />
          <SignatureField
            role="Mieter"
            name={data.tenantName}
            image={data.signatureTenant}
            city={data.signatureCity}
            date={data.date}
          />
        </View>
      </Page>
    </Document>
  );
}

export async function renderHandoverProtocolPdf(
  data: HandoverPdfData,
): Promise<Uint8Array> {
  return renderToBuffer(<HandoverDocument data={data} />);
}
