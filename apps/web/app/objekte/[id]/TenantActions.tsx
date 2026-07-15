"use client";

import { useState } from "react";
import { MoreVertical, Pencil, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TenantEditDialog, type TenantValues } from "./TenantEditDialog";
import { EndTenancyDialog } from "./EndTenancyDialog";

export function TenantActions({
  tenant,
  propertyId,
}: {
  tenant: TenantValues;
  propertyId: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Mieter-Aktionen">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Mieter bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-danger-600"
            onSelect={(e) => {
              e.preventDefault();
              setEndOpen(true);
            }}
          >
            <LogOut className="size-4" />
            Mietverhältnis beenden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TenantEditDialog
        tenant={tenant}
        propertyId={propertyId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <EndTenancyDialog
        tenantId={tenant.id}
        propertyId={propertyId}
        moveInDate={tenant.move_in_date}
        open={endOpen}
        onOpenChange={setEndOpen}
      />
    </>
  );
}
