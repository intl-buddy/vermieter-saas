"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  type AdminTicketView,
  type TicketCategory,
  type TicketStatus,
} from "@repo/core";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminReply,
  adminSetStatus,
  adminSetNote,
  type AdminTicketState,
} from "./actions";

const STATUS_VARIANT: Record<TicketStatus, "warning" | "secondary" | "success"> =
  {
    open: "warning",
    in_progress: "secondary",
    closed: "success",
  };

const STATUS_ORDER: TicketStatus[] = ["open", "in_progress", "closed"];
const CATEGORY_FILTERS: TicketCategory[] = [
  "frage",
  "problem",
  "abrechnung",
  "idee",
];

const initialState: AdminTicketState = {};

const dateTimeFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
function fmt(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateTimeFmt.format(d);
}

function ReplySubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Wird gesendet …" : "Antwort senden"}
    </Button>
  );
}

function NoteSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Speichert …" : "Notiz speichern"}
    </Button>
  );
}

function MessageBubble({
  sender,
  message,
  createdAt,
}: {
  sender: "user" | "admin";
  message: string;
  createdAt: string;
}) {
  const isAdmin = sender === "admin";
  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isAdmin
            ? "bg-primary-50 text-neutral-800"
            : "bg-secondary-50 text-secondary-900"
        }`}
      >
        <div className="mb-0.5 text-xs font-semibold text-neutral-500">
          {isAdmin ? "Support" : "Nutzer"}
          {createdAt ? ` · ${fmt(createdAt)}` : ""}
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

function TicketDetail({ ticket }: { ticket: AdminTicketView }) {
  const [replyState, replyAction] = useActionState(adminReply, initialState);
  const [statusState, statusAction] = useActionState(
    adminSetStatus,
    initialState,
  );
  const [noteState, noteAction] = useActionState(adminSetNote, initialState);

  useEffect(() => {
    if (replyState.error) toast.error(replyState.error);
    if (replyState.success) toast.success(replyState.success);
  }, [replyState]);
  useEffect(() => {
    if (statusState.error) toast.error(statusState.error);
    if (statusState.success) toast.success(statusState.success);
  }, [statusState]);
  useEffect(() => {
    if (noteState.error) toast.error(noteState.error);
    if (noteState.success) toast.success(noteState.success);
  }, [noteState]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5">
        {/* Kopf */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">
              {TICKET_CATEGORY_LABELS[ticket.category]}
            </Badge>
            <Badge variant={STATUS_VARIANT[ticket.status]}>
              {TICKET_STATUS_LABELS[ticket.status]}
            </Badge>
          </div>
          <h2 className="mt-2 text-lg font-bold text-secondary">
            {ticket.subject}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ticket.userEmail} · Paket: {ticket.userPlan || "–"} · erstellt am{" "}
            {fmt(ticket.createdAt)}
          </p>
        </div>

        {/* Verlauf */}
        <div className="flex flex-col gap-3">
          <MessageBubble
            sender="user"
            message={ticket.message}
            createdAt={ticket.createdAt}
          />
          {ticket.messages.map((m) => (
            <MessageBubble
              key={m.id}
              sender={m.sender}
              message={m.message}
              createdAt={m.created_at}
            />
          ))}
        </div>

        {/* Antwort */}
        <form action={replyAction} className="flex flex-col gap-2 border-t border-neutral-100 pt-4">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <Label htmlFor={`admin-reply-${ticket.id}`}>Antwort an den Nutzer</Label>
          <Textarea
            id={`admin-reply-${ticket.id}`}
            name="message"
            required
            rows={4}
            placeholder="Antwort … (wird dem Nutzer auch per E-Mail zugestellt)"
          />
          <div className="flex justify-end">
            <ReplySubmit />
          </div>
        </form>

        {/* Statuswechsel */}
        <form action={statusAction} className="border-t border-neutral-100 pt-4">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <div className="text-sm font-medium text-neutral-700">Status ändern</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUS_ORDER.map((s) => (
              <Button
                key={s}
                type="submit"
                name="status"
                value={s}
                size="sm"
                variant={s === ticket.status ? "secondary" : "outline"}
                disabled={s === ticket.status}
              >
                {TICKET_STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </form>

        {/* Interne Notiz */}
        <form action={noteAction} className="flex flex-col gap-2 border-t border-neutral-100 pt-4">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <Label htmlFor={`admin-note-${ticket.id}`}>
            Interne Notiz (nur für dich sichtbar)
          </Label>
          <Textarea
            id={`admin-note-${ticket.id}`}
            name="note"
            rows={2}
            defaultValue={ticket.adminNote ?? ""}
            placeholder="Notiz zur internen Bearbeitung …"
          />
          <div className="flex justify-end">
            <NoteSubmit />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function AdminTicketsClient({ tickets }: { tickets: AdminTicketView[] }) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">(
    "all",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    tickets[0]?.id ?? null,
  );

  const filtered = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (statusFilter === "all" || t.status === statusFilter) &&
          (categoryFilter === "all" || t.category === categoryFilter),
      ),
    [tickets, statusFilter, categoryFilter],
  );

  const selected =
    filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

  const filterBtn = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "border-secondary bg-secondary text-secondary-foreground"
        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
    }`;

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={filterBtn(statusFilter === "all")}
          >
            Alle
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={filterBtn(statusFilter === s)}
            >
              {TICKET_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Kategorie
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={filterBtn(categoryFilter === "all")}
          >
            Alle
          </button>
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              className={filterBtn(categoryFilter === c)}
            >
              {TICKET_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-muted-foreground">
          Keine Tickets in dieser Auswahl.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
          {/* Liste */}
          <div className="flex flex-col gap-2">
            {filtered.map((t) => {
              const active = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? "border-secondary-300 bg-secondary-50"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={STATUS_VARIANT[t.status]}>
                      {TICKET_STATUS_LABELS[t.status]}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {fmt(t.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-secondary">
                    {t.subject}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {TICKET_CATEGORY_LABELS[t.category]} · {t.userEmail}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div>
            {selected ? (
              <TicketDetail key={selected.id} ticket={selected} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
