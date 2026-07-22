"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVE_ACCOUNT_COOKIE,
  listManagedAccounts,
} from "@/lib/account-context";

/**
 * Wechselt in das Konto eines verwalteten Owners. Der übergebene Wert wird
 * serverseitig gegen die tatsächlich aktiven Links geprüft – ein Cookie allein
 * verschafft keinen Zugriff.
 */
export async function setActiveAccount(ownerId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const managed = await listManagedAccounts(supabase);
  if (!managed.some((a) => a.id === ownerId)) {
    // Kein aktiver Link (oder aufgehoben) → nichts tun.
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ACCOUNT_COOKIE, ownerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 Tage
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Zurück ins eigene Konto: Kontext-Cookie entfernen. */
export async function clearActiveAccount(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ACCOUNT_COOKIE);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
