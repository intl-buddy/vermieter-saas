import { LegalShell } from "@/components/legal-shell";

export const metadata = { title: "Impressum · tefter" };

export default function ImpressumPage() {
  return (
    <LegalShell title="Impressum">
      <p className="mb-6 text-neutral-500">
        Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz).
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        Diensteanbieter
      </h2>
      <p className="mb-3">
        [Name des Betreibers / Firma]
        <br />
        [Straße und Hausnummer]
        <br />
        [PLZ und Ort]
        <br />
        [Land]
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        Vertreten durch
      </h2>
      <p className="mb-3">[Vertretungsberechtigte Person, falls zutreffend]</p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        Kontakt
      </h2>
      <p className="mb-3">
        Telefon: [Telefonnummer]
        <br />
        E-Mail: [E-Mail-Adresse]
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        Umsatzsteuer-Identifikationsnummer
      </h2>
      <p className="mb-3">
        Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
        <br />
        [USt-IdNr., z. B. DE123456789]
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        Registereintrag
      </h2>
      <p className="mb-3">
        [Registergericht und Registernummer, falls zutreffend – sonst entfernen]
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
      </h2>
      <p className="mb-3">
        [Name]
        <br />
        [Anschrift, falls abweichend]
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        Streitschlichtung
      </h2>
      <p className="mb-3">
        Die Europäische Kommission stellt eine Plattform zur
        Online-Streitbeilegung (OS) bereit:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          className="text-secondary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
        . Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </LegalShell>
  );
}
