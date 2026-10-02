"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { SEO_TAKEN, SEO_TAAK_PREFIX } from "@/lib/seo-taken";

/** Een SEO-taak afvinken of terug openzetten. */
export async function zetSeoTaak(id: string, klaar: boolean): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  if (!SEO_TAKEN.some((t) => t.id === id)) return;
  const db = getSupabaseAdmin();
  const key = `${SEO_TAAK_PREFIX}${id}`;
  if (klaar) {
    await db
      .from("app_settings")
      .upsert({ key, value: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() }, { onConflict: "key" });
  } else {
    await db.from("app_settings").delete().eq("key", key);
  }
  revalidatePath("/admin");
}
