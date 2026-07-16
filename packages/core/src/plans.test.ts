import { describe, it, expect } from "vitest";
import {
  PLANS,
  getAccessStatus,
  trialDaysRemaining,
  unitLimitFor,
  nextPlanName,
  stripePriceEnvVar,
  canWrite,
  daysUntil,
} from "./plans";

const NOW = new Date("2026-07-16T12:00:00Z");
const inDays = (d: number) =>
  new Date(NOW.getTime() + d * 86_400_000).toISOString();

describe("getAccessStatus", () => {
  it("aktives Abo → active", () => {
    expect(
      getAccessStatus(
        { subscription_status: "active", trial_ends_at: null, current_period_end: inDays(20) },
        NOW,
      ),
    ).toBe("active");
  });

  it("laufender Trial ohne Abo → trial", () => {
    expect(
      getAccessStatus(
        { subscription_status: "trialing", trial_ends_at: inDays(5), current_period_end: null },
        NOW,
      ),
    ).toBe("trial");
  });

  it("abgelaufener Trial ohne Abo → locked", () => {
    expect(
      getAccessStatus(
        { subscription_status: "trialing", trial_ends_at: inDays(-1), current_period_end: null },
        NOW,
      ),
    ).toBe("locked");
  });

  it("gekündigtes Abo → locked", () => {
    expect(
      getAccessStatus(
        { subscription_status: "canceled", trial_ends_at: inDays(10), current_period_end: inDays(-1) },
        NOW,
      ),
    ).toBe("locked");
  });

  it("past_due innerhalb der 7-Tage-Kulanz → active", () => {
    expect(
      getAccessStatus(
        { subscription_status: "past_due", trial_ends_at: null, current_period_end: inDays(-3) },
        NOW,
      ),
    ).toBe("active");
  });

  it("past_due nach mehr als 7 Tagen ohne Lesefrist → locked", () => {
    expect(
      getAccessStatus(
        { subscription_status: "past_due", trial_ends_at: null, current_period_end: inDays(-8) },
        NOW,
      ),
    ).toBe("locked");
  });

  it("gekündigt mit laufender Lesefrist → readonly", () => {
    expect(
      getAccessStatus(
        {
          subscription_status: "canceled",
          trial_ends_at: null,
          current_period_end: inDays(-10),
          access_until: inDays(150),
        },
        NOW,
      ),
    ).toBe("readonly");
  });

  it("abgelaufener Trial mit laufender Lesefrist → readonly", () => {
    expect(
      getAccessStatus(
        {
          subscription_status: "trialing",
          trial_ends_at: inDays(-1),
          current_period_end: null,
          access_until: inDays(180),
        },
        NOW,
      ),
    ).toBe("readonly");
  });

  it("abgelaufene Lesefrist → locked", () => {
    expect(
      getAccessStatus(
        {
          subscription_status: "canceled",
          trial_ends_at: null,
          current_period_end: null,
          access_until: inDays(-1),
        },
        NOW,
      ),
    ).toBe("locked");
  });

  it("aktives Abo schlägt Lesefrist (bleibt active)", () => {
    expect(
      getAccessStatus(
        {
          subscription_status: "active",
          trial_ends_at: null,
          current_period_end: inDays(20),
          access_until: inDays(-1),
        },
        NOW,
      ),
    ).toBe("active");
  });
});

describe("canWrite", () => {
  it("nur active und trial dürfen schreiben", () => {
    expect(canWrite("active")).toBe(true);
    expect(canWrite("trial")).toBe(true);
    expect(canWrite("readonly")).toBe(false);
    expect(canWrite("locked")).toBe(false);
  });
});

describe("daysUntil", () => {
  it("rundet auf, nie negativ", () => {
    expect(daysUntil(inDays(3), NOW)).toBe(3);
    expect(daysUntil(inDays(-5), NOW)).toBe(0);
    expect(daysUntil(null, NOW)).toBe(0);
  });
});

describe("trialDaysRemaining", () => {
  it("rundet auf und ist nie negativ", () => {
    expect(trialDaysRemaining(inDays(5), NOW)).toBe(5);
    expect(trialDaysRemaining(inDays(-2), NOW)).toBe(0);
    expect(trialDaysRemaining(null, NOW)).toBe(0);
  });
});

describe("unitLimitFor", () => {
  it("Trial nutzt das Platin-Limit (20)", () => {
    expect(unitLimitFor("trial", "trial")).toBe(20);
    expect(unitLimitFor("bronze", "trial")).toBe(20);
  });

  it("aktive Tarife nutzen ihr eigenes Limit", () => {
    expect(unitLimitFor("bronze", "active")).toBe(3);
    expect(unitLimitFor("silber", "active")).toBe(5);
    expect(unitLimitFor("gold", "active")).toBe(10);
    expect(unitLimitFor("platin", "active")).toBe(20);
  });

  it("Enterprise ist unbegrenzt", () => {
    expect(unitLimitFor("enterprise", "active")).toBeNull();
  });
});

describe("nextPlanName", () => {
  it("liefert den nächstgrößeren Tarif", () => {
    expect(nextPlanName(3)).toBe("Silber");
    expect(nextPlanName(5)).toBe("Gold");
    expect(nextPlanName(10)).toBe("Platin");
  });

  it("nach Platin (oder unbegrenzt) folgt Enterprise", () => {
    expect(nextPlanName(20)).toBe("Enterprise");
    expect(nextPlanName(null)).toBe("Enterprise");
  });
});

describe("stripePriceEnvVar", () => {
  it("wählt die passende Env-Var je Intervall", () => {
    expect(stripePriceEnvVar("gold", "monthly")).toBe(PLANS.gold.envMonthly);
    expect(stripePriceEnvVar("gold", "yearly")).toBe(PLANS.gold.envYearly);
  });
});
