"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { LOCALES } from "@/lib/i18n/config";
import type { JournalContent, LocaleContent } from "@/lib/journal-db";

async function guard(): Promise<boolean> {
  return adminConfigured && (await requireAdmin());
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function readContent(fd: FormData): JournalContent {
  const out = {} as JournalContent;
  for (const loc of LOCALES) {
    const c: LocaleContent = {
      title: String(fd.get(`title_${loc}`) ?? "").slice(0, 200),
      excerpt: String(fd.get(`excerpt_${loc}`) ?? "").slice(0, 500),
      tag: String(fd.get(`tag_${loc}`) ?? "").slice(0, 40),
      body: String(fd.get(`body_${loc}`) ?? "").slice(0, 20000),
    };
    out[loc] = c;
  }
  return out;
}

export async function createPost(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const titleNl = String(formData.get("title_nl") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || titleNl);
  if (!slug || !titleNl) return;

  const { data } = await getSupabaseAdmin()
    .from("journal_posts")
    .insert({
      slug,
      post_date: String(formData.get("post_date") ?? "") || undefined,
      read_min: Number(formData.get("read_min") ?? 4) || 4,
      published: false,
      content: readContent(formData),
    })
    .select("id")
    .maybeSingle();

  revalidatePath("/admin/journal");
  if (data?.id) redirect(`/admin/journal/${data.id}`);
  redirect("/admin/journal");
}

export async function updatePost(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin()
    .from("journal_posts")
    .update({
      post_date: String(formData.get("post_date") ?? "") || undefined,
      read_min: Number(formData.get("read_min") ?? 4) || 4,
      content: readContent(formData),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin/journal");
  revalidatePath(`/admin/journal/${id}`);
}

export async function setPublished(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "1";
  if (!id) return;
  await getSupabaseAdmin()
    .from("journal_posts")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/journal");
  revalidatePath(`/admin/journal/${id}`);
}

export async function deletePost(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("journal_posts").delete().eq("id", id);
  revalidatePath("/admin/journal");
  redirect("/admin/journal");
}
