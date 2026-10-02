import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { journalConfigured, dbGet } from "@/lib/journal-db";
import { updatePost, setPublished, deletePost } from "@/app/actions/journal";
import { PostFields } from "@/components/admin/post-fields";

export const dynamic = "force-dynamic";

export default async function EditJournalPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  if (!journalConfigured) return null;

  const { id } = await params;
  const row = await dbGet(id);
  if (!row) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/journal"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Terug naar Journal
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/nl/journal/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-muted hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
            Bekijk
          </a>
          <form action={setPublished}>
            <input type="hidden" name="id" value={row.id} />
            <input
              type="hidden"
              name="published"
              value={row.published ? "0" : "1"}
            />
            <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-card-hover">
              {row.published ? "Depubliceer" : "Publiceer"}
            </button>
          </form>
          <form action={deletePost}>
            <input type="hidden" name="id" value={row.id} />
            <button className="rounded-full border px-3 py-1.5 text-xs text-red-500 hover:bg-card-hover">
              Verwijder
            </button>
          </form>
        </div>
      </div>

      <h1 className="mt-4 flex items-center gap-3 text-2xl font-semibold tracking-tight">
        Post bewerken
        <span
          className={`rounded px-2 py-0.5 font-mono text-[10px] ${
            row.published
              ? "bg-green-500/15 text-green-600 dark:text-green-400"
              : "bg-muted/15 text-muted"
          }`}
        >
          {row.published ? "gepubliceerd" : "concept"}
        </span>
      </h1>

      <form action={updatePost} className="mt-6">
        <input type="hidden" name="id" value={row.id} />
        <PostFields row={row} />
        <div className="mt-6 flex items-center gap-3">
          <button className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Wijzigingen opslaan
          </button>
          <Link
            href="/admin/journal"
            className="rounded-full border px-5 py-2.5 text-sm text-muted hover:text-foreground"
          >
            Annuleren
          </Link>
        </div>
      </form>
    </>
  );
}
