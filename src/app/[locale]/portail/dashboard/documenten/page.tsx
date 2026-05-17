import { notFound } from "next/navigation";
import { FileText, ExternalLink, Trash2 } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { dt, PORTAL_T } from "@/lib/portal-shared";
import { DocUploader } from "@/components/doc-uploader";
import { deleteOwnDocument } from "@/app/actions/portal-client";

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
  }
> = {
  nl: {
    sub: "Contracten, ontwerpen en facturen van mij — en alles wat jij aanlevert, op één plek.",
    fromStudio: "Van Studio VM",
    fromYou: "Door jou aangeleverd",
    noneStudio: "Nog niets gedeeld.",
    noneYou: "Sleep hierboven je logo, teksten of foto's erin.",
    open: "Openen",
  },
  fr: {
    sub: "Contrats, maquettes et factures de ma part — et tout ce que vous fournissez, au même endroit.",
    fromStudio: "De Studio VM",
    fromYou: "Fournis par vous",
    noneStudio: "Rien de partagé pour l'instant.",
    noneYou: "Glissez ci-dessus votre logo, vos textes ou photos.",
    open: "Ouvrir",
  },
  en: {
    sub: "Contracts, designs and invoices from me — and everything you provide, in one place.",
    fromStudio: "From Studio VM",
    fromYou: "Provided by you",
    noneStudio: "Nothing shared yet.",
    noneYou: "Drag your logo, texts or photos in above.",
    open: "Open",
  },
};

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

  const Card = ({ d, own }: { d: Doc; own: boolean }) => (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-5 transition-colors hover:bg-card-hover">
      <a
        href={hrefs.get(d.id) ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <FileText className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.75} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{d.name}</span>
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
            {d.kind} · {dt(d.created_at, locale)}
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
            <button
              aria-label="Verwijder"
              className="rounded-full border p-2 text-muted transition-colors hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.documents}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">{l.sub}</p>

      <div className="mt-6">
        <DocUploader email={email} locale={locale} />
      </div>

      <h2 className="mt-10 font-mono text-xs uppercase tracking-widest text-accent">
        {l.fromYou}
      </h2>
      <div className="mt-4 space-y-3">
        {myDocs.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted">
            {l.noneYou}
          </p>
        ) : (
          myDocs.map((d) => <Card key={d.id} d={d} own />)
        )}
      </div>

      <h2 className="mt-10 font-mono text-xs uppercase tracking-widest text-accent">
        {l.fromStudio}
      </h2>
      <div className="mt-4 space-y-3">
        {studioDocs.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted">
            {l.noneStudio}
          </p>
        ) : (
          studioDocs.map((d) => <Card key={d.id} d={d} own={false} />)
        )}
      </div>
    </>
  );
}
