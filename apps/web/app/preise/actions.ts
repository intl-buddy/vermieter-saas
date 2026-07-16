"use server";

import { isPlanKey, type BillingInterval } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { getStripe, priceIdFor, siteUrl } from "@/lib/stripe";

export type CheckoutResult = { url?: string; error?: string };

/**
 * Erzeugt eine Stripe-Checkout-Session (mode: subscription) für das gewählte
 * Paket/Intervall und gibt die Weiterleitungs-URL zurück. Legt bei Bedarf einen
 * Stripe-Customer an und speichert dessen ID am Nutzer.
 */
export async function createCheckoutSession(
  planKey: string,
  interval: BillingInterval,
): Promise<CheckoutResult> {
  if (!isPlanKey(planKey)) {
    return { error: "Unbekanntes Paket." };
  }
  const billingInterval: BillingInterval =
    interval === "yearly" ? "yearly" : "monthly";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Bitte melde dich an, um ein Abo abzuschließen." };
  }

  const priceId = priceIdFor(planKey, billingInterval);
  if (!priceId) {
    return {
      error:
        "Für dieses Paket ist derzeit kein Preis hinterlegt. Bitte kontaktiere den Support.",
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .maybeSingle();

  const stripe = getStripe();

  // Stripe-Customer sicherstellen und am Nutzer speichern.
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const base = siteUrl();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_tax: { enabled: true },
      customer_update: { address: "auto" },
      allow_promotion_codes: true,
      success_url: `${base}/dashboard?checkout=success`,
      cancel_url: `${base}/preise?checkout=cancel`,
      subscription_data: { metadata: { user_id: user.id } },
      metadata: { user_id: user.id, plan: planKey },
    });

    if (!session.url) {
      return { error: "Checkout konnte nicht gestartet werden." };
    }
    return { url: session.url };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? `Checkout fehlgeschlagen: ${e.message}`
          : "Checkout fehlgeschlagen.",
    };
  }
}
