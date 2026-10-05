import Link from "next/link";
import { ArrowRight, UserPlus, Layers, Search } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { addClient } from "@/app/actions/portal-admin";
import { portaalKlanten } from "@/lib/portal-access";
import { TrendChart } from "@/components/trend-chart";
import { ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

// Een klant = iemand met een project, offerte, factuur, abonnement of
// een 3D-/contactaanvraag, of een portaalaccount dat als klant gemarkeerd
// is (zelf toegevoegd, oud-klant 3DG). Scan-leads uit de websitetijd tellen
// niet mee.
type Client = {
  email: string;
  naam: string | null;
  bedrijf: string | null;
  eersteAt: string;
  lastAt: string;
  projecten: number;
  actief: number;
  betaaldCent: number;
  openCent: number;
  bron: string | null;
  activiteit: boolean;
};

const BRON_LABEL: Record<string, string> = { "3dg": "3DG" };

const ACTIEF = new Set(["aanvraag", "offerte", "akkoord", "productie", "geleverd"]);

export default async function AdminKlanten({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const db = getSupabaseAdmin();

  const [{ data: prData }, { data: offerData }, { data: invData }, { data: subData }, { data: qData }, accounts] =
    await Promise.all([
      db.from("projecten").select("client_email, status, created_at, updated_at").limit(5000),
      db.from("offers").select("client_email, client_name, client_company, created_at").limit(5000),
      db.from("invoices").select("client_email, amount_cents, status, issued_at").limit(5000),
      db.from("subscriptions").select("client_email, created_at").limit(5000),
      db
        .from("quotes")
        .select("email, name, company, created_at, source")
        .in("source", ["3d-model", "contact", "offerte-configurator", "builder"])
        .limit(5000),
      portaalKlanten(),
    ]);

  const byEmail = new Map<string, Client>();
  const raak = (email: string | null | undefined, at: string | null | undefined, activiteit = true) => {
    const key = email?.toLowerCase().trim();
    if (!key) return null;
    const t = at ?? new Date(0).toISOString();
    let c = byEmail.get(key);
    if (!c) {
      c = { email: key, naam: null, bedrijf: null, eersteAt: t, lastAt: t, projecten: 0, actief: 0, betaaldCent: 0, openCent: 0, bron: null, activiteit };
      byEmail.set(key, c);
      return c;
    }
    if (!activiteit) return c;
    if (t > c.lastAt) c.lastAt = t;
    if (t < c.eersteAt) c.eersteAt = t;
    return c;
  };

  for (const p of (prData as { client_email: string; status: string; created_at: string; updated_at: string }[] | null) ?? []) {
    const c = raak(p.client_email, p.updated_at ?? p.created_at);
    if (!c) continue;
    c.projecten += 1;
    if (ACTIEF.has(p.status)) c.actief += 1;
  }
  for (const o of (offerData as { client_email: string; client_name: string | null; client_company: string | null; created_at: string }[] | null) ?? []) {
    const c = raak(o.client_email, o.created_at);
    if (!c) continue;
    c.naam ??= o.client_name;
    c.bedrijf ??= o.client_company;
  }
  for (const iv of (invData as { client_email: string; amount_cents: number; status: string; issued_at: string }[] | null) ?? []) {
    const c = raak(iv.client_email, iv.issued_at);
    if (!c) continue;
    if (iv.status === "betaald") c.betaaldCent += iv.amount_cents ?? 0;
    else if (iv.status === "open") c.openCent += iv.amount_cents ?? 0;
  }
  for (const s of (subData as { client_email: string; created_at: string }[] | null) ?? []) {
    raak(s.client_email, s.created_at);
  }
  for (const q of (qData as { email: string; name: string | null; company: string | null; created_at: string }[] | null) ?? []) {
    const c = raak(q.email, q.created_at);
    if (!c) continue;
    c.naam ??= q.name;
    c.bedrijf ??= q.company;
  }

  // Accounts als laatste, zodat hun aanmaakdatum de datums van echte
  // activiteit (projecten, offertes, …) niet overschrijft.
  for (const a of accounts) {
    const c = raak(a.email, a.aangemaakt, false);
    if (!c) continue;
    c.naam ??= a.naam;
    c.bedrijf ??= a.bedrijf;
    c.bron ??= a.bron;
  }

  const alle = [...byEmail.values()];
  // Klanten met activiteit eerst, daarna kale accounts; elk op recentste.
  let clients = [...alle].sort((a, b) =>
    a.activiteit !== b.activiteit ? (a.activiteit ? -1 : 1) : a.lastAt < b.lastAt ? 1 : -1,
  );
  if (sp.f === "actief") clients = clients.filter((c) => c.actief > 0);
  if (sp.f === "3dg") clients = clients.filter((c) => c.bron === "3dg");
  if (sp.f === "open") clients = clients.filter((c) => c.openCent > 0);
  if (sp.q) {
    const n = sp.q.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.email.includes(n) ||
        (c.naam ?? "").toLowerCase().includes(n) ||
        (c.bedrijf ?? "").toLowerCase().includes(n),
    );
  }

  const eur = (c: number) =>
    `€ ${(c / 100).toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const nu = new Date();
  const nieuwPerMaand = Array.from({ length: 12 }, (_, k) => {
    const dt = new Date(nu.getFullYear(), nu.getMonth() - (11 - k), 1);
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: dt.toLocaleDateString("nl-BE", { month: "short" }),
      // Oud-klanten (met bron) zijn geen nieuwe klanten van die maand.
      value: alle.filter((c) => !c.bron && c.eersteAt.startsWith(ym)).length,
    };
  });
  const totaalBetaald = alle.reduce((t, c) => t + c.betaaldCent, 0);
  const totaalOpen = alle.reduce((t, c) => t + c.openCent, 0);
  const metActief = alle.filter((c) => c.actief > 0).length;

  const filters = [
    { k: undefined, label: `Alle (${alle.length})` },
    { k: "actief", label: `Met lopend project (${metActief})` },
    { k: "open", label: `Openstaand saldo (${alle.filter((c) => c.openCent > 0).length})` },
  ];
  const oud3dg = alle.filter((c) => c.bron === "3dg").length;
  if (oud3dg) filters.push({ k: "3dg", label: `Oud-klanten 3DG (${oud3dg})` });
  const href = (f?: string) => {
    const p = new URLSearchParams();
    if (f) p.set("f", f);
    if (sp.q) p.set("q", sp.q);
    const s = p.toString();
    return `/admin/klanten${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Klanten</h1>
          <p className="mt-1 text-sm text-muted">
            Aannemers en opdrachtgevers met een project, offerte, factuur of aanvraag, en klanten die u zelf toevoegde.
          </p>
        </div>
        <form className="flex gap-2">
          {sp.f && <input type="hidden" name="f" value={sp.f} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Naam, bedrijf of e-mail…"
              className="w-64 rounded-full border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-accent"
            />
          </div>
          <button type="submit" className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover">
            Zoek
          </button>
        </form>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "Klanten", v: String(alle.length) },
          { k: "Met lopend project", v: String(metActief) },
          { k: "Totaal betaald", v: eur(totaalBetaald) },
          { k: "Openstaand", v: eur(totaalOpen) },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl bg-card p-5 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{s.k}</p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <ChartCard title="Nieuwe klanten — laatste 12 maanden">
          <TrendChart id="kl-nieuw" color="var(--accent)" height={140} points={nieuwPerMaand} />
        </ChartCard>
      </div>

      <form
        action={addClient}
        className="mt-6 flex flex-col gap-2 rounded-2xl border border-dashed bg-card/50 p-4 sm:flex-row sm:items-center"
      >
        <UserPlus className="hidden h-4 w-4 shrink-0 text-accent sm:block" strokeWidth={2} />
        <input
          name="client_email"
          type="email"
          required
          placeholder="Klant toevoegen — e-mailadres (krijgt toegang tot het klantenportaal)"
          className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Toevoegen &amp; openen
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={href(f.k)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              (sp.f ?? undefined) === f.k ? "border-accent bg-accent/10 font-medium text-accent" : "text-muted hover:bg-card-hover"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        {clients.length === 0 ? (
          <p className="p-6 text-sm text-muted">
            Geen klanten gevonden. Zodra iemand een 3D-model aanvraagt, verschijnt die hier automatisch.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="hidden border-b text-left font-mono text-[10px] uppercase tracking-widest text-muted md:table-header-group">
              <tr>
                <th className="px-5 py-3 font-medium">Klant</th>
                <th className="px-3 py-3 font-medium">Projecten</th>
                <th className="px-3 py-3 text-right font-medium">Betaald</th>
                <th className="px-3 py-3 text-right font-medium">Openstaand</th>
                <th className="px-3 py-3 font-medium">Laatst</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((c) => {
                const link = `/admin/klanten/${encodeURIComponent(c.email)}`;
                return (
                  <tr key={c.email} className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-card-hover md:table-row md:p-0">
                    <td className="min-w-0 flex-1 md:px-5 md:py-4">
                      <Link href={link} className="block">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium">{c.bedrijf || c.naam || c.email}</span>
                          {c.bron && (
                            <span className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] text-muted">
                              {BRON_LABEL[c.bron] ?? c.bron}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {c.bedrijf && c.naam ? `${c.naam} · ` : ""}
                          {c.email}
                        </span>
                      </Link>
                    </td>
                    <td className="md:px-3 md:py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Layers className="h-3.5 w-3.5 text-muted" />
                        {c.projecten}
                        {c.actief > 0 && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] text-accent">
                            {c.actief} lopend
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="font-mono text-xs md:px-3 md:py-4 md:text-right">{c.betaaldCent ? eur(c.betaaldCent) : "—"}</td>
                    <td className={`font-mono text-xs md:px-3 md:py-4 md:text-right ${c.openCent ? "font-semibold text-amber-600" : ""}`}>
                      {c.openCent ? eur(c.openCent) : "—"}
                    </td>
                    <td className="font-mono text-[11px] text-muted md:px-3 md:py-4">
                      {c.activiteit ? new Date(c.lastAt).toLocaleDateString("nl-BE", { timeZone: "Europe/Brussels" }) : "—"}
                    </td>
                    <td className="md:pr-5">
                      <Link href={link} aria-label={`Open ${c.email}`}>
                        <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
