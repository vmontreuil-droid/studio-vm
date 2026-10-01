import { notFound } from "next/navigation";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  FileCode2,
  FileType,
  ExternalLink,
  Trash2,
  FolderArchive,
  Upload,
  Building2,
  User2,
} from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { dt, PORTAL_T } from "@/lib/portal-shared";
import { DocUploader } from "@/components/doc-uploader";
import { deleteOwnDocument } from "@/app/actions/portal-client";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

type Doc = {
  id: string;
  name: string;
  url: string;
  kind: string;
  created_at: string;
  uploaded_by: string | null;
};

const L: Record<
  Locale,
  {
    sub: string;
    fromStudio: string;
    fromYou: string;
    noneStudio: string;
    noneYou: string;
    open: string;
    total: string;
    uploadHint: string;
    remove: string;
  }
> = {
  nl: {
    sub: "Uw aangeleverde plannen en de documenten van Studio VM — offertes, facturen en geleverde bestanden — op één plek. De modelbestanden per machinesturing vindt u bij elk project.",
    fromStudio: "Van Studio VM",
    fromYou: "Door u aangeleverd",
    noneStudio: "Nog niets gedeeld.",
    noneYou: "Sleep hierboven uw plannen (PDF, DWG, DXF, LandXML) of andere projectbestanden erin.",
    open: "Openen",
    total: "documenten",
    uploadHint: "Plannen aanleveren",
    remove: "Verwijderen",
  },
  fr: {
    sub: "Vos plans et les documents de Studio VM — devis, factures et fichiers livrés — au même endroit. Les fichiers du modèle par système de guidage se trouvent dans chaque projet.",
    fromStudio: "De Studio VM",
    fromYou: "Fournis par vous",
    noneStudio: "Rien de partagé pour l'instant.",
    noneYou: "Glissez ci-dessus vos plans (PDF, DWG, DXF, LandXML) ou d'autres fichiers du projet.",
    open: "Ouvrir",
    total: "documents",
    uploadHint: "Envoyer des plans",
    remove: "Supprimer",
  },
  en: {
    sub: "Your plans and the documents from Studio VM — quotes, invoices and delivered files — in one place. The model files per machine control system are in each project.",
    fromStudio: "From Studio VM",
    fromYou: "Provided by you",
    noneStudio: "Nothing shared yet.",
    noneYou: "Drag your plans (PDF, DWG, DXF, LandXML) or other project files in above.",
    open: "Open",
    total: "documents",
    uploadHint: "Upload plans",
    remove: "Delete",
  },
  de: {
    sub: "Ihre Pläne und die Dokumente von Studio VM — Angebote, Rechnungen und gelieferte Dateien — an einem Ort. Die Modelldateien pro Maschinensteuerung finden Sie im jeweiligen Projekt.",
    fromStudio: "Von Studio VM",
    fromYou: "Von Ihnen bereitgestellt",
    noneStudio: "Noch nichts geteilt.",
    noneYou: "Ziehen Sie Ihre Pläne (PDF, DWG, DXF, LandXML) oder andere Projektdateien oben hinein.",
    open: "Öffnen",
    total: "Dokumente",
    uploadHint: "Pläne hochladen",
    remove: "Löschen",
  },
  es: {
    sub: "Sus planos y los documentos de Studio VM — presupuestos, facturas y archivos entregados — en un solo lugar. Los archivos del modelo por sistema de control de máquina están en cada proyecto.",
    fromStudio: "De Studio VM",
    fromYou: "Aportado por usted",
    noneStudio: "Todavía no se ha compartido nada.",
    noneYou: "Arrastre arriba sus planos (PDF, DWG, DXF, LandXML) u otros archivos del proyecto.",
    open: "Abrir",
    total: "documentos",
    uploadHint: "Subir planos",
    remove: "Eliminar",
  },
};

// File-type icoon op basis van extensie. Lichtgewicht, geen MIME-lookup.
function iconFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp"].includes(ext))
    return FileImage;
  if (["xls", "xlsx", "csv", "ods", "numbers"].includes(ext))
    return FileSpreadsheet;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  // CAD-plannen en modelbestanden (DWG/DXF/LandXML/…).
  if (["dwg", "dxf", "xml", "landxml", "ttm", "tp3", "svd", "svl", "json"].includes(ext))
    return FileCode2;
  if (["ttf", "otf", "woff", "woff2"].includes(ext)) return FileType;
  return FileText;
}

// Kleur per extensie-bucket — geeft de lijst visueel ritme.
function colorFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "text-red-500";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext))
    return "text-purple-500";
  if (["xls", "xlsx", "csv"].includes(ext))
    return "text-green-600 dark:text-green-400";
  if (["doc", "docx"].includes(ext))
    return "text-sky-600 dark:text-sky-400";
  if (["dwg", "dxf", "xml", "landxml"].includes(ext))
    return "text-teal-600 dark:text-teal-400";
  if (["zip", "rar", "7z"].includes(ext))
    return "text-amber-600 dark:text-amber-400";
  return "text-accent";
}

export default async function PortalDocuments({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const t = PORTAL_T[locale];
  const l = L[locale];

  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const email = user?.email?.toLowerCase() ?? "";

  const { data } = await sb
    .from("documents")
    .select("id, name, url, kind, created_at, uploaded_by")
    .order("created_at", { ascending: false });
  const docs = (data as Doc[]) ?? [];

  // Signed URLs voor in Storage geüploade bestanden (privébucket).
  const hrefs = new Map<string, string>();
  for (const d of docs) {
    if (/^https?:\/\//i.test(d.url)) {
      hrefs.set(d.id, d.url);
    } else {
      const { data: signed } = await sb.storage
        .from("client-docs")
        .createSignedUrl(d.url, 3600);
      if (signed?.signedUrl) hrefs.set(d.id, signed.signedUrl);
    }
  }

  const studioDocs = docs.filter((d) => d.uploaded_by !== "klant");
  const myDocs = docs.filter((d) => d.uploaded_by === "klant");

  const Card = ({ d, own }: { d: Doc; own: boolean }) => {
    const Icon = iconFor(d.name);
    const color = colorFor(d.name);
    const ext = d.name.split(".").pop()?.toUpperCase() ?? "";
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-sm transition-colors hover:bg-card-hover">
        <a
          href={hrefs.get(d.id) ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-background ${color}`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{d.name}</span>
            <span className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
              {ext && (
                <span className="rounded bg-background px-1.5 py-0.5">
                  {ext}
                </span>
              )}
              <span>{d.kind}</span>
              <span>·</span>
              <span>{dt(d.created_at, locale)}</span>
            </span>
          </span>
        </a>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={hrefs.get(d.id) ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent"
          >
            {l.open}
            <ExternalLink className="h-4 w-4" strokeWidth={2} />
          </a>
          {own && (
            <form action={deleteOwnDocument.bind(null, d.id)}>
              <SubmitButton
                ariaLabel={l.remove}
                className="rounded-full border p-2 text-muted transition-colors hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent">
            <FolderArchive className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.documents}
            </h1>
            <p className="mt-0.5 max-w-2xl text-sm text-muted">{l.sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
            <FolderArchive className="h-3 w-3" strokeWidth={2.5} />
            {docs.length} {l.total}
          </span>
          {myDocs.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
              <User2 className="h-3 w-3" strokeWidth={2.5} />
              {myDocs.length}
            </span>
          )}
          {studioDocs.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
              <Building2 className="h-3 w-3" strokeWidth={2.5} />
              {studioDocs.length}
            </span>
          )}
        </div>
      </div>

      {/* Uploader */}
      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
          <Upload className="h-3.5 w-3.5" strokeWidth={2.5} />
          {l.uploadHint}
        </h2>
        <DocUploader email={email} locale={locale} />
      </div>

      {/* Jouw documenten */}
      <h2 className="mt-10 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
        <User2 className="h-3.5 w-3.5" strokeWidth={2.5} />
        {l.fromYou}
        <span className="font-normal text-muted/70">({myDocs.length})</span>
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {myDocs.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/30 p-6 text-center text-sm text-muted sm:col-span-2">
            <FileText
              className="mx-auto mb-2 h-6 w-6 opacity-50"
              strokeWidth={1.5}
            />
            {l.noneYou}
          </div>
        ) : (
          myDocs.map((d) => <Card key={d.id} d={d} own />)
        )}
      </div>

      {/* Studio-documenten */}
      <h2 className="mt-10 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
        <Building2 className="h-3.5 w-3.5" strokeWidth={2.5} />
        {l.fromStudio}
        <span className="font-normal text-muted/70">({studioDocs.length})</span>
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {studioDocs.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/30 p-6 text-center text-sm text-muted sm:col-span-2">
            <FileText
              className="mx-auto mb-2 h-6 w-6 opacity-50"
              strokeWidth={1.5}
            />
            {l.noneStudio}
          </div>
        ) : (
          studioDocs.map((d) => <Card key={d.id} d={d} own={false} />)
        )}
      </div>
    </>
  );
}
