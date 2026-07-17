"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Receipt, ClipboardList, Euro, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PropertyForm } from "@/app/objekte/PropertyForm";
import { UnitForm } from "@/app/objekte/[id]/UnitForm";
import { TenantForm } from "@/app/objekte/[id]/TenantForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StepInfo } from "./StepInfo";
import {
  OnboardingAbsenderForm,
  type AbsenderValues,
} from "./OnboardingAbsenderForm";
import { completeOnboarding } from "./actions";

const STEPS = ["Absenderdaten", "Objekt", "Einheit", "Mietverhältnis"];

export type OnboardingProps = {
  step: number;
  firstUnfinished: number;
  showSuccess: boolean;
  absender: AbsenderValues;
  propertyId: string | null;
  propertyName: string | null;
  unitId: string | null;
  unitLabel: string | null;
};

export function OnboardingClient(props: OnboardingProps) {
  const router = useRouter();
  const [completing, startComplete] = useTransition();

  function goToStep(n: number) {
    router.push(`/willkommen?schritt=${n}`);
    router.refresh();
  }

  function goNext() {
    goToStep(props.step + 1);
  }

  function finish() {
    startComplete(async () => {
      const res = await completeOnboarding();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.push("/willkommen?fertig=1");
      router.refresh();
    });
  }

  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="text-lg font-extrabold tracking-tight text-secondary">
            tefter
            <span
              className="ml-0.5 inline-block size-1.5 rounded-full bg-gold-500 align-baseline"
              aria-hidden
            />
          </span>
          {!props.showSuccess ? (
            <Link
              href="/dashboard"
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Später einrichten
            </Link>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {props.showSuccess ? (
          <SuccessScreen />
        ) : (
          <Wizard {...props} goToStep={goToStep} goNext={goNext} finish={finish} completing={completing} />
        )}
      </main>
    </div>
  );
}

function Wizard({
  step,
  firstUnfinished,
  absender,
  propertyId,
  propertyName,
  unitId,
  unitLabel,
  goToStep,
  goNext,
  finish,
  completing,
}: OnboardingProps & {
  goToStep: (n: number) => void;
  goNext: () => void;
  finish: () => void;
  completing: boolean;
}) {
  return (
    <div>
      {/* Fortschrittsleiste */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary-100 text-primary-700"
                      : "bg-neutral-100 text-neutral-400",
                )}
              >
                {n}
              </div>
              {i < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded",
                    done ? "bg-primary-200" : "bg-neutral-100",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <h1 className="mb-1 text-2xl font-bold tracking-tight">{STEPS[step - 1]}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Schritt {step} von {STEPS.length}
      </p>

      <StepInfo step={step} />

      {step === 1 ? (
        <OnboardingAbsenderForm values={absender} onSuccess={goNext} />
      ) : null}

      {step === 2 ? (
        <PropertyForm mode="create" onSuccess={goNext} />
      ) : null}

      {step === 3 ? (
        propertyId ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Einheit für Objekt <strong>{propertyName}</strong>.
            </p>
            <PropertyGuardCard>
              <UnitForm mode="create" propertyId={propertyId} onSuccess={goNext} />
            </PropertyGuardCard>
          </div>
        ) : (
          <MissingPrerequisite
            text="Bitte lege zuerst ein Objekt an."
            onBack={() => goToStep(2)}
          />
        )
      ) : null}

      {step === 4 ? (
        unitId && propertyId ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Mietverhältnis für Einheit <strong>{unitLabel}</strong>.
            </p>
            <PropertyGuardCard>
              <TenantForm
                unitId={unitId}
                propertyId={propertyId}
                onSuccess={finish}
              />
            </PropertyGuardCard>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Die Einheit steht aktuell leer? Du kannst das Mietverhältnis
                  später anlegen.
                </div>
                <Button variant="outline" onClick={finish} disabled={completing}>
                  {completing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Wird abgeschlossen …
                    </>
                  ) : (
                    "Einheit steht aktuell leer"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <MissingPrerequisite
            text="Bitte lege zuerst eine Einheit an."
            onBack={() => goToStep(3)}
          />
        )
      ) : null}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => goToStep(step - 1)}>
            Zurück
          </Button>
        ) : (
          <span />
        )}
        {/* „Weiter" nur, wenn dieser Schritt bereits erledigt ist (Wiedereinstieg) */}
        {step < firstUnfinished ? (
          step === 4 ? (
            <Button onClick={finish} disabled={completing}>
              Abschließen
            </Button>
          ) : (
            <Button onClick={goNext}>Weiter</Button>
          )
        ) : null}
      </div>
    </div>
  );
}

/** Rahmenlose Hülle, damit die wiederverwendeten Formulare gleich aussehen. */
function PropertyGuardCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

function MissingPrerequisite({
  text,
  onBack,
}: {
  text: string;
  onBack: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm text-muted-foreground">{text}</p>
        <Button variant="outline" onClick={onBack}>
          Zurück
        </Button>
      </CardContent>
    </Card>
  );
}

const NEXT_CARDS = [
  {
    href: "/belege",
    icon: Receipt,
    iconBg: "bg-primary-100 text-primary-700",
    title: "Beleg erfassen",
    subtitle: "Rechnung hochladen und zuordnen",
  },
  {
    href: "/aufgaben/wiederkehrend",
    icon: ClipboardList,
    iconBg: "bg-gold-100 text-gold-700",
    title: "Aufgaben-Vorlagen ansehen",
    subtitle: "Wiederkehrende Aufgaben einrichten",
  },
  {
    href: "/mieteingang",
    icon: Euro,
    iconBg: "bg-secondary-100 text-secondary-700",
    title: "Zur Mieteingangskontrolle",
    subtitle: "Sehen, wer schon bezahlt hat",
  },
];

function SuccessScreen() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
        Alles bereit! 🎉
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-neutral-600">
        Deine Einrichtung ist abgeschlossen. Hier sind ein paar sinnvolle
        nächste Schritte.
      </p>

      <h2 className="mt-10 self-start text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Was du als Nächstes tun kannst
      </h2>
      <div className="mt-3 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {NEXT_CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group block rounded-xl border border-neutral-200 border-t-2 border-t-gold-400 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  c.iconBg,
                )}
              >
                <Icon className="size-5" />
              </span>
              <div className="mt-3 font-semibold text-foreground">{c.title}</div>
              <div className="text-sm text-muted-foreground">{c.subtitle}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10">
        <Button asChild size="lg">
          <Link href="/dashboard">Weiter zum Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
