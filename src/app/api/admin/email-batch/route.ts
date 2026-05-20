import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { findEmails } from "@/lib/email-finder";
import { sourceFromLand } from "@/lib/admin/prospect-source";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Filter = {
  q?: string;
  postcode?: string;
  nace?: string;
  form?: string;
  active?: boolean;
};

export async function POST(req: NextRequest) {
  if (!adminConfigured || !(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    limit?: number;
    filter?: Filter;
    land?: string;
  };
  const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 30);
  const CONCURRENCY = 5;
  const f: Filter = body.filter ?? {};
  const source = sourceFromLand(body.land);

  const db = getSupabaseAdmin();

  // Atomic claim via de juiste RPC voor dit land.
  // De RPC-namen verschillen maar accepteren dezelfde param-set
  // (p_limit + filter-velden). 'p_nace' is generiek voor NACE/APE/SIC.
  const { data: claimed, error: claimErr } = await db.rpc(source.claimRpc, {
    p_limit: limit,
    p_q: f.q || null,
    p_postcode: f.postcode || null,
    [source.land === "fr"
      ? "p_ape"
      : source.land === "uk"
        ? "p_sic"
        : "p_nace"]: f.nace || null,
    [source.land === "uk" ? "p_cat" : "p_form"]: f.form || null,
    p_active: f.active !== false,
  });
  if (claimErr) {
    return NextResponse.json(
      { error: claimErr.message, hint: "claim", land: source.land },
      { status: 500 },
    );
  }
  const rows =
    (claimed as { enterprise_number: string; website: string }[] | null) ?? [];

  // Snel "te gaan"-cijfer via de partiële index van het juiste land.
  let cq = db
    .from(source.table)
    .select(source.idCol, { count: "exact", head: true })
    .not("website", "is", null)
    .is("email_scanned_at", null);
  if (f.q) cq = cq.ilike("name", `%${f.q}%`);
  if (f.postcode) cq = cq.like("postcode", `${f.postcode}%`);
  if (f.nace) cq = cq.like(source.codeCol, `${f.nace}%`);
  if (f.form) cq = cq.eq(source.formCol, f.form);
  if (f.active !== false) cq = cq.eq(source.statusCol, source.activeValue);
  const { count: remainingAfter } = await cq;
  const hasMore = rows.length === limit;

  // Parallel scannen — CONCURRENCY workers.
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

  // Bulk-update via het juiste land + de juiste id-kolom.
  const now = new Date().toISOString();
  await Promise.all(
    results.map((res) =>
      db
        .from(source.table)
        .update({ email_found: res.emails, email_scanned_at: now })
        .eq(source.idCol, res.id),
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
