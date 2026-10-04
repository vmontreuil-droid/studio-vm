"use server";

// Acties van de KLANT in het portaal rond zijn 3D-projecten.
// Eigendom wordt altijd gecontroleerd via de klant-sessie (RLS: client_email =
// current_email()); de tijdelijke downloadlinks maakt de service-role pas aan
// na die controle — en voor modelbestanden pas als de factuur betaald is.

import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Project } from "@/lib/projecten";
import { isBetaald } from "@/lib/projecten-server";
import { headers } from "next/headers";
import { herkomst, logBewijs } from "@/lib/invordering/bewijslog";

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
  if (!s?.signedUrl) return { ok: false, fout: "niet_gevonden" };
  const wie = herkomst(await headers());
  await logBewijs({
    soort: "levering_gedownload",
    project_id: project.id,
    client_email: project.client_email,
    details: { bestand: lev.naam, levering_id: leveringId, ip: wie.ip, browser: wie.browser },
  });
  return { ok: true, url: s.signedUrl };
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

// Revisies en vragen over een project lopen via Support (tickets):
// maakTicket in src/app/actions/tickets-klant.ts.
