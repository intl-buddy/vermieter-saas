"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Check, Building2 } from "lucide-react";
import { toast } from "sonner";
import { completeTask, reopenTask } from "./actions";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TaskItemData = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  done: boolean;
  overdue: boolean;
  scopeLabel: string | null;
  scopeHref: string | null;
};

export function TaskItem({ task }: { task: TaskItemData }) {
  const [pending, startTransition] = useTransition();

  function onToggle() {
    if (!task.done) {
      startTransition(async () => {
        await completeTask(task.id);
        toast.success("Aufgabe erledigt", {
          action: {
            label: "Rückgängig",
            onClick: () => {
              void reopenTask(task.id);
            },
          },
        });
      });
    } else {
      startTransition(async () => {
        await reopenTask(task.id);
      });
    }
  }

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          aria-pressed={task.done}
          aria-label={task.done ? "Als offen markieren" : "Als erledigt markieren"}
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-50",
            task.done
              ? "border-primary bg-primary text-white"
              : "border-neutral-300 bg-white hover:border-primary",
          )}
        >
          {task.done ? <Check className="size-4" /> : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "font-medium",
                task.done && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </span>
            {task.overdue && !task.done ? (
              <Badge variant="danger">Überfällig</Badge>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className={cn(task.overdue && !task.done && "text-danger-600")}>
              Fällig: {formatDate(task.dueDate)}
            </span>
            {task.scopeLabel ? (
              task.scopeHref ? (
                <Link
                  href={task.scopeHref}
                  className="inline-flex items-center gap-1 text-secondary hover:underline"
                >
                  <Building2 className="size-3.5" />
                  {task.scopeLabel}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {task.scopeLabel}
                </span>
              )
            ) : null}
          </div>

          {task.description ? (
            <details className="mt-2">
              <summary className="cursor-pointer list-none text-sm font-medium text-secondary marker:hidden">
                Beschreibung anzeigen
              </summary>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
                {task.description}
              </p>
            </details>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
