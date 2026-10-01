import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Project } from "@/lib/projecten";

/** Is de factuur van dit project betaald? (service-role; enkel server-side) */
export async function isBetaald(project: Pick<Project, "invoice_id">): Promise<boolean> {
  if (!project.invoice_id) return false;
  const { data } = await getSupabaseAdmin()
    .from("invoices")
    .select("status")
    .eq("id", project.invoice_id)
    .maybeSingle();
  return (data as { status?: string } | null)?.status === "betaald";
}
