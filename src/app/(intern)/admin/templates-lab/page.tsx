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
              {/* High-tech preview-card — pure CSS, geen externe imagery.
                  Gradient-mesh achtergrond met glow-blob, glass-overlay
                  bovenaan met archetype-naam, en een mock-layout-skelet
                  dat een hint geeft van de section-structuur. */}
              <div
                className="relative h-44 overflow-hidden"
                style={{
                  background: `
                    radial-gradient(circle at 22% 18%, ${(t.accent_color ?? "#ef7e22")}55 0%, transparent 48%),
                    radial-gradient(circle at 82% 78%, ${(t.accent_color ?? "#ef7e22")}88 0%, transparent 52%),
                    linear-gradient(135deg, #050505 0%, #0f0f10 60%, #1a1a1c 100%)
                  `,
                }}
              >
                {/* Soft glow-blob in de hoek */}
                <div
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-3xl"
                  style={{ background: t.accent_color ?? "#ef7e22" }}
                />
                {/* Mock-layout-skelet: hints naar section-structuur per archetype */}
                <div className="absolute inset-0 grid place-items-center p-5">
                  <MockLayout
                    archetype={t.slug.split("-").slice(0, -1).join("-")}
                    accent={t.accent_color ?? "#ef7e22"}
                  />
                </div>
                {/* Top-left: status pill */}
                <span
                  className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest backdrop-blur-md ${
                    t.is_live
                      ? "bg-green-500/90 text-white shadow-lg shadow-green-500/30"
                      : "bg-black/40 text-white/70"
                  }`}
                >
                  {t.is_live ? "● Live" : "Draft"}
                </span>
                {/* Top-right: tone/radius chip */}
                <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/80 backdrop-blur-md">
                  {t.tone ?? "—"} · {t.radius ?? "—"}
                </span>
                {/* Bottom: glass-overlay card met archetype + accent-dot */}
                <div className="absolute inset-x-2.5 bottom-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full shadow"
                      style={{
                        background: t.accent_color ?? "#ef7e22",
                        boxShadow: `0 0 12px ${t.accent_color ?? "#ef7e22"}`,
                      }}
                    />
                    <p className="truncate font-mono text-[10px] uppercase tracking-widest text-white/90">
                      {t.slug.split("-").slice(0, -1).join("-") || t.slug}
                    </p>
                  </div>
                </div>
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

// MockLayout — hint visueel naar de section-structuur van het archetype.
// Pure CSS skeletons (rechthoeken) zonder echte content, maar de
// VERHOUDINGEN en POSITIES verschillen per archetype zodat templates
// op een glance verschillen.
function MockLayout({
  archetype,
  accent,
}: {
  archetype: string;
  accent: string;
}) {
  const cls = "rounded-md bg-white/[0.08] backdrop-blur-sm";
  const accentCls = "rounded-md backdrop-blur-sm";
  const accentStyle = { background: `${accent}40` };

  switch (archetype) {
    case "magazine":
      return (
        <div className="grid w-full max-w-[180px] grid-cols-3 gap-1">
          <div className={`${cls} col-span-3 h-10`} />
          <div className={`${cls} h-4`} />
          <div className={`${cls} h-4`} />
          <div className={`${cls} h-4`} />
          <div className={`${cls} col-span-2 h-6`} />
          <div className={`${accentCls} h-6`} style={accentStyle} />
        </div>
      );
    case "split-hero":
      return (
        <div className="grid w-full max-w-[180px] grid-cols-2 gap-1.5">
          <div className="space-y-1">
            <div className={`${cls} h-3`} />
            <div className={`${cls} h-3 w-2/3`} />
            <div className={`${accentCls} h-4 w-1/2`} style={accentStyle} />
          </div>
          <div className={`${cls} h-12`} />
          <div className={`${cls} col-span-2 h-4`} />
        </div>
      );
    case "video-hero":
      return (
        <div className="w-full max-w-[180px] space-y-1.5">
          <div className={`${cls} relative h-14`}>
            <div
              className={`${accentCls} absolute inset-x-3 bottom-1 h-3`}
              style={accentStyle}
            />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className={`${cls} h-3`} />
            <div className={`${cls} h-3`} />
            <div className={`${cls} h-3`} />
          </div>
        </div>
      );
    case "grid-portfolio":
      return (
        <div className="grid w-full max-w-[180px] grid-cols-3 gap-1">
          <div className={`${cls} col-span-3 h-6`} />
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`${cls} aspect-square`} />
          ))}
        </div>
      );
    case "compact-cta":
      return (
        <div className="w-full max-w-[180px] space-y-1.5">
          <div className={`${cls} h-6`} />
          <div className={`${accentCls} h-4 w-2/3`} style={accentStyle} />
          <div className="space-y-0.5">
            <div className={`${cls} h-2`} />
            <div className={`${cls} h-2`} />
            <div className={`${cls} h-2`} />
            <div className={`${cls} h-2`} />
          </div>
        </div>
      );
    case "story":
      return (
        <div className="w-full max-w-[180px] space-y-1.5">
          <div className={`${cls} h-3 w-1/3`} />
          <div className={`${cls} h-7`} />
          <div className={`${cls} h-2`} />
          <div className={`${cls} h-2`} />
          <div className={`${cls} h-2 w-2/3`} />
          <div className={`${accentCls} h-4 w-1/2`} style={accentStyle} />
        </div>
      );
    case "booking-first":
      return (
        <div className="w-full max-w-[180px] space-y-1.5">
          <div className={`${cls} h-5`} />
          <div className={`${accentCls} h-8`} style={accentStyle} />
          <div className="grid grid-cols-3 gap-1">
            <div className={`${cls} h-3`} />
            <div className={`${cls} h-3`} />
            <div className={`${cls} h-3`} />
          </div>
        </div>
      );
    case "pricelist-first":
      return (
        <div className="w-full max-w-[180px] space-y-1.5">
          <div className={`${cls} h-4`} />
          <div className="grid grid-cols-2 gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${cls} h-5`} />
            ))}
          </div>
          <div className="flex gap-1">
            <div className={`${cls} h-3 flex-1`} />
            <div className={`${cls} h-3 flex-1`} />
            <div className={`${cls} h-3 flex-1`} />
          </div>
        </div>
      );
    case "hours-prominent":
      return (
        <div className="grid w-full max-w-[180px] grid-cols-2 gap-1">
          <div className={`${cls} col-span-2 h-4`} />
          <div className={`${accentCls} h-10`} style={accentStyle} />
          <div className={`${cls} h-10`} />
          <div className={`${cls} col-span-2 h-3`} />
        </div>
      );
    case "newsletter-led":
      return (
        <div className="w-full max-w-[180px] space-y-1.5">
          <div className={`${cls} h-5`} />
          <div className={`${cls} flex h-5 items-center justify-end`}>
            <div
              className={`${accentCls} mr-1 h-3 w-1/3`}
              style={accentStyle}
            />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className={`${cls} h-4`} />
            <div className={`${cls} h-4`} />
            <div className={`${cls} h-4`} />
          </div>
        </div>
      );
    default:
      return (
        <div className="w-full max-w-[180px] space-y-1.5">
          <div className={`${cls} h-6`} />
          <div className={`${cls} h-3`} />
          <div className={`${cls} h-3 w-2/3`} />
        </div>
      );
  }
}
