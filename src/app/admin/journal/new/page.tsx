import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { journalConfigured } from "@/lib/journal-db";
import { createPost } from "@/app/actions/journal";
import { PostFields } from "@/components/admin/post-fields";

export const dynamic = "force-dynamic";

export default async function NewJournalPost() {
  if (!adminConfigured || !(await requireAdmin())) return null;
  if (!journalConfigured) return null;

  return (
    <>
      <Link
        href="/admin/journal"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Terug naar Journal
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Nieuwe post
      </h1>
      <p className="mt-2 text-sm text-muted">
        Wordt als concept opgeslagen — publiceren doe je daarna in de lijst.
      </p>

      <form action={createPost} className="mt-6">
        <PostFields />
        <div className="mt-6 flex items-center gap-3">
          <button className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Opslaan als concept
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
