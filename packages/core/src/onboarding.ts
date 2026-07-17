// ============================================================================
// Onboarding-Fortschritt (framework-frei, testbar).
// Der geführte Flow /willkommen leitet den anzuzeigenden Schritt allein aus den
// vorhandenen Daten ab – so springt ein Wiedereinstieg immer zum ersten
// unerledigten Schritt, ohne Zwischenzustand zu speichern.
// ============================================================================

/** Erledigt-Status der vier Onboarding-Schritte. */
export interface OnboardingProgress {
  /** Schritt 1: Absenderdaten (Name + Adresse) hinterlegt. */
  absender: boolean;
  /** Schritt 2: mindestens ein Objekt angelegt. */
  property: boolean;
  /** Schritt 3: mindestens eine Einheit im jüngsten Objekt. */
  unit: boolean;
  /** Schritt 4: Mietverhältnis in der jüngsten Einheit (oder als leer markiert). */
  tenant: boolean;
}

/** 1–4 = erster offener Schritt; 5 = alle Schritte erledigt. */
export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

/**
 * Ermittelt den ersten unerledigten Schritt. Die Schritte bauen aufeinander
 * auf (Objekt vor Einheit vor Mietverhältnis), daher die feste Reihenfolge.
 */
export function firstUnfinishedStep(p: OnboardingProgress): OnboardingStep {
  if (!p.absender) return 1;
  if (!p.property) return 2;
  if (!p.unit) return 3;
  if (!p.tenant) return 4;
  return 5;
}

/**
 * Begrenzt einen (z. B. aus der URL angeforderten) Schritt auf einen gültigen,
 * anzeigbaren Wert: mindestens 1, höchstens der erste unerledigte Schritt
 * (kein Vorgreifen), und nie über 4 (Schritt 5 ist der Erfolgs-Screen).
 */
export function clampOnboardingStep(
  requested: number | null | undefined,
  firstUnfinished: OnboardingStep,
): 1 | 2 | 3 | 4 {
  const maxStep = Math.min(firstUnfinished, 4) as 1 | 2 | 3 | 4;
  if (requested == null || !Number.isFinite(requested) || requested < 1) {
    return maxStep;
  }
  return Math.min(Math.floor(requested), maxStep) as 1 | 2 | 3 | 4;
}
