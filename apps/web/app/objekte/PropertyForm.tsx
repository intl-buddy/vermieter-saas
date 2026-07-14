"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createProperty, updateProperty, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: FormState = {};

type PropertyValues = {
  id: string;
  name: string;
  street: string;
  house_number: string;
  zip: string;
  city: string;
  build_year: number | null;
  total_living_area: number | null;
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

export function PropertyForm({
  mode,
  property,
}: {
  mode: "create" | "edit";
  property?: PropertyValues;
}) {
  const action = mode === "create" ? createProperty : updateProperty;
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      if (mode === "create") formRef.current?.reset();
    }
  }, [state, mode]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {mode === "edit" && property ? (
        <input type="hidden" name="id" value={property.id} />
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${mode}-name`}>Name des Objekts</Label>
        <Input
          id={`${mode}-name`}
          name="name"
          required
          defaultValue={property?.name ?? ""}
          placeholder="z. B. MFH Schützenstraße 12"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={`${mode}-street`}>Straße</Label>
          <Input
            id={`${mode}-street`}
            name="street"
            required
            defaultValue={property?.street ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${mode}-house_number`}>Hausnummer</Label>
          <Input
            id={`${mode}-house_number`}
            name="house_number"
            required
            defaultValue={property?.house_number ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${mode}-zip`}>PLZ</Label>
          <Input
            id={`${mode}-zip`}
            name="zip"
            inputMode="numeric"
            required
            pattern="[0-9]{5}"
            maxLength={5}
            defaultValue={property?.zip ?? ""}
            placeholder="12345"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={`${mode}-city`}>Ort</Label>
          <Input
            id={`${mode}-city`}
            name="city"
            required
            defaultValue={property?.city ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${mode}-build_year`}>Baujahr (optional)</Label>
          <Input
            id={`${mode}-build_year`}
            name="build_year"
            type="number"
            min="1800"
            max="2100"
            step="1"
            defaultValue={property?.build_year ?? ""}
            placeholder="z. B. 1998"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${mode}-total_living_area`}>
            Wohnfläche gesamt in m² (optional)
          </Label>
          <Input
            id={`${mode}-total_living_area`}
            name="total_living_area"
            type="number"
            min="0"
            step="0.01"
            defaultValue={property?.total_living_area ?? ""}
            placeholder="z. B. 420,50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${mode}-notes`}>Notizen (optional)</Label>
        <Textarea
          id={`${mode}-notes`}
          name="notes"
          rows={2}
          defaultValue={property?.notes ?? ""}
        />
      </div>

      <div>
        <SubmitButton
          label={mode === "create" ? "Objekt anlegen" : "Änderungen speichern"}
        />
      </div>
    </form>
  );
}
