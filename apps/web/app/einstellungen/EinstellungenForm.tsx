"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile, type ProfileState } from "./actions";
import styles from "./einstellungen.module.css";

const initialState: ProfileState = {};

type ProfileValues = {
  full_name: string;
  company_name: string | null;
  address_street: string | null;
  address_zip: string | null;
  address_city: string | null;
  phone: string | null;
  iban: string | null;
  bank_name: string | null;
  bic: string | null;
  dunning_fee: number;
  dunning_deadline_days: number;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "Wird gespeichert …" : "Profil speichern"}
    </button>
  );
}

export function EinstellungenForm({ profile }: { profile: ProfileValues }) {
  const [state, formAction] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className={styles.form}>
      {state.error ? <div className={styles.formError}>{state.error}</div> : null}
      {state.success ? (
        <div className={styles.formSuccess}>{state.success}</div>
      ) : null}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Absender & Kontakt</legend>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="full_name" className={styles.label}>
              Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={profile.full_name}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="company_name" className={styles.label}>
              Firma (optional)
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              defaultValue={profile.company_name ?? ""}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="address_street" className={styles.label}>
              Straße und Hausnummer
            </label>
            <input
              id="address_street"
              name="address_street"
              type="text"
              defaultValue={profile.address_street ?? ""}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="phone" className={styles.label}>
              Telefon
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="address_zip" className={styles.label}>
              PLZ
            </label>
            <input
              id="address_zip"
              name="address_zip"
              type="text"
              inputMode="numeric"
              defaultValue={profile.address_zip ?? ""}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="address_city" className={styles.label}>
              Ort
            </label>
            <input
              id="address_city"
              name="address_city"
              type="text"
              defaultValue={profile.address_city ?? ""}
              className={styles.input}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Bankverbindung</legend>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="iban" className={styles.label}>
              IBAN
            </label>
            <input
              id="iban"
              name="iban"
              type="text"
              defaultValue={profile.iban ?? ""}
              className={styles.input}
              placeholder="DE00 0000 0000 0000 0000 00"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="bank_name" className={styles.label}>
              Bank (optional)
            </label>
            <input
              id="bank_name"
              name="bank_name"
              type="text"
              defaultValue={profile.bank_name ?? ""}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="bic" className={styles.label}>
              BIC (optional)
            </label>
            <input
              id="bic"
              name="bic"
              type="text"
              defaultValue={profile.bic ?? ""}
              className={styles.input}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Mahnwesen</legend>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="dunning_fee" className={styles.label}>
              Mahngebühr (€)
            </label>
            <input
              id="dunning_fee"
              name="dunning_fee"
              type="number"
              min="0"
              step="0.01"
              defaultValue={profile.dunning_fee}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="dunning_deadline_days" className={styles.label}>
              Zahlungsfrist (Tage)
            </label>
            <input
              id="dunning_deadline_days"
              name="dunning_deadline_days"
              type="number"
              min="1"
              max="90"
              step="1"
              defaultValue={profile.dunning_deadline_days}
              className={styles.input}
            />
          </div>
        </div>
      </fieldset>

      <SubmitButton />
    </form>
  );
}
