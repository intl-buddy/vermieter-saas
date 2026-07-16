"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PLAN_ORDER,
  PLANS,
  type AccessStatus,
  type BillingInterval,
  type PlanKey,
} from "@repo/core";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createCheckoutSession } from "./actions";

const ENTERPRISE_MAILTO =
  "mailto:kontakt@tefter.de?subject=Enterprise-Anfrage%20(ab%2021%20Einheiten)";

export function PreiseClient({
  isLoggedIn,
  currentPlan,
  access,
}: {
  isLoggedIn: boolean;
  currentPlan: string | null;
  access: AccessStatus | null;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [pendingPlan, setPendingPlan] = useState<PlanKey | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function startCheckout(plan: PlanKey) {
    if (!isLoggedIn) {
      router.push("/registrieren");
      return;
    }
    setPendingPlan(plan);
    startTransition(async () => {
      const res = await createCheckoutSession(plan, interval);
      if (res.error) {
        toast.error(res.error);
        setPendingPlan(null);
        return;
      }
      if (res.url) window.location.href = res.url;
    });
  }

  return (
    <div className="mt-8">
      {/* Intervall-Umschalter */}
      <div className="flex items-center justify-center gap-3">
        <IntervalToggle value={interval} onChange={setInterval} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((key) => {
          const plan = PLANS[key];
          const isCurrent = currentPlan === key && access === "active";
          const yearly = interval === "yearly";
          const perMonth = yearly ? plan.priceYearlyPerMonth : plan.priceMonthly;
          const busy = isPending && pendingPlan === key;

          return (
            <div
              key={key}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
                key === "gold"
                  ? "border-primary-300 ring-1 ring-primary-200"
                  : "border-neutral-200",
              )}
            >
              {key === "gold" ? (
                <span className="mb-2 self-start rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                  Beliebt
                </span>
              ) : null}
              <h3 className="text-lg font-bold text-neutral-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">
                bis zu {plan.unitLimit} Einheiten
              </p>

              <div className="mt-4">
                <span className="text-3xl font-extrabold tracking-tight text-neutral-900">
                  {formatCurrency(perMonth)}
                </span>
                <span className="text-sm text-neutral-500"> / Monat</span>
              </div>
              <p className="mt-1 h-5 text-xs text-neutral-500">
                {yearly
                  ? `${formatCurrency(plan.priceYearlyTotal)} jährlich abgerechnet`
                  : "monatlich kündbar"}
              </p>

              <ul className="mt-5 flex-1 space-y-2 text-sm text-neutral-700">
                <Feature>Bis {plan.unitLimit} Einheiten</Feature>
                <Feature>Mieteingang & Mahnwesen</Feature>
                <Feature>Nebenkostenabrechnung</Feature>
                <Feature>Belege & EÜR-Export</Feature>
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Aktueller Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => startCheckout(key)}
                    disabled={isPending}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Weiter zu Stripe …
                      </>
                    ) : isLoggedIn ? (
                      "Auswählen"
                    ) : (
                      "Jetzt starten"
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise */}
      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-secondary-200 bg-secondary-50 p-6 sm:flex-row">
        <div>
          <h3 className="text-lg font-bold text-secondary-900">Enterprise</h3>
          <p className="mt-1 text-sm text-secondary-800">
            Ab 21 Einheiten – individuelles Angebot.
          </p>
        </div>
        <a href={ENTERPRISE_MAILTO} className="shrink-0">
          <Button variant="outline">Kontakt aufnehmen</Button>
        </a>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-500">
        Alle Preise inkl. gesetzlicher USt. Verwaltung, Zahlungsmethoden und
        Kündigung laufen sicher über das Stripe-Kundenportal.
      </p>
    </div>
  );
}

function IntervalToggle({
  value,
  onChange,
}: {
  value: BillingInterval;
  onChange: (v: BillingInterval) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-1 text-sm">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={cn(
          "rounded-full px-4 py-1.5 font-medium transition-colors",
          value === "monthly"
            ? "bg-secondary text-white"
            : "text-neutral-600 hover:text-neutral-900",
        )}
      >
        Monatlich
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition-colors",
          value === "yearly"
            ? "bg-secondary text-white"
            : "text-neutral-600 hover:text-neutral-900",
        )}
      >
        Jährlich
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-xs font-semibold",
            value === "yearly"
              ? "bg-white/20 text-white"
              : "bg-primary-100 text-primary-700",
          )}
        >
          ~20 % sparen
        </span>
      </button>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-primary-600" />
      <span>{children}</span>
    </li>
  );
}
