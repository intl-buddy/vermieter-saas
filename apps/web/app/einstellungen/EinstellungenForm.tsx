"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { updateProfile, type ProfileState } from "./actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      {pending ? "Wird gespeichert …" : "Profil speichern"}
    </Button>
  );
}

export function EinstellungenForm({ profile }: { profile: ProfileValues }) {
  const [state, formAction] = useActionState(updateProfile, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Absender & Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="full_name" label="Name">
            <Input
              id="full_name"
              name="full_name"
              required
              defaultValue={profile.full_name}
            />
          </Field>
          <Field id="company_name" label="Firma (optional)">
            <Input
              id="company_name"
              name="company_name"
              defaultValue={profile.company_name ?? ""}
            />
          </Field>
          <Field id="address_street" label="Straße und Hausnummer">
            <Input
              id="address_street"
              name="address_street"
              defaultValue={profile.address_street ?? ""}
            />
          </Field>
          <Field id="phone" label="Telefon">
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
            />
          </Field>
          <Field id="address_zip" label="PLZ">
            <Input
              id="address_zip"
              name="address_zip"
              inputMode="numeric"
              defaultValue={profile.address_zip ?? ""}
            />
          </Field>
          <Field id="address_city" label="Ort">
            <Input
              id="address_city"
              name="address_city"
              defaultValue={profile.address_city ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bankverbindung</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="iban" label="IBAN">
            <Input
              id="iban"
              name="iban"
              defaultValue={profile.iban ?? ""}
              placeholder="DE00 0000 0000 0000 0000 00"
            />
          </Field>
          <Field id="bank_name" label="Bank (optional)">
            <Input
              id="bank_name"
              name="bank_name"
              defaultValue={profile.bank_name ?? ""}
            />
          </Field>
          <Field id="bic" label="BIC (optional)">
            <Input id="bic" name="bic" defaultValue={profile.bic ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mahnwesen</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="dunning_fee" label="Mahngebühr (€)">
            <Input
              id="dunning_fee"
              name="dunning_fee"
              type="number"
              min="0"
              step="0.01"
              defaultValue={profile.dunning_fee}
            />
          </Field>
          <Field id="dunning_deadline_days" label="Zahlungsfrist (Tage)">
            <Input
              id="dunning_deadline_days"
              name="dunning_deadline_days"
              type="number"
              min="1"
              max="90"
              step="1"
              defaultValue={profile.dunning_deadline_days}
            />
          </Field>
        </CardContent>
      </Card>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
