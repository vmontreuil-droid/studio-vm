"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  leadsConfigured,
  mollieConfigured,
  siteUrl,
} from "@/lib/supabase/config";
import { isEmail, sendMail } from "@/lib/monitor";
import { after } from "next/server";
import { scanAndStore } from "@/lib/scan-report";
import { createMolliePayment } from "@/lib/mollie";
import { checkVies } from "@/lib/vies";
import { ensurePortalUser } from "@/lib/portal-access";
import {
  offerCatalog,
  OFFER_INCLUDED,
  subscriptionTiers,
} from "@/lib/pricing";

export type QuoteState = { ok: true } | { ok: false; error: string };

export async function submitQuote(
  formData: FormData,
): Promise<QuoteState> {
  const s = (k: string) => String(formData.get(k) ?? "").trim();

  const name = s("name").slice(0, 120);
  const email = s("email").toLowerCase().slice(0, 160);
  const message = s("message").slice(0, 2000);
  const locale = s("locale") || "nl";
  const base = s("base").slice(0, 40);
  const plan = s("plan").slice(0, 40);
  const modules = s("modules")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 30);
  const estLow = Number(s("estLow")) || null;
  const estHigh = Number(s("estHigh")) || null;
  const monthly = Number(s("monthly")) || 0;

  const phone = s("phone").slice(0, 40);
  const company = s("company").slice(0, 160) || null;
  const address = s("address").slice(0, 240) || null;
  const vatNumber = s("vat_number").slice(0, 40) || null;

  if (!name) return { ok: false, error: "name" };
  if (!isEmail(email)) return { ok: false, error: "email" };
  if (!phone) return { ok: false, error: "phone" };

  const currentSite = s("currentSite");

  if (!leadsConfigured) return { ok: false, error: "not_configured" };

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("quotes")
    .insert({
      locale,
      name,
      email,
      phone,
      company,
      address,
      vat_number: vatNumber,
      message: message || null,
      base,
      modules,
      plan,
      est_low: estLow,
      est_high: estHigh,
      monthly,
    })
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "store" };

  // Gaf de bezoeker een huidige site mee → scan ná de response en het
  // resultaat bij déze aanvraag bewaren (geen mail).
  const quoteId = (data as { id?: string } | null)?.id;
  if (quoteId && currentSite) {
    after(() => scanAndStore(currentSite, quoteId));
  }

  const fmt = (n: number | null) =>
    n == null ? "—" : "€ " + n.toLocaleString("nl-BE");
  await sendMail("info@studio-vm.be", {
    subject: `Nieuwe offerte-aanvraag — ${name}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#111;line-height:1.6">
<h2 style="margin:0 0 12px">Nieuwe offerte-aanvraag</h2>
<p><strong>${name}</strong> · <a href="mailto:${email}">${email}</a></p>
<table style="border-collapse:collapse;font-size:14px;margin-top:8px">
<tr><td style="padding:3px 16px 3px 0;color:#666">Pakket</td><td>${base}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Modules</td><td>${modules.length ? modules.join(", ") : "—"}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Onderhoud</td><td>${plan}${monthly ? ` (${fmt(monthly)}/m)` : ""}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Richtprijs</td><td>${fmt(estLow)} – ${fmt(estHigh)}</td></tr>
</table>
${message ? `<p style="margin-top:14px;white-space:pre-wrap">${message.replace(/</g, "&lt;")}</p>` : ""}
<p style="margin-top:18px"><a href="${siteUrl}/admin/aanvragen" style="color:#b45309">Open in admin →</a></p>
</div>`,
  });

  return { ok: true };
}

export type VatLookup = {
  valid: boolean | null;
  name: string | null;
  address: string | null;
};

export async function lookupVat(vat: string): Promise<VatLookup> {
  const r = await checkVies(String(vat).slice(0, 40));
  if (!r) return { valid: null, name: null, address: null };
  return { valid: r.valid, name: r.name, address: r.address };
}

// --- Directe intake + 30% aanbetaling (offerte-configurator) ---

const TRANSFER_CENTS = 7500;
const REGISTER_CENTS = 3900;
const MAIL_ONE_CENTS = 500;
const MAIL_USER_CENTS = 600;
const DEPOSIT_RATE = 0.3;
const LOCKIN_DISCOUNT = 0.07;
const MIN_SPREAD = 75000;
const MIN_MONTHLY = 7500;
const TERMS = [0, 3, 6, 12, 24];

const cents = (c: number) => "€ " + (c / 100).toLocaleString("nl-BE");

export type StartOfferState =
  | { ok: true; pay: true; url: string }
  | { ok: true; pay: false }
  | { ok: false; error: string };

export async function startOffer(
  formData: FormData,
): Promise<StartOfferState> {
  const s = (k: string) => String(formData.get(k) ?? "").trim();

  // Honeypot
  if (s("website")) return { ok: true, pay: false };

  const name = s("name").slice(0, 120);
  const email = s("email").toLowerCase().slice(0, 160);
  if (!name) return { ok: false, error: "name" };
  if (!isEmail(email)) return { ok: false, error: "email" };

  const phone = s("phone").slice(0, 40);
  if (!phone) return { ok: false, error: "phone" };

  const locale = s("locale") || "nl";
  const company = s("company").slice(0, 160) || null;
  const address = s("address").slice(0, 240) || null;
  const vatNumber = s("vat_number").slice(0, 40) || null;
  const userMsg = s("message").slice(0, 2000);
  const currentSite = s("currentSite");

  // Server-side herberekening — nooit op door de client aangeleverde
  // bedragen vertrouwen.
  const { bases, addons } = offerCatalog();
  const subs = subscriptionTiers();

  const baseSlug = s("baseSlug");
  const base = bases.find((b) => b.slug === baseSlug);
  if (!base) return { ok: false, error: "base" };

  const subSlug = s("subSlug");
  const subTier = subs.find((x) => x.slug === subSlug);
  if (!subTier) return { ok: false, error: "sub" };

  const inc = OFFER_INCLUDED[baseSlug];
  const incNames = inc?.addons ?? [];
  const extraKeys = new Set(
    s("extras")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  );
  const paidExtras = addons.filter(
    (a) => extraKeys.has(a.key) && !incNames.includes(a.name),
  );

  const domain = (["connect", "register", "transfer"] as const).includes(
    s("domain") as "connect" | "register" | "transfer",
  )
    ? (s("domain") as "connect" | "register" | "transfer")
    : "connect";
  const mailKind = (["none", "one", "team"] as const).includes(
    s("mail") as "none" | "one" | "team",
  )
    ? (s("mail") as "none" | "one" | "team")
    : "none";
  const users = Math.min(50, Math.max(1, Number(s("users")) || 1));

  const eenmalig =
    base.cents +
    paidExtras.reduce((t, a) => t + a.cents, 0) +
    (domain === "transfer" ? TRANSFER_CENTS : 0);

  // Direct betalen = scope vastleggen → korting altijd van toepassing.
  const discount = Math.round(eenmalig * LOCKIN_DISCOUNT);
  const payable = eenmalig - discount;

  const projectDeposit = Math.round(payable * DEPOSIT_RATE);
  const domainYear = domain === "register" ? REGISTER_CENTS : 0;
  // Domein-jaar gaat mee in de aanbetaling (niet voorschieten,
  // niet korten — provider-passthrough).
  const deposit = projectDeposit + domainYear;
  const rest = payable - projectDeposit;

  let term = Number(s("term")) || 0;
  if (!TERMS.includes(term)) term = 0;
  let monthlyInstall = 0;
  if (term > 0) {
    const m = Math.ceil(rest / term);
    if (payable >= MIN_SPREAD && m >= MIN_MONTHLY) monthlyInstall = m;
    else term = 0;
  }

  const mailMonthly =
    mailKind === "one"
      ? MAIL_ONE_CENTS
      : mailKind === "team"
        ? MAIL_USER_CENTS * users
        : 0;
  // Domein zit in de aanbetaling (jaarlijks bij provider), niet in
  // de maandfactuur.
  const monthlyTotal = monthlyInstall + subTier.cents + mailMonthly;

  if (!leadsConfigured) return { ok: false, error: "not_configured" };

  const modules = [
    ...paidExtras.map((a) => a.name),
    `Domein: ${domain}`,
    `E-mail: ${mailKind}${mailKind === "team" ? ` ×${users}` : ""}`,
    term === 0 ? "Betaling: ineens (na aanbetaling)" : `Spreiding: ${term}×`,
    "Scope vastgelegd −7%",
  ];

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("quotes")
    .insert({
      locale,
      name,
      email,
      phone,
      company,
      address,
      vat_number: vatNumber,
      message: userMsg || null,
      base: baseSlug,
      modules,
      plan: subSlug,
      est_low: Math.round(payable / 100),
      est_high: Math.round(payable / 100),
      monthly: Math.round(monthlyTotal / 100),
      one_off_cents: eenmalig,
      discount_cents: discount,
      deposit_cents: deposit,
      term,
      monthly_install_cents: monthlyInstall,
      subscription_cents: subTier.cents,
      domain_kind: domain,
      domain_monthly_cents: 0,
      domain_year_cents: domainYear,
      mail_kind: mailKind,
      mail_users: mailKind === "team" ? users : null,
      mail_monthly_cents: mailMonthly,
      monthly_total_cents: monthlyTotal,
      lockin: true,
      deposit_status: "open",
      status: "nieuw",
      source: "offerte-configurator",
    })
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "store" };
  const quoteId = (data as { id?: string } | null)?.id;
  if (!quoteId) return { ok: false, error: "store" };

  if (quoteId && currentSite) {
    after(() => scanAndStore(currentSite, quoteId));
  }

  const breakdown = [
    `Pakket: ${base.name}`,
    paidExtras.length
      ? `Extra: ${paidExtras.map((a) => `${a.name} (${cents(a.cents)})`).join(", ")}`
      : "Extra: —",
    `Eenmalig: ${cents(eenmalig)} − vastlegkorting ${cents(discount)} = ${cents(payable)} (excl. btw)`,
    `Aanbetaling: ${cents(deposit)} — nu te betalen (30% project ${cents(projectDeposit)}${domainYear ? ` + domein 1 jaar ${cents(domainYear)}` : ""})`,
    term === 0
      ? `Saldo: ${cents(rest)} bij oplevering`
      : `Saldo: ${term}× ${cents(monthlyInstall)}/maand vanaf oplevering`,
    `Onderhoud: ${subTier.name} ${cents(subTier.cents)}/maand`,
    mailMonthly ? `E-mail: ${cents(mailMonthly)}/maand` : "E-mail: —",
    domainYear
      ? `Domein: ${domain} — ${cents(domainYear)} (1e jaar in aanbetaling, daarna jaarlijks)`
      : `Domein: ${domain}`,
    `Maandfactuur vanaf oplevering: ${cents(monthlyTotal)}/maand`,
  ];

  await sendMail("info@studio-vm.be", {
    subject: `Nieuwe vastlegging (30% aanbetaling) — ${name}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#111;line-height:1.6">
<h2 style="margin:0 0 12px">Klant legt vast & betaalt aanbetaling</h2>
<p><strong>${name}</strong>${company ? ` · ${company}` : ""} · <a href="mailto:${email}">${email}</a> · ${phone}${address ? `<br><span style="color:#666">${address.replace(/</g, "&lt;")}</span>` : ""}</p>
<table style="border-collapse:collapse;font-size:14px;margin-top:8px">
${breakdown.map((b) => `<tr><td style="padding:3px 0">${b.replace(/</g, "&lt;")}</td></tr>`).join("")}
</table>
${userMsg ? `<p style="margin-top:14px;white-space:pre-wrap">${userMsg.replace(/</g, "&lt;")}</p>` : ""}
<p style="margin-top:18px"><a href="${siteUrl}/admin/aanvragen" style="color:#b45309">Open in admin →</a></p>
</div>`,
  });

  // Direct in het klantportaal + als klant in de admin: portaaltoegang,
  // het gekozen abonnement en een offerte met de volledige samenstelling.
  try {
    await ensurePortalUser(email);

    const { data: subRow } = await db
      .from("subscriptions")
      .select("id")
      .eq("client_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const subPayload = {
      client_email: email,
      plan: subTier.name,
      price_cents: subTier.cents,
      status: "actief",
      updated_at: new Date().toISOString(),
    };
    if (subRow)
      await db
        .from("subscriptions")
        .update(subPayload)
        .eq("id", (subRow as { id: string }).id);
    else await db.from("subscriptions").insert(subPayload);

    await db.from("offers").insert({
      client_email: email,
      title: `Configurator — ${base.name}`,
      body: `Samenstelling via de online configurator:\n\n${breakdown.join("\n")}${userMsg ? `\n\nBericht van de klant:\n${userMsg}` : ""}`,
      amount_cents: payable,
      status: "open",
      valid_until: new Date(Date.now() + 14 * 86400000)
        .toISOString()
        .slice(0, 10),
    });
  } catch {
    // Niet-kritisch voor de aanvraag zelf — de quote staat sowieso
    // bewaard en is zichtbaar in /admin/aanvragen.
  }

  if (!mollieConfigured) {
    // Geen Mollie-sleutel: aanvraag staat geregistreerd, Vincent stuurt
    // handmatig de betaallink. Klant krijgt geen checkout.
    return { ok: true, pay: false };
  }

  const pay = await createMolliePayment({
    amountCents: deposit,
    description: `Aanbetaling 30% — Studio VM (${base.name})`,
    redirectUrl: `${siteUrl}/${locale}/offerte?betaald=1`,
    webhookUrl: `${siteUrl}/api/mollie/webhook`,
    metadata: { quote_id: quoteId },
  });
  if (!pay) return { ok: true, pay: false };

  await db
    .from("quotes")
    .update({ mollie_payment_id: pay.id })
    .eq("id", quoteId);

  return { ok: true, pay: true, url: pay.checkoutUrl };
}
