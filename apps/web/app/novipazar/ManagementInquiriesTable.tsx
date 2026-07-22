"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { nextInquiryStatus } from "@repo/core";
import { Card, CardContent } from "@/components/ui/card";
import { setInquiryStatus } from "./inquiry-actions";

export interface ManagementInquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_email: string;
  properties_count: number;
  units_count: number;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

const STATUS_META: Record<
  ManagementInquiryRow["status"],
  { label: string; className: string }
> = {
  new: { label: "Neu", className: "bg-primary-100 text-primary-800" },
  contacted: { label: "Kontaktiert", className: "bg-gold-100 text-gold-800" },
  closed: { label: "Abgeschlossen", className: "bg-neutral-100 text-neutral-600" },
};

const NEXT_LABEL: Record<ManagementInquiryRow["status"], string> = {
  new: "Als kontaktiert markieren",
  contacted: "Abschließen",
  closed: "",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "–";
  }
}

/**
 * Kompakte Admin-Tabelle der Verwaltungsanfragen mit Status-Wechsel im Zyklus
 * new → contacted → closed.
 */
export function ManagementInquiriesTable({
  rows,
}: {
  rows: ManagementInquiryRow[];
}) {
  const [pending, startTransition] = useTransition();

  function advance(row: ManagementInquiryRow) {
    const next = nextInquiryStatus(row.status);
    if (!next) return;
    startTransition(async () => {
      const res = await setInquiryStatus(row.id, next);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Status aktualisiert.");
    });
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Noch keine Verwaltungsanfragen.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2.5 font-semibold">Name</th>
            <th className="px-4 py-2.5 font-semibold">Kontakt</th>
            <th className="px-4 py-2.5 text-right font-semibold">Obj. / Einh.</th>
            <th className="px-4 py-2.5 font-semibold">Datum</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
            <th className="px-4 py-2.5 font-semibold">Aktion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const meta = STATUS_META[row.status];
            const next = nextInquiryStatus(row.status);
            return (
              <tr
                key={row.id}
                className="border-b border-neutral-100 align-top last:border-0"
              >
                <td className="px-4 py-3 font-medium">
                  {row.name}
                  {row.user_email && row.user_email !== row.email ? (
                    <div className="text-xs text-muted-foreground">
                      Konto: {row.user_email}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <a
                      href={`mailto:${row.email}`}
                      className="text-primary hover:underline"
                    >
                      {row.email}
                    </a>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <a href={`tel:${row.phone}`} className="hover:underline">
                      {row.phone}
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.properties_count} / {row.units_count}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(row.created_at)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {next ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => advance(row)}
                      className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-60"
                    >
                      {NEXT_LABEL[row.status]}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">–</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
