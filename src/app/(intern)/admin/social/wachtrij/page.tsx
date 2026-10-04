import Link from "next/link";
import { ArrowLeft, CalendarClock, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getLinkBerichten, getSocialStand, listWeekPosts, planWeekNu, type SocialPost } from "@/app/actions/social";
import {
  WEEK_SLOTS,
  brusselsDelen,
  brusselsNaarUtc,
  huidigeWeek,
  maandagVan,
  parseWeek,
  planWeek,
  plusDagenDatum,
  verschuifWeek,
  weekBereik,
  type SocialRij,
} from "@/lib/admin/social-generator";
import { POST_TYPE_LABEL, typeVoorWeek } from "@/lib/admin/social-templates";
import { AutoSchakelaar, BerichtKaart, KanaalRij, Melding, MigratieBanner, Pil, plaatsVan } from "../onderdelen";
import { VoorbeeldBeeld } from "../voorbeeld-beeld";

export const dynamic = "force-dynamic";

const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function weekTitel(week: string): string {
  const ma = maandagVan(week);
  const zo = plusDagenDatum(ma, 6);
  const nr = Number(week.slice(-2));
  return ma.maand === zo.maand
    ? `Week ${nr} · ${ma.dag}–${zo.dag} ${MAANDEN[zo.maand - 1]} ${zo.jaar}`
    : `Week ${nr} · ${ma.dag} ${MAANDEN[ma.maand - 1]} – ${zo.dag} ${MAANDEN[zo.maand - 1]} ${zo.jaar}`;
}

function dagSleutel(iso: string): string {
  const d = brusselsDelen(new Date(iso));
  return `${d.jaar}-${String(d.maand).padStart(2, "0")}-${String(d.dag).padStart(2, "0")}`;
}

function dagTitel(sleutel: string): string {
  const [j, m, d] = sleutel.split("-").map(Number);
  return new Date(Date.UTC(j!, m! - 1, d!, 12)).toLocaleDateString("nl-BE", {
    timeZone: "Europe/Brussels",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function maandVan(iso: string): string {
  const d = brusselsDelen(new Date(iso));
  return `${d.jaar}-${String(d.maand).padStart(2, "0")}`;
}

export default async function Wachtrij({ searchParams }: { searchParams: Promise<{ week?: string; melding?: string }> }) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const nu = new Date();
  const deze = huidigeWeek(nu);
  const week = sp.week && parseWeek(sp.week) ? sp.week : deze;
  const terug = `/admin/social/wachtrij?week=${week}`;

  const { van, tot } = weekBereik(week);
  const [stand, posts] = await Promise.all([getSocialStand(), listWeekPosts(week)]);
  const linkPerMaand = stand.migratie.kolommen
    ? await getLinkBerichten(new Date(van.getTime() - 7 * 86_400_000).toISOString(), new Date(tot.getTime() + 35 * 86_400_000).toISOString())
    : {};

  // Welke vaste plaatsen nog leeg zijn en nog niet voorbij.
  const ma = maandagVan(week);
  const bezet = new Set(posts.map((p) => p.notes?.match(new RegExp(`slot:${week}-(\\w+)`))?.[1]).filter(Boolean));
  const open = WEEK_SLOTS.filter((s) => {
    const d = plusDagenDatum(ma, s.dagNaMaandag);
    return !bezet.has(s.id) && brusselsNaarUtc(d.jaar, d.maand, d.dag, s.uur).getTime() > nu.getTime() + 30 * 60_000;
  });

  // Voorstel tonen als er nog plaatsen open zijn (zonder iets te schrijven).
  const voorstel: SocialRij[] = open.length ? (await planWeek({ week, dryRun: true, nu })).nieuw : [];

  const perDag = new Map<string, SocialPost[]>();
  for (const p of posts) {
    if (!p.scheduled_for) continue;
    const k = dagSleutel(p.scheduled_for);
    perDag.set(k, [...(perDag.get(k) ?? []), p]);
  }
  const w = parseWeek(week)!;
  const thema = POST_TYPE_LABEL[typeVoorWeek(w.week)];
  const wachtend = posts.filter((p) => p.status === "concept" && p.goedkeuring_nodig).length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/social" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Social media
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wachtrij</h1>
          <p className="mt-0.5 text-sm text-muted">{weekTitel(week)}</p>
        </div>
        <nav aria-label="Week kiezen" className="flex items-center gap-1.5">
          <Link
            href={`/admin/social/wachtrij?week=${verschuifWeek(week, -1)}`}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-card-hover"
            aria-label="Vorige week"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
          </Link>
          <Link
            href="/admin/social/wachtrij"
            aria-current={week === deze ? "page" : undefined}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-card-hover aria-[current=page]:border-accent"
          >
            Deze week
          </Link>
          <Link
            href={`/admin/social/wachtrij?week=${verschuifWeek(week, 1)}`}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card hover:bg-card-hover"
            aria-label="Volgende week"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
        </nav>
      </div>

      <div className="mt-4 space-y-3">
        <Melding code={sp.melding} />
        <MigratieBanner migratie={stand.migratie} />
      </div>

      <section className="mt-4 rounded-2xl bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Pil>Thema: {thema}</Pil>
          <Pil>{posts.length} gepland</Pil>
          {wachtend > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-semibold text-stone-950">
              {wachtend} wacht{wachtend === 1 ? "" : "en"} op akkoord
            </span>
          )}
        </div>
        <ul className="mt-3 grid gap-1 text-[13px] text-muted sm:grid-cols-2">
          {WEEK_SLOTS.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className={bezet.has(s.id) ? "text-foreground" : ""}>{s.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4">
          <AutoSchakelaar aan={stand.allesAutomatisch} terug={terug} />
        </div>
      </section>

      {open.length > 0 && stand.migratie.kolommen && (
        <form action={planWeekNu} className="mt-4">
          <input type="hidden" name="week" value={week} />
          <input type="hidden" name="terug" value={terug} />
          <button
            type="submit"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 shadow-sm hover:bg-amber-300 sm:w-auto"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            {open.length === WEEK_SLOTS.length ? `Week ${w.week} nu plannen` : `${open.length} lege ${open.length === 1 ? "plaats" : "plaatsen"} invullen`}
          </button>
          <p className="mt-1.5 text-xs text-muted">Gebeurt anders vanzelf op maandagochtend. Het weekoverzicht komt per mail.</p>
        </form>
      )}

      {posts.length > 0 ? (
        <div className="mt-6 space-y-6">
          {[...perDag.entries()].map(([dag, lijst]) => (
            <section key={dag} aria-labelledby={`dag-${dag}`}>
              <h2 id={`dag-${dag}`} className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted">
                {dagTitel(dag)}
              </h2>
              <div className="space-y-3">
                {lijst.map((p) => (
                  <BerichtKaart
                    key={p.id}
                    post={p}
                    migratie={stand.migratie}
                    terug={terug}
                    linkTelling={p.scheduled_for ? (linkPerMaand[maandVan(p.scheduled_for)] ?? 0) - (p.link_post ? 1 : 0) : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
          {open.length
            ? "Nog niets gepland voor deze week."
            : "Niets gepland voor deze week, en alle vaste plaatsen zijn voorbij."}
        </p>
      )}

      {voorstel.length > 0 && (
        <section className="mt-8" aria-labelledby="voorstel">
          <h2 id="voorstel" className="font-mono text-[11px] uppercase tracking-widest text-muted">
            Voorstel voor de lege plaatsen
          </h2>
          <p className="mt-1 text-xs text-muted">
            {stand.migratie.kolommen
              ? "Zo ziet de machine het nu. Bij het plannen kan de keuze nog wisselen tussen gelijkwaardige onderwerpen."
              : "Wordt pas echt gepland na migratie 0050."}
          </p>
          <ul className="mt-3 space-y-2">
            {voorstel.map((r) => {
              const p = plaatsVan(r);
              return (
                <li key={r.id} className="flex gap-3 rounded-xl border border-dashed border-border p-3">
                  <span className={`shrink-0 ${p.formaat === "story" ? "w-12" : p.formaat === "gbp" ? "w-20" : "w-16"}`}>
                    <VoorbeeldBeeld bronnen={r.media.kaart ? [r.media.kaart] : []} alt="" ratio={p.ratio} className="w-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-muted">
                      {new Date(r.scheduled_for).toLocaleString("nl-BE", {
                        timeZone: "Europe/Brussels",
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {p.label} · {POST_TYPE_LABEL[r.post_type]} · {r.taal.toUpperCase()}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold">{r.title}</span>
                    <span className="mt-1 line-clamp-2 text-[13px] text-muted">{r.body}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <KanaalRij post={r} />
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-stone-950 ${r.goedkeuring_nodig ? "bg-amber-300" : "bg-emerald-300"}`}
                      >
                        {r.goedkeuring_nodig ? "Wacht op akkoord" : "Gaat vanzelf uit"}
                      </span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
