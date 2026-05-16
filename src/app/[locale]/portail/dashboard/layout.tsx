import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/portail";
import { PortailLogin } from "@/components/portail-login";
import { PortalShell } from "@/components/portal-shell";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import type { PortalCounts } from "@/lib/portal-shared";

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
  const [oR, iR, tR] = await Promise.all([
    sb.from("offers").select("id", head).eq("status", "open"),
    sb.from("invoices").select("id", head).eq("status", "open"),
    sb.from("tickets").select("id", head).neq("status", "gesloten"),
  ]);
  const counts: PortalCounts = {
    offers: oR.count ?? 0,
    invoices: iR.count ?? 0,
    tickets: tR.count ?? 0,
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
