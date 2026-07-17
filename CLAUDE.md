# tefter – Projekt-Hinweise für Claude

Turborepo-Monorepo (npm workspaces). App: `apps/web` (Next.js App Router,
Supabase SSR, Tailwind v4 + shadcn/ui). Geteilte Logik/Typen: `packages/core`
(inkl. getesteter NK-Berechnung, Vitest). Sprache der UI: Deutsch.

## Befehle
- `npm run build` – Build aller Pakete (muss vor jedem Commit grün sein).
- `npm test` – Vitest der Rechenlogik in `packages/core` (muss grün sein).
- `npm run test:e2e` – Playwright-Smoke-Tests gegen den lokalen Dev-Server
  (benötigt `.env.test` mit `E2E_EMAIL`/`E2E_PASSWORD` – im Repo-Wurzel- oder
  im `apps/web`-Verzeichnis – und einmalig `npx playwright install chromium`).
  Mit `E2E_BASE_URL` läuft die Suite gegen eine andere, bereits laufende
  Umgebung; ohne die Variable startet Playwright selbst einen Dev-Server.
- `npm run gen-types` – erzeugt `packages/core/src/database.types.ts` neu aus
  der Live-DB (benötigt die Supabase-CLI und `SUPABASE_PROJECT_ID`).

## Test- & Deploy-Regel (verbindlich)
- **Vor jedem Push:** `npm run build`.
- **Nach jedem Deploy mit Schema- oder Seitenänderungen:** `npm run test:e2e`
  gegen die lokale Umgebung.

### Deploy-Checkliste (verbindlich, in dieser Reihenfolge)
1. `npm run build` – muss grün sein (dazu `npm test`).
2. Push (Coolify baut und deployt automatisch).
3. **Migration ausführen:** neue Dateien aus `supabase/migrations/` im Supabase
   SQL Editor einspielen, in aufsteigender Nummernfolge.
4. `npm run gen-types` – Typen an das neue Schema angleichen, Ergebnis
   committen. `database.types.ts` muss exakt zu den Migrationen passen.
5. **`/api/health` prüfen:** muss `{"status":"ok"}` liefern. `"degraded"` mit
   `missing:[…]` heißt: Schritt 3 wurde vergessen oder ist fehlgeschlagen.
   ```
   curl -fsS https://<domain>/api/health
   ```
6. `npm run test:e2e` – Smoke-Tests gegen die lokale Umgebung.

## Datenbank / Migrationen
- Schema-Quelle ist `supabase/migrations/` (fortlaufend nummeriert). Der Code
  (inkl. `packages/core/src/database.types.ts`) muss exakt dazu passen.
- Migrationen werden **nicht** automatisch ausgeführt – der Nutzer spielt sie
  selbst im Supabase SQL Editor ein.

### ⚠️ Migrations-Regel (verbindlich)
Jeder Auftrag, der eine Migrationsdatei anlegt oder ändert, MUSS am Ende der
Antwort mit diesem prominenten Hinweis abschließen:

> **⚠️ MIGRATION AUSFÜHREN: `<Datei>` im SQL Editor, BEVOR getestet wird.**

Bei mehreren Dateien alle nennen, in Ausführungsreihenfolge.

### ⚠️ Schema-Wächter-Regel (verbindlich)
**Jede neue Migration ergänzt die Schema-Wächter-Liste** `EXPECTED_COLUMNS` in
`packages/core/src/schema-guard.ts` – mit Tabelle, Spalte und Dateiname der
Migration (`since`). Sonst bleibt eine vergessene Migration unbemerkt.

`/api/health` prüft diese Liste über die RPC `missing_schema_columns`
(Migration 012, `SECURITY DEFINER`, nur `service_role`) gegen
`information_schema` und antwortet:
- `200 {status:'ok'}` – DB erreichbar, Schema vollständig.
- `200 {status:'degraded', missing:[…]}` – Schema-Drift; Log-Warnung
  „⚠️ Migration fehlt vermutlich: …" nennt die fehlende Datei. Bewusst 200,
  damit der Container healthy bleibt (Lesen funktioniert meist weiter).
- `503 {status:'error'}` – Supabase nicht erreichbar; nur das macht den
  Docker-HEALTHCHECK unhealthy.

Aufgenommen werden nur Spalten, die der Code tatsächlich nutzt – der Wächter
ist keine zweite Schema-Kopie, sondern eine Liste harter Abhängigkeiten.
Entfernt eine Migration eine Spalte, muss sie auch aus der Liste verschwinden.

## Abo-Lebenszyklus / Cron (verbindlich)
- Der tägliche Lebenszyklus läuft in der Route `POST /api/cron/lifecycle`
  (nicht in der DB – dort sind Brevo- und Stripe-SDK verfügbar). Er erledigt:
  1. Trial-Ablauf / Abo-Ende → Lesemodus (`access_until = now()+6 Monate`),
  2. Erinnerungsmails an Lesemodus-Nutzer (höchstens alle 30 Tage),
  3. endgültige Löschung nach Lesefrist + 7 Tagen Karenz (Storage, Daten,
     `auth.users`, Stripe-Customer; Nachweis in `deletion_log`, nur user_id-Hash).
- **Auslösung: Coolify-Scheduled-Task, täglich**, mit dem Secret-Header:
  ```
  curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" \
       https://<domain>/api/cron/lifecycle
  ```
  `CRON_SECRET` als Env-Var setzen (siehe `.env.example`). Ohne gültiges Secret
  antwortet die Route mit 401.
- Zugriffsstufen zentral in `getAccessStatus` (packages/core): `active`,
  `trial`, `readonly` (Lesemodus), `locked`. Schreibende Server-Actions werden
  über `assertWriteAccess`/`requireWriteAccess` (`lib/access.ts`) serverseitig
  abgelehnt, sobald der Status nicht `active`/`trial` ist.

## Preise / Stripe (verbindlich)
- Anzeige-Preise werden ausschließlich aus dem `PLANS`-Objekt in
  `packages/core` gerendert – das ist die einzige Quelle.
- **Preisänderungen erfordern IMMER beides: Stripe-Preis anlegen/ändern UND
  `PLANS`-Objekt in `packages/core` aktualisieren – niemals nur eines von
  beiden.** Sonst weichen angezeigter und abgerechneter Preis voneinander ab.

## Konventionen
- Nullable-Spalten in der UI immer null-sicher rendern (Fallback „–" bzw.
  Badge „fehlt").
- Alle Inserts tragen die `user_id` des eingeloggten Nutzers (RLS).
- Commit-Messages auf Deutsch; am Ende die Co-Authored-By-Zeile.
