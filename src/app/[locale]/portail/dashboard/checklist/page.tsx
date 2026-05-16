import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { toggleChecklistItem } from "@/app/actions/portal-client";
import { PORTAL_T, type ChecklistItem } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<Locale, { none: string; sub: string; doneN: (a: number, b: number) => string }> = {
  nl: {
    none: "Nog geen checklist. Zodra we starten zet ik hier wat ik van je nodig heb.",
    sub: "Wat ik van je nodig heb om vlot verder te kunnen. Vink af wat klaar is.",
    doneN: (a, b) => `${a} van ${b} klaar`,
  },
  fr: {
    none: "Pas encore de checklist. Dès qu'on démarre, j'y mets ce dont j'ai besoin.",
    sub: "Ce dont j'ai besoin pour avancer. Cochez ce qui est prêt.",
    doneN: (a, b) => `${a} sur ${b} prêt`,
  },
  en: {
    none: "No checklist yet. As soon as we start I'll put here what I need from you.",
    sub: "What I need from you to move forward. Tick what's ready.",
    doneN: (a, b) => `${a} of ${b} done`,
  },
};

export default async function PortalChecklist({
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
  const { data } = await sb
    .from("checklist_items")
    .select("id, label, done, sort")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });
  const items = (data as ChecklistItem[]) ?? [];
  const doneCount = items.filter((i) => i.done).length;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.checklist}
      </h1>
      <p className="mt-3 text-sm text-muted">{l.sub}</p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted">
          {l.none}
        </p>
      ) : (
        <>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-accent">
            {l.doneN(doneCount, items.length)}
          </p>
          <div className="mt-3 space-y-2">
            {items.map((it) => (
              <form
                key={it.id}
                action={toggleChecklistItem.bind(null, it.id, !it.done)}
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-card-hover"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                      it.done
                        ? "border-green-500 bg-green-500/15 text-green-600 dark:text-green-400"
                        : "border-border"
                    }`}
                  >
                    {it.done && (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      it.done ? "text-muted line-through" : ""
                    }`}
                  >
                    {it.label}
                  </span>
                </button>
              </form>
            ))}
          </div>
        </>
      )}
    </>
  );
}
