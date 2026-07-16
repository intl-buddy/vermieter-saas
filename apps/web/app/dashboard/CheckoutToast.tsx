"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Zeigt nach erfolgreichem Stripe-Checkout einmalig einen Erfolgs-Toast und
 * entfernt den Query-Parameter aus der URL (damit er bei Reload nicht erneut
 * feuert).
 */
export function CheckoutToast({ success }: { success: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (!success || shown.current) return;
    shown.current = true;
    toast.success("Willkommen an Bord! Dein Abo ist aktiv.");
    router.replace(pathname);
  }, [success, router, pathname]);

  return null;
}
