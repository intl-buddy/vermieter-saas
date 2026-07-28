import { test, expect } from "@playwright/test";

// Smoke-Tests: „Seite lädt und zeigt Kerninhalt" – keine tiefen Flows.
// Die Anmeldung erfolgt über den Setup-Schritt (global.setup.ts).

test("Dashboard zeigt 4 KPI-Karten", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Objekte gesamt")).toBeVisible();
  // Exakter Text: „Offene Posten" käme sonst auch in der Statistik-Sektion
  // („Offene Posten gesamt", „… nach Mieter") vor und träfe mehrere Elemente.
  await expect(page.getByText("Offene Posten", { exact: true })).toBeVisible();
  await expect(page.getByText("Mieter im Rückstand")).toBeVisible();
  await expect(page.getByText("Offene Aufgaben")).toBeVisible();
});

test("Objekte-Liste und Objektdetail rendern Mieterkarten", async ({
  page,
}) => {
  await page.goto("/objekte");
  const firstObjekt = page.locator('a[href^="/objekte/"]').first();
  await expect(firstObjekt).toBeVisible();
  await firstObjekt.click();

  // Objektdetail: Einheiten-Abschnitt + Mieterkarte (aktiv oder „anlegen").
  await expect(page.getByRole("heading", { name: "Einheiten" })).toBeVisible();
  await expect(
    page.getByText(/Aktives Mietverhältnis|Mieter anlegen/).first(),
  ).toBeVisible();
});

test("/mieteingang lädt die Tabelle", async ({ page }) => {
  await page.goto("/mieteingang");
  await expect(
    page.getByRole("heading", { name: "Mieteingangskontrolle" }),
  ).toBeVisible();
});

test("/aufgaben lädt", async ({ page }) => {
  await page.goto("/aufgaben");
  await expect(
    page.getByRole("heading", { name: "Aufgaben", exact: true }),
  ).toBeVisible();
});

test("/belege lädt", async ({ page }) => {
  await page.goto("/belege");
  await expect(
    page.getByRole("heading", { name: "Belege", exact: true }),
  ).toBeVisible();
});

test("/preise zeigt die vier Tarif-Karten", async ({ page }) => {
  await page.goto("/preise");
  await expect(
    page.getByRole("heading", { name: "Ein Paket für jede Portfoliogröße" }),
  ).toBeVisible();
  for (const plan of ["Bronze", "Silber", "Gold", "Platin"]) {
    await expect(page.getByRole("heading", { name: plan })).toBeVisible();
  }
  // Abrechnungsintervall-Umschalter (Preise kommen aus PLANS, s. CLAUDE.md).
  // Als Buttons ansprechen: „Jährlich" rendert zusammen mit dem Spar-Badge
  // („~20 % sparen") in einem Knoten, ein exakter Text-Match schlägt daher fehl.
  await expect(page.getByRole("button", { name: "Monatlich" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Jährlich" })).toBeVisible();
});

test("/vorlagen zeigt die drei Karten", async ({ page }) => {
  await page.goto("/vorlagen");
  await expect(page.getByText("Abmahnung", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Wohnungsgeberbescheinigung", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Mietvertrag", { exact: true })).toBeVisible();
});
