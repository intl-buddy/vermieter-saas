"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Euro, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/objekte", label: "Objekte", icon: Building2 },
  { href: "/mieteingang", label: "Mieteingang", icon: Euro },
  { href: "/aufgaben", label: "Aufgaben", icon: ClipboardList },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Hauptnavigation"
    >
      <div className="mx-auto flex w-full max-w-[480px]">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors hover:bg-neutral-50"
            >
              {active ? (
                <span className="absolute top-0 h-1 w-8 rounded-b-full bg-primary" />
              ) : null}
              <Icon
                className={cn(
                  "size-5",
                  active ? "text-primary" : "text-neutral-500",
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-medium leading-none",
                  active ? "text-primary" : "text-neutral-500",
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
