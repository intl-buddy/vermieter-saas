"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireWriteAccess } from "@/lib/access";
import {
  DOCS_BUCKET,
  MAX_DOC_BYTES,
  isAllowedFile,
} from "./document-config";

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export interface FolderRow {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

export interface DocumentRow {
  id: string;
  file_name: string;
  folder_id: string | null;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface Breadcrumb {
  /** null = Wurzelebene (Objektname). */
  id: string | null;
  name: string;
}

export interface FolderContents {
  propertyName: string;
  breadcrumb: Breadcrumb[];
  folders: FolderRow[];
  documents: DocumentRow[];
}

export type ActionResult = { error?: string; success?: boolean };

const NOT_LOGGED_IN = "Bitte melde dich erneut an.";

/** Ordner-Name prüfen und normalisieren. */
function cleanName(raw: string, maxLen: number): string | null {
  const name = raw.trim();
  if (name.length < 1 || name.length > maxLen) return null;
  return name;
}

// ---------------------------------------------------------------------------
// Lesen
// ---------------------------------------------------------------------------

/**
 * Inhalt eines Ordners (oder der Wurzel, wenn `folderId` null ist) laden:
 * Unterordner, Dateien und die Breadcrumb-Kette. Lesen ist über RLS abgesichert
 * (has_account_access), daher kein Schreib-Guard.
 */
export async function listFolderContents(
  propertyId: string,
  folderId: string | null,
): Promise<FolderContents | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NOT_LOGGED_IN };

  const { data: property } = await supabase
    .from("properties")
    .select("name")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property) return { error: "Objekt nicht gefunden." };

  // Alle Ordner des Objekts einmal laden – daraus Breadcrumb und aktuelle Ebene.
  const { data: allFolders } = await supabase
    .from("property_folders")
    .select("id, name, parent_folder_id")
    .eq("property_id", propertyId)
    .order("name", { ascending: true });

  const folders = (allFolders ?? []) as FolderRow[];
  const byId = new Map(folders.map((f) => [f.id, f]));

  // Aktueller Ordner muss existieren, sonst zurück auf die Wurzel.
  let current: FolderRow | null = folderId ? byId.get(folderId) ?? null : null;
  const effectiveFolderId = current ? current.id : null;

  // Breadcrumb von der Wurzel bis zum aktuellen Ordner aufbauen.
  const trail: Breadcrumb[] = [];
  let walker: FolderRow | null = current;
  const guard = new Set<string>();
  while (walker && !guard.has(walker.id)) {
    guard.add(walker.id);
    trail.unshift({ id: walker.id, name: walker.name });
    walker = walker.parent_folder_id
      ? byId.get(walker.parent_folder_id) ?? null
      : null;
  }
  const breadcrumb: Breadcrumb[] = [
    { id: null, name: property.name },
    ...trail,
  ];

  const childFolders = folders
    .filter((f) => (f.parent_folder_id ?? null) === effectiveFolderId)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  let docsQuery = supabase
    .from("property_documents")
    .select("id, file_name, folder_id, mime_type, size_bytes, uploaded_at")
    .eq("property_id", propertyId);
  docsQuery = effectiveFolderId
    ? docsQuery.eq("folder_id", effectiveFolderId)
    : docsQuery.is("folder_id", null);
  const { data: documents } = await docsQuery.order("file_name", {
    ascending: true,
  });

  return {
    propertyName: property.name,
    breadcrumb,
    folders: childFolders,
    documents: (documents ?? []) as DocumentRow[],
  };
}

/** Alle Ordner des Objekts flach (für den Verschieben-Dialog). */
export async function listAllFolders(
  propertyId: string,
): Promise<FolderRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("property_folders")
    .select("id, name, parent_folder_id")
    .eq("property_id", propertyId)
    .order("name", { ascending: true });
  return (data ?? []) as FolderRow[];
}

/** Signierte URL zum Ansehen/Herunterladen erzeugen. */
export async function getDocumentUrl(
  documentId: string,
  download: boolean,
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NOT_LOGGED_IN };

  const { data: doc } = await supabase
    .from("property_documents")
    .select("storage_path, file_name")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { error: "Dokument nicht gefunden." };

  const { data: signed, error } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(doc.storage_path, 300, {
      download: download ? doc.file_name : undefined,
    });
  if (error || !signed?.signedUrl) {
    return { error: "Link konnte nicht erzeugt werden." };
  }
  return { url: signed.signedUrl };
}

// ---------------------------------------------------------------------------
// Ordner schreiben
// ---------------------------------------------------------------------------

/** Prüft, ob ein Objekt für den aktuellen Kontext erreichbar ist. */
async function propertyExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .maybeSingle();
  return Boolean(data);
}

export async function createFolder(
  propertyId: string,
  parentFolderId: string | null,
  rawName: string,
): Promise<ActionResult> {
  const guard = await requireWriteAccess();
  if ("error" in guard) return { error: guard.error };
  const uid = guard.userId;

  const name = cleanName(rawName, 120);
  if (!name) return { error: "Bitte einen Ordnernamen (1–120 Zeichen) angeben." };

  const supabase = await createClient();
  if (!(await propertyExists(supabase, propertyId))) {
    return { error: "Objekt nicht gefunden." };
  }

  // Übergeordneten Ordner (falls angegeben) auf Zugehörigkeit prüfen.
  if (parentFolderId) {
    const { data: parent } = await supabase
      .from("property_folders")
      .select("id")
      .eq("id", parentFolderId)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (!parent) return { error: "Übergeordneter Ordner nicht gefunden." };
  }

  const { error } = await supabase.from("property_folders").insert({
    user_id: uid,
    property_id: propertyId,
    parent_folder_id: parentFolderId,
    name,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "Ein Ordner mit diesem Namen existiert hier bereits." };
    }
    return { error: `Ordner konnte nicht angelegt werden: ${error.message}` };
  }

  revalidatePath(`/objekte/${propertyId}`);
  return { success: true };
}

const STARTER_FOLDERS = [
  "Verträge & Versicherungen",
  "Technik & Wartung",
  "Fotos",
];

/** Legt die drei vorgeschlagenen Startordner auf der Wurzelebene an. */
export async function createStarterFolders(
  propertyId: string,
): Promise<ActionResult> {
  const guard = await requireWriteAccess();
  if ("error" in guard) return { error: guard.error };
  const uid = guard.userId;

  const supabase = await createClient();
  if (!(await propertyExists(supabase, propertyId))) {
    return { error: "Objekt nicht gefunden." };
  }

  for (const name of STARTER_FOLDERS) {
    const { error } = await supabase.from("property_folders").insert({
      user_id: uid,
      property_id: propertyId,
      parent_folder_id: null,
      name,
    });
    // Bereits vorhandene Ordner (Unique-Verletzung) überspringen.
    if (error && error.code !== "23505") {
      return { error: `Startordner konnten nicht angelegt werden: ${error.message}` };
    }
  }

  revalidatePath(`/objekte/${propertyId}`);
  return { success: true };
}

export async function renameFolder(
  folderId: string,
  rawName: string,
): Promise<ActionResult> {
  const guard = await requireWriteAccess();
  if ("error" in guard) return { error: guard.error };

  const name = cleanName(rawName, 120);
  if (!name) return { error: "Bitte einen Ordnernamen (1–120 Zeichen) angeben." };

  const supabase = await createClient();
  const { data: folder } = await supabase
    .from("property_folders")
    .select("property_id")
    .eq("id", folderId)
    .maybeSingle();
  if (!folder) return { error: "Ordner nicht gefunden." };

  const { error } = await supabase
    .from("property_folders")
    .update({ name })
    .eq("id", folderId);
  if (error) {
    if (error.code === "23505") {
      return { error: "Ein Ordner mit diesem Namen existiert hier bereits." };
    }
    return { error: `Umbenennen fehlgeschlagen: ${error.message}` };
  }

  revalidatePath(`/objekte/${folder.property_id}`);
  return { success: true };
}

export async function deleteFolder(folderId: string): Promise<ActionResult> {
  const guard = await requireWriteAccess();
  if ("error" in guard) return { error: guard.error };

  const supabase = await createClient();
  const { data: folder } = await supabase
    .from("property_folders")
    .select("property_id")
    .eq("id", folderId)
    .maybeSingle();
  if (!folder) return { error: "Ordner nicht gefunden." };

  const [{ count: subCount }, { count: docCount }] = await Promise.all([
    supabase
      .from("property_folders")
      .select("id", { count: "exact", head: true })
      .eq("parent_folder_id", folderId),
    supabase
      .from("property_documents")
      .select("id", { count: "exact", head: true })
      .eq("folder_id", folderId),
  ]);

  const sub = subCount ?? 0;
  const docs = docCount ?? 0;
  if (sub > 0 || docs > 0) {
    const parts: string[] = [];
    if (docs > 0) parts.push(`${docs} ${docs === 1 ? "Datei" : "Dateien"}`);
    if (sub > 0)
      parts.push(`${sub} ${sub === 1 ? "Unterordner" : "Unterordner"}`);
    return {
      error: `Ordner enthält noch ${parts.join(" und ")}. Bitte zuerst leeren.`,
    };
  }

  const { error } = await supabase
    .from("property_folders")
    .delete()
    .eq("id", folderId);
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` };

  revalidatePath(`/objekte/${folder.property_id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Dokumente schreiben
// ---------------------------------------------------------------------------

/**
 * Metadaten eines bereits in den Bucket hochgeladenen Dokuments speichern.
 * Der Upload selbst läuft clientseitig direkt in den Storage (Fortschritt +
 * große Dateien bis 25 MB). Hier wird nur validiert und die DB-Zeile angelegt.
 */
export async function registerDocument(input: {
  propertyId: string;
  folderId: string | null;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<ActionResult> {
  const guard = await requireWriteAccess();
  if ("error" in guard) return { error: guard.error };
  const uid = guard.userId;

  const supabase = await createClient();

  // Pfad muss im eigenen (bzw. verwalteten) Konto und Objekt liegen.
  const expectedPrefix = `${uid}/${input.propertyId}/`;
  const removeOrphan = () =>
    supabase.storage.from(DOCS_BUCKET).remove([input.storagePath]);

  if (!input.storagePath.startsWith(expectedPrefix)) {
    await removeOrphan();
    return { error: "Ungültiger Speicherpfad." };
  }
  if (input.sizeBytes > MAX_DOC_BYTES) {
    await removeOrphan();
    return { error: "Die Datei ist zu groß (max. 25 MB)." };
  }
  if (!isAllowedFile(input.fileName, input.mimeType)) {
    await removeOrphan();
    return { error: "Dieser Dateityp wird nicht unterstützt." };
  }
  const fileName = cleanName(input.fileName, 200);
  if (!fileName) {
    await removeOrphan();
    return { error: "Ungültiger Dateiname." };
  }

  if (!(await propertyExists(supabase, input.propertyId))) {
    await removeOrphan();
    return { error: "Objekt nicht gefunden." };
  }
  if (input.folderId) {
    const { data: folder } = await supabase
      .from("property_folders")
      .select("id")
      .eq("id", input.folderId)
      .eq("property_id", input.propertyId)
      .maybeSingle();
    if (!folder) {
      await removeOrphan();
      return { error: "Zielordner nicht gefunden." };
    }
  }

  const { error } = await supabase.from("property_documents").insert({
    user_id: uid,
    property_id: input.propertyId,
    folder_id: input.folderId,
    file_name: fileName,
    storage_path: input.storagePath,
    mime_type: input.mimeType || "application/octet-stream",
    size_bytes: input.sizeBytes,
  });
  if (error) {
    await removeOrphan();
    return { error: `Speichern fehlgeschlagen: ${error.message}` };
  }

  revalidatePath(`/objekte/${input.propertyId}`);
  return { success: true };
}

export async function renameDocument(
  documentId: string,
  rawName: string,
): Promise<ActionResult> {
  const guard = await requireWriteAccess();
  if ("error" in guard) return { error: guard.error };

  const name = cleanName(rawName, 200);
  if (!name) return { error: "Bitte einen Dateinamen (1–200 Zeichen) angeben." };

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("property_documents")
    .select("property_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { error: "Dokument nicht gefunden." };

  const { error } = await supabase
    .from("property_documents")
    .update({ file_name: name })
    .eq("id", documentId);
  if (error) return { error: `Umbenennen fehlgeschlagen: ${error.message}` };

  revalidatePath(`/objekte/${doc.property_id}`);
  return { success: true };
}

export async function moveDocument(
  documentId: string,
  targetFolderId: string | null,
): Promise<ActionResult> {
  const guard = await requireWriteAccess();
  if ("error" in guard) return { error: guard.error };

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("property_documents")
    .select("property_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { error: "Dokument nicht gefunden." };

  if (targetFolderId) {
    const { data: folder } = await supabase
      .from("property_folders")
      .select("id")
      .eq("id", targetFolderId)
      .eq("property_id", doc.property_id)
      .maybeSingle();
    if (!folder) return { error: "Zielordner nicht gefunden." };
  }

  const { error } = await supabase
    .from("property_documents")
    .update({ folder_id: targetFolderId })
    .eq("id", documentId);
  if (error) return { error: `Verschieben fehlgeschlagen: ${error.message}` };

  revalidatePath(`/objekte/${doc.property_id}`);
  return { success: true };
}

export async function deleteDocument(
  documentId: string,
): Promise<ActionResult> {
  const guard = await requireWriteAccess();
  if ("error" in guard) return { error: guard.error };

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("property_documents")
    .select("property_id, storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { error: "Dokument nicht gefunden." };

  if (doc.storage_path) {
    await supabase.storage.from(DOCS_BUCKET).remove([doc.storage_path]);
  }

  const { error } = await supabase
    .from("property_documents")
    .delete()
    .eq("id", documentId);
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` };

  revalidatePath(`/objekte/${doc.property_id}`);
  return { success: true };
}
