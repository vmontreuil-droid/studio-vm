"use server";

// Acties van de KLANT in het portaal rond zijn 3D-projecten.
// Eigendom wordt altijd gecontroleerd via de klant-sessie (RLS: client_email =
// current_email()); de tijdelijke downloadlinks maakt de service-role pas aan
// na die controle — en voor modelbestanden pas als de factuur betaald is.

import { revalidatePath } from "next/cache";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/monitor";
import { getCompanySettings } from "@/lib/admin/settings";
import type { Project } from "@/lib/projecten";
import { isBetaald } from "@/lib/projecten-server";

const LINK_GELDIG = 60 * 10; // 10 minuten

async function klantEmail(): Promise<string | null> {
  if (!supabaseConfigured) return null;
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.email ? user.email.toLowerCase() : null;
}

async function eigenProject(id: string): Promise<Project | null> {
  const sb = await getSupabaseServer();
  const { data } = await sb.from("projecten").select("*").eq("id", id).maybeSingle();
  return (data as Project | null) ?? null;
}

export type DownloadResultaat = { ok: true; url: string } | { ok: false; fout: "login" | "niet_gevonden" | "niet_betaald" };

export async function downloadLevering(leveringId: string): Promise<DownloadResultaat> {
  if (!(await klantEmail())) return { ok: false, fout: "login" };
  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("leveringen")
    .select("id, project_id, naam, pad")
    .eq("id", leveringId)
    .maybeSingle();
  const lev = data as { project_id: string; naam: string; pad: string } | null;
  if (!lev) return { ok: false, fout: "niet_gevonden" };
  const project = await eigenProject(lev.project_id);
  if (!project) return { ok: false, fout: "niet_gevonden" };
  if (!(await isBetaald(project))) return { ok: false, fout: "niet_betaald" };
  const { data: s } = await getSupabaseAdmin()
    .storage.from("modellen")
    .createSignedUrl(lev.pad, LINK_GELDIG, { download: lev.naam });
  return s?.signedUrl ? { ok: true, url: s.signedUrl } : { ok: false, fout: "niet_gevonden" };
}

export async function downloadPlan(projectId: string, pad: string): Promise<DownloadResultaat> {
  if (!(await klantEmail())) return { ok: false, fout: "login" };
  const project = await eigenProject(projectId);
  const plan = project?.plannen?.find((p) => p.pad === pad);
  if (!project || !plan) return { ok: false, fout: "niet_gevonden" };
  const { data: s } = await getSupabaseAdmin()
    .storage.from("plannen")
    .createSignedUrl(plan.pad, LINK_GELDIG, { download: plan.naam });
  return s?.signedUrl ? { ok: true, url: s.signedUrl } : { ok: false, fout: "niet_gevonden" };
}

/** Revisie of vraag over een project → ticket (zichtbaar bij Tickets). */
export async function vraagRevisie(formData: FormData): Promise<{ ok: boolean }> {
  const email = await klantEmail();
  if (!email) return { ok: false };
  const projectId = String(formData.get("project") ?? "");
  const tekst = String(formData.get("tekst") ?? "").trim().slice(0, 4000);
  const project = await eigenProject(projectId);
  if (!project || !tekst) return { ok: false };

  const sb = await getSupabaseServer();
  const { data: t } = await sb
    .from("tickets")
    .insert({ client_email: email, subject: `Revisie — ${project.titel}`.slice(0, 160) })
    .select("id")
    .single();
  if (!t) return { ok: false };
  await sb.from("ticket_messages").insert({ ticket_id: t.id, sender: "klant", body: tekst });

  try {
    const s = await getCompanySettings();
    await sendMail(s.email || "info@studio-vm.be", {
      subject: `Revisie gevraagd — ${project.titel}`,
      replyTo: email,
      html: `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#1c1917">
<p><strong>${email}</strong> vraagt een revisie voor <strong>${project.titel.replace(/</g, "&lt;")}</strong>:</p>
<p style="white-space:pre-wrap;border-left:3px solid #b45309;padding-left:12px">${tekst.replace(/</g, "&lt;")}</p></div>`,
    });
  } catch {
    // mail mag de klant nooit blokkeren
  }
  revalidatePath("/[locale]/portail/dashboard", "layout");
  return { ok: true };
}
