import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

// Meldet den Test-Nutzer einmal an und speichert die Session für alle Tests.
// Dieser Setup-Schritt ist gleichzeitig der „Login funktioniert"-Test.
setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E_EMAIL/E2E_PASSWORD fehlen – bitte in .env.test hinterlegen " +
        "(Repo-Wurzel oder apps/web, Vorlage: apps/web/.env.test.example).",
    );
  }

  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "Anmelden" }).click();

  // Erfolgreicher Login leitet auf das Dashboard weiter. Schlägt er fehl, ist
  // ein Timeout auf die Weiterleitung wenig aussagekräftig – deshalb die
  // Fehlermeldung der Seite mit ausgeben.
  try {
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
  } catch {
    const meldung = (await page.getByRole("alert").allInnerTexts())
      .join(" ")
      .trim();
    throw new Error(
      `Login als ${email} fehlgeschlagen. ` +
        (meldung ? `Seite meldet: „${meldung}". ` : "") +
        "Häufigste Ursache: Der Testnutzer existiert nicht oder seine " +
        "E-Mail-Adresse ist in Supabase nicht bestätigt " +
        "(Dashboard → Authentication → Users → „Confirm email\").",
    );
  }
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
