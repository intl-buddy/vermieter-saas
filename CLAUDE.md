# tefter – Projekt-Hinweise für Claude

Turborepo-Monorepo (npm workspaces). App: `apps/web` (Next.js App Router,
Supabase SSR, Tailwind v4 + shadcn/ui). Geteilte Logik/Typen: `packages/core`
(inkl. getesteter NK-Berechnung, Vitest). Sprache der UI: Deutsch.

## Befehle
- `npm run build` – Build aller Pakete (muss vor jedem Commit grün sein).
- `npm test` – Vitest der Rechenlogik in `packages/core` (muss grün sein).

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

## Konventionen
- Nullable-Spalten in der UI immer null-sicher rendern (Fallback „–" bzw.
  Badge „fehlt").
- Alle Inserts tragen die `user_id` des eingeloggten Nutzers (RLS).
- Commit-Messages auf Deutsch; am Ende die Co-Authored-By-Zeile.
