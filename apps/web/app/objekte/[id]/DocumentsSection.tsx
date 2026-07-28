"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Download,
  Eye,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  FileType,
  Folder,
  FolderInput,
  FolderPlus,
  ImageIcon,
  Loader2,
  MoreVertical,
  Pencil,
  Receipt,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/format";
import {
  DOCS_BUCKET,
  FILE_INPUT_ACCEPT,
  MAX_DOC_BYTES,
  fileKind,
  formatBytes,
  isAllowedFile,
  isViewableInBrowser,
  safeFileName,
  type FileKind,
} from "./document-config";
import {
  createFolder,
  createStarterFolders,
  deleteDocument,
  deleteFolder,
  getDocumentUrl,
  listAllFolders,
  listFolderContents,
  moveDocument,
  registerDocument,
  renameDocument,
  renameFolder,
  type DocumentRow,
  type FolderContents,
  type FolderRow,
} from "./documents-actions";

type UploadStatus = "uploading" | "done" | "error";
interface UploadItem {
  id: string;
  name: string;
  status: UploadStatus;
  error?: string;
}

const KIND_ICON: Record<FileKind, typeof FileIcon> = {
  pdf: FileText,
  image: ImageIcon,
  word: FileText,
  excel: FileSpreadsheet,
  text: FileType,
  other: FileIcon,
};

const KIND_COLOR: Record<FileKind, string> = {
  pdf: "bg-danger-50 text-danger-700",
  image: "bg-secondary-50 text-secondary-700",
  word: "bg-primary-50 text-primary-700",
  excel: "bg-success-50 text-success-700",
  text: "bg-neutral-100 text-neutral-600",
  other: "bg-neutral-100 text-neutral-600",
};

export function DocumentsSection({
  propertyId,
  ownerUserId,
  canWrite,
  initialContents,
}: {
  propertyId: string;
  ownerUserId: string;
  canWrite: boolean;
  initialContents: FolderContents;
}) {
  const [contents, setContents] = useState<FolderContents>(initialContents);
  const currentFolderId =
    contents.breadcrumb[contents.breadcrumb.length - 1]?.id ?? null;

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog-Zustände
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<FolderRow | null>(
    null,
  );
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderRow | null>(
    null,
  );
  const [renameDocTarget, setRenameDocTarget] = useState<DocumentRow | null>(
    null,
  );
  const [moveDocTarget, setMoveDocTarget] = useState<DocumentRow | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState<DocumentRow | null>(
    null,
  );

  /** Inhalt eines Ordners laden und in den State übernehmen. */
  function navigate(folderId: string | null) {
    startRefresh(async () => {
      const res = await listFolderContents(propertyId, folderId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setContents(res);
    });
  }

  /** Aktuellen Ordner neu laden (nach Mutationen). */
  function refresh() {
    navigate(currentFolderId);
  }

  // -------------------------------------------------------------------------
  // Upload (clientseitig direkt in den Storage, mit Fortschritts-Liste)
  // -------------------------------------------------------------------------

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const queued: (UploadItem & { file: File })[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      status: "uploading" as UploadStatus,
      file,
    }));
    setUploads((prev) => [
      ...prev,
      ...queued.map((q) => ({ id: q.id, name: q.name, status: q.status })),
    ]);

    const supabase = createClient();
    let ok = 0;
    let failed = 0;

    const mark = (id: string, patch: Partial<UploadItem>) =>
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      );

    for (const item of queued) {
      if (!isAllowedFile(item.file.name, item.file.type)) {
        mark(item.id, { status: "error", error: "Dateityp nicht unterstützt" });
        failed += 1;
        continue;
      }
      if (item.file.size > MAX_DOC_BYTES) {
        mark(item.id, { status: "error", error: "zu groß (max. 25 MB)" });
        failed += 1;
        continue;
      }

      const path = `${ownerUserId}/${propertyId}/${crypto.randomUUID()}/${safeFileName(
        item.file.name,
      )}`;
      const { error: upErr } = await supabase.storage
        .from(DOCS_BUCKET)
        .upload(path, item.file, {
          contentType: item.file.type || undefined,
          upsert: true,
        });
      if (upErr) {
        mark(item.id, { status: "error", error: "Upload fehlgeschlagen" });
        failed += 1;
        continue;
      }

      const res = await registerDocument({
        propertyId,
        folderId: currentFolderId,
        fileName: item.file.name,
        storagePath: path,
        mimeType: item.file.type,
        sizeBytes: item.file.size,
      });
      if (res.error) {
        mark(item.id, { status: "error", error: res.error });
        failed += 1;
        continue;
      }
      mark(item.id, { status: "done" });
      ok += 1;
    }

    refresh();
    if (ok > 0 && failed === 0) {
      toast.success(
        ok === 1 ? "Dokument hochgeladen." : `${ok} Dokumente hochgeladen.`,
      );
    } else if (ok > 0) {
      toast.warning(`${ok} hochgeladen, ${failed} fehlgeschlagen.`);
    } else {
      toast.error("Upload fehlgeschlagen.");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (files) void handleFiles(files);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!canWrite) return;
    if (e.dataTransfer?.files?.length) void handleFiles(e.dataTransfer.files);
  }

  const uploading = uploads.some((u) => u.status === "uploading");

  const { folders, documents, breadcrumb } = contents;
  const isEmpty = folders.length === 0 && documents.length === 0;
  const isRoot = currentFolderId === null;

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Dokumente</h2>
        {canWrite ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewFolderOpen(true)}
            >
              <FolderPlus className="size-4" />
              Neuer Ordner
            </Button>
            <Button
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Dateien hochladen
            </Button>
          </div>
        ) : null}
      </div>

      {/* Hinweis auf die Belege für abrechnungsrelevante Kosten */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-gold-200 bg-gold-50/60 px-3 py-2 text-sm text-neutral-600">
        <Receipt className="mt-0.5 size-4 shrink-0 text-gold-700" />
        <p>
          Für Rechnungen und Kosten, die in Auswertungen (EÜR,
          Nebenkostenabrechnung) einfließen sollen, nutze weiterhin die{" "}
          <Link
            href={`/belege?objekt=${propertyId}`}
            className="font-medium text-primary hover:underline"
          >
            Belege
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5">
          {/* Breadcrumb */}
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
            {breadcrumb.map((crumb, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <span key={crumb.id ?? "root"} className="flex items-center gap-1">
                  {i > 0 ? (
                    <ChevronRight className="size-4 text-neutral-400" />
                  ) : null}
                  {last ? (
                    <span className="font-semibold">{crumb.name}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(crumb.id)}
                      className="font-medium text-primary hover:underline"
                    >
                      {crumb.name}
                    </button>
                  )}
                </span>
              );
            })}
            {refreshing ? (
              <Loader2 className="ml-1 size-3.5 animate-spin text-neutral-400" />
            ) : null}
          </nav>

          {/* Drag-and-drop-Zone */}
          {canWrite ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mb-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary-50/50"
                  : "border-neutral-300 bg-neutral-50 hover:border-primary-300"
              }`}
            >
              <Upload className="size-6 text-neutral-400" />
              <p className="text-sm font-medium">
                Dateien hierher ziehen oder klicken
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, Bilder, Word/Excel, Text · max. 25 MB je Datei
              </p>
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={FILE_INPUT_ACCEPT}
            onChange={onInputChange}
            className="hidden"
          />

          {/* Upload-Fortschritt */}
          {uploads.length > 0 ? (
            <UploadProgress
              uploads={uploads}
              onClear={() =>
                setUploads((prev) =>
                  prev.filter((u) => u.status === "uploading"),
                )
              }
            />
          ) : null}

          {/* Inhalt */}
          {isEmpty ? (
            <EmptyState
              isRoot={isRoot}
              canWrite={canWrite}
              onStarter={() => {
                startRefresh(async () => {
                  const res = await createStarterFolders(propertyId);
                  if (res.error) toast.error(res.error);
                  else {
                    toast.success("Ordnerstruktur angelegt.");
                    refresh();
                  }
                });
              }}
              onNewFolder={() => setNewFolderOpen(true)}
              onUpload={() => fileInputRef.current?.click()}
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {folders.map((folder) => (
                <li key={folder.id}>
                  <div className="flex items-center gap-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => navigate(folder.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700">
                        <Folder className="size-5" />
                      </span>
                      <span className="min-w-0 truncate font-medium">
                        {folder.name}
                      </span>
                    </button>
                    {canWrite ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Aktionen">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => setRenameFolderTarget(folder)}
                          >
                            <Pencil className="size-4" />
                            Umbenennen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-danger-700 focus:bg-danger-50"
                            onSelect={() => setDeleteFolderTarget(folder)}
                          >
                            <Trash2 className="size-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </li>
              ))}

              {documents.map((doc) => {
                const kind = fileKind(doc.file_name, doc.mime_type);
                const Icon = KIND_ICON[kind];
                return (
                  <li key={doc.id}>
                    <div className="flex items-center gap-3 py-2.5">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${KIND_COLOR[kind]}`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {doc.file_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatBytes(doc.size_bytes)} ·{" "}
                          {formatDate(doc.uploaded_at)}
                        </div>
                      </div>
                      <DocMenu
                        doc={doc}
                        canWrite={canWrite}
                        onRename={() => setRenameDocTarget(doc)}
                        onMove={() => setMoveDocTarget(doc)}
                        onDelete={() => setDeleteDocTarget(doc)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Dialoge */}
      {newFolderOpen ? (
        <NameDialog
          title="Neuer Ordner"
          label="Ordnername"
          submitLabel="Anlegen"
          onClose={() => setNewFolderOpen(false)}
          onSubmit={async (name) => {
            const res = await createFolder(propertyId, currentFolderId, name);
            if (res.error) return res.error;
            toast.success("Ordner angelegt.");
            refresh();
            return null;
          }}
        />
      ) : null}

      {renameFolderTarget ? (
        <NameDialog
          title="Ordner umbenennen"
          label="Ordnername"
          submitLabel="Speichern"
          initial={renameFolderTarget.name}
          onClose={() => setRenameFolderTarget(null)}
          onSubmit={async (name) => {
            const res = await renameFolder(renameFolderTarget.id, name);
            if (res.error) return res.error;
            toast.success("Ordner umbenannt.");
            refresh();
            return null;
          }}
        />
      ) : null}

      {renameDocTarget ? (
        <NameDialog
          title="Datei umbenennen"
          label="Dateiname"
          submitLabel="Speichern"
          initial={renameDocTarget.file_name}
          onClose={() => setRenameDocTarget(null)}
          onSubmit={async (name) => {
            const res = await renameDocument(renameDocTarget.id, name);
            if (res.error) return res.error;
            toast.success("Datei umbenannt.");
            refresh();
            return null;
          }}
        />
      ) : null}

      {deleteFolderTarget ? (
        <ConfirmDialog
          title="Ordner löschen"
          description={`„${deleteFolderTarget.name}" wirklich löschen? Nur leere Ordner können gelöscht werden.`}
          confirmLabel="Löschen"
          onClose={() => setDeleteFolderTarget(null)}
          onConfirm={async () => {
            const res = await deleteFolder(deleteFolderTarget.id);
            if (res.error) return res.error;
            toast.success("Ordner gelöscht.");
            refresh();
            return null;
          }}
        />
      ) : null}

      {deleteDocTarget ? (
        <ConfirmDialog
          title="Datei löschen"
          description={`„${deleteDocTarget.file_name}" wirklich unwiderruflich löschen?`}
          confirmLabel="Löschen"
          onClose={() => setDeleteDocTarget(null)}
          onConfirm={async () => {
            const res = await deleteDocument(deleteDocTarget.id);
            if (res.error) return res.error;
            toast.success("Datei gelöscht.");
            refresh();
            return null;
          }}
        />
      ) : null}

      {moveDocTarget ? (
        <MoveDialog
          propertyId={propertyId}
          rootName={breadcrumb[0]?.name ?? "Objekt"}
          doc={moveDocTarget}
          onClose={() => setMoveDocTarget(null)}
          onMoved={() => {
            toast.success("Datei verschoben.");
            refresh();
          }}
        />
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Unterkomponenten
// ---------------------------------------------------------------------------

function DocMenu({
  doc,
  canWrite,
  onRename,
  onMove,
  onDelete,
}: {
  doc: DocumentRow;
  canWrite: boolean;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const viewable = isViewableInBrowser(doc.file_name, doc.mime_type);

  async function open(download: boolean) {
    setBusy(true);
    const res = await getDocumentUrl(doc.id, download);
    setBusy(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Aktionen" disabled={busy}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreVertical className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {viewable ? (
          <DropdownMenuItem onSelect={() => void open(false)}>
            <Eye className="size-4" />
            Ansehen
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => void open(true)}>
          <Download className="size-4" />
          Herunterladen
        </DropdownMenuItem>
        {canWrite ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRename}>
              <Pencil className="size-4" />
              Umbenennen
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onMove}>
              <FolderInput className="size-4" />
              Verschieben
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-danger-700 focus:bg-danger-50"
              onSelect={onDelete}
            >
              <Trash2 className="size-4" />
              Löschen
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({
  isRoot,
  canWrite,
  onStarter,
  onNewFolder,
  onUpload,
}: {
  isRoot: boolean;
  canWrite: boolean;
  onStarter: () => void;
  onNewFolder: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
        <Folder className="size-6" />
      </span>
      <p className="max-w-md text-sm text-muted-foreground">
        Noch keine Dokumente – lade Verträge, Versicherungen, Fotos oder andere
        Unterlagen zu diesem Objekt hoch.
      </p>
      {canWrite && isRoot ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-medium text-neutral-500">
            Ordnerstruktur anlegen:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={onStarter}>
              Verträge &amp; Versicherungen · Technik &amp; Wartung · Fotos
            </Button>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <Button variant="ghost" size="sm" onClick={onNewFolder}>
              <FolderPlus className="size-4" />
              Eigener Ordner
            </Button>
            <Button variant="ghost" size="sm" onClick={onUpload}>
              <Upload className="size-4" />
              Direkt hochladen
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UploadProgress({
  uploads,
  onClear,
}: {
  uploads: UploadItem[];
  onClear: () => void;
}) {
  const done = uploads.filter((u) => u.status !== "uploading").length;
  const allDone = done === uploads.length;
  return (
    <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">
          Uploads · {done} von {uploads.length}
        </span>
        {allDone ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-primary hover:underline"
          >
            Liste leeren
          </button>
        ) : null}
      </div>
      <ul className="flex flex-col gap-1.5">
        {uploads.map((u) => (
          <li key={u.id} className="flex items-center gap-2 text-sm">
            {u.status === "uploading" ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-neutral-400" />
            ) : u.status === "done" ? (
              <Check className="size-4 shrink-0 text-success-600" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-danger-600" />
            )}
            <span className="min-w-0 flex-1 truncate">{u.name}</span>
            {u.status === "error" ? (
              <span className="shrink-0 text-xs text-danger-700">
                {u.error}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dialog für Name-Eingabe (Anlegen/Umbenennen). `onSubmit` gibt Fehler oder null zurück. */
function NameDialog({
  title,
  label,
  submitLabel,
  initial = "",
  onClose,
  onSubmit,
}: {
  title: string;
  label: string;
  submitLabel: string;
  initial?: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<string | null>;
}) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function submit() {
    const name = value.trim();
    if (!name) return;
    startTransition(async () => {
      const error = await onSubmit(name);
      if (error) toast.error(error);
      else onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name-dialog-input">{label}</Label>
          <Input
            id="name-dialog-input"
            value={value}
            autoFocus
            maxLength={200}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Abbrechen
          </Button>
          <Button onClick={submit} disabled={pending || !value.trim()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<string | null>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const error = await onConfirm();
                if (error) toast.error(error);
                else onClose();
              })
            }
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FolderTreeNode extends FolderRow {
  depth: number;
}

/** Ordnerliste in Baum-Reihenfolge mit Tiefe (für Einrückung) bringen. */
function buildFolderTree(folders: FolderRow[]): FolderTreeNode[] {
  const childrenOf = new Map<string | null, FolderRow[]>();
  for (const f of folders) {
    const key = f.parent_folder_id ?? null;
    const list = childrenOf.get(key) ?? [];
    list.push(f);
    childrenOf.set(key, list);
  }
  for (const list of childrenOf.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  const out: FolderTreeNode[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const f of childrenOf.get(parent) ?? []) {
      out.push({ ...f, depth });
      walk(f.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

function MoveDialog({
  propertyId,
  rootName,
  doc,
  onClose,
  onMoved,
}: {
  propertyId: string;
  rootName: string;
  doc: DocumentRow;
  onClose: () => void;
  onMoved: () => void;
}) {
  const [tree, setTree] = useState<FolderTreeNode[] | null>(null);
  const [pending, startTransition] = useTransition();

  // Ordnerliste beim Öffnen laden.
  useEffect(() => {
    let active = true;
    void listAllFolders(propertyId).then((folders) => {
      if (active) setTree(buildFolderTree(folders));
    });
    return () => {
      active = false;
    };
  }, [propertyId]);

  function move(targetId: string | null) {
    startTransition(async () => {
      const res = await moveDocument(doc.id, targetId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      onMoved();
      onClose();
    });
  }

  const currentDocFolder = doc.folder_id ?? null;

  return (
    <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verschieben</DialogTitle>
          <DialogDescription>
            Zielordner für „{doc.file_name}" wählen.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto">
          {tree === null ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-neutral-400" />
            </div>
          ) : (
            <ul className="flex flex-col">
              <FolderTarget
                name={rootName}
                depth={0}
                icon="root"
                disabled={pending || currentDocFolder === null}
                onSelect={() => move(null)}
              />
              {tree.map((f) => (
                <FolderTarget
                  key={f.id}
                  name={f.name}
                  depth={f.depth + 1}
                  icon="folder"
                  disabled={pending || currentDocFolder === f.id}
                  onSelect={() => move(f.id)}
                />
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Abbrechen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FolderTarget({
  name,
  depth,
  icon,
  disabled,
  onSelect,
}: {
  name: string;
  depth: number;
  icon: "root" | "folder";
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        style={{ paddingLeft: `${0.5 + depth * 1}rem` }}
        className="flex w-full items-center gap-2 rounded-md py-2 pr-2 text-left text-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {icon === "root" ? (
          <FolderInput className="size-4 shrink-0 text-neutral-500" />
        ) : (
          <Folder className="size-4 shrink-0 text-gold-600" />
        )}
        <span className="min-w-0 truncate">{name}</span>
        {disabled ? (
          <span className="ml-auto text-xs text-neutral-400">hier</span>
        ) : null}
      </button>
    </li>
  );
}
