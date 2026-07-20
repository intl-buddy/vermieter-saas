"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createAdHocTask,
  updateTask,
  type TaskFormState,
} from "./actions";
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

/** Werte einer bestehenden Aufgabe – zum Vorbefüllen des Bearbeiten-Dialogs. */
export type EditTaskValues = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  propertyId: string | null;
  unitId: string | null;
};

/** Heutiges Datum als `YYYY-MM-DD` in lokaler Zeit. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function CreateTaskDialog({
  properties,
  units,
  trigger,
  task,
}: {
  properties: PropertyOption[];
  units: UnitOption[];
  trigger?: React.ReactNode;
  /** Gesetzt → Bearbeiten-Modus (auch für generierte Aufgaben). */
  task?: EditTaskValues;
}) {
  const isEdit = Boolean(task);
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    isEdit ? updateTask : createAdHocTask,
    initialState,
  );

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
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Aufgabe anlegen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit ? <input type="hidden" name="id" value={task!.id} /> : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Titel</Label>
            <Input
              id="task-title"
              name="title"
              required
              autoFocus
              defaultValue={task?.title ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description">Beschreibung (optional)</Label>
            <Textarea
              id="task-description"
              name="description"
              rows={2}
              defaultValue={task?.description ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due">Fälligkeitsdatum</Label>
            <Input
              id="task-due"
              name="due_date"
              type="date"
              required
              defaultValue={task?.dueDate ?? todayIso()}
            />
          </div>
          <ScopeFields
            properties={properties}
            units={units}
            defaultPropertyId={task?.propertyId ?? null}
            defaultUnitId={task?.unitId ?? null}
          />
          <DialogFooter>
            <SubmitButton
              label={isEdit ? "Speichern" : "Aufgabe anlegen"}
              pendingLabel="Wird gespeichert …"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
