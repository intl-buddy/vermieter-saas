"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { recordPayment, type PaymentState } from "../actions";
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

const initialState: PaymentState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : "Zahlung erfassen"}
    </Button>
  );
}

/** Heutiges Datum als `YYYY-MM-DD` für das Standard-Wertstellungsdatum. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function PaymentForm({ tenantId }: { tenantId: string }) {
  const [state, formAction] = useActionState(recordPayment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Nach erfolgreicher Erfassung das Formular zurücksetzen; die Server Action
  // hat die Daten bereits über revalidatePath neu geladen.
  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="tenant_id" value={tenantId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Betrag (€)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            placeholder="z. B. 750,00 (negativ = Rückbuchung)"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="paid_at">Wertstellungsdatum</Label>
          <Input
            id="paid_at"
            name="paid_at"
            type="date"
            required
            defaultValue={todayIso()}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="payer">Zahler</Label>
          <Select name="payer" defaultValue="tenant">
            <SelectTrigger id="payer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tenant">Mieter</SelectItem>
              <SelectItem value="jobcenter">Jobcenter</SelectItem>
              <SelectItem value="other">Sonstige</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bank_reference">Verwendungszweck</Label>
        <Input
          id="bank_reference"
          name="bank_reference"
          type="text"
          placeholder="z. B. Miete Juli 2026"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notiz</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Interne Anmerkung (optional)"
        />
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
