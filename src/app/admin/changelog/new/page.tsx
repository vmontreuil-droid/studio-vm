import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { changelogConfigured } from "@/lib/changelog-db";
import { createEntry } from "@/app/actions/changelog";
import { ChangelogFields } from "@/components/admin/changelog-fields";

export const dynamic = "force-dynamic";

export default async function NewChangelogEntry() {
  if (!adminConfigured || !(await requireAdmin())) return null;
  if (!changelogConfigured) return null;

  return (
    <>
      <Link
        href="/admin/changelog"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Terug naar Changelog
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Nieuwe entry
      </h1>
      <p className="mt-2 text-sm text-muted">
        Wordt als concept opgeslagen — publiceren doe je daarna in de lijst.
      </p>

      <form action={createEntry} className="mt-6">
        <ChangelogFields />
        <div className="mt-6 flex items-center gap-3">
          <button className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Opslaan als concept
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
