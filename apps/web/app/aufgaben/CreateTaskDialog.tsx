"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createAdHocTask, type TaskFormState } from "./actions";
import { ScopeFields, type PropertyOption, type UnitOption } from "./ScopeFields";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: TaskFormState = {};

/** Heutiges Datum als `YYYY-MM-DD` in lokaler Zeit. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : "Aufgabe anlegen"}
    </Button>
  );
}

export function CreateTaskDialog({
  properties,
  units,
}: {
  properties: PropertyOption[];
  units: UnitOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createAdHocTask, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Aufgabe anlegen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Aufgabe</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Titel</Label>
            <Input id="task-title" name="title" required autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description">Beschreibung (optional)</Label>
            <Textarea id="task-description" name="description" rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due">Fälligkeitsdatum</Label>
            <Input
              id="task-due"
              name="due_date"
              type="date"
              required
              defaultValue={todayIso()}
            />
          </div>
          <ScopeFields properties={properties} units={units} />
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
