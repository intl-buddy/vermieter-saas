"use client";

import { useState, useTransition } from "react";
import { FileText, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRecord } from "./actions";
import {
  CreateRecordDialog,
  type PropertyOption,
  type RecordValues,
  type TenantOption,
  type UnitOption,
} from "./CreateRecordDialog";
import { COST_TYPE_LABELS } from "./labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function RecordRow({
  record,
  properties,
  units,
  tenants,
  propertyName,
  fullAddress,
  downloadUrl,
}: {
  record: RecordValues;
  properties: PropertyOption[];
  units: UnitOption[];
  tenants: TenantOption[];
  propertyName: string | null;
  fullAddress: string;
  downloadUrl: string | null;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteRecord(record.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Beleg gelöscht.");
      setDeleteOpen(false);
    });
  }

  return (
    <>
      <TableRow
        className="group cursor-pointer hover:bg-neutral-50"
        onClick={() => setEditOpen(true)}
      >
        <TableCell className="whitespace-nowrap">
          {formatDate(record.invoice_date)}
        </TableCell>
        <TableCell>
          {COST_TYPE_LABELS[
            record.cost_type as keyof typeof COST_TYPE_LABELS
          ] ?? record.cost_type}
        </TableCell>
        <TableCell className="text-muted-foreground">
          <span className="block max-w-[180px] truncate" title={fullAddress}>
            {propertyName ?? "–"}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground">
          <span
            className="block max-w-[160px] truncate"
            title={record.vendor ?? undefined}
          >
            {record.vendor || "–"}
          </span>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {formatCurrency(record.gross_amount ?? record.amount)}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {record.paid_date ? (
            <span className="tabular-nums">{record.paid_date.slice(0, 4)}</span>
          ) : (
            <Badge variant="warning">Zahlungsdatum fehlt</Badge>
          )}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {record.is_apportionable ? (
            <Badge variant="success">umlagefähig</Badge>
          ) : (
            <Badge variant="neutral">nicht umlagefähig</Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-secondary hover:underline"
              aria-label="Beleg herunterladen"
            >
              <FileText className="size-4" />
            </a>
          ) : (
            <span className="text-neutral-300">–</span>
          )}
        </TableCell>
        <TableCell
          className="sticky right-0 z-10 border-l border-neutral-100 bg-white text-right group-hover:bg-neutral-50"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Aktionen">
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
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-danger-600"
                onSelect={(e) => {
                  e.preventDefault();
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="size-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <CreateRecordDialog
        mode="edit"
        record={record}
        properties={properties}
        units={units}
        tenants={tenants}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Beleg löschen?</DialogTitle>
            <DialogDescription>
              Beleg und Datei werden dauerhaft gelöscht. Diese Aktion kann nicht
              rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onDelete} disabled={pending}>
              {pending ? "Wird gelöscht …" : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
