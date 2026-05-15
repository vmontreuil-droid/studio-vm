import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured, leadsConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { setSubscriberActive, deleteSubscriber } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

type Subscriber = {
  id: string;
  email: string;
  locale: string;
  source: string | null;
  active: boolean;
  created_at: string;
};

export default async function AdminNewsletter() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  if (!leadsConfigured) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Nieuwsbrief</h1>
        <p className="mt-4 max-w-prose text-muted">
          De abonnees-tabel bestaat nog niet. Pas migratie{" "}
          <code>0006_newsletter.sql</code> toe in Supabase → SQL Editor. Tot dan
          wordt een inschrijving enkel gelogd en verandert er niets live.
        </p>
      </>
    );
  }

  const { data } = await getSupabaseAdmin()
    .from("newsletter_subscribers")
    .select("id, email, locale, source, active, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  const subs = (data as Subscriber[]) ?? [];
  const active = subs.filter((s) => s.active);
  const mailto =
    active.length > 0
      ? `mailto:?bcc=${active.map((s) => s.email).join(",")}`
      : undefined;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Nieuwsbrief{" "}
          <span className="text-muted">
            ({active.length} actief · {subs.length} totaal)
          </span>
        </h1>
        <span className="flex flex-wrap items-center gap-2">
          {subs.length > 0 && (
            <a
              href="/admin/newsletter/export"
              className="rounded-full border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              Exporteer CSV
            </a>
          )}
          {mailto && (
            <a
              href={mailto}
              className="rounded-full border px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              Mail alle actieve abonnees
            </a>
          )}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">
        Inschrijvingen via het formulier in de footer.
      </p>

      <ul className="mt-6 space-y-2">
        {subs.length === 0 && (
          <li className="rounded-2xl border bg-card p-6 text-muted">
            Nog geen abonnees.
          </li>
        )}
        {subs.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm"
          >
            <span className="min-w-0">
              <a
                href={`mailto:${s.email}`}
                className="break-all font-medium text-accent underline"
              >
                {s.email}
              </a>
              <span
                className={`ml-2 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  s.active
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-muted/15 text-muted"
                }`}
              >
                {s.active ? "actief" : "uitgeschreven"}
              </span>
              <span className="ml-2 font-mono text-[10px] text-muted">
                {s.locale.toUpperCase()} · {s.source ?? "—"} ·{" "}
                {new Date(s.created_at).toLocaleDateString("nl-BE")}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <form action={setSubscriberActive}>
                <input type="hidden" name="id" value={s.id} />
                <input
                  type="hidden"
                  name="active"
                  value={s.active ? "0" : "1"}
                />
                <button className="rounded-full border px-3 py-1 text-xs hover:bg-card-hover">
                  {s.active ? "Schrijf uit" : "Heractiveer"}
                </button>
              </form>
              <form action={deleteSubscriber}>
                <input type="hidden" name="id" value={s.id} />
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
