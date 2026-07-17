"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { PLANS, PLAN_ORDER, ENTERPRISE_MIN_UNITS } from "@repo/core";
import { cn } from "@/lib/utils";
import { REGISTER_URL } from "./config";

const EUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function PricingTeaser() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* Intervall-Umschalter */}
      <div className="mb-8 inline-flex items-center rounded-full border border-neutral-200 bg-white p-1 text-sm">
        <button
          type="button"
          onClick={() => setYearly(false)}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium transition-colors",
            !yearly ? "bg-primary text-primary-foreground" : "text-neutral-600",
          )}
        >
          Monatlich
        </button>
        <button
          type="button"
          onClick={() => setYearly(true)}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium transition-colors",
            yearly ? "bg-primary text-primary-foreground" : "text-neutral-600",
          )}
        >
          Jährlich
        </button>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PLAN_ORDER.map((key) => {
          const plan = PLANS[key];
          const popular = key === "gold";
          const perMonth = yearly ? plan.priceYearlyPerMonth : plan.priceMonthly;
          return (
            <div
              key={key}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
                popular
                  ? "border-gold-400 ring-1 ring-gold-300"
                  : "border-neutral-200",
              )}
            >
              {popular ? (
                <span className="absolute -top-3 left-6 rounded-full bg-gold-500 px-3 py-0.5 text-xs font-semibold text-white">
                  Beliebt
                </span>
              ) : null}
              <h3 className="text-lg font-bold text-secondary">{plan.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Bis zu {plan.unitLimit} Einheiten
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">
                  {EUR.format(perMonth)}
                </span>
                <span className="text-sm text-neutral-500">/ Monat</span>
              </div>
              <p className="mt-1 h-5 text-xs text-neutral-500">
                {yearly
                  ? `${EUR.format(plan.priceYearlyTotal)} jährlich abgerechnet`
                  : "monatlich abgerechnet"}
              </p>
              <a
                href={REGISTER_URL}
                className={cn(
                  "mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                  popular
                    ? "bg-primary text-primary-foreground hover:bg-primary-600"
                    : "border border-neutral-200 text-secondary hover:bg-neutral-50",
                )}
              >
                14 Tage kostenlos testen
              </a>
            </div>
          );
        })}

        {/* Enterprise */}
        <div className="relative flex flex-col rounded-2xl border border-secondary-200 bg-secondary-50/40 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-secondary">Enterprise</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Ab {ENTERPRISE_MIN_UNITS} Einheiten
          </p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              Individuell
            </span>
          </div>
          <p className="mt-1 h-5 text-xs text-neutral-500">
            auf deine Portfoliogröße zugeschnitten
          </p>
          <ul className="mt-4 flex flex-col gap-1.5 text-sm text-neutral-600">
            <li className="flex items-center gap-2">
              <Check className="size-4 text-primary" /> Alle Funktionen
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 text-primary" /> Priorisierter Support
            </li>
          </ul>
          <a
            href={REGISTER_URL}
            className="mt-6 inline-flex items-center justify-center rounded-lg border border-secondary-300 px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary-100"
          >
            Kostenlos testen
          </a>
        </div>
      </div>

      <p className="mt-6 text-sm text-neutral-500">
        Alle Preise inkl. USt. Jederzeit kündbar.
      </p>
    </div>
  );
}
