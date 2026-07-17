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
        Omer Alic
        <br />
        Schützenstr. 131
        <br />
        45476 Mülheim an der Ruhr
        <br />
        Deutschland
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        Kontakt
      </h2>
      <p className="mb-3">
        Telefon: 0208 7801 5120
        <br />
        E-Mail:{" "}
        <a
          href="mailto:service@tefter.de"
          className="text-secondary hover:underline"
        >
          service@tefter.de
        </a>
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-foreground">
        Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
      </h2>
      <p className="mb-3">
        Omer Alic
        <br />
        Schützenstr. 131
        <br />
        45476 Mülheim an der Ruhr
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

      <p className="mt-8 text-neutral-500">Stand: Juli 2026</p>
    </LegalShell>
  );
}
