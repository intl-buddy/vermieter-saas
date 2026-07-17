import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";

export const metadata = { title: "AGB · tefter" };

export default function AgbPage() {
  return (
    <LegalShell title="Allgemeine Geschäftsbedingungen">
      <p className="mb-6 text-neutral-500">
        Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der
        Software-as-a-Service-Anwendung tefter.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        1. Geltungsbereich und Unternehmereigenschaft
      </h2>
      <p className="mb-3">
        (1) Diese AGB gelten für alle Verträge zwischen Omer Alic, Schützenstr.
        131, 45476 Mülheim an der Ruhr (nachfolgend „Anbieter") und dem Nutzer
        über die Nutzung von tefter.
      </p>
      <p className="mb-3">
        (2) tefter richtet sich ausschließlich an Vermieter, die in Ausübung
        ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handeln. Der
        Nutzer handelt bei Vertragsschluss als Unternehmer im Sinne des § 14 BGB.
        Ein Verbrauchergeschäft im Sinne des § 13 BGB liegt ausdrücklich nicht
        vor.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        2. Vertragsgegenstand
      </h2>
      <p className="mb-3">
        (1) Der Anbieter stellt dem Nutzer eine Web-Anwendung zur Verwaltung von
        Immobilien zur Verfügung (u. a. Objekte, Einheiten, Mietverhältnisse,
        Zahlungen, Mahnwesen, Nebenkostenabrechnung, Übergabeprotokolle sowie
        Dokumentvorlagen).
      </p>
      <p className="mb-3">
        (2) tefter erbringt keine Rechts- oder Steuerberatung. Alle erzeugten
        Dokumente, Vorlagen und Berechnungen sind unverbindliche Muster bzw.
        Hilfsmittel. Der Nutzer ist verpflichtet, sie vor Verwendung eigenständig
        auf Richtigkeit, Vollständigkeit und rechtliche Zulässigkeit zu prüfen
        und im Zweifel fachkundigen Rat (z. B. Rechtsanwalt oder Steuerberater)
        einzuholen.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        3. Registrierung und Testphase
      </h2>
      <p className="mb-3">
        (1) Die Nutzung setzt eine Registrierung voraus. Mit Abschluss der
        Registrierung kommt der Nutzungsvertrag zustande.
      </p>
      <p className="mb-3">
        (2) Neue Nutzer erhalten einen kostenlosen Testzeitraum von 14 Tagen.
        Dieser endet automatisch, ohne dass es einer Kündigung bedarf, und ist
        mit keinen Kosten verbunden. Ein kostenpflichtiges Abonnement kommt erst
        durch die aktive Auswahl eines Pakets zustande.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        4. Preise und Zahlung
      </h2>
      <p className="mb-3">
        (1) Es gelten die zum Zeitpunkt der Bestellung auf der{" "}
        <Link href="/preise" className="text-secondary hover:underline">
          Preisseite
        </Link>{" "}
        ausgewiesenen Pakete und Preise. Alle Preise verstehen sich inklusive der
        gesetzlichen Umsatzsteuer.
      </p>
      <p className="mb-3">
        (2) Die Abrechnung erfolgt über den Zahlungsdienstleister Stripe. Die
        Vergütung ist je nach gewähltem Abrechnungsintervall monatlich oder
        jährlich im Voraus fällig.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        5. Laufzeit und Kündigung
      </h2>
      <p className="mb-3">
        (1) Das Abonnement wird je nach Auswahl mit monatlicher oder jährlicher
        Laufzeit abgeschlossen und verlängert sich um die jeweils gewählte
        Laufzeit, sofern es nicht gekündigt wird.
      </p>
      <p className="mb-3">
        (2) Der Nutzer kann das Abonnement jederzeit mit Wirkung zum Ende der
        laufenden Abrechnungsperiode über das Kundenportal (Stripe) in den
        Einstellungen kündigen. Bis zum Ende der bezahlten Periode bleibt der
        Zugang bestehen.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        6. Pflichten des Nutzers
      </h2>
      <p className="mb-3">
        (1) Der Nutzer stellt sicher, dass die von ihm eingegebenen Daten richtig
        und aktuell sind, und hält seine Zugangsdaten geheim.
      </p>
      <p className="mb-3">
        (2) Der Nutzer nutzt tefter nicht für rechtswidrige Zwecke und beachtet
        die geltenden gesetzlichen Bestimmungen.
      </p>
      <p className="mb-3">
        (3) Für die von ihm eingegebenen personenbezogenen Daten seiner Mieter
        und sonstiger Betroffener bleibt der Nutzer datenschutzrechtlich
        Verantwortlicher im Sinne der DSGVO. Die Verarbeitung durch den Anbieter
        richtet sich nach dem{" "}
        <Link href="/avv" className="text-secondary hover:underline">
          Auftragsverarbeitungsvertrag
        </Link>
        .
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        7. Verfügbarkeit
      </h2>
      <p className="mb-3">
        Der Anbieter bemüht sich um eine möglichst hohe Verfügbarkeit des
        Dienstes, schuldet jedoch keine bestimmte Verfügbarkeit von 100 %.
        Wartungsarbeiten werden, soweit möglich, angekündigt und in
        nutzungsarme Zeiten gelegt. Vorübergehende Einschränkungen aufgrund von
        Wartung, höherer Gewalt oder Störungen außerhalb des Einflussbereichs des
        Anbieters begründen keinen Mangel.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        8. Datenaufbewahrung nach Vertragsende
      </h2>
      <p className="mb-3">
        Nach Beendigung des Vertrags bleibt das Konto für sechs Monate im
        Lesemodus zugänglich. In diesem Zeitraum kann der Nutzer seine Daten
        einsehen und exportieren. Nach Ablauf der Frist werden die Daten
        endgültig gelöscht (siehe{" "}
        <Link href="/datenschutz" className="text-secondary hover:underline">
          Datenschutzerklärung
        </Link>
        ).
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        9. Haftung
      </h2>
      <p className="mb-3">
        (1) Der Anbieter haftet unbeschränkt für Schäden aus Vorsatz und grober
        Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des
        Körpers oder der Gesundheit.
      </p>
      <p className="mb-3">
        (2) Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung
        einer wesentlichen Vertragspflicht (Kardinalpflicht), deren Erfüllung die
        ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf
        deren Einhaltung der Nutzer regelmäßig vertrauen darf. In diesem Fall ist
        die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
      </p>
      <p className="mb-3">
        (3) Der Anbieter haftet nicht für die inhaltliche Richtigkeit der mit
        tefter erstellten Dokumente, Vorlagen und Berechnungen; deren Prüfung
        obliegt dem Nutzer (Ziffer 2 Abs. 2).
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        10. Änderungen dieser AGB
      </h2>
      <p className="mb-3">
        Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern. Änderungen
        werden dem Nutzer rechtzeitig vor Inkrafttreten in geeigneter Form (z. B.
        per E-Mail oder Hinweis in der Anwendung) angekündigt. Widerspricht der
        Nutzer nicht innerhalb der angekündigten Frist und nutzt den Dienst
        weiter, gelten die geänderten AGB als angenommen; hierauf wird in der
        Ankündigung gesondert hingewiesen.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        11. Schlussbestimmungen
      </h2>
      <p className="mb-3">
        (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
        UN-Kaufrechts.
      </p>
      <p className="mb-3">
        (2) Soweit gesetzlich zulässig, ist Gerichtsstand für alle Streitigkeiten
        aus dem Vertragsverhältnis Mülheim an der Ruhr.
      </p>
      <p className="mb-3">
        (3) Sollte eine Bestimmung dieser AGB unwirksam sein oder werden, bleibt
        die Wirksamkeit der übrigen Bestimmungen unberührt.
      </p>

      <p className="mt-8 text-neutral-500">Stand: Juli 2026</p>
    </LegalShell>
  );
}
