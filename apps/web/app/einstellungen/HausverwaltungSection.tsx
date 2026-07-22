"use client";

import { useState, useTransition } from "react";
import { Building2, ShieldCheck } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { linkAccount, unlinkAccount } from "./hausverwaltung-actions";

/** Formatiert ein ISO-Datum als deutsches Datum. */
function formatGrantedAt(iso: string | null): string {
  if (!iso) return "–";
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
 * Abschnitt „Hausverwaltung": ermöglicht dem Owner, sein Konto mit der OA
 * Hausverwaltung zu verknüpfen (Freigabe-Modell, KEINE Passwort-Weitergabe)
 * bzw. eine bestehende Verknüpfung wieder aufzuheben. Beides hinter einem
 * Bestätigungsdialog mit Pflicht-Checkbox.
 */
export function HausverwaltungSection({
  linkedAt,
}: {
  /** ISO-Zeitpunkt der aktiven Verknüpfung, oder null. */
  linkedAt: string | null;
}) {
  const isLinked = Boolean(linkedAt);

  const [linkAgreed, setLinkAgreed] = useState(false);
  const [unlinkAgreed, setUnlinkAgreed] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onLink() {
    startTransition(async () => {
      const res = await linkAccount();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Konto verknüpft.");
      setLinkOpen(false);
      setLinkAgreed(false);
    });
  }

  function onUnlink() {
    startTransition(async () => {
      const res = await unlinkAccount();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Verknüpfung aufgehoben.");
      setUnlinkOpen(false);
      setUnlinkAgreed(false);
    });
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-secondary-700">
            <Building2 className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            {isLinked ? (
              <>
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Mit der OA Hausverwaltung verknüpft
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Verknüpft seit {formatGrantedAt(linkedAt)}. Die OA
                  Hausverwaltung kann deine Unterlagen einsehen sowie Dokumente
                  hochladen, erstellen und bearbeiten. Deine Abo- und
                  Kontoeinstellungen bleiben ausgenommen.
                </p>

                <Dialog open={unlinkOpen} onOpenChange={setUnlinkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mt-3">
                      Verknüpfung zur OA Hausverwaltung aufheben
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Verknüpfung aufheben</DialogTitle>
                      <DialogDescription>
                        Die OA Hausverwaltung verliert damit sofort jeden
                        Zugriff auf dein Konto.
                      </DialogDescription>
                    </DialogHeader>

                    <label className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={unlinkAgreed}
                        onChange={(e) => setUnlinkAgreed(e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 rounded border-neutral-300"
                      />
                      <span>
                        Mir ist bewusst, dass die OA Hausverwaltung danach keinen
                        Zugriff mehr auf meine Daten hat.
                      </span>
                    </label>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost" disabled={pending}>
                          Abbrechen
                        </Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={onUnlink}
                        disabled={!unlinkAgreed || pending}
                      >
                        {pending ? "Wird aufgehoben …" : "Verknüpfung aufheben"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <div className="font-medium">Hausverwaltung</div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Gib der OA Hausverwaltung Zugriff auf dein Konto, damit sie
                  deine Immobilien für dich verwalten kann – ganz ohne
                  Passwort-Weitergabe.
                </p>

                <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-3">
                      Mit der OA Hausverwaltung verknüpfen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mit der OA Hausverwaltung verknüpfen</DialogTitle>
                      <DialogDescription>
                        Die OA Hausverwaltung (Omer Alic, oa-hausverwaltung.de)
                        erhält damit Zugriff auf dein Konto: Sie kann alle deine
                        Unterlagen einsehen sowie Dokumente hochladen, erstellen
                        und bearbeiten. Die Verarbeitung erfolgt im Rahmen eines
                        Verwaltungsauftrags zwischen dir und der OA
                        Hausverwaltung. Du kannst die Verknüpfung jederzeit hier
                        aufheben.
                      </DialogDescription>
                    </DialogHeader>

                    <label className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={linkAgreed}
                        onChange={(e) => setLinkAgreed(e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 rounded border-neutral-300"
                      />
                      <span>Ich habe den Hinweis gelesen und stimme zu.</span>
                    </label>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost" disabled={pending}>
                          Abbrechen
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={onLink}
                        disabled={!linkAgreed || pending}
                      >
                        {pending ? "Wird verknüpft …" : "Verknüpfen"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
