import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createProtocolDraft } from "@/app/protokolle/actions";
import { TYPE_LABELS, type HandoverType } from "@/app/protokolle/types";

export type UnitProtocol = {
  id: string;
  tenant_name: string;
  type: HandoverType;
  protocol_date: string;
  status: "draft" | "completed";
};

/**
 * Übergabeprotokoll-Bereich je Einheit: startet ein neues Protokoll (Einzug/
 * Auszug) und listet die Historie – bewusst an der Einheit, damit sie auch nach
 * Mieterwechsel erhalten bleibt. Server-Komponente (Formular ruft die
 * Server-Action `createProtocolDraft` direkt auf).
 */
export function UnitProtocolSection({
  unitId,
  activeTenantId,
  protocols,
}: {
  unitId: string;
  activeTenantId: string | null;
  protocols: UnitProtocol[];
}) {
  return (
    <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <ClipboardCheck className="size-4" />
          Übergabeprotokoll
        </div>
        <form action={createProtocolDraft} className="flex gap-2">
          <input type="hidden" name="unit_id" value={unitId} />
          <input type="hidden" name="tenant_id" value={activeTenantId ?? ""} />
          <Button type="submit" name="type" value="move_in" variant="outline" size="sm">
            Einzug
          </Button>
          <Button type="submit" name="type" value="move_out" variant="outline" size="sm">
            Auszug
          </Button>
        </form>
      </div>

      {protocols.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch kein Protokoll für diese Einheit.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {protocols.map((p) => (
            <Link
              key={p.id}
              href={`/protokolle/${p.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm hover:border-primary"
            >
              <span className="font-medium">
                {TYPE_LABELS[p.type]} · {formatDate(p.protocol_date)}
                {p.tenant_name ? ` · ${p.tenant_name}` : ""}
              </span>
              <Badge variant={p.status === "completed" ? "success" : "neutral"}>
                {p.status === "completed" ? "Abgeschlossen" : "Entwurf"}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
