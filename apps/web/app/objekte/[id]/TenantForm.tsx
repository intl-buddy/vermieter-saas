"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createTenant, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: FormState = {};

const DEPOSIT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "cash_deposit", label: "Barkaution" },
  { value: "bank_guarantee", label: "Bankbürgschaft" },
  { value: "deposit_insurance", label: "Kautionsversicherung" },
  { value: "pledged_savings", label: "Verpfändetes Sparbuch" },
  { value: "none", label: "Keine" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : "Mietverhältnis anlegen"}
    </Button>
  );
}

export function TenantForm({
  unitId,
  propertyId,
}: {
  unitId: string;
  propertyId: string;
}) {
  const [state, formAction] = useActionState(createTenant, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="unit_id" value={unitId} />
      <input type="hidden" name="property_id" value={propertyId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-first_name`}>Vorname</Label>
          <Input id={`${unitId}-first_name`} name="first_name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-last_name`}>Nachname</Label>
          <Input id={`${unitId}-last_name`} name="last_name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-email`}>E-Mail (optional)</Label>
          <Input id={`${unitId}-email`} name="email" type="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-phone`}>Telefon (optional)</Label>
          <Input id={`${unitId}-phone`} name="phone" type="tel" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-persons_count`}>Personen</Label>
          <Input
            id={`${unitId}-persons_count`}
            name="persons_count"
            type="number"
            min="1"
            step="1"
            defaultValue="1"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-move_in_date`}>Einzugsdatum</Label>
          <Input
            id={`${unitId}-move_in_date`}
            name="move_in_date"
            type="date"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-cold_rent`}>Kaltmiete (€)</Label>
          <Input
            id={`${unitId}-cold_rent`}
            name="cold_rent"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="z. B. 650,00"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-operating_costs_advance`}>
            NK-Vorauszahlung (€)
          </Label>
          <Input
            id={`${unitId}-operating_costs_advance`}
            name="operating_costs_advance"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-heating_costs_advance`}>
            Heizkosten-Vorauszahlung (€)
          </Label>
          <Input
            id={`${unitId}-heating_costs_advance`}
            name="heating_costs_advance"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-rent_due_day`}>Fälligkeitstag (1–28)</Label>
          <Input
            id={`${unitId}-rent_due_day`}
            name="rent_due_day"
            type="number"
            min="1"
            max="28"
            step="1"
            defaultValue="3"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-deposit_type`}>Kautionsart</Label>
          <Select name="deposit_type" defaultValue="cash_deposit">
            <SelectTrigger id={`${unitId}-deposit_type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPOSIT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${unitId}-deposit_amount`}>Kautionshöhe (€)</Label>
          <Input
            id={`${unitId}-deposit_amount`}
            name="deposit_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
          />
        </div>
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
