import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/core";

/**
 * Supabase-Client mit Service-Role-Rechten (umgeht RLS). NUR serverseitig
 * verwenden – z. B. im Stripe-Webhook, der ohne User-Session Nutzerzeilen
 * aktualisieren muss. Der Service-Role-Key darf niemals ins Frontend gelangen.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase Service-Role-Konfiguration fehlt (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
