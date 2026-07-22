import { describe, it, expect } from "vitest";
import {
  hasAccountAccess,
  resolveEffectiveOwner,
  ACCOUNT_SHARED_TABLES,
  ACCOUNT_PRIVATE_TABLES,
  type AccountLinkLike,
} from "./account-access";

const OWNER = "00000000-0000-0000-0000-0000000000aa";
const MANAGER = "00000000-0000-0000-0000-0000000000bb";
const STRANGER = "00000000-0000-0000-0000-0000000000cc";

const activeLink: AccountLinkLike = {
  owner_user_id: OWNER,
  manager_user_id: MANAGER,
  status: "active",
};
const revokedLink: AccountLinkLike = {
  owner_user_id: OWNER,
  manager_user_id: MANAGER,
  status: "revoked",
};

describe("hasAccountAccess", () => {
  it("erlaubt jedem den Zugriff auf sein eigenes Konto", () => {
    expect(hasAccountAccess(OWNER, OWNER, [])).toBe(true);
    expect(hasAccountAccess(MANAGER, MANAGER, [])).toBe(true);
  });

  it("Fremder ohne Link sieht nichts", () => {
    expect(hasAccountAccess(STRANGER, OWNER, [])).toBe(false);
    expect(hasAccountAccess(STRANGER, OWNER, [activeLink])).toBe(false);
  });

  it("Manager mit aktivem Link darf lesen und schreiben", () => {
    expect(hasAccountAccess(MANAGER, OWNER, [activeLink])).toBe(true);
  });

  it("aufgehobener (revoked) Link sperrt sofort", () => {
    expect(hasAccountAccess(MANAGER, OWNER, [revokedLink])).toBe(false);
  });

  it("Manager-Link deckt NICHT den Zugriff auf ein drittes Konto", () => {
    expect(hasAccountAccess(MANAGER, STRANGER, [activeLink])).toBe(false);
  });
});

describe("resolveEffectiveOwner", () => {
  it("ohne Kontext-Wunsch bleibt man im eigenen Konto", () => {
    const ctx = resolveEffectiveOwner(MANAGER, null, [activeLink]);
    expect(ctx).toEqual({ effectiveUserId: MANAGER, isManaging: false });
  });

  it("wechselt bei gültigem aktivem Link ins Owner-Konto", () => {
    const ctx = resolveEffectiveOwner(MANAGER, OWNER, [activeLink]);
    expect(ctx).toEqual({ effectiveUserId: OWNER, isManaging: true });
  });

  it("revoked Link → Rückfall auf das eigene Konto", () => {
    const ctx = resolveEffectiveOwner(MANAGER, OWNER, [revokedLink]);
    expect(ctx).toEqual({ effectiveUserId: MANAGER, isManaging: false });
  });

  it("Fremder kann sich nicht in ein Konto schummeln", () => {
    const ctx = resolveEffectiveOwner(STRANGER, OWNER, [activeLink]);
    expect(ctx).toEqual({ effectiveUserId: STRANGER, isManaging: false });
  });

  it("eigenes Konto als Wunsch bedeutet kein Verwalten", () => {
    const ctx = resolveEffectiveOwner(OWNER, OWNER, []);
    expect(ctx).toEqual({ effectiveUserId: OWNER, isManaging: false });
  });
});

describe("Tabellen-Invarianten", () => {
  it("Tickets bleiben privat (nicht in den geteilten Tabellen)", () => {
    expect(ACCOUNT_SHARED_TABLES).not.toContain("support_tickets");
    expect(ACCOUNT_SHARED_TABLES).not.toContain("ticket_messages");
    expect(ACCOUNT_PRIVATE_TABLES).toContain("support_tickets");
    expect(ACCOUNT_PRIVATE_TABLES).toContain("ticket_messages");
  });

  it("geteilte und private Tabellen überschneiden sich nicht", () => {
    const shared = new Set<string>(ACCOUNT_SHARED_TABLES);
    for (const t of ACCOUNT_PRIVATE_TABLES) {
      expect(shared.has(t)).toBe(false);
    }
  });
});
