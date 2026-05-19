import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { findEmails } from "@/lib/email-finder";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Filter = {
  q?: string;
  postcode?: string;
  nace?: string;
  form?: string;
  active?: boolean;
};

function applyFilter<T>(q: T, f: Filter): T {
  let r = q as unknown as {
    ilike: (c: string, v: string) => unknown;
    like: (c: string, v: string) => unknown;
    eq: (c: string, v: string) => unknown;
  };
  if (f.q) r = r.ilike("name", `%${f.q}%`) as typeof r;
  if (f.postcode) r = r.like("postcode", `${f.postcode}%`) as typeof r;
  if (f.nace) r = r.like("nace_main", `${f.nace}%`) as typeof r;
  if (f.form) r = r.eq("juridical_form", f.form) as typeof r;
  if (f.active !== false) r = r.eq("juridical_status", "000") as typeof r;
  return r as unknown as T;
}

export async function POST(req: NextRequest) {
  if (!adminConfigured || !(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    limit?: number;
    filter?: Filter;
  };
  // Kleine batches (20) + parallel scannen (5 tegelijk) zodat één
  // call ruim binnen Vercel's 5 min budget blijft. De client roept
  // de API gewoon vaker aan in auto-modus.
  const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 30);
  const CONCURRENCY = 5;
  const f: Filter = body.filter ?? {};

  const db = getSupabaseAdmin();

  // Geen exact count — die is veel te traag op 1,95 M rijen. We
  // halen LIMIT+1 rijen op zodat we kunnen vertellen "is er nog
  // meer" zonder een count-scan over de hele tabel.
  let q = db
    .from("kbo_enterprises")
    .select("enterprise_number, website", { count: "planned" })
    .not("website", "is", null)
    .is("email_scanned_at", null)
    .limit(limit + 1);
  q = applyFilter(q, f);

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json(
      { error: error.message, hint: "select" },
      { status: 500 },
    );
  }
  const all =
    (data as { enterprise_number: string; website: string }[] | null) ?? [];

  // Diagnose: als de SELECT 0 rijen geeft, run een 2e probe met
  // alleen `website not null` om te zien of de filter ergens stukt.
  if (all.length === 0) {
    const probe = await db
      .from("kbo_enterprises")
      .select("enterprise_number, website, email_scanned_at")
      .not("website", "is", null)
      .limit(3);
    return NextResponse.json({
      scanned: 0,
      withEmails: 0,
      emailsTotal: 0,
      hasMore: false,
      _debug: {
        filter: f,
        probeRows: probe.data ?? [],
        probeError: probe.error?.message,
      },
    });
  }

  const hasMore = all.length > limit;
  const rows = hasMore ? all.slice(0, limit) : all;

  // Parallel scannen — CONCURRENCY workers nemen één voor één een
  // prospect uit de wachtrij.
  type ScanResult = { id: string; emails: string[] };
  const results: ScanResult[] = new Array(rows.length);
  let idx = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (true) {
        const i = idx++;
        if (i >= rows.length) return;
        const r = rows[i];
        if (!r.website || !r.website.trim()) {
          results[i] = { id: r.enterprise_number, emails: [] };
          continue;
        }
        try {
          const fr = await findEmails(r.website);
          results[i] = {
            id: r.enterprise_number,
            emails: (fr.emails ?? []).map((e) => e.address),
          };
        } catch {
          results[i] = { id: r.enterprise_number, emails: [] };
        }
      }
    }),
  );

  // Bulk-update alle gescande rijen in één pass (parallel) — sneller
  // dan één voor één een eq-UPDATE doen.
  const now = new Date().toISOString();
  await Promise.all(
    results.map((res) =>
      db
        .from("kbo_enterprises")
        .update({ email_found: res.emails, email_scanned_at: now })
        .eq("enterprise_number", res.id),
    ),
  );

  const scanned = results.length;
  const withEmails = results.filter((r) => r.emails.length > 0).length;
  const emailsTotal = results.reduce((t, r) => t + r.emails.length, 0);

  return NextResponse.json({
    scanned,
    withEmails,
    emailsTotal,
    hasMore,
    remaining: typeof count === "number" ? Math.max(0, count - scanned) : null,
  });
}
