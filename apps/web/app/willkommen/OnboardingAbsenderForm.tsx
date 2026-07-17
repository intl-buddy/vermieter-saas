"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { saveAbsenderdaten, type OnboardingState } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: OnboardingState = {};

export type AbsenderValues = {
  full_name: string;
  company_name: string;
  address_street: string;
  address_zip: string;
  address_city: string;
  phone: string;
  iban: string;
  bank_name: string;
  bic: string;
};

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : "Speichern & weiter"}
    </Button>
  );
}

export function OnboardingAbsenderForm({
  values,
  onSuccess,
}: {
  values: AbsenderValues;
  onSuccess: () => void;
}) {
  const [state, formAction] = useActionState(saveAbsenderdaten, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <Field id="ob-full_name" label="Name">
            <Input
              id="ob-full_name"
              name="full_name"
              required
              defaultValue={values.full_name}
            />
          </Field>
          <Field id="ob-company_name" label="Firma (optional)">
            <Input
              id="ob-company_name"
              name="company_name"
              defaultValue={values.company_name}
            />
          </Field>
          <Field id="ob-address_street" label="Straße und Hausnummer">
            <Input
              id="ob-address_street"
              name="address_street"
              defaultValue={values.address_street}
            />
          </Field>
          <Field id="ob-phone" label="Telefon">
            <Input
              id="ob-phone"
              name="phone"
              type="tel"
              defaultValue={values.phone}
            />
          </Field>
          <Field id="ob-address_zip" label="PLZ">
            <Input
              id="ob-address_zip"
              name="address_zip"
              inputMode="numeric"
              defaultValue={values.address_zip}
            />
          </Field>
          <Field id="ob-address_city" label="Ort">
            <Input
              id="ob-address_city"
              name="address_city"
              defaultValue={values.address_city}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <Field id="ob-iban" label="IBAN">
            <Input
              id="ob-iban"
              name="iban"
              defaultValue={values.iban}
              placeholder="DE00 0000 0000 0000 0000 00"
            />
          </Field>
          <Field id="ob-bank_name" label="Bank (optional)">
            <Input
              id="ob-bank_name"
              name="bank_name"
              defaultValue={values.bank_name}
            />
          </Field>
          <Field id="ob-bic" label="BIC (optional)">
            <Input id="ob-bic" name="bic" defaultValue={values.bic} />
          </Field>
        </CardContent>
      </Card>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
