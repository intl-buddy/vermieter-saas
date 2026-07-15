import Link from "next/link";

/**
 * Schlichtes Layout für öffentliche Rechtsseiten (Impressum/Datenschutz):
 * nur Topbar mit Logo, ohne Bottom-Bar oder User-Menü.
 */
export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight text-secondary"
          >
            tefter
            <span
              className="ml-0.5 inline-block size-1.5 rounded-full bg-gold-500 align-baseline"
              aria-hidden
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <div className="text-sm leading-relaxed text-neutral-700">
          {children}
        </div>
      </main>
    </div>
  );
}
