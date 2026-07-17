"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { STEP_INFO } from "./stepInfoTexts";

/**
 * Info-Hinweis je Onboarding-Schritt. Beim ersten Anzeigen eines Schritts
 * automatisch eingeblendet und per X wegklickbar; der ⓘ-Button blendet den
 * Hinweis wieder ein. Der „schon gesehen"-Zustand wird pro Schritt in der
 * sessionStorage gemerkt, damit ein Zurück/Weiter den Hinweis nicht bei jedem
 * Rendern erneut aufpoppen lässt.
 */
export function StepInfo({ step }: { step: number }) {
  const info = STEP_INFO[step];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!info) return;
    const key = `onboarding-info-seen-${step}`;
    const seen =
      typeof window !== "undefined" && sessionStorage.getItem(key) === "1";
    setOpen(!seen);
  }, [step, info]);

  if (!info) return null;

  function dismiss() {
    setOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`onboarding-info-seen-${step}`, "1");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Info zu „${info.title}" anzeigen`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary-700"
      >
        <Info className="size-4" />
        Wozu dieser Schritt?
      </button>
    );
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-neutral-700">
      <Info className="mt-0.5 size-4 shrink-0 text-gold-600" />
      <p className="flex-1">{info.body}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hinweis schließen"
        className="shrink-0 rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-gold-100 hover:text-neutral-600"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
