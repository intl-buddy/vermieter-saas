"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type AuthState } from "../actions";
import styles from "../auth.module.css";

const initialState: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? "Anmelden …" : "Anmelden"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Anmelden</h1>
        <p className={styles.subtitle}>
          Willkommen zurück. Bitte melde dich mit deinem Konto an.
        </p>

        <form action={formAction} className={styles.form}>
          {state.error ? <div className={styles.error}>{state.error}</div> : null}

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
              autoComplete="current-password"
              required
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          <SubmitButton />
        </form>

        <p className={styles.footer}>
          Noch kein Konto?{" "}
          <Link href="/registrieren" className={styles.link}>
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
