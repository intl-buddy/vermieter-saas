"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Building2, Check, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { completeTask, reopenTask } from "./actions";
import { CreateTaskDialog, type EditTaskValues } from "./CreateTaskDialog";
import type { PropertyOption, UnitOption } from "./ScopeFields";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
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
  propertyId: string | null;
  unitId: string | null;
};

export function TaskItem({
  task,
  properties,
  units,
}: {
  task: TaskItemData;
  properties: PropertyOption[];
  units: UnitOption[];
}) {
  const [pending, startTransition] = useTransition();

  function onComplete() {
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
  }

  function onReopen() {
    startTransition(async () => {
      await reopenTask(task.id);
    });
  }

  const editValues: EditTaskValues = {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    propertyId: task.propertyId,
    unitId: task.unitId,
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
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

        {/* Aktionen: Bearbeiten + Erledigt (bzw. Wieder öffnen) */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <CreateTaskDialog
            properties={properties}
            units={units}
            task={editValues}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="size-4" />
                Bearbeiten
              </Button>
            }
          />
          {task.done ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onReopen}
              disabled={pending}
            >
              <RotateCcw className="size-4" />
              Wieder öffnen
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onComplete}
              disabled={pending}
              className="bg-success-600 text-white hover:bg-success-700"
            >
              <Check className="size-4" />
              Erledigt
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
