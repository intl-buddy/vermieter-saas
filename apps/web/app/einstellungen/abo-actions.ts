"use server";

import { createClient } from "@/lib/supabase/server";
import { getStripe, siteUrl } from "@/lib/stripe";

export type PortalResult = { url?: string; error?: string };

/**
 * Erzeugt eine Stripe-Billing-Portal-Session. Dort verwaltet der Nutzer sein
 * Abo vollständig selbst (Plan wechseln, Zahlungsmethode, Kündigung).
 */
export async function createPortalSession(): Promise<PortalResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return {
      error: "Noch kein Abo vorhanden. Bitte wähle zuerst ein Paket.",
    };
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl()}/einstellungen`,
    });
    return { url: session.url };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? `Kundenportal nicht verfügbar: ${e.message}`
          : "Kundenportal nicht verfügbar.",
    };
  }
}
