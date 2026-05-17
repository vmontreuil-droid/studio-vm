"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  { drop: string; hint: string; busy: string; err: string; max: string }
> = {
  nl: {
    drop: "Sleep bestanden hierheen of klik om te kiezen",
    hint: "Logo, teksten, foto's, contracten… (max 25 MB per bestand)",
    busy: "Bezig met uploaden…",
    err: "Uploaden mislukt — probeer opnieuw of mail het bestand.",
    max: "is te groot (max 25 MB)",
  },
  fr: {
    drop: "Glissez vos fichiers ici ou cliquez pour choisir",
    hint: "Logo, textes, photos, contrats… (max 25 Mo par fichier)",
    busy: "Téléversement en cours…",
    err: "Échec du téléversement — réessayez ou envoyez le fichier par e-mail.",
    max: "est trop volumineux (max 25 Mo)",
  },
  en: {
    drop: "Drag files here or click to choose",
    hint: "Logo, texts, photos, contracts… (max 25 MB per file)",
    busy: "Uploading…",
    err: "Upload failed — try again or email the file.",
    max: "is too large (max 25 MB)",
  },
};

const MAX = 25 * 1024 * 1024;

export function DocUploader({
  email,
  locale,
}: {
  email: string;
  locale: Locale;
}) {
  const t = T[locale];
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setMsg(null);
    start(async () => {
      const sb = getSupabaseBrowser();
      for (const file of list) {
        if (file.size > MAX) {
          setMsg(`"${file.name}" ${t.max}`);
          continue;
        }
        const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
        const path = `${email}/${Date.now()}-${safe}`;
        const up = await sb.storage
          .from("client-docs")
          .upload(path, file, { upsert: false });
        if (up.error) {
          setMsg(t.err);
          continue;
        }
        const ext =
          file.name.split(".").pop()?.toLowerCase().slice(0, 8) || "file";
        const ins = await sb.from("documents").insert({
          client_email: email,
          name: file.name.slice(0, 160),
          url: path,
          kind: ext,
          uploaded_by: "klant",
        });
        if (ins.error) setMsg(t.err);
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
        }
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          over
            ? "border-accent bg-accent/5"
            : "border-border bg-card/50 hover:bg-card-hover"
        }`}
      >
        {pending ? (
          <Loader2 className="h-7 w-7 animate-spin text-accent" strokeWidth={1.75} />
        ) : (
          <UploadCloud className="h-7 w-7 text-accent" strokeWidth={1.75} />
        )}
        <p className="text-sm font-medium">{pending ? t.busy : t.drop}</p>
        <p className="text-xs text-muted">{t.hint}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handle(e.target.files)}
        />
      </div>
      {msg && <p className="mt-2 text-sm text-red-500">{msg}</p>}
    </div>
  );
}
