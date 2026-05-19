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
  const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 100);
  const f: Filter = body.filter ?? {};

  const db = getSupabaseAdmin();

  // Geen exact count — die is veel te traag op 1,95 M rijen. We
  // halen LIMIT+1 rijen op zodat we kunnen vertellen "is er nog
  // meer" zonder een count-scan over de hele tabel.
  let q = db
    .from("kbo_enterprises")
    .select("enterprise_number, website")
    .not("website", "is", null)
    .is("email_scanned_at", null)
    .limit(limit + 1);
  q = applyFilter(q, f);

  const { data, error } = await q;
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

  let scanned = 0;
  let withEmails = 0;
  let emailsTotal = 0;
  for (const r of rows) {
    if (!r.website || !r.website.trim()) {
      // lege string in DB — markeer als gescand zodat we hem niet
      // elke batch opnieuw oppikken
      await db
        .from("kbo_enterprises")
        .update({ email_found: [], email_scanned_at: new Date().toISOString() })
        .eq("enterprise_number", r.enterprise_number);
      scanned++;
      continue;
    }
    let emails: string[] = [];
    try {
      const fr = await findEmails(r.website);
      emails = (fr.emails ?? []).map((e) => e.address);
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
    hasMore,
  });
}
