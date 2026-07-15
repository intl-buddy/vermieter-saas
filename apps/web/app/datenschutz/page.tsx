import { LegalShell } from "@/components/legal-shell";

export const metadata = { title: "Datenschutz · tefter" };

export default function DatenschutzPage() {
  return (
    <LegalShell title="Datenschutzerklärung">
      <p className="mb-6 text-neutral-500">
        Diese Erklärung informiert über die Verarbeitung personenbezogener Daten
        bei der Nutzung von tefter gemäß Datenschutz-Grundverordnung (DSGVO).
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        1. Verantwortlicher
      </h2>
      <p className="mb-3">
        Verantwortlich für die Datenverarbeitung im Sinne des Art. 4 Nr. 7 DSGVO
        ist:
        <br />
        [Name des Betreibers / Firma]
        <br />
        [Anschrift]
        <br />
        E-Mail: [E-Mail-Adresse]
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        2. Hosting
      </h2>
      <p className="mb-3">
        tefter wird auf einem eigenen Server in Deutschland betrieben. Der Server
        steht in einem Rechenzentrum der netcup GmbH (Standort Nürnberg,
        Deutschland). Sämtliche Anwendungs- und Datenbankdaten werden
        ausschließlich innerhalb Deutschlands verarbeitet und gespeichert. Mit
        dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung gemäß Art. 28
        DSGVO. Beim Aufruf der Anwendung werden technisch notwendige Server-Logs
        (u. a. IP-Adresse, Zeitpunkt, abgerufene Ressource) verarbeitet;
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
        einem sicheren, stabilen Betrieb).
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        3. Registrierung und Authentifizierung
      </h2>
      <p className="mb-3">
        Für die Nutzung ist ein Konto erforderlich. Dabei verarbeiten wir die von
        dir angegebenen Daten (Name, E-Mail-Adresse, Passwort in verschlüsselter
        Form) sowie die von dir eingepflegten Verwaltungsdaten (Objekte,
        Einheiten, Mietverhältnisse, Zahlungen, Mahnungen). Rechtsgrundlage ist
        Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Nutzungsvertrags). Die
        Authentifizierung erfolgt über Supabase Auth; die Sitzung wird über ein
        technisch notwendiges Cookie aufrechterhalten.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        4. E-Mail-Versand
      </h2>
      <p className="mb-3">
        Für den Versand transaktionaler E-Mails (z. B. Bestätigungs-, Passwort-
        und Benachrichtigungs-Mails) nutzen wir den Dienst Brevo (Sendinblue SAS,
        Frankreich). Dabei werden die E-Mail-Adresse und der E-Mail-Inhalt an
        Brevo übermittelt und innerhalb der EU verarbeitet. Es besteht ein Vertrag
        zur Auftragsverarbeitung gemäß Art. 28 DSGVO. Rechtsgrundlage ist Art. 6
        Abs. 1 lit. b und lit. f DSGVO.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        5. Cookies
      </h2>
      <p className="mb-3">
        Wir setzen ausschließlich technisch notwendige Cookies ein, die für den
        Betrieb und die Anmeldung erforderlich sind (Session-Cookies). Es werden
        keine Tracking-, Analyse- oder Marketing-Cookies verwendet. Für technisch
        notwendige Cookies ist keine Einwilligung erforderlich (§ 25 Abs. 2 TDDDG);
        Rechtsgrundlage der zugehörigen Verarbeitung ist Art. 6 Abs. 1 lit. f
        DSGVO.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        6. Speicherdauer
      </h2>
      <p className="mb-3">
        Personenbezogene Daten werden gelöscht, sobald sie für die genannten
        Zwecke nicht mehr erforderlich sind. Kontodaten und eingepflegte
        Verwaltungsdaten speichern wir für die Dauer des Nutzungsverhältnisses;
        nach dessen Beendigung werden sie gelöscht, soweit keine gesetzlichen
        Aufbewahrungspflichten (z. B. handels- und steuerrechtlich, § 147 AO, §
        257 HGB) entgegenstehen. Server-Logs werden nach [z. B. 7 Tagen]
        gelöscht.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        7. Deine Rechte
      </h2>
      <p className="mb-3">
        Dir stehen nach der DSGVO folgende Rechte zu: Auskunft (Art. 15),
        Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
        Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch
        gegen die Verarbeitung (Art. 21). Zur Ausübung genügt eine Nachricht an
        [E-Mail-Adresse]. Zudem hast du das Recht, dich bei einer
        Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO).
      </p>

      <p className="mt-8 text-neutral-500">Stand: [Datum]</p>
    </LegalShell>
  );
}
