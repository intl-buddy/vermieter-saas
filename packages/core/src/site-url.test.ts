import { describe, it, expect } from "vitest";
import {
  DEFAULT_SITE_URL,
  normalizeOrigin,
  resolveSiteUrl,
} from "./site-url";

describe("normalizeOrigin", () => {
  it("reduziert eine URL auf den Origin", () => {
    expect(normalizeOrigin("https://app.tefter.de/dashboard?x=1")).toBe(
      "https://app.tefter.de",
    );
  });

  it("entfernt den Schrägstrich am Ende", () => {
    expect(normalizeOrigin("https://app.tefter.de/")).toBe(
      "https://app.tefter.de",
    );
  });

  it("behält einen abweichenden Port", () => {
    expect(normalizeOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });

  it("verwirft containerinterne Adressen", () => {
    // Der Kern des Bugs: 0.0.0.0 landete über den Request-Origin in der Mail.
    expect(normalizeOrigin("https://0.0.0.0:3000")).toBeNull();
    expect(normalizeOrigin("http://0.0.0.0:3000/dashboard")).toBeNull();
    expect(normalizeOrigin("http://[::]:3000")).toBeNull();
  });

  it("verwirft Leerwerte und Unsinn", () => {
    for (const value of [null, undefined, "", "   ", "app.tefter.de", "/pfad"]) {
      expect(normalizeOrigin(value), String(value)).toBeNull();
    }
  });

  it("verwirft fremde Protokolle", () => {
    expect(normalizeOrigin("javascript:alert(1)")).toBeNull();
    expect(normalizeOrigin("ftp://app.tefter.de")).toBeNull();
  });
});

describe("resolveSiteUrl", () => {
  it("nimmt den ersten brauchbaren Kandidaten", () => {
    expect(
      resolveSiteUrl("https://app.tefter.de", "https://ignoriert.de"),
    ).toBe("https://app.tefter.de");
  });

  it("überspringt unbrauchbare Kandidaten", () => {
    // SITE_URL nicht gesetzt, Request-Origin containerintern → Fallback.
    expect(resolveSiteUrl(undefined, "https://0.0.0.0:3000")).toBe(
      DEFAULT_SITE_URL,
    );
  });

  it("nutzt den Fallback-Origin, wenn SITE_URL fehlt", () => {
    expect(resolveSiteUrl(undefined, "https://app.tefter.de")).toBe(
      "https://app.tefter.de",
    );
  });

  it("bevorzugt SITE_URL vor dem Request-Origin", () => {
    expect(
      resolveSiteUrl("https://app.tefter.de", "https://0.0.0.0:3000"),
    ).toBe("https://app.tefter.de");
  });

  it("fällt ohne jeden Kandidaten auf localhost zurück", () => {
    expect(resolveSiteUrl()).toBe(DEFAULT_SITE_URL);
    expect(resolveSiteUrl(null, undefined, "")).toBe(DEFAULT_SITE_URL);
  });

  it("liefert nie eine containerinterne Adresse", () => {
    const result = resolveSiteUrl("http://0.0.0.0:3000", "https://0.0.0.0");
    expect(result).not.toContain("0.0.0.0");
  });
});
