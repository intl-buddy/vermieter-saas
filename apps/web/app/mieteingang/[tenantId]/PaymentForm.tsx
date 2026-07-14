"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { recordPayment, type PaymentState } from "../actions";
import styles from "./detail.module.css";

const initialState: PaymentState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "Wird gespeichert …" : "Zahlung erfassen"}
    </button>
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
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      <input type="hidden" name="tenant_id" value={tenantId} />

      {state.error ? <div className={styles.formError}>{state.error}</div> : null}
      {state.success ? (
        <div className={styles.formSuccess}>{state.success}</div>
      ) : null}

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor="amount" className={styles.label}>
            Betrag (€)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            className={styles.input}
            placeholder="z. B. 750,00 (negativ = Rückbuchung)"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="paid_at" className={styles.label}>
            Wertstellungsdatum
          </label>
          <input
            id="paid_at"
            name="paid_at"
            type="date"
            required
            defaultValue={todayIso()}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="payer" className={styles.label}>
            Zahler
          </label>
          <select
            id="payer"
            name="payer"
            defaultValue="tenant"
            className={styles.input}
          >
            <option value="tenant">Mieter</option>
            <option value="jobcenter">Jobcenter</option>
            <option value="other">Sonstige</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="bank_reference" className={styles.label}>
          Verwendungszweck
        </label>
        <input
          id="bank_reference"
          name="bank_reference"
          type="text"
          className={styles.input}
          placeholder="z. B. Miete Juli 2026"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="notes" className={styles.label}>
          Notiz
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className={styles.textarea}
          placeholder="Interne Anmerkung (optional)"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
