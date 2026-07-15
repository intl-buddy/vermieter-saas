"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createRecord, type RecordState } from "./actions";
import {
  COST_TYPE_OPTIONS,
  ALLOCATION_OPTIONS,
  VAT_RATES,
} from "./labels";
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

const initialState: RecordState = {};

const SELECT_CLS =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

export type PropertyOption = { id: string; name: string };

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
      {pending ? "Wird gespeichert …" : "Beleg speichern"}
    </Button>
  );
}

export function CreateRecordDialog({
  properties,
  defaultPropertyId,
}: {
  properties: PropertyOption[];
  defaultPropertyId?: string;
}) {
  const year = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createRecord, initialState);

  const [gross, setGross] = useState("");
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [apportionable, setApportionable] = useState(true);

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
          Beleg erfassen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Beleg erfassen</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="hidden"
            name="is_apportionable"
            value={apportionable ? "true" : "false"}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Objekt" htmlFor="rec-property">
              <select
                id="rec-property"
                name="property_id"
                required
                defaultValue={defaultPropertyId ?? ""}
                className={SELECT_CLS}
              >
                <option value="" disabled>
                  — Objekt wählen —
                </option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Kostenart" htmlFor="rec-costtype">
              <select
                id="rec-costtype"
                name="cost_type"
                defaultValue="other_operating_costs"
                className={SELECT_CLS}
              >
                {COST_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Lieferant (optional)" htmlFor="rec-vendor">
              <Input id="rec-vendor" name="vendor" />
            </Field>

            <Field label="Rechnungsnummer (optional)" htmlFor="rec-invnr">
              <Input id="rec-invnr" name="invoice_number" />
            </Field>

            <Field label="Rechnungsdatum" htmlFor="rec-invdate">
              <Input id="rec-invdate" name="invoice_date" type="date" required />
            </Field>

            <Field label="Zahlungsdatum (optional)" htmlFor="rec-paiddate">
              <Input id="rec-paiddate" name="paid_date" type="date" />
            </Field>

            <Field label="Betrag brutto (€)" htmlFor="rec-gross">
              <Input
                id="rec-gross"
                name="gross_amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={gross}
                onChange={(e) => {
                  setGross(e.target.value);
                  if (!amountTouched) setAmount(e.target.value);
                }}
              />
            </Field>

            <Field label="USt-Satz" htmlFor="rec-vat">
              <select
                id="rec-vat"
                name="vat_rate"
                defaultValue="19"
                className={SELECT_CLS}
              >
                {VAT_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r} %
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Umlagefähiger Betrag (€)" htmlFor="rec-amount">
              <Input
                id="rec-amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountTouched(true);
                }}
              />
            </Field>

            <Field label="Umlageschlüssel" htmlFor="rec-alloc">
              <select
                id="rec-alloc"
                name="allocation_key"
                defaultValue="living_area"
                className={SELECT_CLS}
              >
                {ALLOCATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Abrechnung von" htmlFor="rec-start">
              <Input
                id="rec-start"
                name="billing_period_start"
                type="date"
                required
                defaultValue={`${year}-01-01`}
              />
            </Field>

            <Field label="Abrechnung bis" htmlFor="rec-end">
              <Input
                id="rec-end"
                name="billing_period_end"
                type="date"
                required
                defaultValue={`${year}-12-31`}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
            <span className="text-sm font-medium text-neutral-700">
              Umlagefähig
            </span>
            <Switch checked={apportionable} onCheckedChange={setApportionable} />
          </div>

          <Field label="Notiz (optional)" htmlFor="rec-notes">
            <Textarea id="rec-notes" name="notes" rows={2} />
          </Field>

          <Field label="Beleg (PDF/JPG/PNG, max. 10 MB – optional)" htmlFor="rec-file">
            <input
              id="rec-file"
              name="receipt"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
            />
          </Field>

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
