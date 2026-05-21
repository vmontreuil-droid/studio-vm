"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";

export type BuilderTemplate = {
  id: string;
  slug: string;
  name: string;
  sector: string | null;
  tone: "warm" | "zakelijk" | "speels" | null;
  accent_color: string | null;
  radius: "strak" | "zacht" | "rond" | null;
  preview_url: string | null;
  description: string | null;
  header: Record<string, unknown>;
  pages: unknown[];
  is_live: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function listTemplates(): Promise<BuilderTemplate[]> {
  if (!adminConfigured) return [];
  const { data } = await getSupabaseAdmin()
    .from("builder_templates")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data as BuilderTemplate[] | null) ?? [];
}

export async function toggleLive(formData: FormData): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("is_live") ?? "false") === "true";
  if (!id) return;
  await getSupabaseAdmin()
    .from("builder_templates")
    .update({ is_live: next })
    .eq("id", id);
  revalidatePath("/admin/templates-lab");
}

export async function deleteTemplate(formData: FormData): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("builder_templates").delete().eq("id", id);
  revalidatePath("/admin/templates-lab");
}

export async function duplicateTemplate(formData: FormData): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getSupabaseAdmin();
  const { data: src } = await db
    .from("builder_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!src) return;
  const t = src as BuilderTemplate;
  const copy = {
    slug: `${t.slug}-copy-${Date.now().toString(36)}`,
    name: `${t.name} (kopie)`,
    sector: t.sector,
    tone: t.tone,
    accent_color: t.accent_color,
    radius: t.radius,
    preview_url: t.preview_url,
    description: t.description,
    header: t.header,
    pages: t.pages,
    is_live: false,
    sort_order: (t.sort_order ?? 0) + 1,
  };
  await db.from("builder_templates").insert(copy);
  revalidatePath("/admin/templates-lab");
}

// Insert-helper voor seed-script (alleen voor admin).
export async function seedTemplate(
  input: Omit<BuilderTemplate, "id" | "created_at" | "updated_at">,
): Promise<{ ok: boolean; error?: string }> {
  if (!adminConfigured || !(await requireAdmin()))
    return { ok: false, error: "unauthorized" };
  const { error } = await getSupabaseAdmin()
    .from("builder_templates")
    .upsert(input, { onConflict: "slug" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/templates-lab");
  return { ok: true };
}
