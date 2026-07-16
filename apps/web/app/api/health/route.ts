import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Healthcheck: 200, wenn die App läuft UND Supabase per Mini-Query erreichbar
 * ist; sonst 503. Wird u. a. vom Docker-HEALTHCHECK aufgerufen.
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    const supabase = await createClient();
    // Leichte Reachability-Query (RLS liefert ggf. 0 Zeilen – wichtig ist,
    // dass PostgREST/DB antwortet, nicht das Ergebnis).
    const { error } = await supabase
      .from("properties")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", supabase: "down", error: error.message, timestamp },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { status: "ok", supabase: "up", timestamp },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        supabase: "down",
        error: e instanceof Error ? e.message : "unbekannter Fehler",
        timestamp,
      },
      { status: 503 },
    );
  }
}
