import Link from "next/link";
import { FileText, Receipt, Paperclip, Search } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type DocType = "offerte" | "factuur" | "bestand";

type Doc = {
  type: DocType;
  title: string;
  client: string;
  at: string;
  amountCents: number | null;
  status: string | null;
  href: string;
};

const TYPES: { key: DocType; label: string; icon: typeof FileText }[] = [
  { key: "offerte", label: "Offertes", icon: FileText },
  { key: "factuur", label: "Facturen", icon: Receipt },
  { key: "bestand", label: "Bestanden", icon: Paperclip },
];

export default async function AdminDocumenten({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { type, q } = await searchParams;
  const db = getSupabaseAdmin();

  const [offR, invR, docR] = await Promise.all([
    db
      .from("offers")
      .select("id, client_email, title, amount_cents, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    db
      .from("invoices")
      .select("id, client_email, number, amount_cents, status, issued_at")
      .order("issued_at", { ascending: false })
      .limit(1000),
    db
      .from("documents")
      .select("id, client_email, name, url, kind, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const docs: Doc[] = [
    ...((offR.data as Record<string, unknown>[] | null) ?? []).map((o) => ({
      type: "offerte" as const,
      title: (o.title as string) || "Offerte",
      client: (o.client_email as string) ?? "",
      at: (o.created_at as string) ?? "",
      amountCents: (o.amount_cents as number | null) ?? null,
      status: (o.status as string | null) ?? null,
      href: `/admin/offertes/${o.id as string}`,
    })),
    ...((invR.data as Record<string, unknown>[] | null) ?? []).map((i) => ({
      type: "factuur" as const,
      title: `Factuur ${(i.number as string) ?? ""}`,
      client: (i.client_email as string) ?? "",
      at: (i.issued_at as string) ?? "",
      amountCents: (i.amount_cents as number | null) ?? null,
      status: (i.status as string | null) ?? null,
      href: `/admin/facturen/${i.id as string}`,
    })),
    ...((docR.data as Record<string, unknown>[] | null) ?? []).map((d) => ({
      type: "bestand" as const,
      title: (d.name as string) || "Bestand",
      client: (d.client_email as string) ?? "",
      at: (d.created_at as string) ?? "",
      amountCents: null,
      status: (d.kind as string | null) ?? null,
      href: (d.url as string) ?? "#",
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  const term = (q ?? "").trim().toLowerCase();
  const filtered = docs.filter(
    (d) =>
      (!type || d.type === type) &&
      (!term ||
        d.title.toLowerCase().includes(term) ||
        d.client.toLowerCase().includes(term)),
  );

  const eur = (c: number | null) =>
    c == null ? "" : `€ ${(c / 100).toFixed(2)}`;
  const counts = {
    offerte: docs.filter((d) => d.type === "offerte").length,
    factuur: docs.filter((d) => d.type === "factuur").length,
    bestand: docs.filter((d) => d.type === "bestand").length,
  };
  const qs = (t?: string) => {
    const p = new URLSearchParams();
    if (t) p.set("type", t);
    if (term) p.set("q", term);
    const s = p.toString();
    return s ? `?${s}` : "";
  };
  const badge: Record<DocType, string> = {
    offerte:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    factuur:
      "bg-accent/10 text-accent",
    bestand:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documenten</h1>
        <p className="mt-0.5 text-sm text-muted">
          Centraal archief van alle offertes, facturen en geüploade
          bestanden — doorzoekbaar.
        </p>
      </div>

      <form className="mt-6">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={2}
          />
          {type && <input type="hidden" name="type" value={type} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Zoek op naam of klant…"
            className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/admin/documenten${qs()}`}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            !type ? "border-accent bg-accent/10 text-accent" : "hover:bg-card-hover"
          }`}
        >
          Alles · {docs.length}
        </Link>
        {TYPES.map((t) => (
          <Link
            key={t.key}
            href={`/admin/documenten${qs(t.key)}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              type === t.key
                ? "border-accent bg-accent/10 text-accent"
                : "hover:bg-card-hover"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" strokeWidth={2} />
            {t.label} · {counts[t.key]}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
        <ul className="divide-y divide-border">
          {filtered.length === 0 && (
            <li className="p-6 text-sm text-muted">
              Geen documenten gevonden.
            </li>
          )}
          {filtered.slice(0, 300).map((d, i) => {
            const Icon = TYPES.find((t) => t.key === d.type)!.icon;
            const external = d.type === "bestand";
            const inner = (
              <>
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${badge[d.type]}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {d.title}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {d.client}
                      {d.status ? ` · ${d.status}` : ""}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-4 text-xs text-muted">
                  {d.amountCents != null && (
                    <span className="whitespace-nowrap font-mono">
                      {eur(d.amountCents)}
                    </span>
                  )}
                  <span className="whitespace-nowrap">
                    {d.at
                      ? new Date(d.at).toLocaleDateString("nl-BE")
                      : ""}
                  </span>
                </span>
              </>
            );
            const cls =
              "flex items-center justify-between gap-3 p-4 text-sm transition-colors hover:bg-card-hover";
            return (
              <li key={`${d.type}-${i}`}>
                {external ? (
                  <a
                    href={d.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cls}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link href={d.href} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
