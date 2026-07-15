/**
 * Layout für Auth-Seiten (Login/Registrieren): zentriert, Violett-Verlauf,
 * ohne Topbar und Bottom-Bar. Die Seiten platzieren ihre weiße Karte hier hinein.
 */
import { FooterLinks } from "@/components/footer-links";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-800 px-4 py-10">
      <div className="mb-6 text-center">
        <span className="text-3xl font-extrabold tracking-tight text-white">
          tefter
        </span>
        <p className="mt-1 text-sm text-secondary-100">
          Immobilienverwaltung, einfach gemacht.
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
      <FooterLinks tone="onDark" className="mt-8" />
    </div>
  );
}
