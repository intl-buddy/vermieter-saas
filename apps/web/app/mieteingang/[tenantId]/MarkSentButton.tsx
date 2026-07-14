"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { markDunningSent, type DunningState } from "../dunningActions";
import styles from "./detail.module.css";

const initialState: DunningState = {};

function Button() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.markSentBtn} disabled={pending}>
      {pending ? "…" : "Als versendet markieren"}
    </button>
  );
}

export function MarkSentButton({
  dunningId,
  tenantId,
}: {
  dunningId: string;
  tenantId: string;
}) {
  const [state, formAction] = useActionState(markDunningSent, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={dunningId} />
      <input type="hidden" name="tenant_id" value={tenantId} />
      <Button />
      {state.error ? (
        <span className={styles.error} style={{ marginLeft: 8 }}>
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
