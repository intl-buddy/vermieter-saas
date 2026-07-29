"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Zeigt nach einem Login, der eine vorgemerkte Konto-Löschung abgebrochen hat,
 * einmalig einen „Willkommen zurück"-Toast und entfernt den Query-Parameter
 * (damit er bei Reload nicht erneut feuert).
 */
export function DeletionCancelledToast({ active }: { active: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    if (!active || shown.current) return;
    shown.current = true;
    toast.success("Willkommen zurück – die Konto-Löschung wurde abgebrochen.");
    router.replace(pathname);
  }, [active, router, pathname]);

  return null;
}
