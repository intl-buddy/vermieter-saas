"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createUnit, updateUnit, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const initialState: FormState = {};

const UNIT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "residential", label: "Wohnung" },
  { value: "commercial", label: "Gewerbe" },
  { value: "parking", label: "Stellplatz" },
  { value: "other", label: "Sonstiges" },
];

type UnitValues = {
  id: string;
  label: string;
  unit_type: string;
  floor: string | null;
  living_area: number | null;
  rooms: number | null;
  notes: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : label}
    </Button>
  );
}

export function UnitForm({
  mode,
  propertyId,
  unit,
  onSuccess,
}: {
  mode: "create" | "edit";
  propertyId: string;
  unit?: UnitValues;
  /** Optionaler Callback nach erfolgreichem Speichern (z. B. Onboarding). */
  onSuccess?: () => void;
}) {
  const action = mode === "create" ? createUnit : updateUnit;
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const uid = unit?.id ?? "new";

  useEffect(() => {
    // Limit erreicht: Upgrade-Dialog statt Toast anzeigen.
    if (state.limit) {
      setLimitOpen(true);
      return;
    }
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      if (mode === "create") formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, mode, onSuccess]);

  return (
    <>
    <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Einheiten-Limit erreicht</DialogTitle>
          <DialogDescription>
            {state.limit
              ? `Dein Paket ${state.limit.planLabel} umfasst bis zu ${state.limit.limit} Einheiten. Upgrade auf ${state.limit.nextPlan}, um weitere anzulegen.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Später</Button>
          </DialogClose>
          <Link href="/preise">
            <Button>Paket ansehen</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="property_id" value={propertyId} />
      {mode === "edit" && unit ? (
        <input type="hidden" name="id" value={unit.id} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={`${uid}-label`}>Bezeichnung</Label>
          <Input
            id={`${uid}-label`}
            name="label"
            required
            defaultValue={unit?.label ?? ""}
            placeholder="z. B. EG links, WE 03"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-unit_type`}>Art</Label>
          <Select name="unit_type" defaultValue={unit?.unit_type ?? "residential"}>
            <SelectTrigger id={`${uid}-unit_type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-floor`}>Etage (optional)</Label>
          <Input
            id={`${uid}-floor`}
            name="floor"
            defaultValue={unit?.floor ?? ""}
            placeholder="z. B. EG, 1. OG, DG"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-living_area`}>Wohnfläche in m² (optional)</Label>
          <Input
            id={`${uid}-living_area`}
            name="living_area"
            type="number"
            min="0"
            step="0.01"
            defaultValue={unit?.living_area ?? ""}
            placeholder="z. B. 72,50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-rooms`}>Zimmer (optional)</Label>
          <Input
            id={`${uid}-rooms`}
            name="rooms"
            type="number"
            min="0"
            step="0.5"
            defaultValue={unit?.rooms ?? ""}
            placeholder="z. B. 2,5"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-unit-notes`}>Notizen (optional)</Label>
        <Textarea
          id={`${uid}-unit-notes`}
          name="notes"
          rows={2}
          defaultValue={unit?.notes ?? ""}
        />
      </div>

      <div>
        <SubmitButton
          label={mode === "create" ? "Einheit anlegen" : "Änderungen speichern"}
        />
      </div>
    </form>
    </>
  );
}
