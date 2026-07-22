"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  User,
  ChevronDown,
  LogOut,
  Settings,
  Receipt,
  Calculator,
  FileText,
  Shield,
  LifeBuoy,
  Building2,
  Check,
} from "lucide-react";
import { logout } from "@/app/actions";
import { setActiveAccount, clearActiveAccount } from "@/app/konto-actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface ManagedAccountOption {
  id: string;
  name: string;
}

export function UserMenu({
  email,
  isAdmin = false,
  managedAccounts = [],
  activeOwnerId = null,
}: {
  email: string;
  /** Serverseitig ermittelt – der Admin-Eintrag wird für Nicht-Admins gar
   *  nicht gerendert (nicht bloß per CSS versteckt). */
  isAdmin?: boolean;
  /** Konten, die dieser Nutzer als Hausverwaltung verwalten darf. */
  managedAccounts?: ManagedAccountOption[];
  /** Aktuell aktiv verwaltetes Owner-Konto (oder null = eigenes Konto). */
  activeOwnerId?: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex size-6 items-center justify-center rounded-full bg-secondary-100 text-secondary-700">
          <User className="size-3.5" />
        </span>
        <ChevronDown className="size-3.5 text-neutral-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="text-xs text-muted-foreground">Angemeldet als</div>
          <div className="truncate text-sm font-medium text-foreground">
            {email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/vorlagen">
            <FileText className="size-4" />
            Vorlagen
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/belege">
            <Receipt className="size-4" />
            Belege
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/abrechnung">
            <Calculator className="size-4" />
            Abrechnungen
          </Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/novipazar">
              <Shield className="size-4" />
              Admin
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/hilfe">
            <LifeBuoy className="size-4" />
            Hilfe
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/einstellungen">
            <Settings className="size-4" />
            Einstellungen
          </Link>
        </DropdownMenuItem>

        {managedAccounts.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="size-3.5" />
              Verwaltete Konten
            </DropdownMenuLabel>
            {activeOwnerId ? (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  startTransition(() => clearActiveAccount());
                }}
                disabled={pending}
              >
                <User className="size-4" />
                Mein Konto
              </DropdownMenuItem>
            ) : null}
            {managedAccounts.map((acc) => (
              <DropdownMenuItem
                key={acc.id}
                onSelect={(e) => {
                  e.preventDefault();
                  if (acc.id === activeOwnerId) return;
                  startTransition(() => setActiveAccount(acc.id));
                }}
                disabled={pending}
              >
                {acc.id === activeOwnerId ? (
                  <Check className="size-4 text-secondary-700" />
                ) : (
                  <Building2 className="size-4" />
                )}
                <span className="truncate">{acc.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}

        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full text-danger-600">
              <LogOut className="size-4" />
              Abmelden
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
