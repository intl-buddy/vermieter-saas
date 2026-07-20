"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createRecord,
  updateRecord,
  type RecordState,
} from "./actions";
import { COST_TYPE_OPTIONS, ALLOCATION_OPTIONS, VAT_RATES } from "./labels";
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
export type UnitOption = { id: string; label: string; property_id: string };
export type TenantOption = {
  id: string;
  label: string;
  property_id: string | null;
  unit_id: string;
  active: boolean;
};

export type RecordValues = {
  id: string;
  property_id: string;
  unit_id: string | null;
  tenant_id: string | null;
  cost_type: string;
  vendor: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  paid_date: string | null;
  gross_amount: number | null;
  vat_rate: number | null;
  amount: number;
  allocation_key: string;
  billing_period_start: string;
  billing_period_end: string;
  is_apportionable: boolean;
  receipt_url: string | null;
  notes: string | null;
};

/** UI-Auswahl beim Umlageschlüssel „direkt": Einheit oder Mietverhältnis. */
function initialAllocChoice(record?: RecordValues): string {
  if (record?.allocation_key === "direct") {
    return record.tenant_id ? "direct_tenant" : "direct_unit";
  }
  return record?.allocation_key ?? "living_area";
}

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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : label}
    </Button>
  );
}

export function CreateRecordDialog({
  properties,
  units = [],
  tenants = [],
  defaultPropertyId,
  defaultPeriodStart,
  defaultPeriodEnd,
  trigger,
  mode = "create",
  record,
  defaultCostType,
  onCreated,
  open: openProp,
  onOpenChange,
}: {
  properties: PropertyOption[];
  units?: UnitOption[];
  tenants?: TenantOption[];
  defaultPropertyId?: string;
  /** Vorbefüllung des Abrechnungszeitraums (z. B. aus dem NK-Wizard). */
  defaultPeriodStart?: string;
  defaultPeriodEnd?: string;
  trigger?: React.ReactNode;
  mode?: "create" | "edit";
  record?: RecordValues;
  defaultCostType?: string;
  onCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const year = new Date().getFullYear();
  const action = mode === "edit" ? updateRecord : createRecord;
  const [state, formAction] = useActionState(action, initialState);

  const [propertyId, setPropertyId] = useState(
    record?.property_id ?? defaultPropertyId ?? "",
  );
  const [alloc, setAlloc] = useState(initialAllocChoice(record));
  const unitsForProperty = units.filter((u) => u.property_id === propertyId);
  const tenantsForProperty = tenants.filter(
    (t) => t.property_id === propertyId,
  );
  const allocKeyValue = alloc.startsWith("direct") ? "direct" : alloc;

  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const uid = record?.id ?? "new";
  const [gross, setGross] = useState(
    record?.gross_amount != null ? String(record.gross_amount) : "",
  );
  const [amount, setAmount] = useState(record ? String(record.amount) : "");
  const [amountTouched, setAmountTouched] = useState(mode === "edit");
  const [apportionable, setApportionable] = useState(
    record?.is_apportionable ?? true,
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      onCreated?.();
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled ? (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="size-4" />
              Beleg erfassen
            </Button>
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Beleg bearbeiten" : "Beleg erfassen"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {mode === "edit" && record ? (
            <input type="hidden" name="id" value={record.id} />
          ) : null}
          <input
            type="hidden"
            name="is_apportionable"
            value={apportionable ? "true" : "false"}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Objekt" htmlFor={`${uid}-property`}>
              <select
                id={`${uid}-property`}
                name="property_id"
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
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

            <Field label="Kostenart" htmlFor={`${uid}-costtype`}>
              <select
                id={`${uid}-costtype`}
                name="cost_type"
                defaultValue={
                  record?.cost_type ?? defaultCostType ?? "other_operating_costs"
                }
                className={SELECT_CLS}
              >
                {COST_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Lieferant (optional)" htmlFor={`${uid}-vendor`}>
              <Input
                id={`${uid}-vendor`}
                name="vendor"
                defaultValue={record?.vendor ?? ""}
              />
            </Field>

            <Field label="Rechnungsnummer (optional)" htmlFor={`${uid}-invnr`}>
              <Input
                id={`${uid}-invnr`}
                name="invoice_number"
                defaultValue={record?.invoice_number ?? ""}
              />
            </Field>

            <Field label="Rechnungsdatum" htmlFor={`${uid}-invdate`}>
              <Input
                id={`${uid}-invdate`}
                name="invoice_date"
                type="date"
                required
                defaultValue={record?.invoice_date ?? ""}
              />
            </Field>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${uid}-paiddate`}>Zahlungsdatum (optional)</Label>
              <Input
                id={`${uid}-paiddate`}
                name="paid_date"
                type="date"
                defaultValue={record?.paid_date ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                Maßgeblich für die EÜR (Jahr der Zahlung). Der Abrechnungszeitraum
                steuert die Nebenkostenabrechnung.
              </p>
            </div>

            <Field label="Betrag brutto (€)" htmlFor={`${uid}-gross`}>
              <Input
                id={`${uid}-gross`}
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

            <Field label="USt-Satz" htmlFor={`${uid}-vat`}>
              <select
                id={`${uid}-vat`}
                name="vat_rate"
                defaultValue={
                  record?.vat_rate != null ? String(record.vat_rate) : "19"
                }
                className={SELECT_CLS}
              >
                {VAT_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r} %
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Umlagefähiger Betrag (€)" htmlFor={`${uid}-amount`}>
              <Input
                id={`${uid}-amount`}
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

            <Field label="Umlageschlüssel" htmlFor={`${uid}-alloc`}>
              {/* Sichtbare Auswahl (inkl. Direkt-Untervarianten) – der reale
                  allocation_key wird als hidden Feld übermittelt. */}
              <input type="hidden" name="allocation_key" value={allocKeyValue} />
              <select
                id={`${uid}-alloc`}
                value={alloc}
                onChange={(e) => setAlloc(e.target.value)}
                className={SELECT_CLS}
              >
                {ALLOCATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                <option value="direct_unit">Direktzuordnung (Einheit)</option>
                <option value="direct_tenant">
                  Direktzuordnung (Mietverhältnis)
                </option>
              </select>
            </Field>

            {alloc === "direct_unit" ? (
              <Field label="Einheit" htmlFor={`${uid}-unit`}>
                <select
                  key={`unit-${propertyId}`}
                  id={`${uid}-unit`}
                  name="unit_id"
                  required
                  defaultValue={record?.unit_id ?? ""}
                  className={SELECT_CLS}
                >
                  <option value="" disabled>
                    — Einheit wählen —
                  </option>
                  {unitsForProperty.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            {alloc === "direct_tenant" ? (
              <Field label="Mietverhältnis" htmlFor={`${uid}-tenant`}>
                <select
                  key={`tenant-${propertyId}`}
                  id={`${uid}-tenant`}
                  name="tenant_id"
                  required
                  defaultValue={record?.tenant_id ?? ""}
                  className={SELECT_CLS}
                >
                  <option value="" disabled>
                    — Mietverhältnis wählen —
                  </option>
                  {tenantsForProperty.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                      {t.active ? "" : " (beendet)"}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}

            <Field label="Abrechnung von" htmlFor={`${uid}-start`}>
              <Input
                id={`${uid}-start`}
                name="billing_period_start"
                type="date"
                required
                defaultValue={
                  record?.billing_period_start ??
                  defaultPeriodStart ??
                  `${year}-01-01`
                }
              />
            </Field>

            <Field label="Abrechnung bis" htmlFor={`${uid}-end`}>
              <Input
                id={`${uid}-end`}
                name="billing_period_end"
                type="date"
                required
                defaultValue={
                  record?.billing_period_end ??
                  defaultPeriodEnd ??
                  `${year}-12-31`
                }
              />
            </Field>
          </div>

          {alloc === "direct_tenant" ? (
            <p className="-mt-1 text-xs text-muted-foreground">
              Die Kosten werden zu 100 % dem gewählten Mietverhältnis zugeordnet
              (unabhängig von den Miettagen).
            </p>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
            <span className="text-sm font-medium text-neutral-700">
              Umlagefähig
            </span>
            <Switch checked={apportionable} onCheckedChange={setApportionable} />
          </div>

          <Field label="Notiz (optional)" htmlFor={`${uid}-notes`}>
            <Textarea
              id={`${uid}-notes`}
              name="notes"
              rows={2}
              defaultValue={record?.notes ?? ""}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${uid}-file`}>
              Beleg (PDF/JPG/PNG, max. 10 MB – optional)
            </Label>
            <input
              id={`${uid}-file`}
              name="receipt"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200"
            />
            {mode === "edit" && record?.receipt_url ? (
              <p className="text-xs text-muted-foreground">
                Es ist bereits ein Beleg hinterlegt. Eine neue Datei ersetzt ihn.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <SubmitButton
              label={mode === "edit" ? "Änderungen speichern" : "Beleg speichern"}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
