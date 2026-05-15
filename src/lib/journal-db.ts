import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import type { Post } from "@/lib/posts";

// Journal-CMS draait op dezelfde Supabase service-role als de rest.
export const journalConfigured = monitorConfigured;

export type LocaleContent = {
  title: string;
  excerpt: string;
  tag: string;
  body: string;
};
export type JournalContent = Record<Locale, LocaleContent>;

export type JournalRow = {
  id: string;
  slug: string;
  post_date: string;
  read_min: number;
  published: boolean;
  content: JournalContent;
  updated_at: string;
};

function rowToPost(r: JournalRow, locale: Locale): Post | null {
  const c = r.content?.[locale];
  if (!c || !c.title) return null;
  return {
    slug: r.slug,
    title: c.title,
    excerpt: c.excerpt ?? "",
    body: c.body ?? "",
    tag: c.tag ?? "",
    date: r.post_date,
    readMin: r.read_min,
  };
}

// Gepubliceerde posts voor de publieke /journal. null = niet beschikbaar
// (niet geconfigureerd, fout, of leeg) → caller valt terug op statische posts.
export async function dbPosts(locale: Locale): Promise<Post[] | null> {
  if (!journalConfigured) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("journal_posts")
    .select("id, slug, post_date, read_min, published, content, updated_at")
    .eq("published", true)
    .order("post_date", { ascending: false });
  if (error || !data || data.length === 0) return null;
  const posts = (data as JournalRow[])
    .map((r) => rowToPost(r, locale))
    .filter((p): p is Post => p !== null);
  return posts.length > 0 ? posts : null;
}

export async function dbPostBySlug(
  slug: string,
  locale: Locale,
): Promise<Post | null> {
  if (!journalConfigured) return null;
  const { data } = await getSupabaseAdmin()
    .from("journal_posts")
    .select("id, slug, post_date, read_min, published, content, updated_at")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!data) return null;
  return rowToPost(data as JournalRow, locale);
}

// Volledige lijst voor de admin (ook drafts).
export async function dbListAll(): Promise<JournalRow[]> {
  if (!journalConfigured) return [];
  const { data } = await getSupabaseAdmin()
    .from("journal_posts")
    .select("id, slug, post_date, read_min, published, content, updated_at")
    .order("post_date", { ascending: false });
  return (data as JournalRow[]) ?? [];
}

export async function dbGet(id: string): Promise<JournalRow | null> {
  if (!journalConfigured) return null;
  const { data } = await getSupabaseAdmin()
    .from("journal_posts")
    .select("id, slug, post_date, read_min, published, content, updated_at")
    .eq("id", id)
    .maybeSingle();
  return (data as JournalRow | null) ?? null;
}
