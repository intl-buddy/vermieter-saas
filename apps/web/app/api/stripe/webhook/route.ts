import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { Database } from "@repo/core";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
type SubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"];

/** Stripe-Status → interner subscription_status. */
function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

/** Aktualisiert die users-Zeile anhand einer Stripe-Subscription. */
async function syncSubscription(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const item = subscription.items.data[0];
  const priceId = item?.price.id ?? null;
  const plan = priceId ? planFromPriceId(priceId) : null;
  const periodEndUnix = item?.current_period_end ?? null;

  const update: UserUpdate = {
    subscription_id: subscription.id,
    subscription_status: mapStatus(subscription.status),
    price_id: priceId,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    current_period_end: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
  };
  // Paket nur überschreiben, wenn die Price-ID eindeutig zuordenbar ist.
  if (plan) update.plan = plan;

  await admin.from("users").update(update).eq("stripe_customer_id", customerId);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook nicht konfiguriert." },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signatur fehlt." }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (e) {
    return NextResponse.json(
      {
        error: `Signaturprüfung fehlgeschlagen: ${
          e instanceof Error ? e.message : "unbekannt"
        }`,
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(admin, subscription);
        }
        break;
      }

      case "customer.subscription.updated": {
        await syncSubscription(admin, event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await admin
          .from("users")
          .update({
            subscription_status: "canceled",
            cancel_at_period_end: false,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        if (customerId) {
          await admin
            .from("users")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        // Andere Events werden bewusst ignoriert.
        break;
    }
  } catch (e) {
    // Fehler beim Verarbeiten → 500, damit Stripe erneut zustellt.
    return NextResponse.json(
      {
        error: `Verarbeitung fehlgeschlagen: ${
          e instanceof Error ? e.message : "unbekannt"
        }`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
