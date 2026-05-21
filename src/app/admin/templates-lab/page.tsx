import Link from "next/link";
import {
  LayoutTemplate,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  listTemplates,
  toggleLive,
  deleteTemplate,
  duplicateTemplate,
} from "@/app/actions/templates-lab";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function TemplatesLab() {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const templates = await listTemplates();

  const total = templates.length;
  const live = templates.filter((t) => t.is_live).length;
  const draft = total - live;
  const bySector = new Map<string, number>();
  for (const t of templates) {
    const k = t.sector ?? "—";
    bySector.set(k, (bySector.get(k) ?? 0) + 1);
  }
  const sectors = [...bySector.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent">
            <LayoutTemplate className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Templates-lab
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Verborgen werkplek voor builder-templates. Alleen 'Live'-
              templates verschijnen voor klanten in <code>/builder</code>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
            <LayoutTemplate className="h-3 w-3" strokeWidth={2.5} />
            {total} totaal
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-green-600 dark:text-green-400">
            <Eye className="h-3 w-3" strokeWidth={2.5} />
            {live} live
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400">
            <EyeOff className="h-3 w-3" strokeWidth={2.5} />
            {draft} draft
          </span>
        </div>
      </div>

      {/* Sector-chips: snel filter-overzicht */}
      {sectors.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {sectors.slice(0, 20).map(([s, n]) => (
            <a
              key={s}
              href={`#sec-${s}`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted hover:border-accent hover:text-accent"
            >
              {s}
              <span className="text-muted/60">{n}</span>
            </a>
          ))}
          {sectors.length > 20 && (
            <span className="self-center text-[10px] text-muted">
              + {sectors.length - 20} andere
            </span>
          )}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed bg-card/30 p-10 text-center">
          <Sparkles
            className="mx-auto h-8 w-8 text-muted"
            strokeWidth={1.5}
          />
          <p className="mt-3 text-sm text-muted">
            Nog geen templates. Run{" "}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
              node scripts/seed-builder-templates.mjs
            </code>{" "}
            om er ~150 te seeden uit je sector-presets.
          </p>
        </div>
      )}

      {/* Grid */}
      {total > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((t) => (
            <div
              key={t.id}
              id={`sec-${t.sector ?? ""}`}
              className={`overflow-hidden rounded-2xl border bg-card shadow-sm ${
                t.is_live ? "ring-1 ring-green-500/30" : ""
              }`}
            >
              {/* Preview: kleurvlak met accent + sector-naam — later
                  vervangen door echte screenshot of mini-render. */}
              <div
                className="relative h-32"
                style={{
                  background: t.accent_color
                    ? `linear-gradient(135deg, ${t.accent_color}, ${t.accent_color}cc 40%, #0a0a0acc 100%)`
                    : "#0a0a0a",
                }}
              >
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white backdrop-blur">
                  {t.tone ?? "—"} · {t.radius ?? "—"}
                </span>
                <span
                  className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest backdrop-blur ${
                    t.is_live
                      ? "bg-green-500/80 text-white"
                      : "bg-black/40 text-white/80"
                  }`}
                >
                  {t.is_live ? "✓ Live" : "Draft"}
                </span>
              </div>

              {/* Meta */}
              <div className="px-4 pt-3">
                <h3 className="truncate text-sm font-semibold tracking-tight">
                  {t.name}
                </h3>
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted">
                  {t.sector ?? "—"} · {t.slug}
                </p>
                {t.description && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] text-muted">
                    {t.description}
                  </p>
                )}
              </div>

              {/* Acties */}
              <div className="mt-3 flex items-center gap-1 border-t bg-background/30 px-3 py-2">
                <form action={toggleLive}>
                  <input type="hidden" name="id" value={t.id} />
                  <input
                    type="hidden"
                    name="is_live"
                    value={t.is_live ? "false" : "true"}
                  />
                  <SubmitButton
                    ariaLabel={t.is_live ? "Naar draft" : "Activeer live"}
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
                      t.is_live
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "border text-muted hover:text-accent"
                    }`}
                  >
                    {t.is_live ? (
                      <Eye className="h-3 w-3" strokeWidth={2.5} />
                    ) : (
                      <EyeOff className="h-3 w-3" strokeWidth={2.5} />
                    )}
                    {t.is_live ? "Live" : "Draft"}
                  </SubmitButton>
                </form>
                <Link
                  href={`/nl/builder?template=${t.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted hover:text-accent"
                >
                  <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
                  Open
                </Link>
                <form action={duplicateTemplate} className="ml-auto">
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton
                    ariaLabel="Dupliceer"
                    className="rounded-full border p-1.5 text-muted hover:text-accent"
                  >
                    <Copy className="h-3 w-3" strokeWidth={2} />
                  </SubmitButton>
                </form>
                <form action={deleteTemplate}>
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton
                    ariaLabel="Verwijder"
                    className="rounded-full border p-1.5 text-muted hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={2} />
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
