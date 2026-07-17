import { describe, it, expect } from "vitest";
import {
  firstUnfinishedStep,
  clampOnboardingStep,
  type OnboardingProgress,
} from "./onboarding";

const ALL_DONE: OnboardingProgress = {
  absender: true,
  property: true,
  unit: true,
  tenant: true,
};

describe("firstUnfinishedStep", () => {
  it("beginnt bei 1, wenn nichts erledigt ist", () => {
    expect(
      firstUnfinishedStep({
        absender: false,
        property: false,
        unit: false,
        tenant: false,
      }),
    ).toBe(1);
  });

  it("springt zum ersten offenen Schritt", () => {
    expect(firstUnfinishedStep({ ...ALL_DONE, property: false })).toBe(2);
    expect(firstUnfinishedStep({ ...ALL_DONE, unit: false })).toBe(3);
    expect(firstUnfinishedStep({ ...ALL_DONE, tenant: false })).toBe(4);
  });

  it("überspringt spätere Lücken zugunsten der ersten", () => {
    // Absender fehlt → 1, auch wenn zufällig schon ein Objekt existiert.
    expect(
      firstUnfinishedStep({
        absender: false,
        property: true,
        unit: false,
        tenant: false,
      }),
    ).toBe(1);
  });

  it("gibt 5 zurück, wenn alles erledigt ist", () => {
    expect(firstUnfinishedStep(ALL_DONE)).toBe(5);
  });
});

describe("clampOnboardingStep", () => {
  it("nutzt bei fehlendem Wunsch den ersten offenen Schritt", () => {
    expect(clampOnboardingStep(undefined, 3)).toBe(3);
    expect(clampOnboardingStep(null, 2)).toBe(2);
  });

  it("verhindert Vorgreifen über den ersten offenen Schritt hinaus", () => {
    expect(clampOnboardingStep(4, 2)).toBe(2);
  });

  it("erlaubt Zurückspringen auf frühere Schritte", () => {
    expect(clampOnboardingStep(1, 3)).toBe(1);
    expect(clampOnboardingStep(2, 4)).toBe(2);
  });

  it("deckelt bei 4, auch wenn alles erledigt ist (5 = Erfolgs-Screen)", () => {
    expect(clampOnboardingStep(5, 5)).toBe(4);
    expect(clampOnboardingStep(undefined, 5)).toBe(4);
  });

  it("fängt ungültige Werte ab", () => {
    expect(clampOnboardingStep(0, 3)).toBe(3);
    expect(clampOnboardingStep(-2, 3)).toBe(3);
    expect(clampOnboardingStep(Number.NaN, 2)).toBe(2);
    expect(clampOnboardingStep(2.9, 4)).toBe(2);
  });
});
