import Link from "next/link";
import { Mail, Globe, MailSearch, Phone, Building2 } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { EmailBatchFinder } from "@/components/email-batch-finder";
import { SOURCES, sourceFromLand } from "@/lib/admin/prospect-source";

export const dynamic = "force-dynamic";

type Row = {
  // alle landen kennen deze velden
  name: string | null;
  postcode: string | null;
  city: string | null;
  street: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  email_found: string[] | null;
  email_scanned_at: string | null;
  // dynamische kolomnamen (worden via select-alias geleverd)
  id_col: string;
  code_col: string | null;
  form_col: string | null;
};

const PAGE_SIZE = 50;

export default async function AdminProspects({
  searchParams,
}: {
  searchParams: Promise<{
    land?: string;
    q?: string;
    postcode?: string;
    code?: string;
    form?: string;
    active?: string;
    page?: string;
  }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const source = sourceFromLand(sp.land);
  const q = (sp.q ?? "").trim();
  const postcode = (sp.postcode ?? "").trim();
  const code = (sp.code ?? "").trim();
  const form = (sp.form ?? "").trim();
  const active = sp.active !== "0";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const db = getSupabaseAdmin();
  const selectCols = `${source.idCol}::text as id_col, ${source.codeCol} as code_col, ${source.formCol} as form_col, name, postcode, city, street, email, phone, website, email_found, email_scanned_at`;

  let qy = db
    .from(source.table)
    .select(selectCols, { count: "exact" })
    .order("name", { ascending: true });
  if (q) qy = qy.ilike("name", `%${q}%`);
  if (postcode) qy = qy.like("postcode", `${postcode}%`);
  if (code) qy = qy.like(source.codeCol, `${code}%`);
  if (form) qy = qy.eq(source.formCol, form);
  if (active) qy = qy.eq(source.statusCol, source.activeValue);
  qy = qy.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count } = await qy;
  const rows = (data as Row[] | null) ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Persistente DB-tellers
  let q1 = db
    .from(source.table)
    .select(source.idCol, { count: "exact", head: true })
    .not("website", "is", null)
    .is("email_scanned_at", null);
  let q2 = db
    .from(source.table)
    .select(source.idCol, { count: "exact", head: true })
    .not("email_scanned_at", "is", null);
  let q3 = db
    .from(source.table)
    .select(source.idCol, { count: "exact", head: true })
    .not("email_found", "is", null)
    .neq("email_found", "[]");
  if (q) {
    q1 = q1.ilike("name", `%${q}%`);
    q2 = q2.ilike("name", `%${q}%`);
    q3 = q3.ilike("name", `%${q}%`);
  }
  if (postcode) {
    q1 = q1.like("postcode", `${postcode}%`);
    q2 = q2.like("postcode", `${postcode}%`);
    q3 = q3.like("postcode", `${postcode}%`);
  }
  if (code) {
    q1 = q1.like(source.codeCol, `${code}%`);
    q2 = q2.like(source.codeCol, `${code}%`);
    q3 = q3.like(source.codeCol, `${code}%`);
  }
  if (form) {
    q1 = q1.eq(source.formCol, form);
    q2 = q2.eq(source.formCol, form);
    q3 = q3.eq(source.formCol, form);
  }
  if (active) {
    q1 = q1.eq(source.statusCol, source.activeValue);
    q2 = q2.eq(source.statusCol, source.activeValue);
    q3 = q3.eq(source.statusCol, source.activeValue);
  }
  const [
    { count: scanRemaining },
    { count: alreadyScanned },
    { count: withEmails },
  ] = await Promise.all([q1, q2, q3]);

  const mkLink = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    const base = {
      land: source.land === "be" ? undefined : source.land,
      q,
      postcode,
      code,
      form,
      active: active ? "1" : "0",
      page,
    };
    for (const [k, v] of Object.entries({ ...base, ...p })) {
      if (v !== "" && v !== undefined && v !== null) u.set(k, String(v));
    }
    return `/admin/prospects?${u.toString()}`;
  };
  const switchLand = (l: string) => mkLink({ land: l === "be" ? "" : l, page: 1 });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospects</h1>
          <p className="mt-0.5 text-sm text-muted">
            {source.flag} {source.label} — {total.toLocaleString("nl-BE")}{" "}
            onderneming(en) in deze weergave.
          </p>
        </div>
        <div className="flex gap-1.5">
          {(["be", "fr", "uk"] as const).map((l) => {
            const s = SOURCES[l];
            const sel = source.land === l;
            return (
              <Link
                key={l}
                href={switchLand(l)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  sel
                    ? "border-accent bg-accent/10 text-accent"
                    : "hover:bg-card-hover"
                }`}
              >
                <span className="text-base leading-none">{s.flag}</span>
                {l.toUpperCase()}
              </Link>
            );
          })}
        </div>
      </div>

      {total === 0 && !q && !postcode && !code && !form && (
        <div className="mt-6 rounded-2xl bg-amber-500/10 p-5 text-sm text-amber-700 dark:text-amber-300">
          <p className="font-medium">
            {source.label} nog niet geïmporteerd.
          </p>
          <p className="mt-1 text-amber-700/90 dark:text-amber-300/90">
            {source.land === "be" && (
              <>
                Download de KBO Open Data dump op{" "}
                <a
                  className="underline"
                  href="https://kbopub.economie.fgov.be/kbo-open-data"
                  target="_blank"
                  rel="noreferrer"
                >
                  kbopub.economie.fgov.be
                </a>{" "}
                en run <code>npm run kbo:import /pad/naar/folder</code>.
              </>
            )}
            {source.land === "fr" && (
              <>
                Download Sirene stock-CSV op{" "}
                <a
                  className="underline"
                  href="https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/"
                  target="_blank"
                  rel="noreferrer"
                >
                  data.gouv.fr
                </a>{" "}
                en run <code>npm run sirene:import /pad/naar/folder</code>.
              </>
            )}
            {source.land === "uk" && (
              <>
                Download "BasicCompanyDataAsOneFile-..." op{" "}
                <a
                  className="underline"
                  href="http://download.companieshouse.gov.uk/en_output.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  download.companieshouse.gov.uk
                </a>{" "}
                en run{" "}
                <code>npm run uk:import /pad/naar/file.csv</code>.
              </>
            )}
          </p>
        </div>
      )}

      <form className="mt-6 grid gap-3 rounded-2xl bg-card p-4 shadow-sm sm:grid-cols-5">
        <input type="hidden" name="land" value={source.land} />
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
          <span className="text-xs font-medium text-muted">
            Postcode (prefix)
          </span>
          <input
            name="postcode"
            defaultValue={postcode}
            placeholder={source.postcodeExample}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">
            {source.codeLabel} (prefix)
          </span>
          <input
            name="code"
            defaultValue={code}
            placeholder={source.codeExample}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Rechtsvorm</span>
          <input
            name="form"
            defaultValue={form}
            placeholder="code"
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
          Enkel actief ({source.statusCol}={source.activeValue})
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
          filter={{ q, postcode, nace: code, form, active }}
          land={source.land}
          initial={{
            remaining: scanRemaining ?? 0,
            scanned: alreadyScanned ?? 0,
            withEmails: withEmails ?? 0,
          }}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-background/40 text-left font-mono text-[10px] uppercase tracking-widest text-muted">
                <th className="px-4 py-3 font-medium">Naam</th>
                <th className="px-4 py-3 font-medium">Plaats</th>
                <th className="px-4 py-3 font-medium">{source.codeLabel}</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 text-right font-medium">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-muted"
                  >
                    Geen resultaten in deze filter.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.id_col}
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
                      {r.id_col} ·{" "}
                      {r.form_col ? `vorm ${r.form_col}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {r.postcode} {r.city}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.code_col || "—"}</td>
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
