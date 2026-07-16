import { NextResponse } from "next/server";
import { runLifecycle } from "@/lib/lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Kann länger laufen (Mails + Storage-/Stripe-Löschungen).
export const maxDuration = 300;

/**
 * Täglicher Abo-Lebenszyklus (via Coolify-Scheduled-Task, siehe CLAUDE.md):
 *   1. Trial-Ablauf / Abo-Ende → Lesemodus (access_until = now()+6 Monate)
 *   2. Erinnerungsmails an Lesemodus-Nutzer (höchstens alle 30 Tage)
 *   3. Endgültige Löschung nach Lesefrist + 7 Tagen Karenz
 *
 * Absicherung: Header `x-cron-secret` muss `CRON_SECRET` entsprechen.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET ist nicht konfiguriert." },
      { status: 500 },
    );
  }
  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  try {
    const result = await runLifecycle(new Date());
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      {
        error: `Lebenszyklus fehlgeschlagen: ${
          e instanceof Error ? e.message : "unbekannt"
        }`,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return handle(request);
}

// GET erlaubt einfachere Scheduler (z. B. curl ohne -X POST).
export async function GET(request: Request) {
  return handle(request);
}
