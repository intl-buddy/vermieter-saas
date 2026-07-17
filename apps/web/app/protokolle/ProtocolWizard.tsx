"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SignaturePad } from "./SignaturePad";
import { PhotoInput } from "./PhotoInput";
import {
  type ProtocolRoom,
  type MeterReading,
  type ProtocolKey,
  type HandoverType,
  type RoomCondition,
  type MeterType,
  CONDITION_LABELS,
  METER_LABELS,
  METER_TYPES,
  ROOM_SUGGESTIONS,
  TYPE_LABELS,
} from "./types";
import {
  saveProtocolStep,
  completeProtocol,
  type ProtocolStepPatch,
} from "./actions";

const STEPS = ["Typ & Mieter", "Räume", "Zähler", "Schlüssel", "Unterschriften"];

const SELECT_CLS =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type TenantOption = { id: string; name: string; email: string | null };

export type ProtocolWizardProps = {
  protocolId: string;
  userId: string;
  initial: {
    type: HandoverType;
    date: string;
    tenantId: string | null;
    tenantName: string;
    tenantEmail: string | null;
    rooms: ProtocolRoom[];
    meters: MeterReading[];
    keys: ProtocolKey[];
    notes: string;
    signatureLandlord: string | null;
    signatureTenant: string | null;
  };
  context: {
    unitLabel: string;
    objektName: string;
    landlordName: string;
    tenantOptions: TenantOption[];
  };
  photoPreviews: Record<string, string>;
};

export function ProtocolWizard({
  protocolId,
  userId,
  initial,
  context,
  photoPreviews,
}: ProtocolWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Feld-State
  const [type, setType] = useState<HandoverType>(initial.type);
  const [date, setDate] = useState(initial.date);
  const [tenantId, setTenantId] = useState<string | null>(initial.tenantId);
  const [tenantName, setTenantName] = useState(initial.tenantName);
  const [tenantEmail, setTenantEmail] = useState(initial.tenantEmail ?? "");
  const [manual, setManual] = useState(
    initial.tenantId === null && context.tenantOptions.length > 0,
  );
  const [rooms, setRooms] = useState<ProtocolRoom[]>(initial.rooms);
  const [meters, setMeters] = useState<MeterReading[]>(initial.meters);
  const [keys, setKeys] = useState<ProtocolKey[]>(initial.keys);
  const [notes, setNotes] = useState(initial.notes);
  const [sigLandlord, setSigLandlord] = useState<string | null>(
    initial.signatureLandlord,
  );
  const [sigTenant, setSigTenant] = useState<string | null>(
    initial.signatureTenant,
  );

  // Schritt aus der sessionStorage wiederherstellen (Wiedereinstieg nach
  // Verbindungsabbruch – Daten liegen ohnehin in der DB).
  const storageKey = `protocol-step-${protocolId}`;
  useEffect(() => {
    const saved = Number(sessionStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved >= 1 && saved <= STEPS.length) {
      setStep(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    sessionStorage.setItem(storageKey, String(step));
  }, [step, storageKey]);

  async function persist(patch: ProtocolStepPatch): Promise<boolean> {
    const res = await saveProtocolStep(protocolId, patch);
    if (!res.ok) {
      toast.error(res.error ?? "Speichern fehlgeschlagen.");
      return false;
    }
    return true;
  }

  /** Räume ändern und sofort speichern (z. B. nach Foto-Upload). */
  async function setRoomsAndPersist(next: ProtocolRoom[]) {
    setRooms(next);
    await persist({ rooms: next });
  }

  function patchForStep(s: number): ProtocolStepPatch {
    switch (s) {
      case 1:
        return {
          type,
          protocol_date: date,
          tenant_id: manual ? null : tenantId,
          tenant_name: tenantName.trim(),
          tenant_email: tenantEmail.trim() || null,
        };
      case 2:
        return { rooms };
      case 3:
        return { meter_readings: meters };
      case 4:
        return { keys };
      case 5:
        return {
          signature_landlord: sigLandlord,
          signature_tenant: sigTenant,
          notes: notes.trim() || null,
        };
      default:
        return {};
    }
  }

  async function goNext() {
    if (step === 1 && !tenantName.trim()) {
      toast.error("Bitte einen Mieternamen angeben.");
      return;
    }
    setSaving(true);
    const ok = await persist(patchForStep(step));
    setSaving(false);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length));
  }

  async function onFinish() {
    setFinishing(true);
    const res = await completeProtocol(protocolId, patchForStep(5));
    if (!res.ok) {
      toast.error(res.error ?? "Abschluss fehlgeschlagen.");
      setFinishing(false);
      return;
    }
    sessionStorage.removeItem(storageKey);
    toast.success("Protokoll abgeschlossen");
    router.refresh();
  }

  // Auswahl der Mieteroption
  function onSelectTenant(v: string) {
    if (v === "__manual__") {
      setManual(true);
      setTenantId(null);
      return;
    }
    setManual(false);
    setTenantId(v);
    const opt = context.tenantOptions.find((o) => o.id === v);
    if (opt) {
      setTenantName(opt.name);
      setTenantEmail(opt.email ?? "");
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-28 pt-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {context.objektName} · Einheit {context.unitLabel}
        </p>
        <h1 className="text-xl font-bold tracking-tight">
          Übergabeprotokoll · {TYPE_LABELS[type]}
        </h1>
      </div>

      {/* Fortschrittsleiste */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={label} className="flex flex-1 items-center gap-1.5">
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
      <p className="-mt-3 text-sm font-medium text-neutral-700">
        Schritt {step} von {STEPS.length}: {STEPS[step - 1]}
      </p>

      {step === 1 ? (
        <StepTypeTenant
          type={type}
          setType={setType}
          date={date}
          setDate={setDate}
          manual={manual}
          tenantId={tenantId}
          tenantName={tenantName}
          setTenantName={setTenantName}
          tenantEmail={tenantEmail}
          setTenantEmail={setTenantEmail}
          options={context.tenantOptions}
          onSelectTenant={onSelectTenant}
        />
      ) : null}

      {step === 2 ? (
        <StepRooms
          rooms={rooms}
          setRooms={setRooms}
          setRoomsAndPersist={setRoomsAndPersist}
          userId={userId}
          protocolId={protocolId}
          photoPreviews={photoPreviews}
        />
      ) : null}

      {step === 3 ? <StepMeters meters={meters} setMeters={setMeters} /> : null}

      {step === 4 ? <StepKeys keys={keys} setKeys={setKeys} /> : null}

      {step === 5 ? (
        <StepSignatures
          landlordName={context.landlordName}
          tenantName={tenantName}
          sigLandlord={sigLandlord}
          setSigLandlord={setSigLandlord}
          sigTenant={sigTenant}
          setSigTenant={setSigTenant}
          notes={notes}
          setNotes={setNotes}
        />
      ) : null}

      {/* Feste Navigationsleiste unten (mobile-first) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || saving || finishing}
          >
            Zurück
          </Button>
          {step < STEPS.length ? (
            <Button onClick={goNext} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Speichern …
                </>
              ) : (
                "Weiter"
              )}
            </Button>
          ) : (
            <Button onClick={onFinish} disabled={finishing}>
              {finishing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Wird abgeschlossen …
                </>
              ) : (
                "Protokoll abschließen"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schritt 1 – Typ & Mieter
// ---------------------------------------------------------------------------
function StepTypeTenant({
  type,
  setType,
  date,
  setDate,
  manual,
  tenantId,
  tenantName,
  setTenantName,
  tenantEmail,
  setTenantEmail,
  options,
  onSelectTenant,
}: {
  type: HandoverType;
  setType: (t: HandoverType) => void;
  date: string;
  setDate: (v: string) => void;
  manual: boolean;
  tenantId: string | null;
  tenantName: string;
  setTenantName: (v: string) => void;
  tenantEmail: string;
  setTenantEmail: (v: string) => void;
  options: TenantOption[];
  onSelectTenant: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-1.5">
          <Label>Art der Übergabe</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["move_in", "move_out"] as HandoverType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium",
                  type === t
                    ? "border-primary bg-primary-50 text-primary-700"
                    : "border-neutral-200 text-neutral-600",
                )}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="protocol-date">Datum</Label>
          <Input
            id="protocol-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {options.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tenant-select">Mieter</Label>
            <select
              id="tenant-select"
              className={SELECT_CLS}
              value={manual ? "__manual__" : (tenantId ?? "")}
              onChange={(e) => onSelectTenant(e.target.value)}
            >
              <option value="" disabled>
                Bitte wählen …
              </option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
              <option value="__manual__">Manuell eingeben …</option>
            </select>
          </div>
        ) : null}

        {manual || options.length === 0 ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-name">Name des Mieters</Label>
              <Input
                id="tenant-name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Vor- und Nachname"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tenant-email">E-Mail (optional)</Label>
              <Input
                id="tenant-email"
                type="email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                placeholder="name@beispiel.de"
              />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Schritt 2 – Räume
// ---------------------------------------------------------------------------
function StepRooms({
  rooms,
  setRooms,
  setRoomsAndPersist,
  userId,
  protocolId,
  photoPreviews,
}: {
  rooms: ProtocolRoom[];
  setRooms: (r: ProtocolRoom[]) => void;
  setRoomsAndPersist: (r: ProtocolRoom[]) => void;
  userId: string;
  protocolId: string;
  photoPreviews: Record<string, string>;
}) {
  const [newRoom, setNewRoom] = useState("");
  const usedNames = new Set(rooms.map((r) => r.name.toLowerCase()));

  function addRoom(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (usedNames.has(trimmed.toLowerCase())) {
      toast.error("Dieser Raum ist bereits erfasst.");
      return;
    }
    setRooms([
      ...rooms,
      { name: trimmed, condition: "good", defects: "", photos: [] },
    ]);
    setNewRoom("");
  }

  function updateRoom(i: number, patch: Partial<ProtocolRoom>) {
    const next = rooms.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    setRooms(next);
  }

  function removeRoom(i: number) {
    setRooms(rooms.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Vorschlagsliste */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <Label>Räume hinzufügen</Label>
          <div className="flex flex-wrap gap-2">
            {ROOM_SUGGESTIONS.filter((s) => !usedNames.has(s.toLowerCase())).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addRoom(s)}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:border-primary hover:text-primary"
                >
                  + {s}
                </button>
              ),
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              placeholder="Eigener Raum, z. B. Abstellkammer"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRoom(newRoom);
                }
              }}
            />
            <Button type="button" variant="outline" onClick={() => addRoom(newRoom)}>
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Räume – füge oben den ersten hinzu.
        </p>
      ) : (
        rooms.map((room, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{room.name}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${room.name} entfernen`}
                  onClick={() => removeRoom(i)}
                >
                  <Trash2 className="size-4 text-danger-600" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CONDITION_LABELS) as RoomCondition[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateRoom(i, { condition: c })}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium",
                      room.condition === c
                        ? "border-primary bg-primary-50 text-primary-700"
                        : "border-neutral-200 text-neutral-600",
                    )}
                  >
                    {CONDITION_LABELS[c]}
                  </button>
                ))}
              </div>

              <Textarea
                rows={2}
                value={room.defects}
                onChange={(e) => updateRoom(i, { defects: e.target.value })}
                placeholder="Mängel / Anmerkungen (optional)"
              />

              <PhotoInput
                photos={room.photos}
                previews={photoPreviews}
                userId={userId}
                protocolId={protocolId}
                onChange={(photos) => {
                  const next = rooms.map((r, idx) =>
                    idx === i ? { ...r, photos } : r,
                  );
                  setRoomsAndPersist(next);
                }}
              />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schritt 3 – Zählerstände
// ---------------------------------------------------------------------------
function StepMeters({
  meters,
  setMeters,
}: {
  meters: MeterReading[];
  setMeters: (m: MeterReading[]) => void;
}) {
  function add() {
    setMeters([...meters, { type: "strom", number: "", value: "" }]);
  }
  function update(i: number, patch: Partial<MeterReading>) {
    setMeters(meters.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }
  function remove(i: number) {
    setMeters(meters.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      {meters.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Zähler erfasst.
        </p>
      ) : (
        meters.map((m, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <select
                  className={SELECT_CLS}
                  value={m.type}
                  onChange={(e) =>
                    update(i, { type: e.target.value as MeterType })
                  }
                >
                  {METER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {METER_LABELS[t]}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Zähler entfernen"
                  onClick={() => remove(i)}
                >
                  <Trash2 className="size-4 text-danger-600" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={m.number}
                  onChange={(e) => update(i, { number: e.target.value })}
                  placeholder="Zählernummer"
                />
                <Input
                  value={m.value}
                  onChange={(e) => update(i, { value: e.target.value })}
                  placeholder="Zählerstand"
                  inputMode="decimal"
                />
              </div>
            </CardContent>
          </Card>
        ))
      )}
      <Button type="button" variant="outline" onClick={add} className="self-start">
        <Plus className="size-4" />
        Zähler hinzufügen
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schritt 4 – Schlüssel
// ---------------------------------------------------------------------------
function StepKeys({
  keys,
  setKeys,
}: {
  keys: ProtocolKey[];
  setKeys: (k: ProtocolKey[]) => void;
}) {
  function add() {
    setKeys([...keys, { label: "", count: 1 }]);
  }
  function update(i: number, patch: Partial<ProtocolKey>) {
    setKeys(keys.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  }
  function remove(i: number) {
    setKeys(keys.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Schlüssel erfasst.
        </p>
      ) : (
        keys.map((k, i) => (
          <Card key={i}>
            <CardContent className="flex items-end gap-2 p-4">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`key-label-${i}`}>Art</Label>
                <Input
                  id={`key-label-${i}`}
                  value={k.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="z. B. Haustür, Wohnung, Briefkasten"
                />
              </div>
              <div className="flex w-24 flex-col gap-1.5">
                <Label htmlFor={`key-count-${i}`}>Anzahl</Label>
                <Input
                  id={`key-count-${i}`}
                  type="number"
                  min="0"
                  step="1"
                  value={k.count}
                  onChange={(e) =>
                    update(i, { count: Math.max(0, Number(e.target.value)) })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Schlüssel entfernen"
                onClick={() => remove(i)}
              >
                <Trash2 className="size-4 text-danger-600" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}
      <Button type="button" variant="outline" onClick={add} className="self-start">
        <Plus className="size-4" />
        Schlüssel hinzufügen
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schritt 5 – Unterschriften
// ---------------------------------------------------------------------------
function StepSignatures({
  landlordName,
  tenantName,
  sigLandlord,
  setSigLandlord,
  sigTenant,
  setSigTenant,
  notes,
  setNotes,
}: {
  landlordName: string;
  tenantName: string;
  sigLandlord: string | null;
  setSigLandlord: (v: string | null) => void;
  sigTenant: string | null;
  setSigTenant: (v: string | null) => void;
  notes: string;
  setNotes: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="flex flex-col gap-4" ref={ref}>
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <Label htmlFor="protocol-notes">Abschließende Anmerkungen (optional)</Label>
          <Textarea
            id="protocol-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="z. B. Übergabe der Kaution, Vereinbarungen …"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <SignaturePad
            role="Unterschrift Vermieter"
            name={landlordName}
            value={sigLandlord}
            onChange={setSigLandlord}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <SignaturePad
            role="Unterschrift Mieter"
            name={tenantName}
            value={sigTenant}
            onChange={setSigTenant}
          />
        </CardContent>
      </Card>
    </div>
  );
}
