import { BottomNav } from "@/components/bottom-nav";
import { UserMenu } from "@/components/user-menu";

/**
 * Grundgerüst für eingeloggte Seiten: schlanke Topbar oben, fixierte
 * Bottom-Bar unten (auf allen Geräten), Inhalt dazwischen mit ausreichend
 * Innenabstand, damit die Leisten nichts verdecken.
 */
export function AppShell({
  title,
  userEmail,
  children,
}: {
  title: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-4xl items-center gap-3 px-4">
          <span className="text-lg font-extrabold tracking-tight text-secondary">
            tefter
          </span>
          {title ? (
            <>
              <span className="h-4 w-px bg-neutral-200" aria-hidden />
              <span className="truncate text-sm font-medium text-neutral-600">
                {title}
              </span>
            </>
          ) : null}
          <div className="ml-auto">
            <UserMenu email={userEmail} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-[76px] pb-[calc(92px+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
