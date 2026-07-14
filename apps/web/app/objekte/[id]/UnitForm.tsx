"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createUnit, updateUnit, type FormState } from "../actions";
import styles from "../objekte.module.css";

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
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "Wird gespeichert …" : label}
    </button>
  );
}

export function UnitForm({
  mode,
  propertyId,
  unit,
}: {
  mode: "create" | "edit";
  propertyId: string;
  unit?: UnitValues;
}) {
  const action = mode === "create" ? createUnit : updateUnit;
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = unit?.id ?? "new";

  useEffect(() => {
    if (state.success && mode === "create") {
      formRef.current?.reset();
    }
  }, [state.success, mode]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      <input type="hidden" name="property_id" value={propertyId} />
      {mode === "edit" && unit ? (
        <input type="hidden" name="id" value={unit.id} />
      ) : null}

      {state.error ? <div className={styles.formError}>{state.error}</div> : null}
      {state.success ? (
        <div className={styles.formSuccess}>{state.success}</div>
      ) : null}

      <div className={styles.formRow}>
        <div className={`${styles.field} ${styles.grow}`}>
          <label htmlFor={`${uid}-label`} className={styles.label}>
            Bezeichnung
          </label>
          <input
            id={`${uid}-label`}
            name="label"
            type="text"
            required
            defaultValue={unit?.label ?? ""}
            className={styles.input}
            placeholder="z. B. EG links, WE 03"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${uid}-unit_type`} className={styles.label}>
            Art
          </label>
          <select
            id={`${uid}-unit_type`}
            name="unit_type"
            defaultValue={unit?.unit_type ?? "residential"}
            className={styles.select}
          >
            {UNIT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor={`${uid}-floor`} className={styles.label}>
            Etage (optional)
          </label>
          <input
            id={`${uid}-floor`}
            name="floor"
            type="text"
            defaultValue={unit?.floor ?? ""}
            className={styles.input}
            placeholder="z. B. EG, 1. OG, DG"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${uid}-living_area`} className={styles.label}>
            Wohnfläche in m² (optional)
          </label>
          <input
            id={`${uid}-living_area`}
            name="living_area"
            type="number"
            min="0"
            step="0.01"
            defaultValue={unit?.living_area ?? ""}
            className={styles.input}
            placeholder="z. B. 72,50"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${uid}-rooms`} className={styles.label}>
            Zimmer (optional)
          </label>
          <input
            id={`${uid}-rooms`}
            name="rooms"
            type="number"
            min="0"
            step="0.5"
            defaultValue={unit?.rooms ?? ""}
            className={styles.input}
            placeholder="z. B. 2,5"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${uid}-unit-notes`} className={styles.label}>
          Notizen (optional)
        </label>
        <textarea
          id={`${uid}-unit-notes`}
          name="notes"
          rows={2}
          defaultValue={unit?.notes ?? ""}
          className={styles.textarea}
        />
      </div>

      <SubmitButton
        label={mode === "create" ? "Einheit anlegen" : "Änderungen speichern"}
      />
    </form>
  );
}
