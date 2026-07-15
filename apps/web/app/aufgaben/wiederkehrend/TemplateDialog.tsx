"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createTemplate, updateTemplate, type TaskFormState } from "../actions";
import {
  ScopeFields,
  type PropertyOption,
  type UnitOption,
} from "../ScopeFields";
import { INTERVAL_OPTIONS, MONTHS } from "../intervals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: TaskFormState = {};

export type TemplateValues = {
  id: string;
  title: string;
  description: string | null;
  interval: string;
  day_of_month: number | null;
  month_of_year: number | null;
  property_id: string | null;
  unit_id: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : label}
    </Button>
  );
}

export function TemplateDialog({
  mode,
  properties,
  units,
  template,
}: {
  mode: "create" | "edit";
  properties: PropertyOption[];
  units: UnitOption[];
  template?: TemplateValues;
}) {
  const action = mode === "create" ? createTemplate : updateTemplate;
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, initialState);
  const [interval, setInterval] = useState(template?.interval ?? "monthly");

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
        {mode === "create" ? (
          <Button>
            <Plus className="size-4" />
            Vorlage anlegen
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" />
            Bearbeiten
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Neue wiederkehrende Aufgabe"
              : "Vorlage bearbeiten"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {mode === "edit" && template ? (
            <input type="hidden" name="id" value={template.id} />
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-title">Titel</Label>
            <Input
              id="tpl-title"
              name="title"
              required
              defaultValue={template?.title ?? ""}
              placeholder="z. B. Wasseruhren ablesen"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-description">Beschreibung (optional)</Label>
            <Textarea
              id="tpl-description"
              name="description"
              rows={2}
              defaultValue={template?.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-interval">Intervall</Label>
              <Select
                name="interval"
                value={interval}
                onValueChange={setInterval}
              >
                <SelectTrigger id="tpl-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-day">Tag im Monat</Label>
              <Input
                id="tpl-day"
                name="day_of_month"
                type="number"
                min="1"
                max="31"
                step="1"
                defaultValue={template?.day_of_month ?? 1}
              />
            </div>
          </div>

          {interval === "yearly" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-month">Monat</Label>
              <Select
                name="month_of_year"
                defaultValue={
                  template?.month_of_year ? String(template.month_of_year) : "1"
                }
              >
                <SelectTrigger id="tpl-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            // Anker-Monat für quarterly/semiannually erhalten (falls gesetzt)
            <input
              type="hidden"
              name="month_of_year"
              defaultValue={template?.month_of_year ?? ""}
            />
          )}

          <ScopeFields
            properties={properties}
            units={units}
            defaultPropertyId={template?.property_id}
            defaultUnitId={template?.unit_id}
          />

          <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-muted-foreground">
            Aufgaben werden automatisch am Fälligkeitstag erzeugt.
          </p>

          <DialogFooter>
            <SubmitButton
              label={mode === "create" ? "Vorlage anlegen" : "Speichern"}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
