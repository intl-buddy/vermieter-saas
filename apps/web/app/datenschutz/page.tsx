import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";

export const metadata = { title: "Datenschutz · tefter" };

export default function DatenschutzPage() {
  return (
    <LegalShell title="Datenschutzerklärung">
      <p className="mb-6 text-neutral-500">
        Diese Erklärung informiert über die Verarbeitung personenbezogener Daten
        bei der Nutzung von tefter gemäß Datenschutz-Grundverordnung (DSGVO). Sie
        richtet sich an unsere Nutzer (Vermieter) sowie an alle Personen, deren
        Daten im Rahmen der Nutzung verarbeitet werden.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        1. Verantwortlicher
      </h2>
      <p className="mb-3">
        Verantwortlich für die Datenverarbeitung im Sinne des Art. 4 Nr. 7 DSGVO
        ist:
        <br />
        Omer Alic, Schützenstr. 131, 45476 Mülheim an der Ruhr, Deutschland
        <br />
        E-Mail:{" "}
        <a
          href="mailto:service@tefter.de"
          className="text-secondary hover:underline"
        >
          service@tefter.de
        </a>
        , Telefon: 0208 7801 5120
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        2. Hosting und Backups
      </h2>
      <p className="mb-3">
        tefter wird auf einem eigenen Server betrieben, der in einem
        Rechenzentrum der Netcup GmbH (Standort Nürnberg, Deutschland) steht.
        Sämtliche Anwendungs- und Datenbankdaten werden ausschließlich innerhalb
        Deutschlands verarbeitet und gespeichert. Verschlüsselte Sicherungskopien
        (Backups) werden bei der Hetzner Online GmbH (Deutschland) abgelegt. Mit
        beiden Anbietern besteht jeweils ein Vertrag zur Auftragsverarbeitung
        gemäß Art. 28 DSGVO. Rechtsgrundlage für den Betrieb ist Art. 6 Abs. 1
        lit. b DSGVO (Erfüllung des Nutzungsvertrags) sowie Art. 6 Abs. 1 lit. f
        DSGVO (berechtigtes Interesse an einem sicheren, stabilen Betrieb).
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        3. Registrierungs- und Nutzungsdaten
      </h2>
      <p className="mb-3">
        Für die Nutzung ist ein Konto erforderlich. Dabei verarbeiten wir die von
        dir angegebenen Bestandsdaten (Name, E-Mail-Adresse, Passwort in
        verschlüsselter Form). Beim Aufruf der Anwendung fallen technisch
        notwendige Server-Logs an, in denen unter anderem die IP-Adresse, der
        Zeitpunkt und die abgerufene Ressource verarbeitet werden.
        Rechtsgrundlage für die Vertragsabwicklung ist Art. 6 Abs. 1 lit. b
        DSGVO; für die Server-Logs Art. 6 Abs. 1 lit. f DSGVO. Die
        Authentifizierung und die Sitzungsverwaltung erfolgen über ein technisch
        notwendiges Cookie.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        4. Vom Nutzer eingegebene Verwaltungsdaten
      </h2>
      <p className="mb-3">
        Als Nutzer pflegst du im Rahmen der Immobilienverwaltung Daten ein –
        insbesondere Mieter-, Objekt- und Zahlungsdaten. Diese Daten verarbeiten
        wir ausschließlich in deinem Auftrag und nach deiner Weisung. Für diese
        Verarbeitung bist du der Verantwortliche im Sinne der DSGVO; wir handeln
        als Auftragsverarbeiter. Die Einzelheiten regelt der{" "}
        <Link href="/avv" className="text-secondary hover:underline">
          Auftragsverarbeitungsvertrag (AVV)
        </Link>
        , dem du bei der Registrierung zustimmst.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        5. E-Mail-Versand
      </h2>
      <p className="mb-3">
        Für den Versand transaktionaler E-Mails (z. B. Bestätigungs-, Passwort-,
        Mahn- und Benachrichtigungs-Mails) nutzen wir den Dienst Brevo. Dabei
        werden die Empfänger-E-Mail-Adresse und der E-Mail-Inhalt an Brevo
        übermittelt und innerhalb der EU verarbeitet. Es besteht ein Vertrag zur
        Auftragsverarbeitung gemäß Art. 28 DSGVO. Rechtsgrundlage ist Art. 6 Abs.
        1 lit. b und lit. f DSGVO.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        6. Zahlungsabwicklung
      </h2>
      <p className="mb-3">
        Die Abwicklung kostenpflichtiger Abonnements erfolgt über den
        Zahlungsdienstleister Stripe (Stripe Payments Europe Ltd., Irland). Deine
        Zahlungsdaten (z. B. Kreditkarten- oder Bankverbindungsdaten) gibst du
        direkt bei Stripe ein; sie werden unmittelbar an Stripe übermittelt und
        von uns nicht gespeichert. Wir erhalten von Stripe lediglich Angaben zum
        Status des Abonnements. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
        Dabei kann es zu einer Übermittlung von Daten in ein Drittland (USA)
        kommen; Stripe stützt diese Übermittlung auf die
        Standardvertragsklauseln der EU-Kommission (Art. 46 DSGVO).
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        7. Cookies
      </h2>
      <p className="mb-3">
        Wir setzen ausschließlich technisch notwendige Cookies ein, die für den
        Betrieb und die Anmeldung erforderlich sind (Session-Cookies). Es werden
        keine Tracking-, Analyse- oder Marketing-Cookies verwendet und keine
        Analyse-Tools eingebunden. Für technisch notwendige Cookies ist keine
        Einwilligung erforderlich (§ 25 Abs. 2 TDDDG); Rechtsgrundlage der
        zugehörigen Verarbeitung ist Art. 6 Abs. 1 lit. f DSGVO.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        8. Speicherdauer
      </h2>
      <p className="mb-3">
        Konto- und Verwaltungsdaten speichern wir für die Dauer des
        Nutzungsverhältnisses. Nach Beendigung des Vertrags bleibt das Konto für
        eine Übergangszeit von sechs Monaten im Lesemodus zugänglich, damit du
        deine Daten sichern und exportieren kannst. Nach Ablauf dieser Lesephase
        werden die Daten – vorbehaltlich gesetzlicher Aufbewahrungspflichten (z.
        B. § 147 AO, § 257 HGB) – vollständig und endgültig gelöscht.
        Server-Logs werden nach spätestens sieben Tagen gelöscht.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        9. Deine Rechte
      </h2>
      <p className="mb-3">
        Dir stehen nach der DSGVO folgende Rechte zu: Auskunft (Art. 15),
        Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
        Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch
        gegen die Verarbeitung (Art. 21). Deine Daten kannst du jederzeit selbst
        über{" "}
        <Link href="/einstellungen" className="text-secondary hover:underline">
          die Einstellungen
        </Link>{" "}
        als Datei exportieren. Zur Ausübung deiner weiteren Rechte genügt eine
        Nachricht an{" "}
        <a
          href="mailto:service@tefter.de"
          className="text-secondary hover:underline"
        >
          service@tefter.de
        </a>
        .
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        10. Beschwerderecht
      </h2>
      <p className="mb-3">
        Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
        beschweren (Art. 77 DSGVO). Die für uns zuständige Behörde ist die
        Landesbeauftragte für Datenschutz und Informationsfreiheit
        Nordrhein-Westfalen (LDI NRW), Kavalleriestr. 2–4, 40213 Düsseldorf.
      </p>

      <p className="mt-8 text-neutral-500">Stand: Juli 2026</p>
    </LegalShell>
  );
}
