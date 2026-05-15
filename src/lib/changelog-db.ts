import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import type { ChangeEntry, ChangeKind } from "@/lib/changelog";

export const changelogConfigured = monitorConfigured;

const KINDS: ChangeKind[] = ["launch", "feature", "improve", "fix"];

export type ChangelogLocaleContent = { title: string; detail: string };
export type ChangelogContent = Record<Locale, ChangelogLocaleContent>;

export type ChangelogRow = {
  id: string;
  entry_date: string;
  version: string;
  kind: string;
  published: boolean;
  content: ChangelogContent;
  updated_at: string;
};

function normKind(k: string): ChangeKind {
  return (KINDS as string[]).includes(k) ? (k as ChangeKind) : "feature";
}

function sortEntries<T extends { date: string; version: string }>(a: T, b: T) {
  return a.date === b.date
    ? b.version.localeCompare(a.version, undefined, { numeric: true })
    : b.date.localeCompare(a.date);
}

// Gepubliceerde entries voor de publieke /changelog. null = niet beschikbaar
// (niet geconfigureerd, fout of leeg) → caller valt terug op statisch.
export async function dbChangelog(
  locale: Locale,
): Promise<ChangeEntry[] | null> {
  if (!changelogConfigured) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("changelog_entries")
    .select("id, entry_date, version, kind, published, content, updated_at")
    .eq("published", true);
  if (error || !data || data.length === 0) return null;
  const entries = (data as ChangelogRow[])
    .map((r) => {
      const c = r.content?.[locale];
      if (!c || !c.title) return null;
      return {
        date: r.entry_date,
        version: r.version,
        kind: normKind(r.kind),
        title: c.title,
        detail: c.detail ?? "",
      } satisfies ChangeEntry;
    })
    .filter((e): e is ChangeEntry => e !== null)
    .sort(sortEntries);
  return entries.length > 0 ? entries : null;
}

export async function dbChangelogListAll(): Promise<ChangelogRow[]> {
  if (!changelogConfigured) return [];
  const { data } = await getSupabaseAdmin()
    .from("changelog_entries")
    .select("id, entry_date, version, kind, published, content, updated_at")
    .order("entry_date", { ascending: false });
  return (data as ChangelogRow[]) ?? [];
}

export async function dbChangelogGet(
  id: string,
): Promise<ChangelogRow | null> {
  if (!changelogConfigured) return null;
  const { data } = await getSupabaseAdmin()
    .from("changelog_entries")
    .select("id, entry_date, version, kind, published, content, updated_at")
    .eq("id", id)
    .maybeSingle();
  return (data as ChangelogRow | null) ?? null;
}
