import Link from "next/link";
import { ChevronLeft, ChevronRight, Zap, CalendarDays } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { STATUS_LABEL, type Project, type ProjectStatus } from "@/lib/projecten";
import { UURTARIEF_CENT } from "@/lib/tarieven";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planning — Admin" };


const WEEKDAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];

// Kleur van een kaartje: categorie bepaalt de rand, status de vulling.
const CAT_RAND: Record<Project["categorie"], string> = {
  vroegtijdig: "border-l-emerald-500",
  normaal: "border-l-accent",
  "last-minute": "border-l-red-500",
};
const STATUS_VUL: Partial<Record<ProjectStatus, string>> = {
  geleverd: "opacity-60 line-through decoration-1",
  afgesloten: "opacity-50 line-through decoration-1",
  geannuleerd: "opacity-40 line-through decoration-1",
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function Planning({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;

  const nu = new Date();
  const vandaag = ymd(nu);
  const m = /^[0-9]{4}-[0-9]{2}$/.test(sp.m ?? "") ? sp.m! : vandaag.slice(0, 7);
  const [jaar, maand] = m.split("-").map(Number);
  const eerste = new Date(jaar, maand - 1, 1);
  const laatste = new Date(jaar, maand, 0);
  // Raster van maandag vóór de 1e tot zondag na de laatste dag.
  // Kalenderdagen optellen (niet in ms): anders geeft de omschakeling naar
  // winter-/zomertijd een dubbele of ontbrekende dag.
  const start = new Date(jaar, maand - 1, 1 - ((eerste.getDay() + 6) % 7));
  const eind = new Date(jaar, maand - 1, laatste.getDate() + ((7 - laatste.getDay()) % 7));
  const dagen: Date[] = [];
  for (let d = new Date(start); d <= eind; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) dagen.push(d);

  const vorige = ymd(new Date(jaar, maand - 2, 1)).slice(0, 7);
  const volgende = ymd(new Date(jaar, maand, 1)).slice(0, 7);

  const { data } = await getSupabaseAdmin()
    .from("projecten")
    .select("*")
    .gte("leverdatum", ymd(start))
    .lte("leverdatum", ymd(eind))
    .order("leverdatum", { ascending: true })
    .limit(1000);
  const projecten = (data as Project[] | null) ?? [];
  const perDag = new Map<string, Project[]>();
  for (const p of projecten) {
    if (!p.leverdatum) continue;
    const k = p.leverdatum.slice(0, 10);
    perDag.set(k, [...(perDag.get(k) ?? []), p]);
  }

  // Zonder leverdatum, nog lopend: apart tonen zodat niets vergeten wordt.
  const { data: zonder } = await getSupabaseAdmin()
    .from("projecten")
    .select("id, titel, status, categorie, client_email")
    .is("leverdatum", null)
    .in("status", ["aanvraag", "offerte", "akkoord", "productie"])
    .limit(100);
  const zonderDatum = (zonder as Pick<Project, "id" | "titel" | "status" | "categorie" | "client_email">[] | null) ?? [];

  const inMaand = projecten.filter((p) => p.leverdatum?.startsWith(m));
  const urenMaand = inMaand
    .filter((p) => p.status !== "geannuleerd")
    .reduce((t, p) => t + Number(p.geschatte_uren ?? 0), 0);
  const waardeMaand = inMaand
    .filter((p) => p.status !== "geannuleerd")
    .reduce((t, p) => t + Math.round(Math.max(Number(p.geschatte_uren ?? 0), 1) * UURTARIEF_CENT[p.categorie]), 0);
  const maandNaam = eerste.toLocaleDateString("nl-BE", { month: "long", year: "numeric" });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Planning</h1>
          <p className="mt-0.5 text-sm text-muted">Leverdata van alle projecten per maand.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/planning?m=${vorige}`} aria-label="Vorige maand" className="rounded-lg border p-2 transition-colors hover:bg-card-hover">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-40 text-center font-semibold capitalize">{maandNaam}</span>
          <Link href={`/admin/planning?m=${volgende}`} aria-label="Volgende maand" className="rounded-lg border p-2 transition-colors hover:bg-card-hover">
            <ChevronRight className="h-4 w-4" />
          </Link>
          {m !== vandaag.slice(0, 7) && (
            <Link href="/admin/planning" className="rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-card-hover">
              Vandaag
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "Leveringen deze maand", v: String(inMaand.filter((p) => p.status !== "geannuleerd").length) },
          { k: "Waarvan last-minute", v: String(inMaand.filter((p) => p.categorie === "last-minute").length) },
          { k: "Geschatte uren", v: `${urenMaand.toLocaleString("nl-BE")} u` },
          { k: "Geschatte waarde", v: `€ ${(waardeMaand / 100).toLocaleString("nl-BE", { maximumFractionDigits: 0 })}` },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl bg-card p-5 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{s.k}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-card shadow-sm">
        <div className="grid min-w-[760px] grid-cols-7">
          {WEEKDAGEN.map((d) => (
            <div key={d} className="border-b px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              {d}
            </div>
          ))}
          {dagen.map((d) => {
            const k = ymd(d);
            const items = perDag.get(k) ?? [];
            const buiten = d.getMonth() !== maand - 1;
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            const isVandaag = k === vandaag;
            return (
              <div
                key={k}
                className={`min-h-28 border-b border-r p-2 ${buiten ? "bg-background/40" : ""} ${weekend && !buiten ? "bg-background/20" : ""}`}
              >
                <p
                  className={`mb-1.5 inline-grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs ${
                    isVandaag ? "bg-accent font-semibold text-white" : buiten ? "text-muted/60" : "text-muted"
                  }`}
                >
                  {d.getDate()}
                </p>
                <div className="space-y-1">
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/projecten/${p.id}`}
                      title={`${p.titel} — ${STATUS_LABEL[p.status].nl} · ${p.client_email}`}
                      className={`block truncate rounded-md border border-l-4 bg-background px-1.5 py-1 text-[11px] leading-tight transition-colors hover:bg-card-hover ${CAT_RAND[p.categorie]} ${STATUS_VUL[p.status] ?? ""}`}
                    >
                      {p.categorie === "last-minute" && <Zap className="mr-0.5 inline h-3 w-3 text-red-500" strokeWidth={2.5} />}
                      {p.titel}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded bg-emerald-500" /> vroegtijdig</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded bg-accent" /> normaal</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded bg-red-500" /> last-minute</span>
        <span className="line-through">geleverd / afgesloten</span>
      </div>

      {zonderDatum.length > 0 && (
        <div className="mt-6 rounded-2xl bg-card p-5 shadow-sm">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            <CalendarDays className="h-3.5 w-3.5" /> Lopend zonder leverdatum ({zonderDatum.length})
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {zonderDatum.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/projecten/${p.id}`}
                  className={`inline-block rounded-md border border-l-4 bg-background px-2 py-1 text-xs transition-colors hover:bg-card-hover ${CAT_RAND[p.categorie]}`}
                >
                  {p.titel} <span className="text-muted">· {STATUS_LABEL[p.status].nl.toLowerCase()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
