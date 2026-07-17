import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Test-Zugangsdaten (E2E_EMAIL/E2E_PASSWORD) aus .env.test laden (gitignored).
// Erst apps/web/.env.test, dann als Fallback die Datei im Repo-Wurzelverzeichnis
// – dotenv überschreibt bereits gesetzte Werte nicht, apps/web gewinnt also.
dotenv.config({ path: ".env.test" });
dotenv.config({ path: "../../.env.test" });

// Standard: lokaler Dev-Server. Per E2E_BASE_URL auf eine andere Umgebung
// (Staging, Preview) umbiegbar – dann wird kein eigener Server gestartet.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const usesExternalServer = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  // Startet den lokalen Dev-Server (nutzt .env.local für Supabase-Keys).
  // Zeigt E2E_BASE_URL auf eine laufende Umgebung, wird nichts gestartet.
  webServer: usesExternalServer
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
