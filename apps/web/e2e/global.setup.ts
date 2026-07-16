import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

// Meldet den Test-Nutzer einmal an und speichert die Session für alle Tests.
// Dieser Setup-Schritt ist gleichzeitig der „Login funktioniert"-Test.
setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E_EMAIL/E2E_PASSWORD fehlen – bitte in apps/web/.env.test hinterlegen.",
    );
  }

  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "Anmelden" }).click();

  // Erfolgreicher Login leitet auf das Dashboard weiter.
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
