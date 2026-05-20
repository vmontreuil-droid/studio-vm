"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { createMolliePayment } from "@/lib/mollie";

export type HealthCheckPackage = "standard" | "premium";

const PRICES: Record<HealthCheckPackage, number> = {
  standard: 4900, // €49 — volledig automatisch, geen call
  premium: 9900, // €99 — incl. 30-min videocall met Vincent
};

export async function startHealthCheck(fd: FormData): Promise<void> {
  const name = (fd.get("name") as string | null)?.trim() || null;
  const emailRaw = (fd.get("email") as string | null)?.trim() || "";
  const websiteRaw = (fd.get("website") as string | null)?.trim() || "";
  const locale = ((fd.get("locale") as string | null) || "nl").toLowerCase();
  const packageRaw = ((fd.get("package") as string | null) || "premium")
    .toLowerCase()
    .trim();
  const pkg: HealthCheckPackage =
    packageRaw === "standard" ? "standard" : "premium";
  if (!emailRaw || !websiteRaw) return;

  // Normaliseer URL
  let website: string;
  try {
    const u = /^https?:\/\//i.test(websiteRaw)
      ? websiteRaw
      : `https://${websiteRaw}`;
    website = new URL(u).toString();
  } catch {
    return;
  }

  const db = getSupabaseAdmin();
  const scanToken = randomBytes(18).toString("base64url");
  const amountCents = PRICES[pkg];

  const { data, error } = await db
    .from("health_checks")
    .insert({
      name,
      email: emailRaw.toLowerCase(),
      website,
      locale,
      amount_cents: amountCents,
      package: pkg,
      scan_token: scanToken,
    })
    .select("id")
    .single();
  if (error || !data) return;
  const id = (data as { id: string }).id;

  const pay = await createMolliePayment({
    amountCents,
    description: `Site Health Check ${pkg === "premium" ? "Premium" : "Standard"} — ${website.replace(/^https?:\/\//, "")}`,
    redirectUrl: `${siteUrl}/${locale}/site-health-check/dank/${id}`,
    webhookUrl: `${siteUrl}/api/mollie/health-webhook`,
    metadata: { kind: "health_check", id, package: pkg },
  });
  if (!pay) return;
  await db
    .from("health_checks")
    .update({ mollie_payment_id: pay.id })
    .eq("id", id);

  redirect(pay.checkoutUrl);
}
