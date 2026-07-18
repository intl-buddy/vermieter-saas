import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Euro,
  Mail,
  Calculator,
  FileText,
  Check,
  Shield,
  Building2,
  Receipt,
  ClipboardList,
  Smartphone,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { PricingTeaser } from "./PricingTeaser";
import { REGISTER_URL, LOGIN_URL } from "./config";

const TITLE =
  "tefter – Immobilienverwaltung für private Vermieter | Mieteingang, Mahnung, Nebenkostenabrechnung";
const DESCRIPTION =
  "tefter ist die App vom Hausverwalter für private Vermieter: Mieteingang im Blick, Mahnungen als fertiges PDF und eine geführte Nebenkostenabrechnung – DSGVO-konform, gehostet in Deutschland. 14 Tage kostenlos testen.";

export const metadata: Metadata = {
  metadataBase: new URL("https://tefter.de"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://tefter.de/",
    siteName: "tefter",
    locale: "de_DE",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "tefter" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

const PROBLEMS = [
  {
    problem: "Excel-Chaos und Zettelwirtschaft",
    solution: "Alle Objekte, Mieter und Zahlungen an einem Ort.",
  },
  {
    problem: "Mahnungen kosten Überwindung",
    solution:
      "Rückstand erkannt, Mahnung mit einem Klick als fertiges PDF.",
  },
  {
    problem: "Angst vor der Nebenkostenabrechnung",
    solution:
      "Der geführte Assistent rechnet nachvollziehbar – Schritt für Schritt wie beim Profi.",
  },
];

const FEATURES = [
  {
    icon: Euro,
    title: "Mieteingangskontrolle",
    text: "Soll und Ist automatisch abgeglichen – offene Posten siehst du sofort.",
  },
  {
    icon: Mail,
    title: "1-Klick-Mahnung",
    text: "Drei Stufen, rechtssicher formuliert und direkt per E-Mail versendbar.",
  },
  {
    icon: Calculator,
    title: "Nebenkostenabrechnung",
    text: "Geführter Assistent, tagesgenau, mit ausgewiesenem Rechenweg und § 35a.",
  },
  {
    icon: FileText,
    title: "Dokumente & Übergabe",
    text: "Mietvertrag, Abmahnung, Wohnungsgeberbescheinigung und Übergabeprotokoll mit Unterschrift am Handy.",
  },
];

const FEATURE_CATEGORIES = [
  {
    icon: Building2,
    title: "Stammdaten & Verwaltung",
    items: [
      "Objekte, Einheiten & Mietverhältnisse zentral verwalten",
      "Personenzahl-Historie je Mietverhältnis",
      "Staffel-, Index- und Standardmiete",
      "Mieterwechsel mit Beendigung & Neuvermietung",
      "Geführte Ersteinrichtung in 10 Minuten",
    ],
  },
  {
    icon: Euro,
    title: "Mieteingang & Mahnwesen",
    items: [
      "Automatische monatliche Soll-Stellungen",
      "Offene Posten auf einen Blick",
      "Zahlungen erfassen inkl. Rückbuchungen",
      "Mahnung in 3 Stufen mit einem Klick als PDF",
      "Mahnversand direkt per E-Mail",
      "Automatische Eskalationslogik",
    ],
  },
  {
    icon: Calculator,
    title: "Nebenkostenabrechnung",
    items: [
      "Geführter Assistent in 7 Schritten",
      "Tagesgenaue Abrechnung bei Mieterwechsel",
      "Alle Umlageschlüssel (Fläche, Personen, Einheiten, direkt)",
      "Personentage statt Stichtag",
      "Heizkosten aus der Messdienst-Abrechnung",
      "Nachvollziehbarer Rechenweg auf jedem PDF",
      "§ 35a-Ausweis für die Steuererklärung der Mieter",
      "Interaktive Kostenarten-Checkliste mit Erklärungen",
    ],
  },
  {
    icon: Receipt,
    title: "Belege & Steuern",
    items: [
      "Belegablage mit Foto/PDF-Upload",
      "Zuordnung zu Objekt und Kostenart",
      "Umlagefähig/nicht umlagefähig getrennt",
      "EÜR-Export als CSV (Zufluss-/Abflussprinzip)",
      "Kostenauswertung nach Kategorien",
    ],
  },
  {
    icon: FileText,
    title: "Dokumente & Vorlagen",
    items: [
      "Mietvertrag mit allen Anlagen (BetrKV, SEPA, Hausordnung, Lüftungshinweise)",
      "Abmahnungen in 4 Varianten",
      "Wohnungsgeberbescheinigung (§ 19 BMG)",
      "Übergabeprotokoll mit Fingerunterschrift am Handy",
      "Automatischer Versand an den Mieter per E-Mail",
    ],
  },
  {
    icon: ClipboardList,
    title: "Aufgaben & Überblick",
    items: [
      "Wiederkehrende Aufgaben (Zählerstände, Wartungen)",
      "Automatische Erinnerung bei Fälligkeit",
      "Dashboard mit Soll/Ist-Mieteinnahmen",
      "Vermietungsquote & Kostenstruktur",
      "Offene Posten je Mieter",
    ],
  },
  {
    icon: Shield,
    title: "Sicherheit & Daten",
    items: [
      "Hosting in Deutschland 🇩🇪",
      "DSGVO-konform inkl. AVV",
      "Tägliche verschlüsselte Backups",
      "Kompletter Datenexport jederzeit (ZIP)",
      "Kein Tracking, keine Werbung",
    ],
  },
  {
    icon: Smartphone,
    title: "Mobil & Zugang",
    items: [
      "Für Handy & Desktop optimiert",
      "Als App auf den Homescreen installierbar",
      "Übergabeprotokoll direkt vor Ort ausfüllen",
      "14 Tage kostenlos testen, ohne Kreditkarte",
    ],
  },
];

const FAQS = [
  {
    q: "Brauche ich Vorkenntnisse?",
    a: "Nein. tefter führt dich Schritt für Schritt durch jede Aufgabe – von der ersten Einheit bis zur fertigen Nebenkostenabrechnung. Wenn du deine Wohnungen kennst, kommst du mit tefter zurecht.",
  },
  {
    q: "Wo liegen meine Daten?",
    a: "Ausschließlich in Deutschland, auf einem eigenen Server in einem Rechenzentrum in Nürnberg. tefter ist DSGVO-konform; ein Auftragsverarbeitungsvertrag (AVV) ist inklusive und wird bei der Registrierung geschlossen.",
  },
  {
    q: "Gibt es versteckte Kosten oder Zusatzmodule?",
    a: "Nein. Jedes Paket enthält alle Funktionen von tefter – Mahnwesen, Nebenkostenabrechnung, Dokumente, Übergabeprotokolle, alles. Du zahlst ausschließlich nach der Zahl deiner Einheiten. Es gibt keine Einrichtungsgebühr, keine Aufpreise für Funktionen und keine automatischen Preiserhöhungen.",
  },
  {
    q: "Kann ich jederzeit kündigen?",
    a: "Ja. Du kannst dein Abo jederzeit zum Ende der Laufzeit über das Kundenportal kündigen – monatlich oder jährlich, ganz wie du möchtest.",
  },
  {
    q: "Was passiert nach dem Test?",
    a: "Der 14-tägige Test endet automatisch, ohne dass Kosten entstehen. Erst wenn du aktiv ein Paket wählst, wird tefter kostenpflichtig. Eine Kreditkarte brauchst du für den Test nicht.",
  },
  {
    q: "Funktioniert tefter am Handy?",
    a: "Ja – tefter ist mobil-first gebaut. Das Übergabeprotokoll erstellst du direkt in der Wohnung am Handy, inklusive Fotos und Unterschrift mit dem Finger.",
  },
  {
    q: "Bekomme ich meine Daten wieder raus?",
    a: "Jederzeit. Du kannst deine Daten mit einem Klick als ZIP-Archiv exportieren – auch nach Vertragsende während der sechsmonatigen Lesephase.",
  },
];

export default function MarketingPage() {
  return (
    <div className="min-h-dvh bg-white text-neutral-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-xl font-extrabold tracking-tight text-secondary">
            tefter
            <span
              className="ml-0.5 inline-block size-1.5 rounded-full bg-gold-500 align-baseline"
              aria-hidden
            />
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href={LOGIN_URL}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            >
              Login
            </a>
            <a
              href={REGISTER_URL}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-600"
            >
              Kostenlos testen
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-neutral-100 bg-gradient-to-b from-neutral-50 to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
            <Reveal>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-secondary sm:text-5xl">
                Verwalte deine Immobilien selbst.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-neutral-600">
                tefter – die App vom Hausverwalter. Mieteingang, Mahnungen und
                Nebenkostenabrechnung, Schritt für Schritt geführt.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={REGISTER_URL}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-md"
                >
                  14 Tage kostenlos testen
                </a>
                <a
                  href="#preise"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold text-secondary hover:bg-neutral-50"
                >
                  Preise ansehen
                </a>
              </div>
              <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
                <span>Ohne Kreditkarte</span>
                <span aria-hidden>·</span>
                <span>DSGVO-konform</span>
                <span aria-hidden>·</span>
                <span>Gehostet in Deutschland 🇩🇪</span>
              </p>
            </Reveal>

            {/* App-Screenshot im dezenten Browser-Mockup */}
            <Reveal delay={120}>
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                <div className="flex items-center gap-1.5 px-2 py-2">
                  <span className="size-2.5 rounded-full bg-danger-200" />
                  <span className="size-2.5 rounded-full bg-gold-300" />
                  <span className="size-2.5 rounded-full bg-primary-200" />
                </div>
                <div className="overflow-hidden rounded-xl border border-neutral-100">
                  <Image
                    src="/marketing/dashboard-hero.webp"
                    alt="tefter Dashboard – Kennzahlen, Schnellaktionen und Mieteinnahmen auf einen Blick"
                    width={1600}
                    height={862}
                    priority
                    sizes="(min-width: 1024px) 40rem, 100vw"
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Problem / Lösung */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
              Kommt dir das bekannt vor?
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.problem} delay={i * 80}>
                <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold text-danger-600">
                    {p.problem}
                  </p>
                  <div className="mt-3 flex items-start gap-2">
                    <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                    <p className="font-medium text-neutral-800">{p.solution}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-neutral-100 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Reveal>
              <h2 className="text-center text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
                Alles, was private Vermieter wirklich brauchen
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} delay={i * 80}>
                    <div className="flex h-full gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                        <Icon className="size-6" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-secondary">
                          {f.title}
                        </h3>
                        <p className="mt-1 text-neutral-600">{f.text}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Alle Funktionen in der Übersicht */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
              Alle Funktionen in der Übersicht
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Reveal key={cat.title} delay={(i % 3) * 80}>
                  <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                        <Icon className="size-6" />
                      </span>
                      <h3 className="text-lg font-semibold text-secondary">
                        {cat.title}
                      </h3>
                    </div>
                    <ul className="mt-5 flex flex-col gap-2.5">
                      {cat.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span className="text-sm text-neutral-600">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal>
            <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-primary-200 bg-primary-50 px-6 py-8 text-center sm:px-10">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <Check className="size-7" />
              </span>
              <p className="mt-4 text-xl font-bold text-secondary sm:text-2xl">
                Alle Funktionen. In jedem Paket. Ohne Aufpreis.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
                Vom ersten Tag an nutzt du den vollen Funktionsumfang – der
                Unterschied zwischen den Paketen liegt allein in der Zahl deiner
                Einheiten. Keine versteckten Kosten, keine Zusatzmodule, keine
                Überraschungen.
              </p>
              <a
                href={REGISTER_URL}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-md"
              >
                Kostenlos testen
              </a>
            </div>
          </Reveal>
        </section>

        {/* Story */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <figure className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-2xl font-bold text-secondary">
                OA
              </div>
              <div>
                <blockquote className="text-xl font-medium leading-relaxed text-neutral-800">
                  „Ich verwalte hauptberuflich bundesweit Wohnungen. tefter ist
                  die App, die ich mir für private Vermieter immer gewünscht habe
                  – gebaut aus der täglichen Praxis, nicht am Reißbrett."
                </blockquote>
                <figcaption className="mt-4 text-sm text-neutral-500">
                  <span className="font-semibold text-secondary">Omer Alic</span>{" "}
                  · Hausverwalter &amp; Gründer
                </figcaption>
              </div>
            </figure>
          </Reveal>
        </section>

        {/* Preise */}
        <section id="preise" className="scroll-mt-20 border-y border-neutral-100 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Reveal>
              <h2 className="text-center text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
                Ein Paket für jede Portfoliogröße
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600">
                Alle Funktionen in jedem Paket. Der Unterschied liegt allein in
                der Zahl der verwalteten Einheiten.
              </p>
            </Reveal>
            <div className="mt-10">
              <PricingTeaser />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
              Häufige Fragen
            </h2>
          </Reveal>
          <div className="mt-10 flex flex-col gap-3">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-neutral-200 bg-white px-5 py-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-secondary marker:hidden">
                  {item.q}
                  <span
                    className="text-neutral-400 transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Abschluss-CTA */}
        <section className="bg-secondary">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Bereit, deine Verwaltung selbst zu übernehmen?
              </h2>
              <a
                href={REGISTER_URL}
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary-600"
              >
                14 Tage kostenlos testen
              </a>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-secondary-100">
                <Shield className="size-4" />
                Ohne Kreditkarte · jederzeit kündbar
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:px-6">
          <span className="font-extrabold tracking-tight text-secondary">
            tefter
          </span>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/impressum" className="hover:text-neutral-700">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-neutral-700">
              Datenschutz
            </Link>
            <Link href="/agb" className="hover:text-neutral-700">
              AGB
            </Link>
            <Link href="/avv" className="hover:text-neutral-700">
              AVV
            </Link>
            <a
              href="mailto:service@tefter.de"
              className="hover:text-neutral-700"
            >
              Kontakt
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
