"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { createMolliePayment } from "@/lib/mollie";

export type HealthCheckPackage = "standard" | "premium";
export type CustomerType = "particulier" | "bedrijf";

const PRICES: Record<HealthCheckPackage, number> = {
  standard: 4900, // €49 — volledig automatisch, geen call
  premium: 9900, // €99 — incl. 30-min videocall met Vincent
};

// Trim + null voor lege strings; behoudt korte non-empty waarden.
function s(fd: FormData, key: string): string | null {
  const v = (fd.get(key) as string | null)?.trim();
  return v ? v : null;
}

export async function startHealthCheck(fd: FormData): Promise<void> {
  const name = s(fd, "name");
  const emailRaw = s(fd, "email") ?? "";
  const websiteRaw = s(fd, "website") ?? "";
  const locale = ((fd.get("locale") as string | null) || "nl").toLowerCase();
  const packageRaw = ((fd.get("package") as string | null) || "premium")
    .toLowerCase()
    .trim();
  const pkg: HealthCheckPackage =
    packageRaw === "standard" ? "standard" : "premium";
  const customerTypeRaw = ((fd.get("customer_type") as string | null) ||
    "particulier")
    .toLowerCase()
    .trim();
  const customerType: CustomerType =
    customerTypeRaw === "bedrijf" ? "bedrijf" : "particulier";

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

  // Voor B2B: bedrijfsnaam + btw-nr zijn vereist voor geldige factuur
  const companyName = s(fd, "company_name");
  const vatNumber = s(fd, "vat_number");
  if (customerType === "bedrijf" && (!companyName || !vatNumber)) {
    return;
  }

  const street = s(fd, "street");
  const postalCode = s(fd, "postal_code");
  const city = s(fd, "city");
  const country = s(fd, "country") ?? "BE";

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
      customer_type: customerType,
      company_name: companyName,
      vat_number: vatNumber,
      street,
      postal_code: postalCode,
      city,
      country,
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
