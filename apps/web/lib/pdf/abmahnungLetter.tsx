import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";
import { formatDate } from "../format";
import {
  ABMAHNUNG_GESPRAECH,
  ABMAHNUNG_RECHTSFOLGEN,
} from "../vorlagen/abmahnung";
import {
  DateLine,
  RecipientBlock,
  ReturnLine,
  SenderBlock,
  letterStyles,
  type LetterRecipient,
  type LetterSender,
} from "./letterShared";

export type AbmahnungData = {
  sender: LetterSender;
  recipient: LetterRecipient & { lastName: string };
  issuedAt: string; // Ausstellungsdatum (YYYY-MM-DD)
  deadline: string; // Frist (YYYY-MM-DD)
  grund: string; // Grund für Betreff
  objektLabel: string; // Objektname
  einheitLabel: string; // Einheit
  sachverhalt: string; // Absatz 1 (editierbar)
};

function AbmahnungDocument({ data }: { data: AbmahnungData }) {
  const { sender, recipient } = data;
  const subject = `Abmahnung wegen ${data.grund} – ${data.objektLabel}, ${data.einheitLabel}`;

  return (
    <Document
      title={`Abmahnung – ${recipient.name}`}
      author={sender.fullName}
    >
      <Page size="A4" style={letterStyles.page}>
        <SenderBlock sender={sender} />
        <ReturnLine sender={sender} />
        <RecipientBlock recipient={recipient} />
        <DateLine city={sender.addressCity} date={data.issuedAt} />

        <Text style={letterStyles.subject}>{subject}</Text>

        <Text style={letterStyles.paragraph}>
          Sehr geehrte/r Frau/Herr {recipient.lastName},
        </Text>

        {/* Absatz 1 – Sachverhalt */}
        <Text style={letterStyles.paragraph}>{data.sachverhalt}</Text>

        {/* Absatz 2 – förmliche Abmahnung + Aufforderung + Frist */}
        <Text style={letterStyles.paragraph}>
          Wir mahnen Sie hiermit wegen des vorstehend geschilderten Verhaltens
          ausdrücklich ab. Zugleich fordern wir Sie auf, das beanstandete
          Verhalten unverzüglich, spätestens jedoch bis zum{" "}
          {formatDate(data.deadline)}, einzustellen und künftig zu unterlassen.
        </Text>

        {/* Absatz 3 – Rechtsfolgen (wörtlich) */}
        <Text style={letterStyles.paragraph}>{ABMAHNUNG_RECHTSFOLGEN}</Text>

        {/* Absatz 4 – Gesprächsangebot */}
        <Text style={letterStyles.paragraph}>{ABMAHNUNG_GESPRAECH}</Text>

        <Text>Mit freundlichen Grüßen</Text>
        <Text style={letterStyles.signatureName}>{sender.fullName}</Text>
      </Page>
    </Document>
  );
}

export async function renderAbmahnungPdf(
  data: AbmahnungData,
): Promise<Uint8Array> {
  return renderToBuffer(<AbmahnungDocument data={data} />);
}
