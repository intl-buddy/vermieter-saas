"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { markDunningSent, type DunningState } from "../dunningActions";
import { Button } from "@/components/ui/button";

const initialState: DunningState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? "…" : "Als versendet markieren"}
    </Button>
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

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={dunningId} />
      <input type="hidden" name="tenant_id" value={tenantId} />
      <SubmitButton />
    </form>
  );
}
