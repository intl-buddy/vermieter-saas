"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { RoomPhoto } from "./types";

const PROTOCOLS_BUCKET = "protocols";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Foto-Auswahl je Raum: lädt Bilder direkt vom Handy in den privaten Bucket
 * „protocols" und meldet die Pfade nach oben. Bereits vorhandene Fotos
 * (Wiedereinstieg) werden über signierte Vorschau-URLs angezeigt.
 */
export function PhotoInput({
  photos,
  previews,
  userId,
  protocolId,
  onChange,
}: {
  photos: RoomPhoto[];
  /** path → signierte Vorschau-URL (für bereits gespeicherte Fotos). */
  previews: Record<string, string>;
  userId: string;
  protocolId: string;
  onChange: (photos: RoomPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Lokale Vorschau-URLs für frisch hochgeladene Fotos (Object-URLs).
  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = ""; // gleiche Datei erneut wählbar machen

    setBusy(true);
    const supabase = createClient();
    const added: RoomPhoto[] = [];
    const newLocal: Record<string, string> = {};

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`„${file.name}" ist kein Bild.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`„${file.name}" ist zu groß (max. 10 MB).`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${protocolId}/fotos/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(PROTOCOLS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) {
        toast.error(`Upload fehlgeschlagen: ${error.message}`);
        continue;
      }
      added.push({ path });
      newLocal[path] = URL.createObjectURL(file);
    }

    if (added.length > 0) {
      setLocalUrls((s) => ({ ...s, ...newLocal }));
      onChange([...photos, ...added]);
    }
    setBusy(false);
  }

  function remove(path: string) {
    // Datei aus dem Storage entfernen (Best effort) und Pfad abhängen.
    const supabase = createClient();
    void supabase.storage.from(PROTOCOLS_BUCKET).remove([path]);
    onChange(photos.filter((p) => p.path !== path));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => {
          const url = localUrls[p.path] ?? previews[p.path];
          return (
            <div
              key={p.path}
              className="relative size-20 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt="Foto"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[10px] text-neutral-400">
                  Foto
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(p.path)}
                aria-label="Foto entfernen"
                className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={onFiles}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="self-start"
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Wird hochgeladen …
          </>
        ) : (
          <>
            <Camera className="size-4" />
            Foto hinzufügen
          </>
        )}
      </Button>
    </div>
  );
}
