import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { sourceFromLand, type Land } from "@/lib/admin/prospect-source";
import { runScan, type ScanResult } from "@/app/actions/scan";
import { FIND } from "@/lib/scan-findings";

export type OutreachConfig = {
  paused: boolean;
  dailyQuota: number;
  calLink: string | null;
  senderName: string;
  senderEmail: string;
  minScore: number;
  maxScore: number;
  nacePrefixes: string[];
  lands: Land[];
};

const DEFAULT_CONFIG: OutreachConfig = {
  paused: true,
  dailyQuota: 20,
  calLink: null,
  senderName: "Vincent Montreuil",
  senderEmail: "vincent@studio-vm.be",
  minScore: 30,
  maxScore: 65,
  nacePrefixes: [],
  lands: ["be"],
};

export async function getOutreachConfig(): Promise<OutreachConfig> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("company_settings")
      .select(
        "outreach_paused, outreach_daily_quota, outreach_cal_link, outreach_sender_name, outreach_sender_email, outreach_min_score, outreach_max_score, outreach_nace_prefixes, outreach_lands",
      )
      .eq("id", "default")
      .maybeSingle();
    if (!data) return DEFAULT_CONFIG;
    const r = data as Record<string, unknown>;
    return {
      paused: (r.outreach_paused as boolean) ?? true,
      dailyQuota: (r.outreach_daily_quota as number) ?? 20,
      calLink: (r.outreach_cal_link as string) || null,
      senderName: (r.outreach_sender_name as string) || DEFAULT_CONFIG.senderName,
      senderEmail:
        (r.outreach_sender_email as string) || DEFAULT_CONFIG.senderEmail,
      minScore: (r.outreach_min_score as number) ?? 30,
      maxScore: (r.outreach_max_score as number) ?? 65,
      nacePrefixes:
        (r.outreach_nace_prefixes as string[] | null) ?? [],
      lands:
        ((r.outreach_lands as string[] | null) ?? ["be"]).filter(
          (l): l is Land => l === "be" || l === "fr" || l === "uk",
        ) || ["be"],
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Taalkeuze per prospect: NL-default voor BE, FR voor Waalse postcodes
// + Frankrijk, EN voor UK.
export function detectLang(land: Land, postcode: string | null): "nl" | "fr" | "en" {
  if (land === "uk") return "en";
  if (land === "fr") return "fr";
  // BE: 1000-3999 + 8000-9999 = NL, 4000-7999 = FR
  const pc = Number(postcode || "0");
  if (pc >= 4000 && pc <= 7999) return "fr";
  return "nl";
}

// Genereer een uniek scan-token voor de publieke prospect-portaal-pagina.
function makeToken(): string {
  return randomBytes(18).toString("base64url");
}

// Selecteer top-N findings die in een prospect-mail vermeld kunnen worden
// (kritische/waarschuwingen, met een mensentaal-formulering).
export function topIssues(
  scan: ScanResult,
  lang: "nl" | "fr" | "en" = "nl",
  n = 3,
): string[] {
  if (!scan.ok) return [];
  const sev = (s: string) =>
    s === "critical" ? 2 : s === "warning" ? 1 : 0;
  const sorted = [...scan.findings]
    .filter((f) => f.severity === "critical" || f.severity === "warning")
    .sort((a, b) => sev(b.severity) - sev(a.severity));
  const dict = FIND[lang] ?? FIND.nl;
  return sorted
    .slice(0, n)
    .map((f) => dict[f.key]?.title ?? f.key);
}

// Pre-scan één prospect: scan z'n site, sla resultaat op in scan_requests
// (voor de publieke portaal-pagina) + in prospect_outreach.
export async function prescanProspect(
  land: Land,
  prospectId: string,
  website: string,
  email: string,
): Promise<boolean> {
  if (!website) return false;
  const db = getSupabaseAdmin();
  let result: ScanResult;
  try {
    result = await runScan(website);
  } catch {
    return false;
  }
  const token = makeToken();
  const lang = detectLang(
    land,
    null /* postcode unknown here; default ok for token-only */,
  );

  // Maak een scan_request-entry zodat de prospect /scan/[token] kan openen.
  try {
    await db.from("scan_requests").insert({
      email,
      url: website,
      locale: lang,
      token,
      scan: result,
    });
  } catch {
    // Fout (duplicate?) — geen drama, we slaan de outreach-row sowieso op.
  }

  await db
    .from("prospect_outreach")
    .upsert(
      {
        land,
        prospect_id: prospectId,
        website,
        scan_score: result.ok ? result.score : null,
        scan_grade: result.ok ? result.grade : null,
        scan_stack: result.ok ? result.stack : null,
        scan_issues: result.ok ? topIssues(result, "nl", 5) : [],
        scan_token: token,
        scan_at: new Date().toISOString(),
        mail_to: email,
        status: "gescand",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "land,prospect_id" },
    );
  return true;
}

// Selecteer N prospects per land die nog géén outreach-entry hebben maar
// wel een gevonden mailadres → kandidaten voor pre-scan.
export async function pickForPrescan(
  land: Land,
  limit: number,
): Promise<{ id: string; email: string; website: string }[]> {
  const src = sourceFromLand(land);
  const db = getSupabaseAdmin();

  // Stap A: ondernemingen met email + website
  const { data } = await db
    .from(src.table)
    .select(`${src.idCol}, website, email_found`)
    .not("email_found", "is", null)
    .neq("email_found", "[]")
    .not("website", "is", null)
    .limit(limit * 3); // overschat want we filteren nadien

  const rows =
    (data as { [k: string]: unknown; email_found: string[] | null }[] | null) ??
    [];

  // Stap B: filter wie nog géén outreach-entry heeft.
  const ids = rows.map((r) => String(r[src.idCol]));
  if (ids.length === 0) return [];
  const { data: existing } = await db
    .from("prospect_outreach")
    .select("prospect_id")
    .eq("land", land)
    .in("prospect_id", ids);
  const known = new Set(
    ((existing as { prospect_id: string }[] | null) ?? []).map(
      (e) => e.prospect_id,
    ),
  );

  return rows
    .filter((r) => !known.has(String(r[src.idCol])))
    .slice(0, limit)
    .map((r) => ({
      id: String(r[src.idCol]),
      email: (r.email_found as string[])[0] ?? "",
      website: String(r.website),
    }))
    .filter((x) => x.email);
}
