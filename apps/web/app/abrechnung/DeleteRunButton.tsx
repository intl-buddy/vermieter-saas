"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBillingRun } from "./actions";
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

export function DeleteRunButton({ runId }: { runId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteBillingRun(runId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Abrechnungslauf gelöscht.");
      setOpen(false);
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
            className="text-danger-600"
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            Lauf löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abrechnungslauf löschen?</DialogTitle>
            <DialogDescription>
              Der Lauf, alle zugehörigen Einzelabrechnungen und die gespeicherten
              PDFs werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig
              gemacht werden.
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
