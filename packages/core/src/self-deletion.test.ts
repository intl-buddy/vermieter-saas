import { describe, it, expect } from "vitest";
import {
  SELF_DELETION_GRACE_DAYS,
  isDeletionPending,
  isPastGrace,
  isDueForDeletion,
  scheduledDeletionDate,
  planStripeCleanup,
} from "./self-deletion";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-29T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY_MS).toISOString();
const inDays = (n: number) => new Date(NOW.getTime() + n * DAY_MS).toISOString();

describe("Selbstlöschung – Karenz", () => {
  it("nutzt 7 Tage Karenz", () => {
    expect(SELF_DELETION_GRACE_DAYS).toBe(7);
  });
});

describe("isDeletionPending (Login-Abbruch)", () => {
  it("ist wahr, sobald ein Zeitpunkt vorgemerkt ist", () => {
    expect(isDeletionPending(daysAgo(1))).toBe(true);
  });
  it("ist falsch ohne vorgemerkte Löschung", () => {
    expect(isDeletionPending(null)).toBe(false);
    expect(isDeletionPending(undefined)).toBe(false);
  });
});

describe("isDueForDeletion (Lauf löscht erst nach 7 Tagen)", () => {
  it("löscht NICHT vor Ablauf der 7 Tage", () => {
    expect(
      isDueForDeletion(
        { access_until: null, deletion_requested_at: daysAgo(6) },
        NOW,
      ),
    ).toBe(false);
  });

  it("löscht erst NACH Ablauf der 7 Tage", () => {
    expect(
      isDueForDeletion(
        { access_until: null, deletion_requested_at: daysAgo(8) },
        NOW,
      ),
    ).toBe(true);
  });

  it("löscht exakt am Rand (knapp über 7 Tage) und nicht genau bei 7 Tagen", () => {
    // Genau 7 Tage alt → Cutoff ist now-7d; strikt „<" ⇒ noch nicht fällig.
    expect(
      isDueForDeletion(
        { access_until: null, deletion_requested_at: daysAgo(7) },
        NOW,
      ),
    ).toBe(false);
    expect(
      isPastGrace(new Date(NOW.getTime() - 7 * DAY_MS - 1000).toISOString(), NOW),
    ).toBe(true);
  });

  it("ohne Auslöser (beide null) niemals fällig", () => {
    expect(
      isDueForDeletion({ access_until: null, deletion_requested_at: null }, NOW),
    ).toBe(false);
  });

  it("greift auch über die Lesefrist (access_until)", () => {
    expect(
      isDueForDeletion(
        { access_until: daysAgo(8), deletion_requested_at: null },
        NOW,
      ),
    ).toBe(true);
    // Lesefrist noch in der Zukunft → nicht fällig.
    expect(
      isDueForDeletion(
        { access_until: inDays(30), deletion_requested_at: null },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("planStripeCleanup (aktives Abo wird gekündigt)", () => {
  it("löscht den Stripe-Customer, wenn vorhanden (kündigt das Abo)", () => {
    expect(planStripeCleanup({ stripe_customer_id: "cus_123" })).toEqual({
      deleteCustomer: true,
    });
  });
  it("ohne Stripe-Customer nichts zu tun", () => {
    expect(planStripeCleanup({ stripe_customer_id: null })).toEqual({
      deleteCustomer: false,
    });
  });
});

describe("scheduledDeletionDate", () => {
  it("ist Auslöser + 7 Tage", () => {
    const trigger = "2026-07-29T00:00:00.000Z";
    expect(scheduledDeletionDate(trigger).toISOString()).toBe(
      "2026-08-05T00:00:00.000Z",
    );
  });
});
