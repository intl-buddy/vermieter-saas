import Stripe from "stripe";
import {
  PLANS,
  PLAN_ORDER,
  stripePriceEnvVar,
  type BillingInterval,
  type PlanKey,
} from "@repo/core";

let cached: Stripe | null = null;

/** Lazy-initialisierter Stripe-Client (Server-only). */
export function getStripe(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt.");
    }
    cached = new Stripe(key);
  }
  return cached;
}

/** Stripe-Price-ID für Paket + Intervall (aus den Env-Vars). */
export function priceIdFor(
  plan: PlanKey,
  interval: BillingInterval,
): string | null {
  return process.env[stripePriceEnvVar(plan, interval)] ?? null;
}

/** Leitet aus einer Stripe-Price-ID das tefter-Paket ab (für den Webhook). */
export function planFromPriceId(priceId: string): PlanKey | null {
  for (const key of PLAN_ORDER) {
    if (process.env[PLANS[key].envMonthly] === priceId) return key;
    if (process.env[PLANS[key].envYearly] === priceId) return key;
  }
  return null;
}

/** Öffentliche Basis-URL (für success/cancel/return URLs). */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
