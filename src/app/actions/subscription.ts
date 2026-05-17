"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { supabaseConfigured, siteUrl } from "@/lib/supabase/config";
import {
  publishSetupCents,
  PUBLISH_BASE_MONTHLY_CENTS,
} from "@/lib/pricing";
import {
  mollieCreateCustomer,
  mollieFirstPayment,
  mollieCreateSubscription,
  mollieCancelSubscription,
} from "@/lib/mollie-sub";

async function authed(): Promise<string | null> {
  if (!supabaseConfigured) return null;
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.email ? user.email.toLowerCase() : null;
}

// Start het publiceer-abonnement: Mollie-klant + eerste betaling
// (€199 opstart, legt meteen het maandmandaat vast). Na betaling maakt
// de webhook het maandelijkse €39-abonnement aan en zet status actief.
export async function startPublishSubscription(
  formData: FormData,
): Promise<void> {
  const email = await authed();
  const locale = String(formData.get("locale") ?? "nl");
  const back = `/${locale}/portail/dashboard/builder`;
  if (!email) redirect(back);

  const admin = getSupabaseAdmin();

  // Al een actief abonnement? Niets te doen.
  const { data: existing } = await admin
    .from("subscriptions")
    .select("id, status, mollie_customer_id")
    .eq("client_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = existing as {
    id: string;
    status: string;
    mollie_customer_id: string | null;
  } | null;
  if (row?.status === "actief") redirect(`${back}?ok=live`);

  let customerId = row?.mollie_customer_id ?? null;
  if (!customerId) {
    customerId = await mollieCreateCustomer(email, email);
  }
  if (!customerId) redirect(`${back}?fout=mollie`);

  // Abonnementsrij klaarzetten (gepauzeerd tot betaling binnen is).
  if (row) {
    await admin
      .from("subscriptions")
      .update({
        mollie_customer_id: customerId,
        plan: "Website",
        price_cents: PUBLISH_BASE_MONTHLY_CENTS,
        status: "gepauzeerd",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  } else {
    await admin.from("subscriptions").insert({
      client_email: email,
      plan: "Website",
      price_cents: PUBLISH_BASE_MONTHLY_CENTS,
      currency: "EUR",
      period: "maand",
      status: "gepauzeerd",
      mollie_customer_id: customerId,
    });
  }

  const pay = await mollieFirstPayment({
    customerId: customerId!,
    amountCents: publishSetupCents(),
    description: "Website — opstart (incl. eerste maand-mandaat)",
    redirectUrl: `${siteUrl}/${locale}/portail/dashboard/builder?ok=betaald`,
    metadata: { sub_email: email },
  });
  if (!pay) redirect(`${back}?fout=mollie`);
  redirect(pay!.checkoutUrl);
}

export async function cancelPublishSubscription(
  formData: FormData,
): Promise<void> {
  const email = await authed();
  const locale = String(formData.get("locale") ?? "nl");
  const back = `/${locale}/portail/dashboard/builder`;
  if (!email) redirect(back);

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("subscriptions")
    .select("id, mollie_customer_id, mollie_subscription_id")
    .eq("client_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as {
    id: string;
    mollie_customer_id: string | null;
    mollie_subscription_id: string | null;
  } | null;
  if (row?.mollie_customer_id && row.mollie_subscription_id) {
    await mollieCancelSubscription(
      row.mollie_customer_id,
      row.mollie_subscription_id,
    );
  }
  if (row) {
    await admin
      .from("subscriptions")
      .update({ status: "gestopt", updated_at: new Date().toISOString() })
      .eq("id", row.id);
  }
  // Gepubliceerde sites offline halen zodra het abonnement stopt.
  await admin
    .from("builder_designs")
    .update({ published: false })
    .eq("client_email", email)
    .eq("published", true);
  redirect(`${back}?ok=gestopt`);
}

// Extra site bijkopen: extra €39/m-abonnement op dezelfde Mollie-klant
// (hergebruikt het bestaande mandaat — geen nieuwe opstartkost, geen
// betaalscherm). Verhoogt het aantal sites dat online mag.
export async function addExtraSite(formData: FormData): Promise<void> {
  const email = await authed();
  const locale = String(formData.get("locale") ?? "nl");
  const back = `/${locale}/portail/dashboard/builder`;
  if (!email) redirect(back);

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("subscriptions")
    .select("mollie_customer_id")
    .eq("client_email", email)
    .eq("status", "actief")
    .not("mollie_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const customerId =
    (data as { mollie_customer_id: string | null } | null)
      ?.mollie_customer_id ?? null;
  // Geen Mollie-klant/mandaat (bv. testrij of Mollie nog niet live)
  // → extra site kan pas zodra de betaalkoppeling actief is.
  if (!customerId) redirect(`${back}?fout=mollie`);

  const subId = await mollieCreateSubscription({
    customerId: customerId!,
    amountCents: PUBLISH_BASE_MONTHLY_CENTS,
    description: "Website — extra site (maandabonnement)",
    metadata: { sub_email: email },
  });
  if (!subId) redirect(`${back}?fout=mollie`);

  await admin.from("subscriptions").insert({
    client_email: email,
    plan: "Website (extra site)",
    price_cents: PUBLISH_BASE_MONTHLY_CENTS,
    currency: "EUR",
    period: "maand",
    status: "actief",
    setup_paid: true,
    mollie_customer_id: customerId,
    mollie_subscription_id: subId,
  });
  redirect(`${back}?ok=extra`);
}
