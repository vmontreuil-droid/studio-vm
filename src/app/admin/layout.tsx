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
  const [nieuwR, monitorsR] = await Promise.all([
    db.from("quotes").select("id", head).eq("status", "nieuw"),
    db.from("monitors").select("id", head).eq("active", true),
  ]);
  const counts: AdminCounts = {
    nieuw: nieuwR.count ?? 0,
    monitorsActief: monitorsR.count ?? 0,
  };

  return <AdminShell counts={counts}>{children}</AdminShell>;
}
