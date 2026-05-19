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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  if (!adminConfigured || !(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    limit?: number;
    filter?: Filter;
  };
  const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 100);
  const f: Filter = body.filter ?? {};

  const db = getSupabaseAdmin();
  // 1) Welke 100 nu scannen?
  let q = db
    .from("kbo_enterprises")
    .select("enterprise_number, website")
    .not("website", "is", null)
    .neq("website", "")
    .is("email_scanned_at", null)
    .order("name", { ascending: true })
    .limit(limit);
  if (f.q) q = q.ilike("name", `%${f.q}%`);
  if (f.postcode) q = q.like("postcode", `${f.postcode}%`);
  if (f.nace) q = q.like("nace_main", `${f.nace}%`);
  if (f.form) q = q.eq("juridical_form", f.form);
  if (f.active !== false) q = q.eq("juridical_status", "000");

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows =
    (data as { enterprise_number: string; website: string }[] | null) ?? [];

  // 2) Resterend totaal in deze filter (voor de voortgangsteller).
  let cq = db
    .from("kbo_enterprises")
    .select("enterprise_number", { count: "exact", head: true })
    .not("website", "is", null)
    .neq("website", "")
    .is("email_scanned_at", null);
  if (f.q) cq = cq.ilike("name", `%${f.q}%`);
  if (f.postcode) cq = cq.like("postcode", `${f.postcode}%`);
  if (f.nace) cq = cq.like("nace_main", `${f.nace}%`);
  if (f.form) cq = cq.eq("juridical_form", f.form);
  if (f.active !== false) cq = cq.eq("juridical_status", "000");
  const { count: remainingBefore } = await cq;

  let scanned = 0;
  let withEmails = 0;
  let emailsTotal = 0;
  for (const r of rows) {
    let emails: string[] = [];
    try {
      const res = await findEmails(r.website);
      emails = (res.emails ?? []).map((e) => e.address);
    } catch {
      /* netwerk-fout — gewoon leeg opslaan, volgende */
    }
    await db
      .from("kbo_enterprises")
      .update({
        email_found: emails,
        email_scanned_at: new Date().toISOString(),
      })
      .eq("enterprise_number", r.enterprise_number);
    scanned++;
    if (emails.length > 0) {
      withEmails++;
      emailsTotal += emails.length;
    }
    await sleep(1500); // throttle — wees vriendelijk
  }

  return NextResponse.json({
    scanned,
    withEmails,
    emailsTotal,
    remainingBefore: remainingBefore ?? 0,
    remainingAfter: Math.max(0, (remainingBefore ?? 0) - scanned),
  });
}
