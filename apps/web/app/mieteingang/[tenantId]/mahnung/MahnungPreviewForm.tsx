"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createDunning, type DunningState } from "../../dunningActions";
import { formatCurrency, formatMonth } from "../../../../lib/format";
import styles from "../detail.module.css";

const initialState: DunningState = {};

export type PreviewCharge = {
  period: string;
  totalAmount: number;
  openAmount: number;
};

function parseFee(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "Mahnung wird erzeugt …" : "Mahnung erzeugen"}
    </button>
  );
}

export function MahnungPreviewForm({
  tenantId,
  suggestedLevel,
  dunningFee,
  charges,
  defaultDeadline,
  hint,
}: {
  tenantId: string;
  suggestedLevel: number;
  dunningFee: number;
  charges: PreviewCharge[];
  defaultDeadline: string;
  hint: string | null;
}) {
  const [state, formAction] = useActionState(createDunning, initialState);
  const [level, setLevel] = useState(suggestedLevel);
  const [feeStr, setFeeStr] = useState(
    suggestedLevel === 1 ? "0" : String(dunningFee),
  );

  const openTotal = charges.reduce((sum, c) => sum + c.openAmount, 0);
  const total = openTotal + parseFee(feeStr);

  function onLevelChange(next: number) {
    setLevel(next);
    // Standard-Mahngebühr je Stufe (weiterhin editierbar).
    setFeeStr(next === 1 ? "0" : String(dunningFee));
  }

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="tenant_id" value={tenantId} />

      {state.error ? <div className={styles.formError}>{state.error}</div> : null}
      {hint ? <div className={styles.warn}>{hint}</div> : null}

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label htmlFor="level" className={styles.label}>
            Mahnstufe
          </label>
          <select
            id="level"
            name="level"
            value={level}
            onChange={(e) => onLevelChange(Number(e.target.value))}
            className={styles.input}
          >
            <option value={1}>Stufe 1 – Zahlungserinnerung</option>
            <option value={2}>Stufe 2 – Mahnung</option>
            <option value={3}>Stufe 3 – Letzte Mahnung</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="fee" className={styles.label}>
            Mahngebühr (€)
          </label>
          <input
            id="fee"
            name="fee"
            type="number"
            min="0"
            step="0.01"
            value={feeStr}
            onChange={(e) => setFeeStr(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="payment_deadline" className={styles.label}>
            Zahlungsfrist
          </label>
          <input
            id="payment_deadline"
            name="payment_deadline"
            type="date"
            required
            defaultValue={defaultDeadline}
            className={styles.input}
          />
        </div>
      </div>

      <div>
        <h2 className={styles.sectionTitle}>Offene Monate</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thLeft}>Monat</th>
                <th className={styles.thRight}>Sollbetrag</th>
                <th className={styles.thRight}>Offener Betrag</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c) => (
                <tr key={c.period}>
                  <td className={styles.tdLeft}>{formatMonth(c.period)}</td>
                  <td className={styles.tdRight}>
                    {formatCurrency(c.totalAmount)}
                  </td>
                  <td className={`${styles.tdRight} ${styles.open}`}>
                    {formatCurrency(c.openAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.summaryBox}>
        <div className={styles.summaryRow}>
          <span>Summe offener Mieten</span>
          <span>{formatCurrency(openTotal)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Mahngebühr</span>
          <span>{formatCurrency(parseFee(feeStr))}</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <span>Zahlbetrag gesamt</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <p className={styles.note}>
        Bei Bestätigung wird das PDF erzeugt, im privaten Bucket „dunning"
        gespeichert und die Mahnung als Entwurf angelegt.
      </p>

      <SubmitButton />
    </form>
  );
}
