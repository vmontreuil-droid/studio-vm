import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { changelogConfigured, dbChangelogGet } from "@/lib/changelog-db";
import {
  updateEntry,
  setEntryPublished,
  deleteEntry,
} from "@/app/actions/changelog";
import { ChangelogFields } from "@/components/admin/changelog-fields";

export const dynamic = "force-dynamic";

export default async function EditChangelogEntry({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  if (!changelogConfigured) return null;

  const { id } = await params;
  const row = await dbChangelogGet(id);
  if (!row) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/changelog"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Terug naar Changelog
        </Link>
        <div className="flex items-center gap-2">
          <form action={setEntryPublished}>
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
          <form action={deleteEntry}>
            <input type="hidden" name="id" value={row.id} />
            <button className="rounded-full border px-3 py-1.5 text-xs text-red-500 hover:bg-card-hover">
              Verwijder
            </button>
          </form>
        </div>
      </div>

      <h1 className="mt-4 flex items-center gap-3 text-2xl font-semibold tracking-tight">
        Entry bewerken
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

      <form action={updateEntry} className="mt-6">
        <input type="hidden" name="id" value={row.id} />
        <ChangelogFields row={row} />
        <div className="mt-6 flex items-center gap-3">
          <button className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Wijzigingen opslaan
          </button>
          <Link
            href="/admin/changelog"
            className="rounded-full border px-5 py-2.5 text-sm text-muted hover:text-foreground"
          >
            Annuleren
          </Link>
        </div>
      </form>
    </>
  );
}
