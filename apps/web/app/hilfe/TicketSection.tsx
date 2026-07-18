"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { MessageSquarePlus, ChevronDown } from "lucide-react";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_CATEGORY_ORDER,
  TICKET_STATUS_LABELS,
  type TicketCategory,
  type TicketStatus,
} from "@repo/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createTicket, addUserReply, type HilfeState } from "./actions";

export interface UserTicketMessage {
  id: string;
  sender: "user" | "admin";
  message: string;
  created_at: string;
}

export interface UserTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  message: string;
  created_at: string;
  messages: UserTicketMessage[];
}

const STATUS_VARIANT: Record<
  TicketStatus,
  "warning" | "secondary" | "success"
> = {
  open: "warning",
  in_progress: "secondary",
  closed: "success",
};

const initialState: HilfeState = {};

const dateTimeFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateTimeFmt.format(d);
}

/** Styling für native <select>, an SelectTrigger/Input angelehnt. */
const selectClass =
  "flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

function CreateSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <MessageSquarePlus className="size-4" />
      {pending ? "Wird gesendet …" : "Anfrage senden"}
    </Button>
  );
}

function ReplySubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Wird gesendet …" : "Antwort senden"}
    </Button>
  );
}

/** Neue-Anfrage-Formular. */
function NewTicketForm() {
  const [state, formAction] = useActionState(createTicket, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Du kommst nicht weiter? Schreib uns.</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-category">Kategorie</Label>
              <select
                id="ticket-category"
                name="category"
                required
                defaultValue="frage"
                className={selectClass}
              >
                {TICKET_CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {TICKET_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-subject">Betreff</Label>
              <Input
                id="ticket-subject"
                name="subject"
                required
                maxLength={200}
                placeholder="Worum geht es?"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-message">Nachricht</Label>
            <Textarea
              id="ticket-message"
              name="message"
              required
              rows={5}
              placeholder="Beschreibe dein Anliegen möglichst konkret."
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Wir antworten per E-Mail an deine Konto-Adresse.
            </p>
            <CreateSubmit />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** Eine Ticket-Karte mit Status, aufklappbarem Verlauf und Antwortfeld. */
function TicketCard({ ticket }: { ticket: UserTicket }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addUserReply, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }
  }, [state]);

  const replies = ticket.messages;

  return (
    <Card>
      <CardContent className="p-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-3 text-left"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">
                {TICKET_CATEGORY_LABELS[ticket.category]}
              </Badge>
              <Badge variant={STATUS_VARIANT[ticket.status]}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
            <p className="mt-2 truncate font-semibold text-secondary">
              {ticket.subject}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Erstellt am {formatDateTime(ticket.created_at)}
              {replies.length > 0
                ? ` · ${replies.length} ${replies.length === 1 ? "Antwort" : "Nachrichten"}`
                : ""}
            </p>
          </div>
          <ChevronDown
            className={`mt-1 size-5 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {open ? (
          <div className="mt-4 border-t border-neutral-100 pt-4">
            {/* Verlauf: erste Nachricht am Ticket + Folgenachrichten */}
            <div className="flex flex-col gap-3">
              <MessageBubble
                sender="user"
                message={ticket.message}
                createdAt={ticket.created_at}
              />
              {replies.map((m) => (
                <MessageBubble
                  key={m.id}
                  sender={m.sender}
                  message={m.message}
                  createdAt={m.created_at}
                />
              ))}
            </div>

            {ticket.status === "closed" ? (
              <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-muted-foreground">
                Dieses Ticket ist als beantwortet markiert. Bei neuen Fragen
                kannst du trotzdem antworten.
              </p>
            ) : null}

            <form
              ref={formRef}
              action={formAction}
              className="mt-4 flex flex-col gap-2"
            >
              <input type="hidden" name="ticket_id" value={ticket.id} />
              <Label htmlFor={`reply-${ticket.id}`} className="text-xs">
                Rückfrage stellen
              </Label>
              <Textarea
                id={`reply-${ticket.id}`}
                name="message"
                required
                rows={3}
                placeholder="Deine Rückfrage an den Support …"
              />
              <div className="flex justify-end">
                <ReplySubmit />
              </div>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
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
  const isUser = sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-secondary-50 text-secondary-900"
            : "bg-primary-50 text-neutral-800"
        }`}
      >
        <div className="mb-0.5 text-xs font-semibold text-neutral-500">
          {isUser ? "Du" : "tefter Support"}
          {createdAt ? ` · ${formatDateTime(createdAt)}` : ""}
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export function TicketSection({ tickets }: { tickets: UserTicket[] }) {
  return (
    <div className="flex flex-col gap-4">
      <NewTicketForm />

      {tickets.length > 0 ? (
        <div className="mt-2">
          <h3 className="mb-3 text-sm font-semibold text-neutral-700">
            Deine Anfragen
          </h3>
          <div className="flex flex-col gap-3">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
