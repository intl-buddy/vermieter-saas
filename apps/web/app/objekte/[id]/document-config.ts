/**
 * Gemeinsame Konfiguration für den „Digitalen Ordner" (Dokumente je Objekt).
 * Wird sowohl vom Client-Upload als auch von den Server-Actions genutzt, damit
 * erlaubte Typen und Maximalgröße nur an einer Stelle stehen.
 */

export const DOCS_BUCKET = "property-documents";

/** Maximale Dateigröße: 25 MB. */
export const MAX_DOC_BYTES = 25 * 1024 * 1024;

/** Erlaubte Dateiendungen (Kleinbuchstaben, ohne Punkt). */
export const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "heic",
  "heif",
  "webp",
  "docx",
  "xlsx",
  "txt",
] as const;

/** Erlaubte MIME-Typen (Zweitprüfung; manche Browser liefern bei HEIC leer). */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] as const;

/** `accept`-Attribut für den Datei-Dialog. */
export const FILE_INPUT_ACCEPT = [
  ...ALLOWED_EXTENSIONS.map((e) => `.${e}`),
  ...ALLOWED_MIME_TYPES,
].join(",");

/** Endung eines Dateinamens in Kleinbuchstaben (ohne Punkt), ggf. leer. */
export function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0 || idx === name.length - 1) return "";
  return name.slice(idx + 1).toLowerCase();
}

/**
 * Prüft, ob eine Datei erlaubt ist. Primär über die Endung (zuverlässig auch
 * bei fehlendem MIME-Typ), ersatzweise über den MIME-Typ.
 */
export function isAllowedFile(name: string, mimeType: string): boolean {
  const ext = fileExtension(name);
  if ((ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) return true;
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Dateinamen auf sichere Zeichen für den Storage-Pfad reduzieren. */
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}.\-_]+/gu, "_");
  return cleaned.slice(-160) || "dokument";
}

/** Dateigröße menschenlesbar, z. B. `1,2 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString("de-DE")} ${units[unit]}`;
}

export type FileKind = "pdf" | "image" | "word" | "excel" | "text" | "other";

/** Grobe Typ-Kategorie für die Icon-Auswahl. */
export function fileKind(name: string, mimeType: string): FileKind {
  const ext = fileExtension(name);
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (
    ["jpg", "jpeg", "png", "heic", "heif", "webp"].includes(ext) ||
    mimeType.startsWith("image/")
  ) {
    return "image";
  }
  if (ext === "docx" || mimeType.includes("wordprocessingml")) return "word";
  if (ext === "xlsx" || mimeType.includes("spreadsheetml")) return "excel";
  if (ext === "txt" || mimeType === "text/plain") return "text";
  return "other";
}

/** Bilder und PDFs lassen sich direkt im Browser ansehen. */
export function isViewableInBrowser(name: string, mimeType: string): boolean {
  const kind = fileKind(name, mimeType);
  return kind === "pdf" || kind === "image";
}
