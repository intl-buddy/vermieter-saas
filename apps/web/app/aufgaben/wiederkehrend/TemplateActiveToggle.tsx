"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleTemplateActive } from "../actions";
import { Switch } from "@/components/ui/switch";

export function TemplateActiveToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [checked, setChecked] = useState(active);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      await toggleTemplateActive(id, next);
      toast.success(next ? "Vorlage aktiviert." : "Vorlage deaktiviert.");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={onChange} disabled={pending} />
      <span className="text-sm text-muted-foreground">
        {checked ? "Aktiv" : "Inaktiv"}
      </span>
    </div>
  );
}
