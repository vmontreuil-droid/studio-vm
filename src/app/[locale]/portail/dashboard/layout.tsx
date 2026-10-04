import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/portail";
import { PortailLogin } from "@/components/portail-login";
import { PortalShell } from "@/components/portal-shell";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import type { PortalCounts } from "@/lib/portal-shared";
import { ticketSchema } from "@/lib/tickets-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Portaal — Studio VM",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  if (!supabaseConfigured) {
    return (
      <main>
        <PortailLogin locale={locale} />
      </main>
    );
  }

  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <main>
        <PortailLogin locale={locale} />
      </main>
    );
  }

  const head = { count: "exact" as const, head: true };

  // Support-tellers (sessie van de klant, RLS). Met migratie 0049: open
  // tickets zonder de interne site-meldingen + ongelezen antwoorden. Zonder
  // 0049 (of als de query faalt): de oude telling, en 0 ongelezen.
  async function ticketTellers(): Promise<{ open: number; ongelezen: number }> {
    const oud = async () => {
      const r = await sb.from("tickets").select("id", head).neq("status", "gesloten");
      return r.count ?? 0;
    };
    if (!(await ticketSchema()).v2) return { open: await oud(), ongelezen: 0 };
    const [o, n] = await Promise.all([
      sb.from("tickets").select("id", head).neq("status", "gesloten").neq("soort", "intern"),
      sb.from("tickets").select("id", head).eq("klant_ongelezen", true).neq("soort", "intern"),
    ]);
    return {
      open: o.error ? await oud() : (o.count ?? 0),
      ongelezen: n.error ? 0 : (n.count ?? 0),
    };
  }

  const [oR, iR, tickets, sR, pR] = await Promise.all([
    sb.from("offers").select("id", head).eq("status", "open"),
    sb.from("invoices").select("id", head).eq("status", "open"),
    ticketTellers(),
    sb
      .from("subscriptions")
      .select("id", head)
      .eq("status", "actief"),
    sb
      .from("projecten")
      .select("id", head)
      .not("status", "in", "(afgesloten,geannuleerd)"),
  ]);
  const counts: PortalCounts = {
    offers: oR.count ?? 0,
    invoices: iR.count ?? 0,
    tickets: tickets.open,
    ticketsOngelezen: tickets.ongelezen,
    sites: sR.count ?? 0,
    projecten: pR.count ?? 0,
  };

  async function doSignOut() {
    "use server";
    await signOut();
    redirect(localePath(locale as Locale, "/portail"));
  }

  return (
    <PortalShell
      locale={locale}
      email={user.email ?? ""}
      counts={counts}
      signOutAction={doSignOut}
    >
      {children}
    </PortalShell>
  );
}
