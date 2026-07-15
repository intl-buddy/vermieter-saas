"use client";

import Link from "next/link";
import { User, ChevronDown, LogOut, Settings } from "lucide-react";
import { logout } from "@/app/actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ email }: { email: string }) {
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
          <Link href="/einstellungen">
            <Settings className="size-4" />
            Einstellungen
          </Link>
        </DropdownMenuItem>
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
