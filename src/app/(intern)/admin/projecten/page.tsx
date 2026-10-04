import Link from "next/link";
import { LayoutList, Columns3, Search, CircleDollarSign, CircleDashed, MapPinned, ArrowRight } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { STAPPEN, STATUS_LABEL, CATEGORIE_LABEL, werfTekst, dagenTot, type ProjectStatus } from "@/lib/projecten";
import { laadProjectRijen, type ProjectRij } from "@/lib/projecten-overzicht";
import { CategorieBadge, StatusBadge, Aftelling } from "@/components/admin/project-ui";
import { werfPunten } from "@/lib/werf-punten";
import { WervenKaart } from "@/components/werven-kaart";

export const dynamic = "force-dynamic";

type Rij = ProjectRij & { dagen: number | null };

const STATUS_FILTERS = ["alle", ...STAPPEN, "geannuleerd"] as const;
const CAT_FILTERS = ["alle", "vroegtijdig", "normaal", "last-minute"] as const;
const KLAAR: ProjectStatus[] = ["geleverd", "afgesloten", "geannuleerd"];

const uurTekst = (u: number | null | undefined) => (u == null ? "—" : `${String(Number(u)).replace(".", ",")} u`);

/** Een herhaalde parameter (?q=a&q=b) komt als lijst binnen: neem de eerste. */
const eerste = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminProjecten({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const ruw = await searchParams;
  const sp = {
    status: eerste(ruw.status),
    cat: eerste(ruw.cat),
    q: eerste(ruw.q).slice(0, 200),
    weergave: eerste(ruw.weergave),
    melding: eerste(ruw.melding),
  };
  const status = (STATUS_FILTERS as readonly string[]).includes(sp.status) ? sp.status : "alle";
  const cat = (CAT_FILTERS as readonly string[]).includes(sp.cat) ? sp.cat : "alle";
  const q = sp.q.trim().toLowerCase().slice(0, 80);
  const kanban = sp.weergave === "kanban";

  // Klant en factuurstatus: gedeeld met de werfkaart (@/lib/projecten-overzicht).
  const { rijen: basis, error } = await laadProjectRijen(getSupabaseAdmin(), { limiet: 1000 });

  // eslint-disable-next-line react-hooks/purity
  const nu = Date.now();
  const rijen: Rij[] = basis.map((p) => ({ ...p, dagen: p.leverdatum ? dagenTot(p.leverdatum, nu) : null }));

  // Samenvatting (over alles, los van de filters)
  const actief = rijen.filter((r) => r.status !== "afgesloten" && r.status !== "geannuleerd");
  const lopend = rijen.filter((r) => !KLAAR.includes(r.status));
  const deadlines = lopend.filter((r) => r.dagen != null && r.dagen <= 7);
  const teLaat = deadlines.filter((r) => (r.dagen ?? 0) < 0).length;
  const teFactureren = rijen.filter((r) => r.status === "geleverd" && !r.betaald);
  const maand = new Date(nu).toISOString().slice(0, 7);
  const urenMaand = rijen
    .filter((r) => r.status !== "geannuleerd" && (r.leverdatum ?? r.created_at).startsWith(maand))
    .reduce((t, r) => t + (Number(r.gewerkte_uren) || 0), 0);
  const stats = [
    { k: "Actief", v: String(actief.length) },
    { k: "In productie", v: String(rijen.filter((r) => r.status === "productie").length) },
    { k: "Deadline ≤ 7 d", v: `${deadlines.length}${teLaat ? ` (${teLaat} te laat)` : ""}`, rood: teLaat > 0 },
    { k: "Te factureren", v: String(teFactureren.length), rood: teFactureren.length > 0 },
    { k: "Uren deze maand", v: uurTekst(Math.round(urenMaand * 100) / 100), sub: "gewerkt, op leverdatum" },
  ];

  // Filters
  const zichtbaar = rijen.filter((r) => {
    if (status === "alle" ? r.status === "geannuleerd" : r.status !== status) return false;
    if (cat !== "alle" && r.categorie !== cat) return false;
    if (q) {
      const hooi = [r.titel, r.klant, r.client_email, werfTekst(r.werf)].join(" ").toLowerCase();
      if (!hooi.includes(q)) return false;
    }
    return true;
  });

  // Kaart: de werven uit de huidige weergave (zelfde filters als de lijst) die
  // geldige coördinaten hebben.
  const punten = werfPunten(zichtbaar, "nl", { href: (r) => `/admin/projecten/${r.id}`, klant: (r) => r.klant });
  // Werfkaart (/admin/kaart) met de gekozen status, categorie en zoekterm.
  const kaartQs = new URLSearchParams();
  if (sp.q.trim()) kaartQs.set("q", sp.q.trim());
  if (status !== "alle") kaartQs.set("status", status);
  if (cat !== "alle") kaartQs.set("urg", cat);

  const href = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    const alles = { status, cat, q: sp.q, weergave: kanban ? "kanban" : "", ...extra };
    for (const [k, v] of Object.entries(alles)) if (v && v !== "alle") p.set(k, v);
    const s = p.toString();
    return `/admin/projecten${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Projecten</h1>
        <Link
          href="/admin/projecten/nieuw"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          + Nieuw project
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">3D-modellen voor machinesturing — van aanvraag tot levering en betaling.</p>

      {sp.melding === "verwijderd" && (
        <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400">Project verwijderd.</p>
      )}
      {error && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600">
          Projecten konden niet geladen worden: {error.message}. Is migratie 0046 uitgevoerd?
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl bg-card p-5 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{s.k}</p>
            <p className={`mt-1 truncate text-2xl font-semibold ${s.rood ? "text-red-600 dark:text-red-400" : ""}`}>{s.v}</p>
            {s.sub && <p className="mt-0.5 text-[11px] text-muted">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="get" action="/admin/projecten" className="mt-6 flex flex-wrap items-end gap-2">
        {kanban && <input type="hidden" name="weergave" value="kanban" />}
        <label className="text-xs text-muted">
          Status
          <select name="status" defaultValue={status} className="mt-1 block rounded-full border bg-background px-3 py-1.5 text-sm">
            <option value="alle">alle (zonder geannuleerd)</option>
            {[...STAPPEN, "geannuleerd" as const].map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s].nl}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Categorie
          <select name="cat" defaultValue={cat} className="mt-1 block rounded-full border bg-background px-3 py-1.5 text-sm">
            <option value="alle">alle</option>
            {(["vroegtijdig", "normaal", "last-minute"] as const).map((c) => (
              <option key={c} value={c}>
                {CATEGORIE_LABEL[c].nl}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[200px] flex-1 text-xs text-muted">
          Zoeken
          <span className="relative mt-1 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={2} />
            <input
              name="q"
              defaultValue={sp.q}
              placeholder="titel, klant of werf"
              className="w-full rounded-full border bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:border-accent"
            />
          </span>
        </label>
        <button className="rounded-full border px-4 py-1.5 text-sm transition-colors hover:bg-card-hover">Filter</button>
        {(status !== "alle" || cat !== "alle" || q) && (
          <Link href={kanban ? "/admin/projecten?weergave=kanban" : "/admin/projecten"} className="px-2 py-1.5 text-sm text-muted hover:text-foreground">
            wissen
          </Link>
        )}
        <div className="ml-auto flex overflow-hidden rounded-full border">
          <Link
            href={href({ weergave: "" })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm ${!kanban ? "bg-foreground text-background" : "hover:bg-card-hover"}`}
          >
            <LayoutList className="h-4 w-4" strokeWidth={2} /> Tabel
          </Link>
          <Link
            href={href({ weergave: "kanban" })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm ${kanban ? "bg-foreground text-background" : "hover:bg-card-hover"}`}
          >
            <Columns3 className="h-4 w-4" strokeWidth={2} /> Bord
          </Link>
        </div>
      </form>

      <div className="mt-6 flex justify-end">
        <Link
          href={`/admin/kaart${kaartQs.toString() ? `?${kaartQs}` : ""}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <MapPinned className="h-3.5 w-3.5" strokeWidth={2} />
          Volledige kaart met filters
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>
      <WervenKaart punten={punten} taal="nl" kaartClass="mt-2" zonderLocatie={zichtbaar.length - punten.length}>
        {zichtbaar.length === 0 && (
          <p className="mt-6 rounded-2xl bg-card p-6 text-sm text-muted shadow-sm">Geen projecten in deze weergave.</p>
        )}

        {zichtbaar.length > 0 && !kanban && (
          <div className="mt-6 overflow-x-auto rounded-2xl bg-card shadow-sm">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                  <th className="px-4 py-3 font-normal">Project</th>
                  <th className="px-4 py-3 font-normal">Categorie</th>
                  <th className="px-4 py-3 font-normal">Systemen</th>
                  <th className="px-4 py-3 font-normal">Leverdatum</th>
                  <th className="px-4 py-3 font-normal">Uren</th>
                  <th className="px-4 py-3 font-normal">Betaald</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {zichtbaar.map((r) => (
                  <tr key={r.id} data-werf-id={r.id} className="border-b align-top transition-colors last:border-0 hover:bg-card-hover">
                    <td className="max-w-[280px] px-4 py-3">
                      <Link href={`/admin/projecten/${r.id}`} className="font-medium hover:text-accent">
                        {r.titel}
                      </Link>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                        {r.klant}
                        {r.werf?.gemeente ? ` · ${r.werf.gemeente}${r.werf.land ? ` (${r.werf.land})` : ""}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <CategorieBadge c={r.categorie} />
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.merken.length === 0 && <span className="text-muted">—</span>}
                        {r.merken.map((m) => (
                          <span key={m} className="rounded-full border px-2 py-0.5 text-[11px]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Aftelling datum={r.leverdatum} dagen={r.dagen} klaar={KLAAR.includes(r.status)} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      <span className="text-muted">{uurTekst(r.geschatte_uren)}</span> / {uurTekst(r.gewerkte_uren)}
                    </td>
                    <td className="px-4 py-3">
                      {r.betaald ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CircleDollarSign className="h-4 w-4" strokeWidth={2} /> betaald
                        </span>
                      ) : r.factuurStatus ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <CircleDashed className="h-4 w-4" strokeWidth={2} /> {r.factuurStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">geen factuur</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge s={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {zichtbaar.length > 0 && kanban && (
          <div className="mt-6 overflow-x-auto pb-2">
          <div className={`grid gap-3 ${status === "geannuleerd" ? "grid-cols-1 sm:max-w-xs" : "min-w-[960px] grid-cols-6"}`}>
            {(status === "geannuleerd" ? (["geannuleerd"] as ProjectStatus[]) : STAPPEN).map((st) => {
              const kol = zichtbaar.filter((r) => r.status === st);
              return (
                <div key={st} className="flex flex-col rounded-2xl bg-card-hover/40 p-2">
                  <p className="flex items-center justify-between px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {STATUS_LABEL[st].nl}
                    <span className="rounded-full bg-card px-2 py-0.5">{kol.length}</span>
                  </p>
                  <div className="space-y-2">
                    {kol.map((r) => (
                      <Link
                        key={r.id}
                        href={`/admin/projecten/${r.id}`}
                        data-werf-id={r.id}
                        className={`block rounded-xl bg-card p-3 shadow-sm transition-colors hover:bg-card-hover ${
                          r.categorie === "last-minute" ? "border-l-4" : ""
                        }`}
                        // Inline: border-red-600 verliest van de ongelaagde `* { border-color }` in globals.css.
                        style={r.categorie === "last-minute" ? { borderLeftColor: "#dc2626" } : undefined}
                      >
                        <p className="text-sm font-medium leading-snug">{r.titel}</p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted">{r.klant}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <CategorieBadge c={r.categorie} />
                          {r.betaald && <CircleDollarSign className="h-4 w-4 text-emerald-600" strokeWidth={2} aria-label="betaald" />}
                        </div>
                        <div className="mt-2 text-xs">
                          <Aftelling datum={r.leverdatum} dagen={r.dagen} klaar={KLAAR.includes(r.status)} />
                        </div>
                        {r.merken.length > 0 && (
                          <p className="mt-1.5 line-clamp-2 text-[11px] text-muted">{r.merken.join(" · ")}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </WervenKaart>
    </>
  );
}
