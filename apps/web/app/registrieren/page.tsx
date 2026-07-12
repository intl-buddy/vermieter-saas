"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { register, type AuthState } from "../actions";
import styles from "../auth.module.css";

const initialState: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? "Konto wird erstellt …" : "Konto erstellen"}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(register, initialState);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Registrieren</h1>
        <p className={styles.subtitle}>
          Erstelle dein Konto und verwalte deine Immobilien.
        </p>

        <form action={formAction} className={styles.form}>
          {state.error ? <div className={styles.error}>{state.error}</div> : null}
          {state.message ? (
            <div className={styles.success}>{state.message}</div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="full_name" className={styles.label}>
              Vollständiger Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              className={styles.input}
              placeholder="Max Mustermann"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={styles.input}
              placeholder="name@beispiel.de"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className={styles.input}
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <SubmitButton />
        </form>

        <p className={styles.footer}>
          Bereits ein Konto?{" "}
          <Link href="/login" className={styles.link}>
            Jetzt anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
