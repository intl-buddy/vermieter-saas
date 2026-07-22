import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/account-context";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtocolWizard, type TenantOption } from "../ProtocolWizard";
import { SendProtocolDialog } from "../SendProtocolDialog";
import {
  parseRooms,
  parseMeters,
  parseKeys,
  TYPE_LABELS,
  CONDITION_LABELS,
  METER_LABELS,
} from "../types";

export const metadata = { title: "Übergabeprotokoll · tefter" };
export const dynamic = "force-dynamic";

const PROTOCOLS_BUCKET = "protocols";

export default async function ProtocolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);

  const { data: protocol } = await supabase
    .from("handover_protocols")
    .select(
      "id, user_id, unit_id, tenant_id, tenant_name, tenant_email, type, protocol_date, rooms, meter_readings, keys, notes, signature_landlord, signature_tenant, pdf_url, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (!protocol || protocol.user_id !== uid) notFound();

  // Einheit + Objekt
  const { data: unit } = await supabase
    .from("units")
    .select("id, label, property_id")
    .eq("id", protocol.unit_id)
    .maybeSingle();
  let objektName = "";
  let backHref = "/protokolle";
  if (unit) {
    backHref = `/objekte/${unit.property_id}`;
    const { data: property } = await supabase
      .from("properties")
      .select("name")
      .eq("id", unit.property_id)
      .maybeSingle();
    objektName = property?.name ?? "";
  }

  const rooms = parseRooms(protocol.rooms);
  const meters = parseMeters(protocol.meter_readings);
  const keys = parseKeys(protocol.keys);

  // Absenderprofil (Vermieter = Eigentümer des Protokolls)
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, company_name, email")
    .eq("id", uid)
    .maybeSingle();
  const landlordName =
    profile?.company_name?.trim() || profile?.full_name?.trim() || "";

  // ---------------- Abgeschlossen: Zusammenfassung + PDF + Mailversand -------
  if (protocol.status === "completed") {
    let pdfUrl: string | null = null;
    if (protocol.pdf_url) {
      const { data: signed } = await supabase.storage
        .from(PROTOCOLS_BUCKET)
        .createSignedUrl(protocol.pdf_url, 300);
      pdfUrl = signed?.signedUrl ?? null;
    }

    return (
      <div className="min-h-dvh bg-neutral-50">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Link
            href={backHref}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Zurück
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Übergabeprotokoll
            </h1>
            <Badge variant="success">Abgeschlossen</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {TYPE_LABELS[protocol.type]} · {formatDate(protocol.protocol_date)} ·{" "}
            {objektName} · Einheit {unit?.label ?? "–"} · {protocol.tenant_name}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {pdfUrl ? (
              <Button asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileDown className="size-4" />
                  PDF öffnen
                </a>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <a href={`/protokolle/${protocol.id}/pdf`} target="_blank">
                  <FileDown className="size-4" />
                  PDF erzeugen
                </a>
              </Button>
            )}
            <SendProtocolDialog
              protocolId={protocol.id}
              tenantEmail={protocol.tenant_email}
              landlordEmail={profile?.email ?? null}
            />
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-2 font-semibold">Räume</h2>
                {rooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Räume erfasst.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {rooms.map((r, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>
                          {r.name}
                          {r.photos.length > 0
                            ? ` · ${r.photos.length} Foto(s)`
                            : ""}
                        </span>
                        <span className="text-muted-foreground">
                          {CONDITION_LABELS[r.condition]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="mb-2 font-semibold">Zählerstände</h2>
                {meters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Zählerstände erfasst.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {meters.map((m, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>{METER_LABELS[m.type]}</span>
                        <span className="text-muted-foreground">
                          {m.value || "–"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="mb-2 font-semibold">Schlüssel</h2>
                {keys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Schlüssel erfasst.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {keys.map((k, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>{k.label || "–"}</span>
                        <span className="text-muted-foreground">{k.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- Entwurf: Wizard -----------------------------------------
  // Signierte Vorschau-URLs für bereits hochgeladene Fotos.
  const photoPreviews: Record<string, string> = {};
  const allPaths = rooms.flatMap((r) => r.photos.map((p) => p.path));
  await Promise.all(
    allPaths.map(async (path) => {
      const { data: signed } = await supabase.storage
        .from(PROTOCOLS_BUCKET)
        .createSignedUrl(path, 3600);
      if (signed?.signedUrl) photoPreviews[path] = signed.signedUrl;
    }),
  );

  // Mieteroptionen: aktive + frühere Mietverhältnisse dieser Einheit.
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, first_name, last_name, email, move_out_date")
    .eq("unit_id", protocol.unit_id)
    .order("move_out_date", { ascending: true, nullsFirst: true });
  const tenantOptions: TenantOption[] = (tenants ?? []).map((t) => ({
    id: t.id,
    name: `${t.first_name} ${t.last_name}`.trim(),
    email: t.email,
  }));

  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <span className="text-lg font-extrabold tracking-tight text-secondary">
            tefter
            <span
              className="ml-0.5 inline-block size-1.5 rounded-full bg-gold-500 align-baseline"
              aria-hidden
            />
          </span>
          <Link
            href={backHref}
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Abbrechen
          </Link>
        </div>
      </header>

      <ProtocolWizard
        protocolId={protocol.id}
        userId={user.id}
        initial={{
          type: protocol.type,
          date: protocol.protocol_date,
          tenantId: protocol.tenant_id,
          tenantName: protocol.tenant_name,
          tenantEmail: protocol.tenant_email,
          rooms,
          meters,
          keys,
          notes: protocol.notes ?? "",
          signatureLandlord: protocol.signature_landlord,
          signatureTenant: protocol.signature_tenant,
        }}
        context={{
          unitLabel: unit?.label ?? "",
          objektName,
          landlordName,
          tenantOptions,
        }}
        photoPreviews={photoPreviews}
      />
    </div>
  );
}
