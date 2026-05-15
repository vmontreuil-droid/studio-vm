import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { changelogConfigured, dbChangelogListAll } from "@/lib/changelog-db";
import { setEntryPublished, deleteEntry } from "@/app/actions/changelog";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  launch: "Lancering",
  feature: "Nieuw",
  improve: "Beter",
  fix: "Fix",
};

export default async function AdminChangelog() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  if (!changelogConfigured) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
        <p className="mt-4 max-w-prose text-muted">
          De changelog-tabel bestaat nog niet. Pas migratie{" "}
          <code>0008_changelog.sql</code> toe in Supabase → SQL Editor. Tot dan
          toont de publieke /changelog het ingebouwde logboek en verandert er
          niets live.
        </p>
      </>
    );
  }

  const rows = await dbChangelogListAll();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Changelog <span className="text-muted">({rows.length})</span>
        </h1>
        <Link
          href="/admin/changelog/new"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nieuwe entry
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">
        Entries die je publiceert, vervangen het ingebouwde logboek op de
        publieke /changelog.
      </p>

      <ul className="mt-6 space-y-2">
        {rows.length === 0 && (
          <li className="rounded-2xl border bg-card p-6 text-muted">
            Nog geen entries. /changelog toont voorlopig het ingebouwde
            logboek.
          </li>
        )}
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm"
          >
            <span className="min-w-0">
              <strong className="break-words">
                {r.content?.nl?.title || "(zonder titel)"}
              </strong>
              <span
                className={`ml-2 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  r.published
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-muted/15 text-muted"
                }`}
              >
                {r.published ? "gepubliceerd" : "concept"}
              </span>
              <span className="ml-2 font-mono text-[10px] text-muted">
                {r.entry_date} · v{r.version || "—"} ·{" "}
                {KIND_LABEL[r.kind] ?? r.kind}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Link
                href={`/admin/changelog/${r.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                Bewerken
              </Link>
              <form action={setEntryPublished}>
                <input type="hidden" name="id" value={r.id} />
                <input
                  type="hidden"
                  name="published"
                  value={r.published ? "0" : "1"}
                />
                <button className="rounded-full border px-3 py-1 text-xs hover:bg-card-hover">
                  {r.published ? "Depubliceer" : "Publiceer"}
                </button>
              </form>
              <form action={deleteEntry}>
                <input type="hidden" name="id" value={r.id} />
                <button className="rounded-full border px-3 py-1 text-xs text-red-500 hover:bg-card-hover">
                  Verwijder
                </button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
