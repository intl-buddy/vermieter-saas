import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDate } from "../format";

/**
 * Gemeinsame Bausteine für Briefvorlagen (Abmahnung, Wohnungsgeberbestätigung).
 * Das Layout ist bewusst identisch zu den Mahnungen: Absenderblock rechts oben
 * aus dem Vermieterprofil, kleine unterstrichene Rücksende-Absenderzeile,
 * Empfängerblock links, Ort/Datum rechts, Betreff fett – kein Logo, keine
 * Fußzeile.
 */

export type LetterSender = {
  fullName: string;
  companyName: string | null;
  addressStreet: string | null;
  addressZip: string | null;
  addressCity: string | null;
};

export type LetterRecipient = {
  name: string; // "Vorname Nachname"
  street: string; // Straße + Hausnummer
  zipCity: string; // "PLZ Ort"
};

export const letterStyles = StyleSheet.create({
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
  signatureName: {
    marginTop: 28,
  },
});

/** Absenderblock rechts oben (Name, Firma, Anschrift) aus dem Vermieterprofil. */
export function SenderBlock({ sender }: { sender: LetterSender }) {
  return (
    <View style={letterStyles.senderBlock}>
      <Text style={letterStyles.senderLine}>{sender.fullName}</Text>
      {sender.companyName ? (
        <Text style={letterStyles.senderLine}>{sender.companyName}</Text>
      ) : null}
      {sender.addressStreet ? (
        <Text style={letterStyles.senderLine}>{sender.addressStreet}</Text>
      ) : null}
      <Text style={letterStyles.senderLine}>
        {[sender.addressZip, sender.addressCity].filter(Boolean).join(" ")}
      </Text>
    </View>
  );
}

/** Kleine unterstrichene Rücksende-Absenderzeile über dem Empfängerblock. */
export function ReturnLine({ sender }: { sender: LetterSender }) {
  const returnParts = [
    sender.fullName,
    sender.addressStreet,
    [sender.addressZip, sender.addressCity].filter(Boolean).join(" "),
  ].filter(Boolean);
  return <Text style={letterStyles.returnLine}>{returnParts.join(", ")}</Text>;
}

/** Empfängerblock links (Name + Anschrift). */
export function RecipientBlock({
  recipient,
}: {
  recipient: LetterRecipient;
}) {
  return (
    <View style={letterStyles.recipientBlock}>
      <Text style={letterStyles.recipientLine}>{recipient.name}</Text>
      <Text style={letterStyles.recipientLine}>{recipient.street}</Text>
      <Text style={letterStyles.recipientLine}>{recipient.zipCity}</Text>
    </View>
  );
}

/** Ort / Datum rechtsbündig. */
export function DateLine({
  city,
  date,
}: {
  city: string | null;
  date: string;
}) {
  return (
    <Text style={letterStyles.dateLine}>
      {city ? `${city}, den ` : "Den "}
      {formatDate(date)}
    </Text>
  );
}
