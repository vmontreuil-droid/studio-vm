"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { LOCALES } from "@/lib/i18n/config";
import type { NowContent, NowLocale } from "@/lib/now-db";

async function guard(): Promise<boolean> {
  return adminConfigured && (await requireAdmin());
}

function lines(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function saveNow(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const content = {} as NowContent;
  for (const loc of LOCALES) {
    const c: NowLocale = {
      work: lines(formData.get(`work_${loc}`)),
      ideas: lines(formData.get(`ideas_${loc}`)),
      bandwidth: String(formData.get(`bandwidth_${loc}`) ?? "").slice(0, 600),
    };
    content[loc] = c;
  }
  const updated_on =
    String(formData.get("updated_on") ?? "") ||
    new Date().toISOString().slice(0, 10);

  await getSupabaseAdmin()
    .from("now_page")
    .upsert(
      {
        singleton: true,
        updated_on,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "singleton" },
    );

  revalidatePath("/admin/now");
  for (const loc of LOCALES) revalidatePath(`/${loc}/now`);
}
