"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { LOCALES } from "@/lib/i18n/config";
import type {
  ChangelogContent,
  ChangelogLocaleContent,
} from "@/lib/changelog-db";

const KINDS = ["launch", "feature", "improve", "fix"];

async function guard(): Promise<boolean> {
  return adminConfigured && (await requireAdmin());
}

function readContent(fd: FormData): ChangelogContent {
  const out = {} as ChangelogContent;
  for (const loc of LOCALES) {
    const c: ChangelogLocaleContent = {
      title: String(fd.get(`title_${loc}`) ?? "").slice(0, 200),
      detail: String(fd.get(`detail_${loc}`) ?? "").slice(0, 2000),
    };
    out[loc] = c;
  }
  return out;
}

function readKind(fd: FormData): string {
  const k = String(fd.get("kind") ?? "feature");
  return KINDS.includes(k) ? k : "feature";
}

export async function createEntry(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const titleNl = String(formData.get("title_nl") ?? "").trim();
  if (!titleNl) return;
  const { data } = await getSupabaseAdmin()
    .from("changelog_entries")
    .insert({
      entry_date: String(formData.get("entry_date") ?? "") || undefined,
      version: String(formData.get("version") ?? "").slice(0, 20),
      kind: readKind(formData),
      published: false,
      content: readContent(formData),
    })
    .select("id")
    .maybeSingle();
  revalidatePath("/admin/changelog");
  if (data?.id) redirect(`/admin/changelog/${data.id}`);
  redirect("/admin/changelog");
}

export async function updateEntry(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin()
    .from("changelog_entries")
    .update({
      entry_date: String(formData.get("entry_date") ?? "") || undefined,
      version: String(formData.get("version") ?? "").slice(0, 20),
      kind: readKind(formData),
      content: readContent(formData),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin/changelog");
  revalidatePath(`/admin/changelog/${id}`);
}

export async function setEntryPublished(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "1";
  if (!id) return;
  await getSupabaseAdmin()
    .from("changelog_entries")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/changelog");
  revalidatePath(`/admin/changelog/${id}`);
}

export async function deleteEntry(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("changelog_entries").delete().eq("id", id);
  revalidatePath("/admin/changelog");
  redirect("/admin/changelog");
}
