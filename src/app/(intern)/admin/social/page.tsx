import Link from "next/link";
import {
  Activity,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Hourglass,
  ListChecks,
  Plus,
  Share2,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createSocialPost,
  getKanalenOverzicht,
  getMonthlyStats,
  getPlatformBreakdown,
  getSocialClicksPerWeek,
  getSocialStand,
  getTopPosts,
  getUtmStats,
  listSocialPosts,
  listWeekPosts,
  telOudeDrafts,
  planWeekNu,
  type SocialPost,
} from "@/app/actions/social";
import {
  WEEK_SLOTS,
  datumVeld,
  huidigeWeek,
  isOudeDraft,
  planWeek,
  verschuifWeek,
  type SocialRij,
} from "@/lib/admin/social-generator";
import {
  KANAAL_LABEL,
  KANALEN,
  POST_TYPES,
  POST_TYPE_LABEL,
  SOCIAL_BRONNEN,
  STANDAARD_KANALEN,
  TALEN,
  kanalenVoorPlaats,
  nieuweStatus,
} from "@/lib/admin/social-templates";
import { BarList, ChartCard, Donut } from "@/components/charts";
import { TrendChart } from "@/components/trend-chart";
import {
  AutoSchakelaar,
  BerichtRegel,
  KanaalTegel,
  Label,
  Melding,
  MigratieBanner,
  STATUS_KLEUR,
  STATUS_LABEL,
  statusSleutel,
} from "./onderdelen";
import { KanalenSectie } from "./kanalen";

export const dynamic = "force-dynamic";

const KANAAL_KLEUR: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#D62976",
  google: "#1A73E8",
  youtube: "#FF0000",
  tiktok: "#25F4EE",
  pinterest: "#E60023",
  x: "#a8a29e",
  threads: "#78716c",
  bluesky: "#1185FE",
  whatsapp: "#25D366",
  algemeen: "var(--accent)",
};

const veld =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export default async function AdminSocial({ searchParams }: { searchParams: Promise<{ melding?: string }> }) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const terug = "/admin/social";
  const deze = huidigeWeek();
  const volgende = verschuifWeek(deze, 1);

  const [stand, posts, dezeWeek, volgendeWeek, utmStats, monthly, clicksByWeek, platformBreak, topPosts, kanalen] = await Promise.all([
    getSocialStand(),
    listSocialPosts(),
    listWeekPosts(deze),
    listWeekPosts(volgende),
    getUtmStats(),
    getMonthlyStats(),
    getSocialClicksPerWeek(),
    getPlatformBreakdown(),
    getTopPosts(),
    getKanalenOverzicht(),
  ]);
  const oudeDrafts = await telOudeDrafts();

  const nu = new Date().getTime();
  // Meldingen van de knoppen bij Kanalen tonen we daar (de pagina springt naar #kanalen).
  const kanaalMelding = sp.melding && /^kanaa?l/.test(sp.melding) ? sp.melding : undefined;
  // Het eerstvolgende bericht dat nog uit moet gaan (voorbeeld per kanaal).
  const volgendeBericht =
    [...dezeWeek, ...volgendeWeek]
      .filter((p) => ["goedgekeurd", "concept"].includes(p.status) && p.scheduled_for && Date.parse(p.scheduled_for) > nu - 3_600_000)
      .sort((a, b) => Date.parse(a.scheduled_for!) - Date.parse(b.scheduled_for!))[0] ?? null;
  const verbonden = new Set(kanalen.kanalen.kanalen.filter((k) => k.aan && !k.weg && !k.ontkoppeld && !k.vergrendeld).map((k) => k.dienst));

  // Niets gepland? Toon wat de machine zou plannen (alleen lezen, niets wordt geschreven).
  let voorstel: SocialRij[] = [];
  let voorstelWeek = deze;
  if (!dezeWeek.length && !volgendeWeek.length) {
    voorstel = (await planWeek({ week: deze, dryRun: true })).nieuw;
    if (!voorstel.length) {
      voorstelWeek = volgende;
      voorstel = (await planWeek({ week: volgende, dryRun: true })).nieuw;
    }
  }
  const bibliotheek = posts.filter((p) => !isOudeDraft(p));
  const wachtend = [...dezeWeek, ...volgendeWeek].filter((p) => statusSleutel(p) === "wacht");
  const gepubliceerd30 = posts.filter(
    (p) => nieuweStatus(p.status) === "gepubliceerd" && p.posted_at && nu - Date.parse(p.posted_at) < 30 * 86_400_000,
  ).length;
  const kliks30 = utmStats.reduce((s, x) => s + x.views, 0);

  // Statusverdeling van de echte berichten (zonder de oude dagelijkse drafts).
  const perStatus = new Map<string, number>();
  for (const p of bibliotheek) {
    const k = statusSleutel(p);
    perStatus.set(k, (perStatus.get(k) ?? 0) + 1);
  }
  const statusDonut = [...perStatus.entries()].map(([k, v]) => ({
    label: STATUS_LABEL[k as keyof typeof STATUS_LABEL] ?? k,
    value: v,
    color: STATUS_KLEUR[k as keyof typeof STATUS_KLEUR] ?? "#a8a29e",
  }));
  const postsTrend = monthly.map((m) => ({ label: m.label, value: m.posts }));
  const engagementTrend = monthly.map((m) => ({ label: m.label, value: m.engagement }));
  const heeftEngagement = engagementTrend.some((p) => p.value > 0);
  const utmBars = utmStats.slice(0, 10).map((s) => ({
    label: `${KANAAL_LABEL[s.source] ?? s.source}${s.campaign ? ` · ${s.campaign}` : ""}`,
    value: s.views,
  }));
  const kanalenTabel = platformBreak.filter((b) => b.platform !== "linkedin" && b.platform !== "algemeen");

  return (
    <>
      {/* Kop */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent">
            <Share2 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Social media</h1>
            <p className="mt-0.5 max-w-2xl text-sm text-muted">
              Elke maandagochtend plant de contentmachine de week: dinsdag een Nederlandstalig bericht, woensdag een
              Google-bericht, donderdag een Franstalig bericht en vrijdag een story of reel. Zonder link in de tekst, zonder
              persoonsnaam.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/social/wachtrij"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-stone-950 shadow-sm hover:bg-amber-300"
          >
            <ListChecks className="h-4 w-4" strokeWidth={2.25} />
            Wachtrij
            {wachtend.length > 0 && (
              <span className="rounded-full bg-stone-950 px-1.5 text-[11px] font-bold text-amber-300">{wachtend.length}</span>
            )}
          </Link>
          <Link
            href="/admin/webactiviteit"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted hover:bg-card-hover hover:text-foreground"
          >
            <Activity className="h-4 w-4" strokeWidth={2} />
            Webactiviteit
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Melding code={kanaalMelding ? undefined : sp.melding} />
        <MigratieBanner migratie={stand.migratie} />
      </div>

      {/* Contentmachine + deze week */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <section className="rounded-2xl bg-card p-5 shadow-sm lg:col-span-2">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={2.25} />
            Contentmachine
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            {WEEK_SLOTS.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} />
                {s.label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Gepland op maandag 07:00 (zomer 08:00). Drie berichten per week op alle feeds (maandag realisatie, woensdag
            tip of kennis, vrijdag uitdaging, aanbod of tip), Nederlands en Frans om de beurt, plus een Google-bericht en
            een story.
          </p>
          <div className="mt-4 border-t border-border pt-4">
            <AutoSchakelaar aan={stand.allesAutomatisch} terug={terug} />
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Kanalen</p>
              <a href="#kanalen" className="text-[12px] font-medium text-accent hover:underline">
                {verbonden.size ? `${verbonden.size} verbonden` : "Instellen"}
              </a>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {KANALEN.map((k) => (
                <span
                  key={k}
                  title={verbonden.has(k) ? "Verbonden: publiceert automatisch" : "Nog niet verbonden in Buffer"}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[12px] ${
                    verbonden.has(k) ? "border-border" : "border-dashed border-border text-muted"
                  }`}
                >
                  <KanaalTegel kanaal={k} />
                  {KANAAL_LABEL[k]}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Deze week</p>
            <Link href="/admin/social/wachtrij" className="text-[13px] font-medium text-accent hover:underline">
              Alles bekijken
            </Link>
          </div>
          {dezeWeek.length ? (
            <ul className="mt-2 divide-y divide-border">
              {dezeWeek.map((p) => (
                <li key={p.id}>
                  <BerichtRegel post={p} href={`/admin/social/wachtrij?week=${deze}#b-${p.id.slice(0, 8)}`} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-border p-3 text-sm text-muted sm:p-4">
              <p>Nog niets gepland voor deze week.</p>
              {voorstel.length > 0 && (
                <>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest">
                    Voorstel week {Number(voorstelWeek.slice(-2))}
                    {stand.migratie.kolommen ? "" : " · na migratie 0050"}
                  </p>
                  <ul className="mt-1 divide-y divide-border">
                    {voorstel.map((r) => (
                      <li key={r.id}>
                        <BerichtRegel
                          post={alsPost(r)}
                          href={`/admin/social/wachtrij?week=${voorstelWeek}`}
                          bronnen={r.media.kaart ? [r.media.kaart] : []}
                          pil={
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-stone-950 ${r.goedkeuring_nodig ? "bg-amber-300" : "bg-emerald-300"}`}
                            >
                              {r.goedkeuring_nodig ? "Wacht op akkoord" : "Gaat vanzelf uit"}
                            </span>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {stand.migratie.kolommen && (
                <form action={planWeekNu} className="mt-3">
                  <input type="hidden" name="week" value={deze} />
                  <input type="hidden" name="terug" value={terug} />
                  <button
                    type="submit"
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-stone-950 hover:bg-amber-300"
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                    Lege plaatsen nu invullen
                  </button>
                </form>
              )}
            </div>
          )}
          {volgendeWeek.length > 0 && (
            <>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted">Volgende week</p>
              <ul className="mt-2 divide-y divide-border">
                {volgendeWeek.map((p) => (
                  <li key={p.id}>
                    <BerichtRegel post={p} href={`/admin/social/wachtrij?week=${volgende}#b-${p.id.slice(0, 8)}`} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Kerncijfers */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={CalendarClock} label="Gepland deze week" value={String(dezeWeek.length)} hint={`${volgendeWeek.length} volgende week`} />
        <Kpi
          icon={Hourglass}
          label="Wacht op akkoord"
          value={String(wachtend.length)}
          hint="realisaties, deze en volgende week"
          toon={wachtend.length ? "amber" : "neutraal"}
        />
        <Kpi icon={CheckCircle2} label="Gepubliceerd (30 d)" value={String(gepubliceerd30)} hint="door de publisher of met de hand" />
        <Kpi icon={TrendingUp} label="Social-klikken (30 d)" value={String(kliks30)} hint="bezoeken met social-UTM" toon={kliks30 ? "accent" : "neutraal"} />
      </div>

      {/* Kanalen: publiceren via Buffer */}
      <KanalenSectie o={kanalen} volgende={volgendeBericht} posts={posts} melding={kanaalMelding} />

      {/* Grafieken */}
      <div className="mt-8 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent">
          <BarChart3 className="h-4 w-4" strokeWidth={2} />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">Bereik en klikken</h2>
      </div>
      <p className="mt-1 text-xs text-muted">
        Enkel bezoeken met utm_source {SOCIAL_BRONNEN.filter((b) => b !== "twitter").join(", ")}. Outreach en andere mails
        tellen niet mee.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Bezoeken via social per week">
            {clicksByWeek.every((p) => p.value === 0) ? (
              <Leeg>Nog geen bezoeken via social. Profiel-, bio- en knoplinks met UTM tellen hier mee.</Leeg>
            ) : (
              <TrendChart id="social-clicks-12w" color="var(--accent)" height={180} points={clicksByWeek} />
            )}
          </ChartCard>
        </div>
        <ChartCard title="Berichten per status">
          {statusDonut.length === 0 ? (
            <Leeg>Nog geen berichten.</Leeg>
          ) : (
            <Donut segments={statusDonut} centerTop={String(bibliotheek.length)} centerSub="berichten" />
          )}
        </ChartCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl bg-card p-5 shadow-sm lg:col-span-2">
          <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            <Trophy className="h-3 w-3" strokeWidth={2.5} />
            Per kanaal
          </p>
          {kanalenTabel.length === 0 ? (
            <Leeg>Nog geen gegevens per kanaal.</Leeg>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted">
                    <th className="py-2 text-left font-normal">Kanaal</th>
                    <th className="hidden py-2 text-right font-normal sm:table-cell">Berichten</th>
                    <th className="py-2 text-right font-normal">Gepubliceerd</th>
                    <th className="py-2 pl-3 text-right font-normal">Klikken (30 d)</th>
                  </tr>
                </thead>
                <tbody>
                  {kanalenTabel.map((b) => (
                    <tr key={b.platform} className="border-b border-border last:border-0">
                      <td className="py-2.5">
                        <span className="flex items-center gap-2">
                          <KanaalTegel kanaal={b.platform} />
                          <span className="font-medium">{KANAAL_LABEL[b.platform] ?? b.platform}</span>
                        </span>
                      </td>
                      <td className="hidden py-2.5 text-right font-mono text-xs text-muted sm:table-cell">{b.posts}</td>
                      <td className="py-2.5 text-right font-mono text-xs">{b.posted}</td>
                      <td className="py-2.5 text-right font-mono text-xs font-semibold text-accent">{b.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <ChartCard title="Klikken per bron en campagne (30 d)">
          {utmBars.length === 0 ? <Leeg>Nog geen bezoeken via social.</Leeg> : <BarList items={utmBars} color="var(--accent)" />}
        </ChartCard>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard title="Berichten per maand">
          {postsTrend.every((p) => p.value === 0) ? (
            <Leeg>Nog geen geplande of gepubliceerde berichten.</Leeg>
          ) : (
            <TrendChart id="social-posts-12m" color="var(--accent)" height={160} points={postsTrend} />
          )}
        </ChartCard>
        <ChartCard title="Reacties per maand (likes, reacties, gedeeld)">
          {heeftEngagement ? (
            <TrendChart id="social-eng-12m" color={KANAAL_KLEUR.instagram} height={160} points={engagementTrend} />
          ) : (
            <Leeg>Nog geen cijfers. Ze verschijnen zodra de publisher ze ophaalt of u ze bij een gepubliceerd bericht invult.</Leeg>
          )}
        </ChartCard>
      </div>

      {topPosts.length > 0 && topPosts[0]!._eng > 0 && (
        <div className="mt-3 rounded-2xl bg-card p-5 shadow-sm">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">Best ontvangen berichten</p>
          <ol className="divide-y divide-border">
            {topPosts
              .filter((p) => p._eng > 0)
              .map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
                  <span className="font-mono text-xs text-muted">{p.posted_at?.slice(0, 10)}</span>
                  <span className="rounded-full bg-amber-300 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-950">{p._eng}</span>
                </li>
              ))}
          </ol>
        </div>
      )}

      {/* Bibliotheek + nieuw bericht */}
      <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <section className="rounded-2xl bg-card p-5 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Bibliotheek</p>
            <span className="font-mono text-[10px] text-muted">{bibliotheek.length}</span>
          </div>
          {bibliotheek.length ? (
            <ul className="mt-2 divide-y divide-border">
              {bibliotheek.slice(0, 40).map((p) => (
                <li key={p.id}>
                  <BerichtRegel
                    post={p}
                    href={p.scheduled_for ? `/admin/social/wachtrij?week=${huidigeWeek(new Date(p.scheduled_for))}#b-${p.id.slice(0, 8)}` : undefined}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Leeg>Nog geen berichten van de nieuwe contentmachine.</Leeg>
          )}
          {oudeDrafts > 0 && (
            <p className="mt-3 text-xs text-muted">
              {oudeDrafts} drafts van de oude dagelijkse machine (nooit gepubliceerd) zijn verborgen. Migratie 0050 zet ze op
              overgeslagen.
            </p>
          )}
        </section>

        <details className="group self-start rounded-2xl bg-card shadow-sm lg:col-span-2">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-sm font-semibold">Eigen bericht toevoegen</span>
              <span className="block text-xs text-muted">komt als concept in de wachtrij</span>
            </span>
          </summary>
          <form action={createSocialPost} className="group/nieuw space-y-3 border-t border-border px-5 py-4">
            <input type="hidden" name="terug" value={terug} />
            <Label tekst="Kop op het beeld">
              <input name="title" required maxLength={200} placeholder="bv. Bouwput met taluds" className={veld} />
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Label tekst="Plaats">
                <select name="plaats" defaultValue="feed" className={veld}>
                  <option value="feed">Bericht</option>
                  <option value="story">Story</option>
                  <option value="google">Google-bericht</option>
                </select>
              </Label>
              <Label tekst="Tijdstip">
                <input type="datetime-local" name="datum" defaultValue={datumVeld(new Date(nu + 2 * 86_400_000).toISOString()).slice(0, 11) + "12:00"} className={veld} />
              </Label>
            </div>
            {stand.migratie.kolommen && (
              <div className="grid grid-cols-2 gap-3">
                <Label tekst="Taal">
                  <select name="taal" defaultValue="nl" className={veld}>
                    {TALEN.map((t) => (
                      <option key={t} value={t}>
                        {t.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </Label>
                <Label tekst="Soort">
                  <select name="post_type" defaultValue="tip" className={veld}>
                    {POST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {POST_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </Label>
              </div>
            )}
            {stand.migratie.kolommen && (
              // Enkel bij een gewoon bericht: een Google-bericht en een story
              // kiezen hun kanalen zelf (de server dwingt dat ook af).
              <fieldset className="hidden group-has-[option[value=feed]:checked]/nieuw:block">
                <legend className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">Kanalen</legend>
                <div className="flex flex-wrap gap-1.5">
                  {kanalenVoorPlaats("feed").map((k) => (
                    <label
                      key={k}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-[12px] has-[:checked]:border-accent has-[:checked]:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                    >
                      <input type="checkbox" name="kanalen" value={k} defaultChecked={STANDAARD_KANALEN.feed.includes(k)} className="accent-[var(--accent)]" />
                      <KanaalTegel kanaal={k} />
                      {KANAAL_LABEL[k]}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <Label tekst="Bijschrift (zonder link)">
              <textarea name="body" rows={5} maxLength={5000} className={veld} />
            </Label>
            {stand.migratie.kolommen && (
              <Label tekst="Korte tekst voor X en Bluesky">
                <textarea name="tekst_kort" rows={2} maxLength={300} className={veld} />
              </Label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Label tekst="Hashtags (max. 5)">
                <input name="hashtags" maxLength={500} placeholder="#machinesturing #grondverzet" className={veld} />
              </Label>
              <Label tekst="Doelpagina">
                <input name="target_url" defaultValue="/nl/offerte" maxLength={500} className={veld} />
              </Label>
            </div>
            <button
              type="submit"
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-semibold text-stone-950 hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Concept aanmaken
            </button>
          </form>
        </details>
      </div>
    </>
  );
}

/** Een voorstel (nog niet in de databank) als bericht tonen. */
function alsPost(r: SocialRij): SocialPost {
  return {
    ...r,
    created_at: r.scheduled_for,
    updated_at: r.scheduled_for,
    posted_at: null,
    posted_url: null,
    result_likes: 0,
    result_comments: 0,
    result_shares: 0,
  };
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  toon = "neutraal",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint?: string;
  toon?: "neutraal" | "accent" | "amber";
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
      </div>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${toon === "accent" || toon === "amber" ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

function Leeg({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-card-hover p-6 text-center text-sm text-muted">{children}</p>;
}
