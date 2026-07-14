"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createTenant, type FormState } from "../actions";
import styles from "../objekte.module.css";

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
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "Wird gespeichert …" : "Mietverhältnis anlegen"}
    </button>
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
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      <input type="hidden" name="unit_id" value={unitId} />
      <input type="hidden" name="property_id" value={propertyId} />

      {state.error ? <div className={styles.formError}>{state.error}</div> : null}
      {state.success ? (
        <div className={styles.formSuccess}>{state.success}</div>
      ) : null}

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-first_name`} className={styles.label}>
            Vorname
          </label>
          <input
            id={`${unitId}-first_name`}
            name="first_name"
            type="text"
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-last_name`} className={styles.label}>
            Nachname
          </label>
          <input
            id={`${unitId}-last_name`}
            name="last_name"
            type="text"
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-email`} className={styles.label}>
            E-Mail (optional)
          </label>
          <input
            id={`${unitId}-email`}
            name="email"
            type="email"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-phone`} className={styles.label}>
            Telefon (optional)
          </label>
          <input
            id={`${unitId}-phone`}
            name="phone"
            type="tel"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-persons_count`} className={styles.label}>
            Personen
          </label>
          <input
            id={`${unitId}-persons_count`}
            name="persons_count"
            type="number"
            min="1"
            step="1"
            defaultValue="1"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-move_in_date`} className={styles.label}>
            Einzugsdatum
          </label>
          <input
            id={`${unitId}-move_in_date`}
            name="move_in_date"
            type="date"
            required
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-cold_rent`} className={styles.label}>
            Kaltmiete (€)
          </label>
          <input
            id={`${unitId}-cold_rent`}
            name="cold_rent"
            type="number"
            min="0"
            step="0.01"
            required
            className={styles.input}
            placeholder="z. B. 650,00"
          />
        </div>
        <div className={styles.field}>
          <label
            htmlFor={`${unitId}-operating_costs_advance`}
            className={styles.label}
          >
            NK-Vorauszahlung (€)
          </label>
          <input
            id={`${unitId}-operating_costs_advance`}
            name="operating_costs_advance"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label
            htmlFor={`${unitId}-heating_costs_advance`}
            className={styles.label}
          >
            Heizkosten-Vorauszahlung (€)
          </label>
          <input
            id={`${unitId}-heating_costs_advance`}
            name="heating_costs_advance"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-rent_due_day`} className={styles.label}>
            Fälligkeitstag (1–28)
          </label>
          <input
            id={`${unitId}-rent_due_day`}
            name="rent_due_day"
            type="number"
            min="1"
            max="28"
            step="1"
            defaultValue="3"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-deposit_type`} className={styles.label}>
            Kautionsart
          </label>
          <select
            id={`${unitId}-deposit_type`}
            name="deposit_type"
            defaultValue="cash_deposit"
            className={styles.select}
          >
            {DEPOSIT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${unitId}-deposit_amount`} className={styles.label}>
            Kautionshöhe (€)
          </label>
          <input
            id={`${unitId}-deposit_amount`}
            name="deposit_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className={styles.input}
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
