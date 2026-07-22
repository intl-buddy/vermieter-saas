import { describe, it, expect } from "vitest";
import { nextInquiryStatus, canSubmitInquiry } from "./inquiry";

describe("nextInquiryStatus", () => {
  it("folgt dem Zyklus new → contacted → closed", () => {
    expect(nextInquiryStatus("new")).toBe("contacted");
    expect(nextInquiryStatus("contacted")).toBe("closed");
  });

  it("closed ist der Endzustand", () => {
    expect(nextInquiryStatus("closed")).toBeNull();
  });
});

describe("canSubmitInquiry (Wiederholungsschutz)", () => {
  it("erlaubt Senden ohne bestehende Anfrage", () => {
    expect(canSubmitInquiry(null)).toBe(true);
  });

  it("blockiert bei offener Anfrage (new/contacted)", () => {
    expect(canSubmitInquiry("new")).toBe(false);
    expect(canSubmitInquiry("contacted")).toBe(false);
  });

  it("erlaubt erneutes Senden nach Abschluss", () => {
    expect(canSubmitInquiry("closed")).toBe(true);
  });
});
