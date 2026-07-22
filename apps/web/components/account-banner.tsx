"use client";

import { useTransition } from "react";
import { Building2 } from "lucide-react";
import { clearActiveAccount } from "@/app/konto-actions";

/**
 * Deutlich sichtbares Banner, während eine Hausverwaltung im Konto eines
 * Owners arbeitet. „Zurück zu meinem Konto" verlässt den Kontext.
 */
export function AccountBanner({ ownerName }: { ownerName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-secondary-300 bg-secondary-100 px-4 py-2.5 text-sm text-secondary-900">
      <span className="flex items-center gap-2">
        <Building2 className="size-4 shrink-0" />
        <span>
          Du arbeitest im Konto von{" "}
          <strong className="font-semibold">{ownerName}</strong>
        </span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => clearActiveAccount())}
        className="shrink-0 rounded-md bg-secondary-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-secondary-800 disabled:opacity-60"
      >
        {pending ? "Wechsle …" : "Zurück zu meinem Konto"}
      </button>
    </div>
  );
}
