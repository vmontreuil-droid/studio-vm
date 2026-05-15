import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { setMonitorActive, deleteMonitor } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

type Monitor = {
  id: string;
  token: string;
  locale: string;
  url: string;
  email: string;
  active: boolean;
  last_scan_at: string | null;
};

export default async function AdminMonitors() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const { data } = await getSupabaseAdmin()
    .from("monitors")
    .select("id, token, locale, url, email, active, last_scan_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const monitors = (data as Monitor[]) ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Monitors{" "}
        <span className="text-muted">({monitors.length})</span>
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sites die bezoekers via de scan laten opvolgen.
      </p>

      <ul className="mt-6 space-y-2">
        {monitors.length === 0 && (
          <li className="rounded-2xl border bg-card p-6 text-muted">
            Nog geen monitors.
          </li>
        )}
        {monitors.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm"
          >
            <span>
              <strong>{m.url}</strong>{" "}
              <span className="text-muted">· {m.email}</span>
              <span
                className={`ml-2 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  m.active
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-muted/15 text-muted"
                }`}
              >
                {m.active ? "actief" : "inactief"}
              </span>
              {m.last_scan_at && (
                <span className="ml-2 font-mono text-[10px] text-muted">
                  laatste scan{" "}
                  {new Date(m.last_scan_at).toLocaleDateString("nl-BE")}
                </span>
              )}
            </span>
            <span className="flex items-center gap-2">
              <a
                href={`/${m.locale}/scan/historiek/${m.token}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border px-3 py-1 text-xs text-muted hover:text-foreground"
              >
                Historiek
              </a>
              <form action={setMonitorActive}>
                <input type="hidden" name="id" value={m.id} />
                <input
                  type="hidden"
                  name="active"
                  value={m.active ? "0" : "1"}
                />
                <button className="rounded-full border px-3 py-1 text-xs hover:bg-card-hover">
                  {m.active ? "Deactiveer" : "Activeer"}
                </button>
              </form>
              <form action={deleteMonitor}>
                <input type="hidden" name="id" value={m.id} />
                <button className="rounded-full border px-3 py-1 text-xs text-red-500 hover:bg-card-hover">
                  Verwijder
                </button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
