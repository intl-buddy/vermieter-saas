"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { endTenancy, type FormState } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Wird beendet …" : "Mietverhältnis beenden"}
    </Button>
  );
}

export function EndTenancyDialog({
  tenantId,
  propertyId,
  moveInDate,
  open,
  onOpenChange,
}: {
  tenantId: string;
  propertyId: string;
  moveInDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(endTenancy, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mietverhältnis beenden</DialogTitle>
          <DialogDescription>
            Lege das Auszugsdatum fest, um dieses Mietverhältnis zu beenden.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={tenantId} />
          <input type="hidden" name="property_id" value={propertyId} />
          <input type="hidden" name="move_in_date" value={moveInDate} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="move-out-date">Auszugsdatum</Label>
            <Input
              id="move-out-date"
              name="move_out_date"
              type="date"
              required
              min={moveInDate}
            />
          </div>

          <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            Das Mietverhältnis wird beendet. Danach kann ein neuer Mieter für
            diese Einheit angelegt werden. Offene Forderungen bleiben bestehen.
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Abbrechen</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
