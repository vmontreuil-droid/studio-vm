import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { ADMIN_COOKIE, isValidAdmin } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/admin-login";
import { AdminShell, type AdminCounts } from "@/components/admin-shell";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!adminConfigured) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-4 text-muted">
          Nog niet geconfigureerd. Zet <code>ADMIN_PASSWORD</code> +
          Supabase-keys en pas migraties 0002–0004 toe.
        </p>
      </main>
    );
  }

  const jar = await cookies();
  if (!isValidAdmin(jar.get(ADMIN_COOKIE)?.value)) {
    return <AdminLogin />;
  }

  const db = getSupabaseAdmin();
  const head = { count: "exact" as const, head: true };
  const [
    nieuwR,
    monitorsR,
    scansR,
    offertesR,
    facturenR,
    ticketsR,
    formR,
    projectenR,
    invorderingR,
  ] = await Promise.all([
    db.from("quotes").select("id", head).eq("status", "nieuw"),
    db.from("monitors").select("id", head).eq("active", true),
    db.from("scan_requests").select("id", head),
    db
      .from("offers")
      .select("id", head)
      .eq("status", "open")
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().slice(0, 10)}`),
    db.from("invoices").select("id", head).eq("status", "open"),
    // Tickets-badge: enkel tickets waar de studio aan zet is (migratie 0049),
    // zonder interne site-meldingen.
    db
      .from("tickets")
      .select("id", head)
      .neq("status", "gesloten")
      .eq("wacht_op", "studio")
      .neq("soort", "intern"),
    db.from("form_submissions").select("id", head).eq("is_read", false),
    db
      .from("projecten")
      .select("id", head)
      .in("status", ["aanvraag", "offerte", "akkoord", "productie"]),
    // Dossiers die op Studio VM wachten (migratie 0052; zonder: fout → 0).
    db.from("invorderingen").select("id", head).eq("status", "klaar"),
  ]);
  // Zonder migratie 0049 bestaan wacht_op/soort niet (een HEAD-telling geeft
  // dan een fout zonder code): terug naar de oude telling van alle open tickets.
  const ticketsOudR = ticketsR.error
    ? db.from("tickets").select("id", head).neq("status", "gesloten")
    : null;
  // "Klanten"-badge = dezelfde bronnen als de klantenlijst (zonder
  // scan-leads uit de websitetijd), zodat het cijfer overeenkomt.
  const [prEmR, subEmR, quoteEmR, offerEmR, invEmR, ticketsOud] = await Promise.all([
    db.from("projecten").select("client_email").limit(5000),
    db.from("subscriptions").select("client_email").limit(5000),
    db
      .from("quotes")
      .select("email")
      .in("source", ["3d-model", "contact", "offerte-configurator", "builder"])
      .limit(5000),
    db.from("offers").select("client_email").limit(5000),
    db.from("invoices").select("client_email").limit(5000),
    ticketsOudR,
  ]);
  const ticketsOpen = ticketsOud ? (ticketsOud.count ?? 0) : (ticketsR.count ?? 0);
  const klantSet = new Set<string>();
  const add = (v: string | null | undefined) => {
    const k = v?.toLowerCase().trim();
    if (k) klantSet.add(k);
  };
  for (const r of (prEmR.data as { client_email: string }[] | null) ?? [])
    add(r.client_email);
  for (const r of (subEmR.data as { client_email: string }[] | null) ?? [])
    add(r.client_email);
  for (const r of (quoteEmR.data as { email: string }[] | null) ?? [])
    add(r.email);
  for (const r of (offerEmR.data as { client_email: string }[] | null) ?? [])
    add(r.client_email);
  for (const r of (invEmR.data as { client_email: string }[] | null) ?? [])
    add(r.client_email);
  const klanten = klantSet.size;
  const counts: AdminCounts = {
    nieuw: nieuwR.count ?? 0,
    monitorsActief: monitorsR.count ?? 0,
    scans: scansR.count ?? 0,
    klanten,
    offertesOpen: offertesR.count ?? 0,
    facturenOpen: facturenR.count ?? 0,
    ticketsOpen,
    formNieuw: formR.count ?? 0,
    projectenActief: projectenR.count ?? 0,
    invorderingKlaar: invorderingR.error ? 0 : (invorderingR.count ?? 0),
  };

  return <AdminShell counts={counts}>{children}</AdminShell>;
}
