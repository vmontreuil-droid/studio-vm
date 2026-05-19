import Link from "next/link";
import { Mail, Globe, MailSearch, Phone, Building2 } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { EmailBatchFinder } from "@/components/email-batch-finder";

export const dynamic = "force-dynamic";

type KboRow = {
  enterprise_number: string;
  juridical_form: string | null;
  juridical_status: string | null;
  start_date: string | null;
  name: string | null;
  postcode: string | null;
  city: string | null;
  street: string | null;
  house_number: string | null;
  nace_main: string | null;
  nace_codes: string[] | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  email_found: string[] | null;
  email_scanned_at: string | null;
};

const PAGE_SIZE = 50;

export default async function AdminProspects({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    postcode?: string;
    nace?: string;
    form?: string;
    active?: string;
    page?: string;
  }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const postcode = (sp.postcode ?? "").trim();
  const nace = (sp.nace ?? "").trim();
  const form = (sp.form ?? "").trim();
  const active = sp.active !== "0";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const db = getSupabaseAdmin();
  let qy = db
    .from("kbo_enterprises")
    .select(
      "enterprise_number, juridical_form, juridical_status, start_date, name, postcode, city, street, house_number, nace_main, nace_codes, email, phone, website, email_found, email_scanned_at",
      { count: "exact" },
    )
    .order("name", { ascending: true });
  if (q) qy = qy.ilike("name", `%${q}%`);
  if (postcode) qy = qy.like("postcode", `${postcode}%`);
  if (nace) qy = qy.like("nace_main", `${nace}%`);
  if (form) qy = qy.eq("juridical_form", form);
  if (active) qy = qy.eq("juridical_status", "000");
  qy = qy.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count } = await qy;
  const rows = (data as KboRow[] | null) ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const mkLink = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    const base = { q, postcode, nace, form, active: active ? "1" : "0", page };
    for (const [k, v] of Object.entries({ ...base, ...p })) {
      if (v !== "" && v !== undefined && v !== null) u.set(k, String(v));
    }
    return `/admin/prospects?${u.toString()}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
          <p className="mt-0.5 text-sm text-muted">
            KBO Open Data — {total.toLocaleString("nl-BE")} onderneming(en)
            in deze weergave. Filter, klik "Zoek contact" om hun publiek
            mailadres te halen.
          </p>
        </div>
      </div>

      {total === 0 && !q && !postcode && !nace && !form && (
        <div className="mt-6 rounded-2xl bg-amber-500/10 p-5 text-sm text-amber-700 dark:text-amber-300">
          <p className="font-medium">KBO nog niet geïmporteerd.</p>
          <p className="mt-1 text-amber-700/90 dark:text-amber-300/90">
            Maak een account op{" "}
            <a
              className="underline"
              href="https://kbopub.economie.fgov.be/kbo-open-data"
              target="_blank"
              rel="noreferrer"
            >
              kbopub.economie.fgov.be/kbo-open-data
            </a>
            , download de maandelijkse full-dump (.zip), pak ze uit en run
            lokaal in studio-vm: <code>node --max-old-space-size=4096
            scripts/kbo-import.mjs /pad/naar/uitgepakte-folder</code>. Set
            <code> SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code>.
          </p>
        </div>
      )}

      <form className="mt-6 grid gap-3 rounded-2xl bg-card p-4 shadow-sm sm:grid-cols-5">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">Naam bevat</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="bv. carpentier"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Postcode (prefix)</span>
          <input
            name="postcode"
            defaultValue={postcode}
            placeholder="bv. 9"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">NACE-code (prefix)</span>
          <input
            name="nace"
            defaultValue={nace}
            placeholder="bv. 56 (horeca)"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Rechtsvorm</span>
          <input
            name="form"
            defaultValue={form}
            placeholder="code, bv. 014"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input
            type="checkbox"
            name="active"
            value="1"
            defaultChecked={active}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Enkel juridisch actief (status 000)
        </label>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:col-span-2"
        >
          Filter
        </button>
      </form>

      <div className="mt-4">
        <EmailBatchFinder
          filter={{ q, postcode, nace, form, active }}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-background/40 text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                <th className="px-4 py-3 font-medium">Naam</th>
                <th className="px-4 py-3 font-medium">Plaats</th>
                <th className="px-4 py-3 font-medium">NACE</th>
                <th className="px-4 py-3 font-medium">Contact (KBO)</th>
                <th className="px-4 py-3 text-right font-medium">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                    Geen resultaten in deze filter.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.enterprise_number}
                  className="transition-colors hover:bg-card-hover"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted" strokeWidth={2} />
                      <span className="font-medium">
                        {r.name || "(geen naam)"}
                      </span>
                    </span>
                    <span className="block font-mono text-[10px] text-muted">
                      {r.enterprise_number} ·{" "}
                      {r.juridical_form ? `vorm ${r.juridical_form}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {r.postcode} {r.city}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {r.nace_main || "—"}
                    {r.nace_codes && r.nace_codes.length > 1 && (
                      <span className="text-[10px]">
                        {" "}+{r.nace_codes.length - 1}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.email && (
                        <a
                          href={`mailto:${r.email}`}
                          className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent"
                        >
                          <Mail className="h-3 w-3" strokeWidth={2} />
                          {r.email}
                        </a>
                      )}
                      {r.phone && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-card-hover px-2 py-0.5 text-xs text-muted">
                          <Phone className="h-3 w-3" strokeWidth={2} />
                          {r.phone}
                        </span>
                      )}
                      {r.website && (
                        <a
                          href={
                            /^https?:\/\//i.test(r.website)
                              ? r.website
                              : `https://${r.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-card-hover px-2 py-0.5 text-xs text-muted hover:text-foreground"
                        >
                          <Globe className="h-3 w-3" strokeWidth={2} />
                          site
                        </a>
                      )}
                      {!r.email && !r.phone && !r.website && (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </div>
                    {r.email_found && r.email_found.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.email_found.slice(0, 3).map((em) => (
                          <a
                            key={em}
                            href={`mailto:${em}`}
                            className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:text-green-400"
                          >
                            <Mail className="h-3 w-3" strokeWidth={2} />
                            {em}
                          </a>
                        ))}
                        {r.email_found.length > 3 && (
                          <span className="text-[10px] text-muted">
                            +{r.email_found.length - 3} meer
                          </span>
                        )}
                      </div>
                    )}
                    {r.email_scanned_at && !r.email_found?.length && (
                      <span className="mt-1 inline-block font-mono text-[9px] uppercase tracking-widest text-muted">
                        gescand — geen mail gevonden
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.website ? (
                      <Link
                        href={`/admin/email-finder?url=${encodeURIComponent(r.website)}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-accent px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                      >
                        <MailSearch className="h-3.5 w-3.5" strokeWidth={2} />
                        Zoek contact
                      </Link>
                    ) : (
                      <span className="text-[10px] text-muted">
                        geen website
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted">
            <span>
              Pagina {page} / {pages.toLocaleString("nl-BE")}
            </span>
            <span className="flex gap-2">
              {page > 1 && (
                <Link
                  href={mkLink({ page: page - 1 })}
                  className="rounded-full border px-3 py-1 hover:bg-card-hover"
                >
                  ‹ Vorige
                </Link>
              )}
              {page < pages && (
                <Link
                  href={mkLink({ page: page + 1 })}
                  className="rounded-full border px-3 py-1 hover:bg-card-hover"
                >
                  Volgende ›
                </Link>
              )}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
