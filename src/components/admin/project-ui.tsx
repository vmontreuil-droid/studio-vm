// Kleine weergave-bouwstenen voor de projecten-admin (server-safe).
import { Zap } from "lucide-react";
import { CATEGORIE_LABEL, STATUS_LABEL, statusKleur, type Project, type ProjectStatus } from "@/lib/projecten";

export const VELD =
  "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export function CategorieBadge({ c }: { c: Project["categorie"] }) {
  if (c === "last-minute")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
        <Zap className="h-3 w-3" strokeWidth={2.5} />
        {CATEGORIE_LABEL[c].nl}
      </span>
    );
  return (
    <span
      className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
        c === "vroegtijdig" ? "bg-sky-500/15 text-sky-600 dark:text-sky-400" : "bg-accent/15 text-accent"
      }`}
    >
      {CATEGORIE_LABEL[c].nl}
    </span>
  );
}

export function StatusBadge({ s }: { s: ProjectStatus }) {
  return (
    <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${statusKleur(s)}`}>
      {STATUS_LABEL[s].nl}
    </span>
  );
}

/** "nog 3 d" — rood als verlopen, amber bij ≤ 3 dagen. `dagen` null = geen datum. */
export function Aftelling({ datum, dagen, klaar }: { datum: string | null; dagen: number | null; klaar?: boolean }) {
  if (!datum || dagen == null) return <span className="text-muted">—</span>;
  const tekst = dagen < 0 ? `${-dagen} d te laat` : dagen === 0 ? "vandaag" : `nog ${dagen} d`;
  const kleur = klaar
    ? "text-muted"
    : dagen < 0
      ? "bg-red-600 text-white"
      : dagen <= 3
        ? "bg-amber-500 text-white"
        : "bg-card-hover text-foreground";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-xs">
        {new Date(`${datum}T12:00:00`).toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
      </span>
      {!klaar && <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${kleur}`}>{tekst}</span>}
    </span>
  );
}

export function Kaart({
  titel,
  icoon: Icoon,
  children,
  actie,
  className = "",
}: {
  titel: string;
  icoon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  actie?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-card p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted">
          {Icoon && <Icoon className="h-4 w-4 text-accent" strokeWidth={2} />}
          {titel}
        </h2>
        {actie}
      </div>
      {children}
    </section>
  );
}
