"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createDunning, type DunningState } from "../../dunningActions";
import { formatCurrency, formatMonth } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <Button type="submit" disabled={pending}>
      {pending ? "Mahnung wird erzeugt …" : "Mahnung erzeugen"}
    </Button>
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

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  const openTotal = charges.reduce((sum, c) => sum + c.openAmount, 0);
  const total = openTotal + parseFee(feeStr);

  function onLevelChange(next: number) {
    setLevel(next);
    // Standard-Mahngebühr je Stufe (weiterhin editierbar).
    setFeeStr(next === 1 ? "0" : String(dunningFee));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="tenant_id" value={tenantId} />

      {hint ? (
        <div className="rounded-xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          {hint}
        </div>
      ) : null}

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="level">Mahnstufe</Label>
            <Select
              name="level"
              value={String(level)}
              onValueChange={(v) => onLevelChange(Number(v))}
            >
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Stufe 1 – Zahlungserinnerung</SelectItem>
                <SelectItem value="2">Stufe 2 – Mahnung</SelectItem>
                <SelectItem value="3">Stufe 3 – Letzte Mahnung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fee">Mahngebühr (€)</Label>
            <Input
              id="fee"
              name="fee"
              type="number"
              min="0"
              step="0.01"
              value={feeStr}
              onChange={(e) => setFeeStr(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment_deadline">Zahlungsfrist</Label>
            <Input
              id="payment_deadline"
              name="payment_deadline"
              type="date"
              required
              defaultValue={defaultDeadline}
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Offene Monate</h2>
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monat</TableHead>
                <TableHead className="text-right">Sollbetrag</TableHead>
                <TableHead className="text-right">Offener Betrag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((c) => (
                <TableRow key={c.period}>
                  <TableCell>{formatMonth(c.period)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(c.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-danger-600">
                    {formatCurrency(c.openAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-6">
          <div className="flex items-center justify-between text-sm tabular-nums">
            <span className="text-muted-foreground">Summe offener Mieten</span>
            <span>{formatCurrency(openTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm tabular-nums">
            <span className="text-muted-foreground">Mahngebühr</span>
            <span>{formatCurrency(parseFee(feeStr))}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-bold tabular-nums">
            <span>Zahlbetrag gesamt</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Bei Bestätigung wird das PDF erzeugt, im privaten Bucket „dunning"
        gespeichert und die Mahnung als Entwurf angelegt.
      </p>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
