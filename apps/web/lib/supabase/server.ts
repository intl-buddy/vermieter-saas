import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@repo/core";

/** Aufgelöster Typ des Supabase-Server-Clients (inkl. Datenbank-Typen). */
export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Supabase-Client für den Server (Server Components, Server Actions, Route Handler).
 * Bindet die Session über die Next.js-Cookies an. Muss pro Request neu erstellt
 * werden, da der Cookie-Store request-gebunden ist.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` wurde aus einer Server Component heraus aufgerufen.
            // Das kann ignoriert werden, wenn die Middleware die Session
            // ohnehin aktualisiert.
          }
        },
      },
    },
  );
}
