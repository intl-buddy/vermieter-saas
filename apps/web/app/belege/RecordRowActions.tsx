"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRecord } from "./actions";
import {
  CreateRecordDialog,
  type PropertyOption,
  type RecordValues,
} from "./CreateRecordDialog";
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

export function RecordRowActions({
  record,
  properties,
}: {
  record: RecordValues;
  properties: PropertyOption[];
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

      <CreateRecordDialog
        mode="edit"
        record={record}
        properties={properties}
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
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={pending}
            >
              {pending ? "Wird gelöscht …" : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
