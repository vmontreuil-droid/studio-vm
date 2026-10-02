import { Search, Check, ExternalLink, CalendarClock, RotateCcw } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SEO_TAKEN, SEO_TAAK_PREFIX } from "@/lib/seo-taken";
import { zetSeoTaak } from "@/app/actions/seo-taken";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function datumKort(s: string): string {
  return new Date(`${s}T00:00:00`).toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" });
}

/** Herinneringen voor wat Vincent buiten de site moet doen om gevonden te worden. */
export async function SeoOpvolging() {
  const { data } = await getSupabaseAdmin()
    .from("app_settings")
    .select("key, value")
    .like("key", `${SEO_TAAK_PREFIX}%`);
  const klaar = new Map(
    ((data as { key: string; value: string | null }[] | null) ?? []).map((r) => [r.key.slice(SEO_TAAK_PREFIX.length), r.value ?? ""]),
  );
  const vandaag = ymd(new Date());
  const open = SEO_TAKEN.filter((t) => !klaar.has(t.id) && t.vanaf <= vandaag);
  const binnenkort = SEO_TAKEN.filter((t) => !klaar.has(t.id) && t.vanaf > vandaag);
  const gedaan = SEO_TAKEN.filter((t) => klaar.has(t.id));
  if (!open.length && !binnenkort.length) return null;

  return (
    <div className="mt-3 rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          <Search className="h-3.5 w-3.5 text-accent" /> SEO-opvolging — gevonden worden
        </p>
        <span className="font-mono text-[10px] text-muted">
          {gedaan.length}/{SEO_TAKEN.length} gedaan
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card-hover">
        <div className="h-full rounded-full bg-accent/70" style={{ width: `${(gedaan.length / SEO_TAKEN.length) * 100}%` }} />
      </div>

      {open.length > 0 ? (
        <ul className="mt-4 divide-y divide-border">
          {open.map((t) => (
            <li key={t.id} className="flex items-start gap-3 py-3">
              <form action={zetSeoTaak.bind(null, t.id, true)}>
                <button
                  type="submit"
                  aria-label={`${t.titel} afvinken`}
                  title="Afvinken"
                  className="mt-0.5 grid h-5 w-5 place-items-center rounded-md border-2 border-accent/60 text-transparent transition-colors hover:bg-accent/10 hover:text-accent"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </form>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.titel}</p>
                <p className="mt-0.5 text-xs text-muted">{t.uitleg}</p>
              </div>
              {t.link && (
                <a
                  href={t.link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {t.link.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Check className="h-4 w-4 text-emerald-500" /> Voor vandaag alles gedaan.
        </p>
      )}

      {binnenkort.length > 0 && (
        <div className="mt-3 rounded-xl border border-dashed p-3">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
            <CalendarClock className="h-3.5 w-3.5" /> Binnenkort
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted">
            {binnenkort.map((t) => (
              <li key={t.id} className="flex gap-3">
                <span className="w-20 shrink-0 font-mono capitalize">{datumKort(t.vanaf)}</span>
                <span>{t.titel}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {gedaan.length > 0 && (
        <details className="mt-3 text-xs text-muted">
          <summary className="cursor-pointer hover:text-foreground">Gedaan ({gedaan.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {gedaan.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="flex-1 line-through">{t.titel}</span>
                <span className="font-mono">{klaar.get(t.id)}</span>
                <form action={zetSeoTaak.bind(null, t.id, false)}>
                  <button type="submit" title="Terug openzetten" aria-label="Terug openzetten" className="rounded p-1 hover:text-foreground">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
