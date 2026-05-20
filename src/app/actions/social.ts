"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  CHANNELS,
  LOCALES,
  buildFromJournal,
  buildFromChangelog,
  buildEvergreenBatch,
  expandAllVariants,
  spreadSchedule,
  type Channel,
  type Locale,
  type NewSocialPost,
  type Variants,
} from "@/lib/social";

async function guard(): Promise<boolean> {
  return await requireAdmin();
}

function getLocale(v: FormDataEntryValue | null): Locale {
  const s = String(v ?? "nl");
  return LOCALES.includes(s as Locale) ? (s as Locale) : "nl";
}

function getChannels(fd: FormData): Channel[] {
  const raw = fd.getAll("channels").map((v) => String(v));
  const out = CHANNELS.filter((c) => raw.includes(c));
  return out.length > 0 ? out : [...CHANNELS];
}

async function insertBatch(rows: NewSocialPost[]): Promise<number> {
  if (rows.length === 0) return 0;
  const times = spreadSchedule(rows.length);
  const payload = rows.map((r, i) => ({
    kind: r.kind,
    source_ref: r.source_ref,
    locale: r.locale,
    headline: r.headline.slice(0, 240),
    link: r.link,
    channels: r.channels,
    variants: r.variants,
    scheduled_at: times[i],
    status: "gepland",
  }));
  const { error } = await getSupabaseAdmin()
    .from("social_posts")
    .insert(payload);
  if (error) {
    console.error("[social] insert batch failed:", error.message);
    return 0;
  }
  return payload.length;
}

export async function generateJournalBatch(): Promise<void> {
  if (!(await guard())) return;
  const { data } = await getSupabaseAdmin()
    .from("journal_posts")
    .select("id, slug, content")
    .eq("published", true)
    .order("post_date", { ascending: false })
    .limit(5);
  type Row = {
    id: string;
    slug: string;
    content: Record<
      string,
      { title?: string; excerpt?: string; tag?: string } | undefined
    >;
  };
  const rows: NewSocialPost[] = ((data as Row[]) ?? []).flatMap((p) =>
    buildFromJournal(p, siteUrl),
  );
  await insertBatch(rows);
  revalidatePath("/admin/social");
}

export async function generateChangelogBatch(): Promise<void> {
  if (!(await guard())) return;
  const { data } = await getSupabaseAdmin()
    .from("changelog_entries")
    .select("id, version, kind, content")
    .eq("published", true)
    .order("entry_date", { ascending: false })
    .limit(5);
  type Row = {
    id: string;
    version: string;
    kind: string;
    content: Record<string, { title?: string; detail?: string } | undefined>;
  };
  const rows: NewSocialPost[] = ((data as Row[]) ?? []).flatMap((e) =>
    buildFromChangelog(e, siteUrl),
  );
  await insertBatch(rows);
  revalidatePath("/admin/social");
}

export async function generateEvergreen(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const count = Math.max(
    1,
    Math.min(8, parseInt(String(formData.get("count") ?? "4"), 10) || 4),
  );
  const seed = Math.floor(Math.random() * 9999);
  const rows = buildEvergreenBatch(siteUrl, count, seed);
  await insertBatch(rows);
  revalidatePath("/admin/social");
}

export async function createManualPost(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const locale = getLocale(formData.get("locale"));
  const channels = getChannels(formData);
  const hook = String(formData.get("hook") ?? "").trim().slice(0, 280);
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const cta = String(formData.get("cta") ?? "").trim().slice(0, 200) || undefined;
  const link = String(formData.get("link") ?? "").trim().slice(0, 500) || undefined;
  const hashtags = String(formData.get("hashtags") ?? "")
    .split(/[,\s]+/)
    .map((s) => s.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 12);
  const when = String(formData.get("scheduled_at") ?? "").trim();
  const status = when ? "gepland" : "concept";

  if (!hook) return;
  const variants = expandAllVariants({ hook, body, cta, link, hashtags }, locale, channels);
  await getSupabaseAdmin().from("social_posts").insert({
    kind: "manual",
    source_ref: null,
    locale,
    headline: hook,
    link: link ?? null,
    channels,
    variants,
    scheduled_at: when ? new Date(when).toISOString() : null,
    status,
  });
  revalidatePath("/admin/social");
}

export async function updateVariant(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const channel = String(formData.get("channel") ?? "") as Channel;
  const text = String(formData.get("text") ?? "").slice(0, 6000);
  if (!id || !CHANNELS.includes(channel)) return;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("social_posts")
    .select("variants")
    .eq("id", id)
    .maybeSingle();
  const cur = (data as { variants: Variants } | null)?.variants ?? {};
  const next: Variants = { ...cur, [channel]: { text } };
  await db
    .from("social_posts")
    .update({ variants: next, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath(`/admin/social/${id}`);
}

export async function setStatus(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return;
  const allowed = ["concept", "gepland", "gepost", "gearchiveerd"];
  if (!allowed.includes(status)) return;
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "gepost") patch.posted_at = new Date().toISOString();
  await getSupabaseAdmin().from("social_posts").update(patch).eq("id", id);
  revalidatePath("/admin/social");
  revalidatePath(`/admin/social/${id}`);
}

export async function setSchedule(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const when = String(formData.get("scheduled_at") ?? "").trim();
  if (!id) return;
  const iso = when ? new Date(when).toISOString() : null;
  await getSupabaseAdmin()
    .from("social_posts")
    .update({
      scheduled_at: iso,
      status: iso ? "gepland" : "concept",
      notify_sent_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin/social");
  revalidatePath(`/admin/social/${id}`);
}

export async function deletePost(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("social_posts").delete().eq("id", id);
  revalidatePath("/admin/social");
  redirect("/admin/social");
}

// Plan alle conceptposts in een keer — handig na een batch-generatie.
export async function scheduleAllConcepts(): Promise<void> {
  if (!(await guard())) return;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("social_posts")
    .select("id")
    .eq("status", "concept")
    .order("created_at", { ascending: true })
    .limit(500);
  const ids = ((data as { id: string }[]) ?? []).map((r) => r.id);
  if (ids.length === 0) return;
  const times = spreadSchedule(ids.length);
  for (let i = 0; i < ids.length; i++) {
    await db
      .from("social_posts")
      .update({
        scheduled_at: times[i],
        status: "gepland",
        notify_sent_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ids[i]);
  }
  revalidatePath("/admin/social");
}
