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

  // Atomic claim — meerdere parallelle clients (laptop, desktop, …)
  // krijgen elk een eigen exclusieve batch via FOR UPDATE SKIP LOCKED.
  // De rijen worden meteen gemarkeerd als gescand zodat geen andere
  // worker ze opnieuw oppakt; de echte email_found wordt verderop
  // ingevuld als we klaar zijn.
  const { data: claimed, error: claimErr } = await db.rpc(
    "claim_kbo_for_scan",
    {
      p_limit: limit,
      p_q: f.q || null,
      p_postcode: f.postcode || null,
      p_nace: f.nace || null,
      p_form: f.form || null,
      p_active: f.active !== false,
    },
  );
  if (claimErr) {
    return NextResponse.json(
      { error: claimErr.message, hint: "claim" },
      { status: 500 },
    );
  }
  const rows =
    (claimed as { enterprise_number: string; website: string }[] | null) ?? [];
  // Snel "te gaan"-cijfer na de claim — exact, via de partiële index.
  let cq = db
    .from("kbo_enterprises")
    .select("enterprise_number", { count: "exact", head: true })
    .not("website", "is", null)
    .is("email_scanned_at", null);
  cq = applyFilter(cq, f);
  const { count: remainingAfter } = await cq;
  const hasMore = rows.length === limit;

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
    remaining:
      typeof remainingAfter === "number" ? remainingAfter : null,
  });
}
