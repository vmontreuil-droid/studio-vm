"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { SEO_TAKEN, SEO_TAAK_PREFIX, leesTaakWaarde } from "@/lib/seo-taken";

/**
 * Een SEO-taak afvinken of terug openzetten. Terugkerende taken onthouden
 * hoe vaak ze gedaan zijn (voor de fotoreeks); terugzetten draait de laatste
 * beurt terug.
 */
export async function zetSeoTaak(id: string, klaar: boolean): Promise<void> {
  if (!adminConfigured || !(await requireAdmin())) return;
  const taak = SEO_TAKEN.find((t) => t.id === id);
  if (!taak) return;
  const db = getSupabaseAdmin();
  const key = `${SEO_TAAK_PREFIX}${id}`;
  const vandaag = new Date().toISOString().slice(0, 10);
  const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
  const huidig = leesTaakWaarde((data as { value: string | null } | null)?.value);
  const nu = new Date().toISOString();

  if (klaar) {
    const value = taak.herhaalDagen ? `${vandaag}|${huidig.aantal + 1}` : vandaag;
    await db.from("app_settings").upsert({ key, value, updated_at: nu }, { onConflict: "key" });
  } else if (taak.herhaalDagen && huidig.aantal > 1) {
    // Eén beurt terug; de datum van de vorige beurt kennen we niet meer, dus
    // die zetten we zo dat de taak meteen weer openstaat.
    const terug = new Date(Date.now() - taak.herhaalDagen * 86_400_000).toISOString().slice(0, 10);
    await db.from("app_settings").upsert({ key, value: `${terug}|${huidig.aantal - 1}`, updated_at: nu }, { onConflict: "key" });
  } else {
    await db.from("app_settings").delete().eq("key", key);
  }
  revalidatePath("/admin");
}
