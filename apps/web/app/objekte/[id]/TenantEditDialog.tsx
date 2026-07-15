"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { updateTenant, type FormState } from "../actions";
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
import { Switch } from "@/components/ui/switch";

const initialState: FormState = {};

const SELECT_CLS =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

const DEPOSIT_OPTIONS = [
  { value: "cash_deposit", label: "Barkaution" },
  { value: "bank_guarantee", label: "Bankbürgschaft" },
  { value: "deposit_insurance", label: "Kautionsversicherung" },
  { value: "pledged_savings", label: "Verpfändetes Sparbuch" },
  { value: "none", label: "Keine" },
];

export type TenantValues = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  persons_count: number;
  move_in_date: string;
  cold_rent: number;
  operating_costs_advance: number;
  heating_costs_advance: number;
  advance_mode: string;
  rent_due_day: number;
  deposit_type: string;
  deposit_amount: number;
  deposit_paid: boolean;
  iban: string | null;
  notes: string | null;
};

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : "Änderungen speichern"}
    </Button>
  );
}

export function TenantEditDialog({
  tenant,
  propertyId,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  tenant: TenantValues;
  propertyId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const action = updateTenant;
  const [state, formAction] = useActionState(action, initialState);

  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const uid = tenant.id;
  const [coldRent, setColdRent] = useState(String(tenant.cold_rent));
  const [oca, setOca] = useState(String(tenant.operating_costs_advance));
  const [hca, setHca] = useState(String(tenant.heating_costs_advance));
  const [advanceMode, setAdvanceMode] = useState(
    tenant.advance_mode === "combined" ? "combined" : "split",
  );
  const [depositPaid, setDepositPaid] = useState(tenant.deposit_paid);

  const amountsChanged =
    coldRent !== String(tenant.cold_rent) ||
    oca !== String(tenant.operating_costs_advance) ||
    hca !== String(tenant.heating_costs_advance);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled ? (
        <DialogTrigger asChild>
          {trigger ?? <Button variant="outline">Mieter bearbeiten</Button>}
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mieter bearbeiten</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={tenant.id} />
          <input type="hidden" name="property_id" value={propertyId} />
          <input type="hidden" name="advance_mode" value={advanceMode} />
          <input
            type="hidden"
            name="deposit_paid"
            value={depositPaid ? "true" : "false"}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Vorname" htmlFor={`${uid}-first`}>
              <Input
                id={`${uid}-first`}
                name="first_name"
                required
                defaultValue={tenant.first_name}
              />
            </Field>
            <Field label="Nachname" htmlFor={`${uid}-last`}>
              <Input
                id={`${uid}-last`}
                name="last_name"
                required
                defaultValue={tenant.last_name}
              />
            </Field>
            <Field label="E-Mail (optional)" htmlFor={`${uid}-email`}>
              <Input
                id={`${uid}-email`}
                name="email"
                type="email"
                defaultValue={tenant.email ?? ""}
              />
            </Field>
            <Field label="Telefon (optional)" htmlFor={`${uid}-phone`}>
              <Input
                id={`${uid}-phone`}
                name="phone"
                type="tel"
                defaultValue={tenant.phone ?? ""}
              />
            </Field>
            <Field label="Personenzahl" htmlFor={`${uid}-persons`}>
              <Input
                id={`${uid}-persons`}
                name="persons_count"
                type="number"
                min="1"
                step="1"
                defaultValue={tenant.persons_count}
              />
            </Field>
            <Field label="Einzugsdatum" htmlFor={`${uid}-movein`}>
              <Input
                id={`${uid}-movein`}
                name="move_in_date"
                type="date"
                required
                defaultValue={tenant.move_in_date}
              />
            </Field>
            <Field label="Kaltmiete (€)" htmlFor={`${uid}-cold`}>
              <Input
                id={`${uid}-cold`}
                name="cold_rent"
                type="number"
                min="0"
                step="0.01"
                required
                value={coldRent}
                onChange={(e) => setColdRent(e.target.value)}
              />
            </Field>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium text-neutral-700">
                Vorauszahlungen
              </span>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={advanceMode === "split"}
                    onChange={() => setAdvanceMode("split")}
                  />
                  Nebenkosten + Heizkosten getrennt
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={advanceMode === "combined"}
                    onChange={() => setAdvanceMode("combined")}
                  />
                  Betriebskosten gesamt
                </label>
              </div>
              {advanceMode === "combined" ? (
                <Field
                  label="Betriebskosten-Vorauszahlung (€)"
                  htmlFor={`${uid}-oca`}
                >
                  <Input
                    id={`${uid}-oca`}
                    name="operating_costs_advance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={oca}
                    onChange={(e) => setOca(e.target.value)}
                  />
                </Field>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="NK-Vorauszahlung (€)" htmlFor={`${uid}-oca`}>
                    <Input
                      id={`${uid}-oca`}
                      name="operating_costs_advance"
                      type="number"
                      min="0"
                      step="0.01"
                      value={oca}
                      onChange={(e) => setOca(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Heizkosten-Vorauszahlung (€)"
                    htmlFor={`${uid}-hca`}
                  >
                    <Input
                      id={`${uid}-hca`}
                      name="heating_costs_advance"
                      type="number"
                      min="0"
                      step="0.01"
                      value={hca}
                      onChange={(e) => setHca(e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>
            <Field label="Fälligkeitstag (1–28)" htmlFor={`${uid}-due`}>
              <Input
                id={`${uid}-due`}
                name="rent_due_day"
                type="number"
                min="1"
                max="28"
                step="1"
                defaultValue={tenant.rent_due_day}
              />
            </Field>
            <Field label="Kautionsart" htmlFor={`${uid}-deptype`}>
              <select
                id={`${uid}-deptype`}
                name="deposit_type"
                defaultValue={tenant.deposit_type}
                className={SELECT_CLS}
              >
                {DEPOSIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kautionsbetrag (€)" htmlFor={`${uid}-depamount`}>
              <Input
                id={`${uid}-depamount`}
                name="deposit_amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={tenant.deposit_amount}
              />
            </Field>
            <Field label="IBAN (optional)" htmlFor={`${uid}-iban`}>
              <Input
                id={`${uid}-iban`}
                name="iban"
                defaultValue={tenant.iban ?? ""}
              />
            </Field>
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 sm:mt-6">
              <span className="text-sm font-medium text-neutral-700">
                Kaution bezahlt
              </span>
              <Switch checked={depositPaid} onCheckedChange={setDepositPaid} />
            </div>
          </div>

          <Field label="Notizen (optional)" htmlFor={`${uid}-notes`}>
            <Textarea
              id={`${uid}-notes`}
              name="notes"
              rows={2}
              defaultValue={tenant.notes ?? ""}
            />
          </Field>

          {amountsChanged ? (
            <div className="rounded-lg border border-secondary-100 bg-secondary-50 px-3 py-2 text-sm text-secondary-800">
              Änderungen an Miete und Vorauszahlungen gelten ab der nächsten
              monatlichen Soll-Stellung. Bereits erzeugte Monate bleiben
              unverändert. Für den laufenden Monat kannst du die Soll-Stellung im
              Mieteingang manuell anpassen.
            </div>
          ) : null}

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
