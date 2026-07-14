"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  createProperty,
  updateProperty,
  type FormState,
} from "./actions";
import styles from "./objekte.module.css";

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
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "Wird gespeichert …" : label}
    </button>
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
    if (state.success && mode === "create") {
      formRef.current?.reset();
    }
  }, [state.success, mode]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      {mode === "edit" && property ? (
        <input type="hidden" name="id" value={property.id} />
      ) : null}

      {state.error ? <div className={styles.formError}>{state.error}</div> : null}
      {state.success ? (
        <div className={styles.formSuccess}>{state.success}</div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor={`${mode}-name`} className={styles.label}>
          Name des Objekts
        </label>
        <input
          id={`${mode}-name`}
          name="name"
          type="text"
          required
          defaultValue={property?.name ?? ""}
          className={styles.input}
          placeholder="z. B. MFH Schützenstraße 12"
        />
      </div>

      <div className={styles.formRow}>
        <div className={`${styles.field} ${styles.grow}`}>
          <label htmlFor={`${mode}-street`} className={styles.label}>
            Straße
          </label>
          <input
            id={`${mode}-street`}
            name="street"
            type="text"
            required
            defaultValue={property?.street ?? ""}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${mode}-house_number`} className={styles.label}>
            Hausnummer
          </label>
          <input
            id={`${mode}-house_number`}
            name="house_number"
            type="text"
            required
            defaultValue={property?.house_number ?? ""}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor={`${mode}-zip`} className={styles.label}>
            PLZ
          </label>
          <input
            id={`${mode}-zip`}
            name="zip"
            type="text"
            inputMode="numeric"
            required
            pattern="[0-9]{5}"
            maxLength={5}
            defaultValue={property?.zip ?? ""}
            className={styles.input}
            placeholder="12345"
          />
        </div>
        <div className={`${styles.field} ${styles.grow}`}>
          <label htmlFor={`${mode}-city`} className={styles.label}>
            Ort
          </label>
          <input
            id={`${mode}-city`}
            name="city"
            type="text"
            required
            defaultValue={property?.city ?? ""}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor={`${mode}-build_year`} className={styles.label}>
            Baujahr (optional)
          </label>
          <input
            id={`${mode}-build_year`}
            name="build_year"
            type="number"
            min="1800"
            max="2100"
            step="1"
            defaultValue={property?.build_year ?? ""}
            className={styles.input}
            placeholder="z. B. 1998"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${mode}-total_living_area`} className={styles.label}>
            Wohnfläche gesamt in m² (optional)
          </label>
          <input
            id={`${mode}-total_living_area`}
            name="total_living_area"
            type="number"
            min="0"
            step="0.01"
            defaultValue={property?.total_living_area ?? ""}
            className={styles.input}
            placeholder="z. B. 420,50"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${mode}-notes`} className={styles.label}>
          Notizen (optional)
        </label>
        <textarea
          id={`${mode}-notes`}
          name="notes"
          rows={2}
          defaultValue={property?.notes ?? ""}
          className={styles.textarea}
        />
      </div>

      <SubmitButton
        label={mode === "create" ? "Objekt anlegen" : "Änderungen speichern"}
      />
    </form>
  );
}
