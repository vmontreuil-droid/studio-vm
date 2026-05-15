import { cookies } from "next/headers";
import { adminConfigured } from "@/lib/supabase/config";
import { ADMIN_COOKIE, isValidAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin-nav";

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
    return (
      <main className="mx-auto max-w-sm px-6 py-24">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <form
          action="/api/admin/login"
          method="post"
          className="mt-6 space-y-3"
        >
          <input
            name="password"
            type="password"
            required
            autoFocus
            placeholder="Wachtwoord"
            className="w-full rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <button className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
            Inloggen
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r p-5 sm:flex">
        <p className="mb-8 px-2 text-xl font-extrabold lowercase tracking-tighter">
          vm<span className="text-accent">.</span>
          <span className="ml-2 align-middle font-mono text-[10px] font-normal uppercase tracking-widest text-muted">
            admin
          </span>
        </p>
        <AdminNav />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b p-4 sm:hidden">
          <AdminNav />
        </div>
        <main className="p-6 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
