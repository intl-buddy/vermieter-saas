import { Text, StyleSheet } from "@react-pdf/renderer";

/**
 * Dezente, zentrierte Fußzeile für alle erzeugten PDFs (NK-Abrechnung, Mahnung,
 * Vorlagen, Übergabeprotokoll). `fixed` sorgt dafür, dass sie auf jeder Seite am
 * unteren Rand erscheint. Über das users-Flag `pdf_footer_enabled` abschaltbar –
 * bei `enabled={false}` wird nichts gerendert.
 */

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 16,
    left: 24,
    right: 24,
    textAlign: "center",
    fontSize: 8,
    color: "#999999",
  },
});

export function PdfFooter({ enabled = true }: { enabled?: boolean }) {
  if (!enabled) return null;
  return (
    <Text fixed style={styles.footer}>
      Erstellt mit tefter · tefter.de
    </Text>
  );
}
