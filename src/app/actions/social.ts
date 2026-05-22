"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { generateDailyPosts } from "@/lib/admin/social-generator";
import { buildSocialDigestMail } from "@/lib/admin/social-mail";
import { sendMail } from "@/lib/monitor";
import { getCompanySettings } from "@/lib/admin/settings";

export type SocialPost = {
  id: string;
  created_at: string;
  updated_at: string;
  platform: "facebook" | "linkedin" | "instagram" | "x" | "algemeen";
  post_kind:
    | "persoonlijk"
    | "page"
    | "group"
    | "ad"
    | "story"
    | "article"
    | null;
  status: "idee" | "concept" | "klaar" | "gepost" | "gearchiveerd";
  title: string;
  body: string | null;
  hashtags: string | null;
  attachments_json: unknown;
  target_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  scheduled_for: string | null;
  posted_at: string | null;
  posted_url: string | null;
  result_likes: number | null;
  result_comments: number | null;
  result_shares: number | null;
  notes: string | null;
};

export type AppSetting = { key: string; value: string | null };

// =====================================================================
// Hulp — slug + UTM-campaign uit titel + datum
// =====================================================================
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 40);
}

function utmCampaignFor(title: string): string {
  const ym = new Date().toISOString().slice(0, 7).replace("-", ""); // 202605
  return `${ym}-${slugify(title) || "post"}`;
}

// =====================================================================
// Listing & reads
// =====================================================================
export async function listSocialPosts(): Promise<SocialPost[]> {
  if (!adminConfigured) return [];
  const { data } = await getSupabaseAdmin()
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as SocialPost[] | null) ?? [];
}

export async function listAppSettings(): Promise<AppSetting[]> {
  if (!adminConfigured) return [];
  const { data } = await getSupabaseAdmin()
    .from("app_settings")
    .select("*")
    .order("key", { ascending: true });
  return (data as AppSetting[] | null) ?? [];
}

// =====================================================================
// Create — minimale velden + auto-utm
// =====================================================================
export async function createSocialPost(formData: FormData): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;

  const platform = String(formData.get("platform") ?? "facebook");
  const post_kind = String(formData.get("post_kind") ?? "persoonlijk");
  const title = String(formData.get("title") ?? "").slice(0, 200);
  const body = String(formData.get("body") ?? "").slice(0, 5000);
  const hashtags = String(formData.get("hashtags") ?? "").slice(0, 500);
  const target_url = String(formData.get("target_url") ?? "/").slice(0, 500);
  const utm_campaign =
    String(formData.get("utm_campaign") ?? "").slice(0, 80) ||
    utmCampaignFor(title);

  if (!title) return;

  await getSupabaseAdmin().from("social_posts").insert({
    platform,
    post_kind,
    status: "concept",
    title,
    body: body || null,
    hashtags: hashtags || null,
    target_url: target_url || "/",
    utm_source: platform,
    utm_medium: "social",
    utm_campaign,
  });

  revalidatePath("/admin/social");
}

// =====================================================================
// Update body/title/inhoud
// =====================================================================
export async function updateSocialPost(formData: FormData): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const patch: Record<string, unknown> = {};
  const fields = [
    "title",
    "body",
    "hashtags",
    "target_url",
    "platform",
    "post_kind",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "posted_url",
    "notes",
  ];
  for (const f of fields) {
    if (formData.has(f)) {
      const v = String(formData.get(f) ?? "");
      patch[f] = v === "" ? null : v;
    }
  }
  // numerieke velden
  for (const f of ["result_likes", "result_comments", "result_shares"]) {
    if (formData.has(f)) {
      const n = Number(formData.get(f) ?? 0);
      patch[f] = Number.isFinite(n) ? n : 0;
    }
  }

  if (Object.keys(patch).length === 0) return;
  await getSupabaseAdmin().from("social_posts").update(patch).eq("id", id);
  revalidatePath("/admin/social");
}

// =====================================================================
// Status-transities — idee → concept → klaar → gepost → gearchiveerd
// =====================================================================
export async function setSocialStatus(formData: FormData): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  const patch: Record<string, unknown> = { status };
  if (status === "gepost") patch.posted_at = new Date().toISOString();
  await getSupabaseAdmin().from("social_posts").update(patch).eq("id", id);
  revalidatePath("/admin/social");
}

export async function deleteSocialPost(formData: FormData): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("social_posts").delete().eq("id", id);
  revalidatePath("/admin/social");
}

// =====================================================================
// App-settings — Pixel-IDs en co.
// =====================================================================
export async function setAppSetting(formData: FormData): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  const key = String(formData.get("key") ?? "").slice(0, 80);
  const value = String(formData.get("value") ?? "").slice(0, 500);
  if (!key) return;

  await getSupabaseAdmin()
    .from("app_settings")
    .upsert(
      { key, value: value || null, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  revalidatePath("/admin/social");
  revalidatePath("/", "layout"); // pixel-IDs zitten straks in root-layout
}

// =====================================================================
// AI Content Engine — handmatige trigger vanaf /admin/social-knop.
// Genereert 3 posts NU, stuurt digest-mail, revalidates pagina.
// =====================================================================
export async function generateNow(): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  const result = await generateDailyPosts({ count: 3 });
  if (result.generated > 0) {
    try {
      const s = await getCompanySettings();
      const to = s.email || "vmontreuil@outlook.be";
      const mail = buildSocialDigestMail(result.posts);
      await sendMail(to, mail).catch(() => false);
    } catch {
      // mail-fout mag de generatie niet ongedaan maken
    }
  }
  revalidatePath("/admin/social");
}

// =====================================================================
// Posts-per-maand + engagement-per-maand (laatste 12 maanden)
// =====================================================================
export type MonthBucket = {
  month: string; // YYYY-MM
  label: string;
  posts: number;
  engagement: number;
  posted: number;
};

export async function getMonthlyStats(): Promise<MonthBucket[]> {
  if (!adminConfigured) return [];
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { data } = await getSupabaseAdmin()
    .from("social_posts")
    .select(
      "created_at, posted_at, status, result_likes, result_comments, result_shares",
    )
    .gte("created_at", since.toISOString())
    .limit(5_000);

  const rows =
    (data as Array<{
      created_at: string;
      posted_at: string | null;
      status: string;
      result_likes: number | null;
      result_comments: number | null;
      result_shares: number | null;
    }> | null) ?? [];

  const months: MonthBucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    const ym = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString("nl-BE", { month: "short" });
    months.push({ month: ym, label, posts: 0, engagement: 0, posted: 0 });
  }
  for (const r of rows) {
    const ym = (r.posted_at ?? r.created_at).slice(0, 7);
    const m = months.find((x) => x.month === ym);
    if (!m) continue;
    m.posts += 1;
    if (r.status === "gepost") m.posted += 1;
    m.engagement +=
      (r.result_likes ?? 0) +
      (r.result_comments ?? 0) +
      (r.result_shares ?? 0);
  }
  return months;
}

// =====================================================================
// Klikken per dag uit page_views (laatste 30d, alleen rijen met utm_source)
// =====================================================================
export async function getSocialClicksByDay(): Promise<
  Array<{ label: string; value: number }>
> {
  if (!adminConfigured) return [];
  const since = new Date(Date.now() - 30 * 86_400_000);
  const { data } = await getSupabaseAdmin()
    .from("page_views")
    .select("created_at, utm_source")
    .not("utm_source", "is", null)
    .gte("created_at", since.toISOString())
    .limit(20_000);

  const rows =
    (data as Array<{ created_at: string; utm_source: string }> | null) ?? [];
  const now = new Date();
  return Array.from({ length: 30 }, (_, k) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - (29 - k));
    const ymd = dt.toISOString().slice(0, 10);
    return {
      label: dt.toLocaleDateString("nl-BE", {
        day: "2-digit",
        month: "short",
      }),
      value: rows.filter((r) => r.created_at.startsWith(ymd)).length,
    };
  });
}

// =====================================================================
// Per-platform breakdown — posts, engagement, clicks, avg/post
// =====================================================================
export type PlatformBreakdown = {
  platform: string;
  posts: number;
  posted: number;
  engagement: number;
  clicks: number;
  avgEngagement: number;
};

export async function getPlatformBreakdown(): Promise<PlatformBreakdown[]> {
  if (!adminConfigured) return [];
  const sb = getSupabaseAdmin();
  const [postsRes, viewsRes] = await Promise.all([
    sb
      .from("social_posts")
      .select("platform, status, result_likes, result_comments, result_shares")
      .limit(5_000),
    sb
      .from("page_views")
      .select("utm_source")
      .not("utm_source", "is", null)
      .limit(20_000),
  ]);

  const map = new Map<
    string,
    { posts: number; posted: number; engagement: number; clicks: number }
  >();
  const ensure = (k: string) => {
    let e = map.get(k);
    if (!e) {
      e = { posts: 0, posted: 0, engagement: 0, clicks: 0 };
      map.set(k, e);
    }
    return e;
  };

  for (const p of (postsRes.data as Array<{
    platform: string | null;
    status: string;
    result_likes: number | null;
    result_comments: number | null;
    result_shares: number | null;
  }> | null) ?? []) {
    const k = p.platform ?? "algemeen";
    const e = ensure(k);
    e.posts += 1;
    if (p.status === "gepost") e.posted += 1;
    e.engagement +=
      (p.result_likes ?? 0) +
      (p.result_comments ?? 0) +
      (p.result_shares ?? 0);
  }
  for (const v of (viewsRes.data as Array<{ utm_source: string | null }> | null) ??
    []) {
    if (!v.utm_source) continue;
    ensure(v.utm_source).clicks += 1;
  }

  return [...map.entries()]
    .map(([platform, x]) => ({
      platform,
      ...x,
      avgEngagement: x.posted > 0 ? Math.round(x.engagement / x.posted) : 0,
    }))
    .sort((a, b) => b.engagement + b.clicks - (a.engagement + a.clicks));
}

// =====================================================================
// Top-10 best-presterende posts (op engagement)
// =====================================================================
export type TopPost = SocialPost & { _eng: number };

export async function getTopPosts(): Promise<TopPost[]> {
  if (!adminConfigured) return [];
  const { data } = await getSupabaseAdmin()
    .from("social_posts")
    .select("*")
    .eq("status", "gepost")
    .limit(500);
  const posts = (data as SocialPost[] | null) ?? [];
  return posts
    .map((p) => ({
      ...p,
      _eng:
        (p.result_likes ?? 0) +
        (p.result_comments ?? 0) +
        (p.result_shares ?? 0),
    }))
    .sort((a, b) => b._eng - a._eng)
    .slice(0, 10);
}

// =====================================================================
// Stats — pageviews per UTM-source/campaign (laatste 30d)
// =====================================================================
export type UtmStat = {
  source: string;
  campaign: string | null;
  views: number;
  visitors: number;
};

export async function getUtmStats(): Promise<UtmStat[]> {
  if (!adminConfigured) return [];
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await getSupabaseAdmin()
    .from("page_views")
    .select("utm_source, utm_campaign, visitor_hash")
    .not("utm_source", "is", null)
    .gte("created_at", since)
    .limit(10_000);

  const rows =
    (data as Array<{
      utm_source: string | null;
      utm_campaign: string | null;
      visitor_hash: string | null;
    }> | null) ?? [];

  const map = new Map<
    string,
    { source: string; campaign: string | null; views: number; visitors: Set<string> }
  >();
  for (const r of rows) {
    if (!r.utm_source) continue;
    const key = `${r.utm_source}|${r.utm_campaign ?? ""}`;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        source: r.utm_source,
        campaign: r.utm_campaign,
        views: 0,
        visitors: new Set<string>(),
      };
      map.set(key, entry);
    }
    entry.views += 1;
    if (r.visitor_hash) entry.visitors.add(r.visitor_hash);
  }
  return [...map.values()]
    .map((e) => ({
      source: e.source,
      campaign: e.campaign,
      views: e.views,
      visitors: e.visitors.size,
    }))
    .sort((a, b) => b.views - a.views);
}
