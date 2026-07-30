import { describe, it, expect } from "vitest";
import {
  REMINDER_INTERVAL_DAYS,
  shouldPromoteToReadonly,
  isReminderDue,
} from "./lifecycle-policy";
import type { AccessInput } from "./plans";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-30T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY_MS).toISOString();
const inDays = (n: number) => new Date(NOW.getTime() + n * DAY_MS).toISOString();

describe("shouldPromoteToReadonly (Trial→Lesemodus)", () => {
  it("abgelaufener App-Trial ohne Abo → Kandidat", () => {
    const u: AccessInput = {
      subscription_status: "trialing",
      trial_ends_at: daysAgo(1),
      current_period_end: null,
      subscription_id: null,
      cancel_at_period_end: false,
    };
    expect(shouldPromoteToReadonly(u, NOW)).toBe(true);
  });

  it("aktives Abo → kein Kandidat", () => {
    const u: AccessInput = {
      subscription_status: "active",
      trial_ends_at: null,
      current_period_end: inDays(20),
      subscription_id: "sub_1",
      cancel_at_period_end: false,
    };
    expect(shouldPromoteToReadonly(u, NOW)).toBe(false);
  });

  it("laufender App-Trial → noch kein Kandidat", () => {
    const u: AccessInput = {
      subscription_status: "trialing",
      trial_ends_at: inDays(5),
      current_period_end: null,
      subscription_id: null,
      cancel_at_period_end: false,
    };
    expect(shouldPromoteToReadonly(u, NOW)).toBe(false);
  });

  it("ignoriert eine bereits gesetzte Lesefrist (rechnet mit access_until=null)", () => {
    const u: AccessInput = {
      subscription_status: "canceled",
      trial_ends_at: daysAgo(400),
      current_period_end: daysAgo(30),
      subscription_id: "sub_1",
      cancel_at_period_end: true,
      access_until: inDays(100), // würde 'readonly' ergeben – hier bewusst ignoriert
    };
    expect(shouldPromoteToReadonly(u, NOW)).toBe(true);
  });
});

describe("isReminderDue (Erinnerungsmails)", () => {
  it("Intervall beträgt 30 Tage", () => {
    expect(REMINDER_INTERVAL_DAYS).toBe(30);
  });

  it("Lesefrist läuft, noch nie erinnert → fällig", () => {
    expect(isReminderDue(inDays(100), null, NOW)).toBe(true);
  });

  it("zuletzt vor 31 Tagen erinnert → fällig", () => {
    expect(isReminderDue(inDays(100), daysAgo(31), NOW)).toBe(true);
  });

  it("zuletzt vor 10 Tagen erinnert → nicht fällig", () => {
    expect(isReminderDue(inDays(100), daysAgo(10), NOW)).toBe(false);
  });

  it("Lesefrist bereits abgelaufen → nicht fällig", () => {
    expect(isReminderDue(daysAgo(1), null, NOW)).toBe(false);
  });

  it("keine Lesefrist gesetzt → nicht fällig", () => {
    expect(isReminderDue(null, null, NOW)).toBe(false);
  });
});
