"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

const STATUSES = [
  "nieuw",
  "gescand",
  "verzonden",
  "opgevolgd",
  "geopend",
  "beantwoord",
  "klant",
  "geen_interesse",
] as const;

export async function setOutreachStatus(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const land = (fd.get("land") as string | null)?.trim();
  const prospect_id = (fd.get("prospect_id") as string | null)?.trim();
  const status = (fd.get("status") as string | null)?.trim() as
    | (typeof STATUSES)[number]
    | undefined;
  if (!land || !prospect_id || !status || !STATUSES.includes(status)) return;
  try {
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "beantwoord") patch.replied_at = new Date().toISOString();
    await getSupabaseAdmin()
      .from("prospect_outreach")
      .update(patch)
      .eq("land", land)
      .eq("prospect_id", prospect_id);
    revalidatePath("/admin/outreach");
  } catch {}
}

export async function toggleOutreachPaused(): Promise<void> {
  if (!(await requireAdmin())) return;
  try {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("company_settings")
      .select("outreach_paused")
      .eq("id", "default")
      .maybeSingle();
    const current = (data as { outreach_paused: boolean } | null)
      ?.outreach_paused;
    await db
      .from("company_settings")
      .update({ outreach_paused: !current })
      .eq("id", "default");
    revalidatePath("/admin/outreach");
  } catch {}
}
