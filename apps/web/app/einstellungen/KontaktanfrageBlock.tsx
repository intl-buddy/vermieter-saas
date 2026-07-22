"use client";

import { useState, useTransition } from "react";
import { PhoneCall, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitManagementInquiry } from "./hausverwaltung-actions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ISO-Datum als deutsches Datum. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "–";
  }
}

/**
 * „Verwaltung abgeben"-Unterbereich: Nutzer ohne Verwaltungsvertrag können sich
 * unverbindlich von der OA Hausverwaltung kontaktieren lassen. Liegt bereits
 * eine offene Anfrage vor, erscheint statt des Buttons eine Statuszeile.
 */
export function KontaktanfrageBlock({
  defaults,
  inquiry,
}: {
  defaults: { name: string; email: string; phone: string };
  /** Offene Anfrage (status 'new'/'contacted'), sonst null. */
  inquiry: { createdAt: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaults.name);
  const [email, setEmail] = useState(defaults.email);
  const [phone, setPhone] = useState(defaults.phone);
  const [pending, startTransition] = useTransition();

  const valid =
    name.trim().length > 0 &&
    EMAIL_REGEX.test(email.trim()) &&
    phone.trim().length >= 6;

  function onSubmit() {
    if (!valid) return;
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("email", email.trim());
    formData.set("phone", phone.trim());
    startTransition(async () => {
      const res = await submitManagementInquiry(formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Anfrage gesendet – wir melden uns bei dir!");
      setOpen(false);
    });
  }

  return (
    <div className="mb-4 rounded-xl border border-secondary-100 bg-secondary-50 p-4">
      <div className="font-medium text-secondary-900">
        Noch kein Verwaltungsvertrag?
      </div>
      <p className="mt-0.5 text-sm text-secondary-800">
        Du möchtest die Verwaltung abgeben? Die OA Hausverwaltung meldet sich
        unverbindlich bei dir.
      </p>

      {inquiry ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>
            Anfrage gesendet am {formatDate(inquiry.createdAt)} – die OA
            Hausverwaltung meldet sich bei dir.
          </span>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-3">
              <PhoneCall className="size-4" />
              Von der OA Hausverwaltung kontaktieren lassen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kontaktieren lassen</DialogTitle>
              <DialogDescription>
                Trag deine Kontaktdaten ein – die OA Hausverwaltung meldet sich
                unverbindlich bei dir.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inquiry-name">Name</Label>
                <Input
                  id="inquiry-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vor- und Nachname"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inquiry-email">E-Mail</Label>
                <Input
                  id="inquiry-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inquiry-phone">Telefonnummer</Label>
                <Input
                  id="inquiry-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="z. B. 0170 1234567"
                />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Mit dem Absenden werden Name, E-Mail und Telefonnummer an die OA
              Hausverwaltung (oa-hausverwaltung.de) übermittelt, damit diese dich
              zur Kontaktaufnahme erreichen kann.
            </p>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" disabled={pending}>
                  Abbrechen
                </Button>
              </DialogClose>
              <Button onClick={onSubmit} disabled={!valid || pending}>
                {pending ? "Wird gesendet …" : "Anfrage senden"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
