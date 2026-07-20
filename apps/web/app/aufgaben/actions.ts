"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { requireWriteAccess, READONLY_WRITE_ERROR } from "@/lib/access";
import { parseIntStrict } from "@/lib/parse";

type TaskInterval = Database["public"]["Enums"]["task_interval"];

const ALLOWED_INTERVALS: readonly TaskInterval[] = [
  "monthly",
  "quarterly",
  "semiannually",
  "yearly",
];

export type TaskFormState = {
  error?: string;
  success?: string;
};

// Schreibende Aufgaben-Actions: zentrale Auth- + Schreibrechte-Prüfung.
async function requireUserId(): Promise<
  { userId: string } | { error: string }
> {
  return requireWriteAccess();
}

/** Optionaler Fremdschlüssel: leerer String → null. */
function optionalId(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v || null;
}

// ---------------------------------------------------------------------------
// Einmalige Ad-hoc-Aufgabe
// ---------------------------------------------------------------------------

export async function createAdHocTask(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const propertyId = optionalId(formData.get("property_id"));
  const unitId = optionalId(formData.get("unit_id"));

  if (!title || !dueDate) {
    return { error: "Bitte Titel und Fälligkeitsdatum angeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("generated_tasks").insert({
    user_id: auth.userId,
    template_id: null,
    title,
    description: description || null,
    due_date: dueDate,
    property_id: propertyId,
    unit_id: unitId,
    status: "open",
  });

  if (error) {
    return { error: `Speichern fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/aufgaben");
  return { success: "Aufgabe wurde angelegt." };
}

/** Bestehende (auch generierte) Aufgabe bearbeiten: Titel/Beschreibung/Fälligkeit/Zuordnung. */
export async function updateTask(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Aufgabe konnte nicht ermittelt werden." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const propertyId = optionalId(formData.get("property_id"));
  const unitId = optionalId(formData.get("unit_id"));

  if (!title || !dueDate) {
    return { error: "Bitte Titel und Fälligkeitsdatum angeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("generated_tasks")
    .update({
      title,
      description: description || null,
      due_date: dueDate,
      property_id: propertyId,
      unit_id: unitId,
    })
    .eq("id", id);

  if (error) {
    return { error: `Speichern fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/aufgaben");
  return { success: "Aufgabe wurde aktualisiert." };
}

/** Aufgabe abhaken: status='done', completed_at=jetzt. */
export async function completeTask(id: string): Promise<void> {
  const guard = await requireWriteAccess();
  if ("error" in guard) throw new Error(READONLY_WRITE_ERROR);
  const supabase = await createClient();
  await supabase
    .from("generated_tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/aufgaben");
}

/** Abhaken rückgängig machen: zurück auf 'open' (Cron markiert ggf. erneut). */
export async function reopenTask(id: string): Promise<void> {
  const guard = await requireWriteAccess();
  if ("error" in guard) throw new Error(READONLY_WRITE_ERROR);
  const supabase = await createClient();
  await supabase
    .from("generated_tasks")
    .update({ status: "open", completed_at: null })
    .eq("id", id);
  revalidatePath("/aufgaben");
}

// ---------------------------------------------------------------------------
// Wiederkehrende Aufgaben (Vorlagen)
// ---------------------------------------------------------------------------

type TemplateFields = {
  title: string;
  description: string | null;
  interval: TaskInterval;
  day_of_month: number | null;
  month_of_year: number | null;
  property_id: string | null;
  unit_id: string | null;
};

function readTemplateFields(
  formData: FormData,
): { data: TemplateFields } | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const intervalRaw = String(formData.get("interval") ?? "").trim();
  const dayRaw = String(formData.get("day_of_month") ?? "").trim();
  const monthRaw = String(formData.get("month_of_year") ?? "").trim();
  const propertyId = optionalId(formData.get("property_id"));
  const unitId = optionalId(formData.get("unit_id"));

  if (!title) {
    return { error: "Bitte einen Titel angeben." };
  }
  if (!ALLOWED_INTERVALS.includes(intervalRaw as TaskInterval)) {
    return { error: "Bitte ein gültiges Intervall wählen." };
  }
  const interval = intervalRaw as TaskInterval;

  let dayOfMonth: number | null = null;
  if (dayRaw) {
    const parsed = parseIntStrict(dayRaw);
    if (parsed === null || Number.isNaN(parsed) || parsed < 1 || parsed > 31) {
      return { error: "Der Tag muss zwischen 1 und 31 liegen." };
    }
    dayOfMonth = parsed;
  }

  let monthOfYear: number | null = null;
  if (interval === "yearly") {
    const parsed = monthRaw ? parseIntStrict(monthRaw) : null;
    if (parsed === null || Number.isNaN(parsed) || parsed < 1 || parsed > 12) {
      return {
        error: "Für jährliche Aufgaben bitte einen Monat (1–12) angeben.",
      };
    }
    monthOfYear = parsed;
  } else if (monthRaw) {
    const parsed = parseIntStrict(monthRaw);
    if (parsed !== null && !Number.isNaN(parsed) && parsed >= 1 && parsed <= 12) {
      monthOfYear = parsed;
    }
  }

  return {
    data: {
      title,
      description: description || null,
      interval,
      day_of_month: dayOfMonth,
      month_of_year: monthOfYear,
      property_id: propertyId,
      unit_id: unitId,
    },
  };
}

export async function createTemplate(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const fields = readTemplateFields(formData);
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_templates")
    .insert({ user_id: auth.userId, ...fields.data });

  if (error) {
    return { error: `Speichern fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/aufgaben/wiederkehrend");
  return { success: "Vorlage wurde angelegt." };
}

export async function updateTemplate(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Vorlage konnte nicht ermittelt werden." };

  const fields = readTemplateFields(formData);
  if ("error" in fields) return { error: fields.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_templates")
    .update(fields.data)
    .eq("id", id);

  if (error) {
    return { error: `Speichern fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/aufgaben/wiederkehrend");
  return { success: "Vorlage wurde aktualisiert." };
}

/** Vorlage aktiv/inaktiv schalten. */
export async function toggleTemplateActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  const guard = await requireWriteAccess();
  if ("error" in guard) throw new Error(READONLY_WRITE_ERROR);
  const supabase = await createClient();
  await supabase
    .from("task_templates")
    .update({ is_active: isActive })
    .eq("id", id);
  revalidatePath("/aufgaben/wiederkehrend");
}
