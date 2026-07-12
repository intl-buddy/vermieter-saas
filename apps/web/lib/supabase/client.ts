import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@repo/core";

/**
 * Supabase-Client für den Browser (Client Components).
 * Liest die öffentlichen Env-Vars, die im Browser verfügbar sind.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
