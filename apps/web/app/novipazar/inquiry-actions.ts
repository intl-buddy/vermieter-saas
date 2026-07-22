"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@repo/core";
import { createClient } from "@/lib/supabase/server";

type InquiryStatus = Database["public"]["Enums"]["management_inquiry_status"];

/**
 * Setzt den Status einer Verwaltungsanfrage (new → contacted → closed). Die
 * Autorisierung erfolgt in der RPC (`is_admin_caller`, SECURITY DEFINER).
 */
export async function setInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_inquiry_status", {
    p_inquiry_id: id,
    p_status: status,
  });
  if (error) return { error: error.message };
  revalidatePath("/novipazar");
  return {};
}
