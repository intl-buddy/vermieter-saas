"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AccessStatus } from "@repo/core";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createPortalSession } from "./abo-actions";

const PLAN_LABELS: Record<string, string> = {
  trial: "Testzeitraum",
  bronze: "Bronze",
  silber: "Silber",
  gold: "Gold",
  platin: "Platin",
  enterprise: "Enterprise",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  trialing: "Testzeitraum",
  past_due: "Zahlung überfällig",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
};

export function AboSection({
  plan,
  access,
  subscriptionStatus,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  trialEndsAt,
  unitCount,
  unitLimit,
  hasSubscription,
}: {
  plan: string;
  access: AccessStatus;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  unitCount: number;
  unitLimit: number | null;
  hasSubscription: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function openPortal() {
    startTransition(async () => {
      const res = await createPortalSession();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.url) window.location.href = res.url;
    });
  }

  const planLabel = PLAN_LABELS[plan] ?? plan;
  const statusLabel = STATUS_LABELS[subscriptionStatus] ?? subscriptionStatus;
  const limitLabel = unitLimit === null ? "unbegrenzt" : String(unitLimit);
  const atLimit = unitLimit !== null && unitCount >= unitLimit;

  const statusTone =
    access === "active"
      ? "bg-primary-100 text-primary-700"
      : access === "trial"
        ? "bg-gold-100 text-gold-800"
        : "bg-danger-100 text-danger-700";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-neutral-900">
              {planLabel}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                statusTone,
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {access === "trial" && trialEndsAt
              ? `Testzeitraum bis ${formatDate(trialEndsAt)}.`
              : cancelAtPeriodEnd && currentPeriodEnd
                ? `Läuft zum ${formatDate(currentPeriodEnd)} aus (gekündigt).`
                : currentPeriodEnd
                  ? `Nächste Abbuchung am ${formatDate(currentPeriodEnd)}.`
                  : "Kein aktives Abo."}
          </p>
        </div>

        {hasSubscription ? (
          <Button variant="outline" onClick={openPortal} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Öffne Portal …
              </>
            ) : (
              <>
                <CreditCard className="size-4" />
                Abo verwalten
              </>
            )}
          </Button>
        ) : (
          <Link href="/preise">
            <Button>Paket wählen</Button>
          </Link>
        )}
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Einheiten-Nutzung</span>
          <span
            className={cn(
              "font-semibold",
              atLimit ? "text-danger-600" : "text-neutral-900",
            )}
          >
            {unitCount} von {limitLabel}
          </span>
        </div>
        {atLimit ? (
          <p className="mt-2 text-xs text-danger-600">
            Dein Paket ist voll ausgelastet.{" "}
            <Link href="/preise" className="font-medium underline">
              Jetzt upgraden
            </Link>
            , um weitere Einheiten anzulegen.
          </p>
        ) : null}
      </div>
    </div>
  );
}
