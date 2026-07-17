import { LegalShell } from "@/components/legal-shell";

export const metadata = { title: "Auftragsverarbeitungsvertrag · tefter" };

export default function AvvPage() {
  return (
    <LegalShell title="Auftragsverarbeitungsvertrag (AVV)">
      <p className="mb-6 text-neutral-500">
        Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO zwischen dem Nutzer
        („Verantwortlicher") und Omer Alic, Schützenstr. 131, 45476 Mülheim an
        der Ruhr („Auftragsverarbeiter"). Dieser Vertrag wird mit der Zustimmung
        des Nutzers bei der Registrierung wirksam.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        1. Gegenstand, Dauer, Art und Zweck der Verarbeitung
      </h2>
      <p className="mb-3">
        Gegenstand ist die Verarbeitung personenbezogener Daten durch den
        Auftragsverarbeiter im Rahmen der Bereitstellung der
        Immobilienverwaltungs-Software tefter. Art und Zweck der Verarbeitung
        umfassen das Speichern, Ordnen, Auslesen, Verändern und Löschen der vom
        Verantwortlichen eingegebenen Daten sowie das Erzeugen von Dokumenten und
        Auswertungen. Die Verarbeitung erfolgt ausschließlich zur Erfüllung des
        Nutzungsvertrags. Die Dauer entspricht der Laufzeit des
        Nutzungsverhältnisses.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        2. Kategorien betroffener Personen und Datenarten
      </h2>
      <p className="mb-3">
        Betroffene Personen sind insbesondere Mieter, Eigentümer sowie
        Dienstleister des Verantwortlichen. Verarbeitet werden u. a. Stammdaten
        (Name, Anschrift, Kontaktdaten), Vertrags- und Objektdaten (Einheiten,
        Mietverhältnisse, Flächen), Zahlungs- und Forderungsdaten
        (Mieten, Vorauszahlungen, offene Posten) sowie zugehörige Dokumente.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        3. Weisungsrecht des Verantwortlichen
      </h2>
      <p className="mb-3">
        Der Auftragsverarbeiter verarbeitet die Daten ausschließlich im Rahmen
        des Vertrags und nach den dokumentierten Weisungen des Verantwortlichen.
        Die Nutzung der Anwendung durch den Verantwortlichen gilt als solche
        Weisung. Ist der Auftragsverarbeiter der Ansicht, dass eine Weisung gegen
        geltendes Datenschutzrecht verstößt, informiert er den Verantwortlichen.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        4. Technische und organisatorische Maßnahmen (TOM)
      </h2>
      <p className="mb-3">
        Der Auftragsverarbeiter trifft angemessene technische und organisatorische
        Maßnahmen gemäß Art. 32 DSGVO, insbesondere:
      </p>
      <ul className="mb-3 list-disc space-y-1 pl-5">
        <li>Transportverschlüsselung sämtlicher Verbindungen (TLS/HTTPS);</li>
        <li>
          Zugriffskontrolle über eine Authentifizierung sowie
          zeilenbasierte Zugriffsbeschränkung (Row Level Security), sodass jeder
          Nutzer ausschließlich auf seine eigenen Daten zugreifen kann;
        </li>
        <li>verschlüsselte Sicherungskopien (Backups);</li>
        <li>Serverstandort und Datenverarbeitung in Deutschland.</li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        5. Unterauftragsverarbeiter
      </h2>
      <p className="mb-3">
        Der Verantwortliche stimmt dem Einsatz der folgenden
        Unterauftragsverarbeiter zu:
      </p>
      <ul className="mb-3 list-disc space-y-1 pl-5">
        <li>Netcup GmbH (Deutschland) – Hosting/Serverbetrieb;</li>
        <li>Hetzner Online GmbH (Deutschland) – verschlüsselte Backups;</li>
        <li>Brevo (EU) – Versand transaktionaler E-Mails;</li>
        <li>
          Stripe Payments Europe Ltd. (Irland) – Zahlungsabwicklung.
        </li>
      </ul>
      <p className="mb-3">
        Der Auftragsverarbeiter kann weitere Unterauftragsverarbeiter hinzuziehen
        oder bestehende ersetzen. Solche Änderungen werden dem Verantwortlichen
        rechtzeitig vorab angekündigt. Der Verantwortliche kann einer Änderung aus
        wichtigem, datenschutzbezogenem Grund innerhalb der angekündigten Frist
        widersprechen; im Fall eines berechtigten Widerspruchs steht beiden
        Parteien ein Kündigungsrecht zu.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        6. Unterstützungspflichten
      </h2>
      <p className="mb-3">
        Der Auftragsverarbeiter unterstützt den Verantwortlichen im Rahmen des
        Zumutbaren bei der Erfüllung der Rechte betroffener Personen (Art. 12–23
        DSGVO) sowie bei den Pflichten nach Art. 32 bis 36 DSGVO (Datensicherheit,
        Meldung von Datenschutzverletzungen, Datenschutz-Folgenabschätzung). Er
        meldet ihm bekannt gewordene Verletzungen des Schutzes personenbezogener
        Daten unverzüglich.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        7. Löschung und Rückgabe nach Vertragsende
      </h2>
      <p className="mb-3">
        Nach Beendigung des Vertrags stehen dem Verantwortlichen die Daten für
        sechs Monate im Lesemodus zum Export zur Verfügung. Nach Ablauf dieser
        Frist werden die verarbeiteten Daten gelöscht, soweit keine gesetzliche
        Aufbewahrungspflicht besteht. Backups werden im Rahmen der regulären
        Backup-Zyklen überschrieben.
      </p>

      <p className="mt-8 text-neutral-500">Stand: Juli 2026</p>
    </LegalShell>
  );
}
