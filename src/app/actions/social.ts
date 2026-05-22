"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";

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
