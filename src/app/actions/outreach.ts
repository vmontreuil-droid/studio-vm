"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { resendApiKey, resendFrom } from "@/lib/supabase/config";
import { getOutreachConfig } from "@/lib/admin/outreach";
import {
  bedrijfVoorMail,
  buildOutreachSamples,
  type MailBedrijf,
} from "@/lib/admin/outreach-mail";
import { getCompanySettings } from "@/lib/admin/settings";
import { parseNaceList } from "@/lib/admin/aannemers";
import { klantMailVoorbeelden } from "@/lib/klant-mails";

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

// Stuur één voorbeeldmail naar jezelf om de rendering, headers en
// spam-score te checken vóór de cron echt naar prospects vertrekt.
export async function sendTestMail(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  if (!resendApiKey)
    return { ok: false, error: "RESEND_API_KEY ontbreekt." };
  const id = (fd.get("id") as string | null)?.trim();
  if (!id) return { ok: false, error: "Geen mail-id." };

  const cfg = await getOutreachConfig();
  if (!cfg.senderEmail)
    return { ok: false, error: "Geen sender-email ingesteld." };

  // Genereer dezelfde sample-mail als op de preview-pagina.
  const sample = buildSamplePreview(
    id,
    cfg,
    bedrijfVoorMail(await getCompanySettings()),
  );
  if (!sample)
    return { ok: false, error: `Onbekende template '${id}'.` };

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.studio-vm.be";
  const unsub = `${baseUrl}/api/outreach/unsubscribe?t=voorbeeld-token`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sample.from ?? `${cfg.senderName} <${cfg.senderEmail}>`,
        to: [cfg.senderEmail],
        subject: `[TEST] ${sample.subject}`,
        html: sample.html,
        text: sample.text,
        reply_to: cfg.senderEmail,
        headers: {
          "List-Unsubscribe": `<${unsub}>, <mailto:${cfg.senderEmail}?subject=Unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return { ok: false, error: `Resend ${r.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "netwerk-error",
    };
  }
}

export async function sendTestMailAction(
  _prev: { ok: boolean; error?: string } | null,
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  return sendTestMail(fd);
}

function buildSamplePreview(
  id: string,
  cfg: Awaited<ReturnType<typeof getOutreachConfig>>,
  bedrijf: MailBedrijf,
): {
  subject: string;
  html: string;
  text?: string;
  from?: string;
} | null {
  // Outreach-varianten (aannemers) — dezelfde voorbeelden als /admin/mail-preview.
  if (id.startsWith("outreach-")) {
    const sample = buildOutreachSamples(cfg, bedrijf).find((x) => x.id === id);
    return sample ? sample.mail : null;
  }
  // Klantmails (offerte, factuur, tickets …) — exact de echte bouwers uit
  // src/lib/klant-mails.ts, id = "<mail>.<taal>" zoals op /admin/mail-preview.
  const m = /^([a-z0-9-]+)\.(nl|fr|en|de|es)$/.exec(id);
  if (m) {
    const v = klantMailVoorbeelden(m[2]).find((x) => x.id === m[1]);
    return v ? { subject: v.mail.subject, html: v.mail.html, from: resendFrom } : null;
  }
  return null;
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

// Doelgroep van de aannemers-campagne: NACE-prefixen + landen. Schrijft
// enkel deze twee kolommen; raakt de pauze-schakelaar nooit aan.
export async function saveOutreachTargeting(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const gekozen = fd.getAll("nace").map((v) => String(v));
  const extra = String(fd.get("nace_extra") ?? "");
  const prefixes = parseNaceList([...gekozen, ...extra.split(/[\s,;]+/)]);
  const lands: ("be" | "fr" | "uk")[] = [];
  for (const l of ["be", "fr", "uk"] as const) {
    if (fd.get(`land_${l}`) != null) lands.push(l);
  }
  try {
    await getSupabaseAdmin()
      .from("company_settings")
      .update({
        outreach_nace_prefixes: prefixes,
        outreach_lands: lands.length > 0 ? lands : ["be"],
      })
      .eq("id", "default");
  } catch {}
  revalidatePath("/admin/outreach");
  revalidatePath("/admin/instellingen");
}

// Warm-up opnieuw starten (bv. na een lange pauze of nieuwe campagne):
// de quota begint dan terug bij 5/dag vanaf de eerstvolgende verzending.
export async function restartOutreachWarmup(): Promise<void> {
  if (!(await requireAdmin())) return;
  try {
    await getSupabaseAdmin()
      .from("company_settings")
      .update({ outreach_started_at: null })
      .eq("id", "default");
  } catch {}
  revalidatePath("/admin/outreach");
}
