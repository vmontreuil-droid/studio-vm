"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { sendMail } from "@/lib/monitor";
import { ensurePortalUser, deletePortalUser } from "@/lib/portal-access";
import {
  offerCatalog,
  OFFER_INCLUDED,
  subscriptionTiers,
  subscriptionCents,
} from "@/lib/pricing";
import { checkVies } from "@/lib/vies";
import { portalEmailHtml, offerPreviewHtml } from "@/lib/email";
import { randomBytes } from "crypto";
import { runScan } from "@/app/actions/scan";

async function guard(): Promise<boolean> {
  return await requireAdmin();
}

async function clientLocale(email: string): Promise<string> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("scan_requests")
      .select("locale")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const loc = (data as { locale?: string } | null)?.locale;
    return loc && ["nl", "fr", "en"].includes(loc) ? loc : "nl";
  } catch {
    return "nl";
  }
}

const SUBJECT: Record<string, Record<string, string>> = {
  offer: {
    nl: "Er staat een offerte voor je klaar",
    fr: "Un devis vous attend",
    en: "A quote is waiting for you",
  },
  invoice: {
    nl: "Nieuwe factuur in je portaal",
    fr: "Nouvelle facture dans votre portail",
    en: "New invoice in your portal",
  },
  subscription: {
    nl: "Je abonnement is bijgewerkt",
    fr: "Votre abonnement a été mis à jour",
    en: "Your subscription was updated",
  },
  ticket: {
    nl: "Antwoord op je ticket",
    fr: "Réponse à votre ticket",
    en: "Reply to your ticket",
  },
  site: {
    nl: "Update over je website",
    fr: "Mise à jour de votre site",
    en: "Update on your website",
  },
  progress: {
    nl: "Voortgang van je project",
    fr: "Avancement de votre projet",
    en: "Your project progress",
  },
  document: {
    nl: "Nieuw document in je portaal",
    fr: "Nouveau document dans votre portail",
    en: "New document in your portal",
  },
};

const CTA: Record<string, string> = {
  nl: "Open je klantenportaal",
  fr: "Ouvrir votre portail client",
  en: "Open your client portal",
};

async function notifyClient(
  email: string,
  kind:
    | "offer"
    | "invoice"
    | "subscription"
    | "ticket"
    | "site"
    | "progress"
    | "document",
  bodyLines: string[],
  extraHtml?: string,
  targetPath?: string,
) {
  const locale = await clientLocale(email);
  const subject = SUBJECT[kind][locale] ?? SUBJECT[kind].nl;
  const portalBase = `${siteUrl}/${locale}/portail`;
  const portalUrl = targetPath
    ? `${portalBase}?next=${encodeURIComponent(
        `/${locale}/portail/${targetPath}`,
      )}`
    : portalBase;
  const eyebrow =
    { nl: "Je klantenportaal", fr: "Votre portail client", en: "Your client portal" }[
      locale
    ] ?? "Je klantenportaal";
  const signin =
    {
      nl: "Log in met je e-mailadres — je krijgt een veilige login-link, geen wachtwoord nodig.",
      fr: "Connectez-vous avec votre e-mail — vous recevez un lien sécurisé, sans mot de passe.",
      en: "Sign in with your email — you get a secure login link, no password needed.",
    }[locale] ??
    "Log in met je e-mailadres — je krijgt een veilige login-link, geen wachtwoord nodig.";
  await sendMail(email, {
    subject,
    html: portalEmailHtml({
      locale,
      eyebrow,
      title: subject,
      bodyLines,
      ctaLabel: CTA[locale] ?? CTA.nl,
      ctaHref: portalUrl,
      footnote: signin,
      extraHtml,
    }),
  }).catch(() => {});
}

function cents(v: FormDataEntryValue | null): number {
  const n = Math.round(parseFloat(String(v ?? "").replace(",", ".")) * 100);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function createOffer(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const title =
    String(formData.get("title") ?? "").trim().slice(0, 200) || "Offerte";
  const body = String(formData.get("body") ?? "").trim().slice(0, 8000);
  const internalNote = String(formData.get("internal_note") ?? "")
    .trim()
    .slice(0, 4000);
  const clientName = String(formData.get("client_name") ?? "")
    .trim()
    .slice(0, 160);
  const clientCompany = String(formData.get("client_company") ?? "")
    .trim()
    .slice(0, 160);
  const clientAddress = String(formData.get("client_address") ?? "")
    .trim()
    .slice(0, 400);
  const vatRaw = String(formData.get("vat_number") ?? "")
    .trim()
    .slice(0, 32);
  const validDays = [7, 14, 30].includes(
    Number(formData.get("valid_days")),
  )
    ? Number(formData.get("valid_days"))
    : 7;
  if (!email) return;

  const db = getSupabaseAdmin();
  const { bases, addons, subs } = offerCatalog();
  const picked: {
    label: string;
    desc: string;
    cents: number;
    kind?: "incl" | "sub";
  }[] = [];
  const baseKey = String(formData.get("base") ?? "");
  const base = bases.find((b) => b.key === baseKey);
  const inc = base?.slug ? OFFER_INCLUDED[base.slug] : undefined;
  let paid = 0;
  if (base) {
    picked.push({ label: base.name, desc: "Basispakket", cents: base.cents });
    paid += base.cents;
  }
  // Inbegrepen opties → € 0-lijnen.
  if (inc) {
    for (const name of inc.addons) {
      const a = addons.find((x) => x.name === name);
      if (a)
        picked.push({
          label: `${a.name} (inbegrepen)`,
          desc: a.desc ?? "",
          cents: 0,
          kind: "incl",
        });
    }
  }
  // Abonnement: expliciete keuze in het formulier wint; anders het
  // bij het pakket inbegrepen abonnement.
  const subSlug = String(formData.get("sub") ?? "").trim();
  const sub =
    subs.find((x) => x.slug === subSlug) ??
    (inc ? subs.find((x) => x.slug === inc.sub) : undefined);
  if (sub)
    picked.push({
      label: `${sub.name} — verplicht · 1 jaar minimum, daarna jaarlijks stilzwijgend verlengd`,
      desc: sub.desc ?? "",
      cents: 0,
      kind: "sub",
    });
  // Extra aangevinkte opties die NIET al inbegrepen zijn → betalend.
  for (const k of formData.getAll("addon").map(String)) {
    const a = addons.find((x) => x.key === k);
    if (!a) continue;
    if (inc && inc.addons.includes(a.name)) continue;
    picked.push({ label: a.name, desc: a.desc ?? "", cents: a.cents });
    paid += a.cents;
  }
  // Directe ondertekening: 7% vastlegkorting + 30% aanbetaling
  // (zelfde model als op de website).
  const lockin = String(formData.get("lockin") ?? "") === "1";
  const gross = paid;
  const lockinDiscount = lockin ? Math.round(gross * 0.07) : 0;
  if (lockin && lockinDiscount > 0) {
    picked.push({
      label: "Vastlegkorting — directe ondertekening (−7%)",
      desc: "Scope ligt vast bij meteen tekenen + 30% aanbetaling.",
      cents: -lockinDiscount,
    });
  }
  const override = cents(formData.get("amount"));
  const amount =
    override > 0 ? override : Math.max(0, gross - lockinDiscount);

  // BTW-controle via VIES (faalt nooit de opslag).
  let vatValid: boolean | null = null;
  let vatName: string | null = null;
  let vatReverse = false;
  if (vatRaw) {
    const v = await checkVies(vatRaw);
    if (v) {
      vatValid = v.valid;
      vatName = v.name;
      vatReverse = v.valid === true && v.country !== "BE";
    }
  }

  const validUntil = new Date(Date.now() + validDays * 86400000)
    .toISOString()
    .slice(0, 10);

  // De vastleg-/betaal- én domein/e-mail-voorwaarden staan NIET
  // meer in de vrije klanttekst — die worden contextueel onder de
  // bedragen in het offertedocument getoond (zie portaal). De
  // klanttekst blijft dus zuiver de eigen toelichting.
  const finalBody = body;

  // Offertenummer OFF-{jaar}-{volgnr}
  const year = new Date().getFullYear();
  const { count } = await db
    .from("offers")
    .select("id", { count: "exact", head: true });
  const offerNo = `OFF-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { error } = await db.from("offers").insert({
    client_email: email,
    offer_no: offerNo,
    title,
    body: finalBody || null,
    items: picked,
    amount_cents: amount || null,
    valid_days: validDays,
    valid_until: validUntil,
    internal_note: internalNote || null,
    client_name: clientName || null,
    client_company: clientCompany || null,
    client_address: clientAddress || null,
    vat_number: vatRaw || null,
    vat_valid: vatValid,
    vat_name: vatName,
    vat_reverse: vatReverse,
  });
  if (error) return;
  await ensurePortalUser(email);
  const greet = clientName
    ? `Beste ${clientName.split(/\s+/)[0]},`
    : "Beste,";
  const includes = picked
    .filter((it) => it.cents >= 0 && it.kind !== "sub")
    .map((it) => it.label.replace(/\s*\(inbegrepen\)\s*$/i, ""));
  const subMonthly = sub ? subscriptionCents(sub.slug ?? "") : 0;
  const preview = offerPreviewHtml({
    offerNo,
    amountExclCents: amount || 0,
    vatReverse,
    validUntil,
    includes,
    subLabel: sub
      ? `${sub.name} — 1 jaar min., daarna jaarlijks stilzwijgend verlengd`
      : null,
    subMonthlyCents: subMonthly,
    discountCents: lockin ? lockinDiscount : 0,
    freeMonthsCents: lockin && subMonthly ? subMonthly * 2 : 0,
  });
  await notifyClient(
    email,
    "offer",
    [
      greet,
      `Hierbij je persoonlijke voorstel voor <strong>${title}</strong>. Hieronder vind je alvast het overzicht — bekijk het rustig, je beslist zelf en op je eigen tempo.`,
      `In je portaal zie je de volledige offerte met alle details. Aanvaarden of afwijzen kan met één klik — geen verplichting, geen haast.`,
    ],
    preview,
    "dashboard/offertes",
  );
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function resendOffer(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { data } = await getSupabaseAdmin()
    .from("offers")
    .select(
      "client_email, offer_no, title, amount_cents, valid_until, items, vat_reverse, client_name",
    )
    .eq("id", id)
    .maybeSingle();
  const o = data as {
    client_email: string;
    offer_no: string | null;
    title: string;
    amount_cents: number | null;
    valid_until: string | null;
    items: { label: string; cents: number; kind?: string }[] | null;
    vat_reverse: boolean | null;
    client_name: string | null;
  } | null;
  if (!o?.client_email) return;
  await ensurePortalUser(o.client_email);
  const its = Array.isArray(o.items) ? o.items : [];
  const subItem = its.find((it) => it.kind === "sub");
  const subTier = subItem
    ? subscriptionTiers().find((t) =>
        subItem.label.toLowerCase().includes(t.name.toLowerCase()),
      )
    : undefined;
  const discCents = its.reduce(
    (s, it) => (it.cents < 0 ? s - it.cents : s),
    0,
  );
  const preview = offerPreviewHtml({
    offerNo: o.offer_no,
    amountExclCents: o.amount_cents ?? 0,
    vatReverse: !!o.vat_reverse,
    validUntil: o.valid_until,
    includes: its
      .filter((it) => it.cents >= 0 && it.kind !== "sub")
      .map((it) => it.label.replace(/\s*\(inbegrepen\)\s*$/i, "")),
    subLabel: subTier
      ? `${subTier.name} — 1 jaar min., daarna jaarlijks stilzwijgend verlengd`
      : subItem
        ? subItem.label
        : null,
    subMonthlyCents: subTier ? subTier.cents : 0,
    discountCents: discCents,
    freeMonthsCents: discCents > 0 && subTier ? subTier.cents * 2 : 0,
  });
  const greet = o.client_name
    ? `Beste ${o.client_name.split(/\s+/)[0]},`
    : "Beste,";
  await notifyClient(
    o.client_email,
    "offer",
    [
      greet,
      `Hierbij (opnieuw) je persoonlijke voorstel voor <strong>${o.title}</strong>. Hieronder het overzicht — bekijk het rustig, je beslist zelf en op je eigen tempo.`,
      `In je portaal zie je de volledige offerte. Aanvaarden of afwijzen kan met één klik — geen verplichting, geen haast.`,
    ],
    preview,
    "dashboard/offertes",
  );
  revalidatePath("/admin/klanten", "layout");
  revalidatePath("/admin/offertes");
}

export async function deleteOffer(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("offers").delete().eq("id", id);
  revalidatePath("/admin/offertes");
  revalidatePath("/admin/klanten", "layout");
}

export async function setOfferStatus(
  id: string,
  status: "open" | "akkoord" | "afgewezen",
): Promise<void> {
  if (!(await guard())) return;
  const { error } = await getSupabaseAdmin()
    .from("offers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return;
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function addInvoice(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const number = String(formData.get("number") ?? "").trim().slice(0, 60);
  const description = String(formData.get("description") ?? "")
    .trim()
    .slice(0, 300);
  const amount = cents(formData.get("amount"));
  const dueAt = String(formData.get("due_at") ?? "").trim();
  if (!email || !number) return;

  const { error } = await getSupabaseAdmin().from("invoices").insert({
    client_email: email,
    number,
    description: description || null,
    amount_cents: amount,
    due_at: dueAt || null,
  });
  if (error) return;
  await ensurePortalUser(email);
  await notifyClient(email, "invoice", [
    `Er staat een nieuwe factuur klaar: <strong>${number}</strong> — € ${(
      amount / 100
    ).toFixed(2)}.`,
    "Je vindt 'm terug in je portaal.",
  ]);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function setInvoiceStatus(
  id: string,
  status: "open" | "betaald" | "vervallen",
): Promise<void> {
  if (!(await guard())) return;
  const { error } = await getSupabaseAdmin()
    .from("invoices")
    .update({ status })
    .eq("id", id);
  if (error) return;
  revalidatePath("/admin/klanten", "layout");
  return;
}

// Eén klik: bestaande klant 'insteken' als website-klant — portaal-
// toegang + het gekozen abonnement (prijs uit pricing.ts), zodat het
// meteen in zijn portaal staat.
export async function activateWebsiteClient(
  formData: FormData,
): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const slug = String(formData.get("plan") ?? "").trim();
  if (!email) return;
  const tier = subscriptionTiers().find((s) => s.slug === slug);
  if (!tier) return;

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("subscriptions")
    .select("id")
    .eq("client_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as { id: string } | null;
  const payload = {
    client_email: email,
    plan: tier.name,
    price_cents: tier.cents,
    status: "actief",
    updated_at: new Date().toISOString(),
  };
  const { error } = row
    ? await db.from("subscriptions").update(payload).eq("id", row.id)
    : await db.from("subscriptions").insert(payload);
  if (error) return;

  await ensurePortalUser(email);
  await notifyClient(email, "subscription", [
    `Je bent geactiveerd als klant van Studio VM met het abonnement <strong>${tier.name}</strong> — € ${(
      tier.cents / 100
    ).toFixed(2)} / maand. Je portaal staat klaar.`,
  ]);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function setSubscription(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const plan = String(formData.get("plan") ?? "").trim().slice(0, 80);
  const price = cents(formData.get("price"));
  const status = String(formData.get("status") ?? "actief");
  const id = String(formData.get("id") ?? "");
  if (!email || !plan) return;
  const st = ["actief", "gepauzeerd", "gestopt"].includes(status)
    ? status
    : "actief";

  const db = getSupabaseAdmin();
  const payload = {
    client_email: email,
    plan,
    price_cents: price,
    status: st,
    updated_at: new Date().toISOString(),
  };
  const { error } = id
    ? await db.from("subscriptions").update(payload).eq("id", id)
    : await db.from("subscriptions").insert(payload);
  if (error) return;
  await ensurePortalUser(email);
  await notifyClient(email, "subscription", [
    `Je abonnement is bijgewerkt: <strong>${plan}</strong> — € ${(
      price / 100
    ).toFixed(2)} / maand (${st}).`,
  ]);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function replyTicketStudio(
  formData: FormData,
): Promise<void> {
  if (!(await guard())) return;
  const ticketId = String(formData.get("ticket_id") ?? "");
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const body = String(formData.get("body") ?? "").trim().slice(0, 8000);
  if (!ticketId || !body || !email) return;

  const db = getSupabaseAdmin();
  const { error } = await db
    .from("ticket_messages")
    .insert({ ticket_id: ticketId, sender: "studio", body });
  if (error) return;
  await db
    .from("tickets")
    .update({ status: "in_behandeling", updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  await notifyClient(email, "ticket", [
    "Er is een antwoord op je ticket.",
    body.replace(/</g, "&lt;").slice(0, 300),
  ]);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function setTicketStatus(
  id: string,
  status: "open" | "in_behandeling" | "gesloten",
): Promise<void> {
  if (!(await guard())) return;
  const { error } = await getSupabaseAdmin()
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return;
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function addSite(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 160);
  const urlRaw = String(formData.get("url") ?? "").trim().slice(0, 300);
  const url = urlRaw
    ? /^https?:\/\//i.test(urlRaw)
      ? urlRaw
      : `https://${urlRaw}`
    : null;
  const status = String(formData.get("status") ?? "in_aanbouw");
  const st = ["in_aanbouw", "online", "onderhoud", "offline"].includes(status)
    ? status
    : "in_aanbouw";
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
  if (!email || !name) return;

  const { error } = await getSupabaseAdmin().from("sites").insert({
    client_email: email,
    name,
    url,
    status: st,
    notes: notes || null,
    last_deploy: new Date().toISOString().slice(0, 10),
  });
  if (error) return;
  await ensurePortalUser(email);
  await notifyClient(email, "site", [
    `Je website <strong>${name}</strong> staat in je portaal${
      url ? ` — ${url}` : ""
    }.`,
  ]);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function setSiteStatus(
  id: string,
  status: "in_aanbouw" | "online" | "onderhoud" | "offline",
): Promise<void> {
  if (!(await guard())) return;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("sites")
    .select("client_email, name")
    .eq("id", id)
    .maybeSingle();
  const { error } = await db
    .from("sites")
    .update({
      status,
      last_deploy: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return;
  const row = data as { client_email?: string; name?: string } | null;
  if (row?.client_email) {
    await notifyClient(row.client_email, "site", [
      `Status van je website <strong>${row.name ?? ""}</strong>: <strong>${status}</strong>.`,
    ]);
  }
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function addClient(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  await ensurePortalUser(email);
  revalidatePath("/admin/klanten", "layout");
  redirect(`/admin/klanten/${encodeURIComponent(email)}`);
}

export async function setProgress(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const step = String(formData.get("step") ?? "briefing");
  const valid = ["briefing", "ontwerp", "bouw", "online", "nazorg"];
  const st = valid.includes(step) ? step : "briefing";
  const note = String(formData.get("note") ?? "").trim().slice(0, 4000);
  if (!email) return;
  const { error } = await getSupabaseAdmin()
    .from("project_progress")
    .upsert(
      {
        client_email: email,
        step: st,
        note: note || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_email" },
    );
  if (error) return;
  await ensurePortalUser(email);
  await notifyClient(email, "progress", [
    `Je project staat nu op: <strong>${st}</strong>.`,
  ]);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function addChecklistItem(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const label = String(formData.get("label") ?? "").trim().slice(0, 300);
  if (!email || !label) return;
  await getSupabaseAdmin()
    .from("checklist_items")
    .insert({ client_email: email, label });
  await ensurePortalUser(email);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  if (!(await guard())) return;
  await getSupabaseAdmin().from("checklist_items").delete().eq("id", id);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function addDocument(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const urlRaw = String(formData.get("url") ?? "").trim().slice(0, 600);
  const kind = String(formData.get("kind") ?? "document")
    .trim()
    .slice(0, 40);
  const url =
    urlRaw && /^https?:\/\//i.test(urlRaw) ? urlRaw : `https://${urlRaw}`;
  if (!email || !name || !urlRaw) return;
  await getSupabaseAdmin()
    .from("documents")
    .insert({ client_email: email, name, url, kind: kind || "document" });
  await ensurePortalUser(email);
  await notifyClient(email, "document", [
    `Er staat een nieuw document voor je klaar: <strong>${name}</strong>.`,
  ]);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function deleteDocument(id: string): Promise<void> {
  if (!(await guard())) return;
  await getSupabaseAdmin().from("documents").delete().eq("id", id);
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function setDomain(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("site_id") ?? "");
  if (!id) return;
  const val = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v ? v.slice(0, 200) : null;
  };
  const { error } = await getSupabaseAdmin()
    .from("sites")
    .update({
      domain: val("domain"),
      registrar: val("registrar"),
      domain_renewal: val("domain_renewal"),
      hosting: val("hosting"),
      dns_note: val("dns_note"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return;
  revalidatePath("/admin/klanten", "layout");
  return;
}

export async function deleteClient(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase();
  const confirm = String(formData.get("confirm") ?? "")
    .trim()
    .toLowerCase();
  // Bevestiging: getypt adres moet exact kloppen.
  if (!email || confirm !== email) {
    redirect(`/admin/klanten/${encodeURIComponent(email)}?tab=overzicht`);
  }

  const db = getSupabaseAdmin();
  // Tabellen met client_email
  for (const table of [
    "offers",
    "invoices",
    "subscriptions",
    "tickets",
    "sites",
    "documents",
    "checklist_items",
    "project_progress",
  ]) {
    try {
      await db.from(table).delete().eq("client_email", email);
    } catch {
      // doorgaan: best effort
    }
  }
  // Tabellen met kolom 'email'
  for (const table of ["scan_requests", "newsletter_subscribers"]) {
    try {
      await db.from(table).delete().eq("email", email);
    } catch {
      // doorgaan
    }
  }
  // Portaaltoegang intrekken
  await deletePortalUser(email);

  revalidatePath("/admin/klanten", "layout");
  redirect("/admin/klanten");
}

// ---------- Formulier-inzendingen (van gepubliceerde klantsites) ----------

export async function setFormRead(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const read = String(formData.get("read") ?? "") === "1";
  await getSupabaseAdmin()
    .from("form_submissions")
    .update({ is_read: read })
    .eq("id", id);
  revalidatePath("/admin/formulieren");
  revalidatePath("/admin/klanten", "layout");
}

export async function deleteFormSubmission(
  formData: FormData,
): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("form_submissions").delete().eq("id", id);
  revalidatePath("/admin/formulieren");
}

// ---------- Builder-ontwerpen (admin-zijde, service-role) ----------

export async function adminUnpublishDesign(
  formData: FormData,
): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin()
    .from("builder_designs")
    .update({ published: false, published_at: null })
    .eq("id", id);
  revalidatePath("/admin/designs");
}

export async function adminDeleteDesign(
  formData: FormData,
): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("builder_designs").delete().eq("id", id);
  revalidatePath("/admin/designs");
}

// Scant een site en koppelt de analyse aan een klant, ZONDER de
// klant te mailen. Bewust geen sendPortalMail / nieuwsbrief: jij
// beslist zelf wanneer (en of) de klant iets ontvangt. De scan
// verschijnt in /admin/scans én in het klantportaal van die mail.
export async function addClientScan(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const email = String(formData.get("client_email") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 160);
  let url = String(formData.get("url") ?? "").trim().slice(0, 300);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !url) return;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  let scan: Awaited<ReturnType<typeof runScan>>;
  try {
    scan = await runScan(url);
  } catch {
    return;
  }
  if (!scan || !scan.ok) return;

  await getSupabaseAdmin()
    .from("scan_requests")
    .insert({
      token: randomBytes(24).toString("base64url"),
      email,
      url: scan.finalUrl || url,
      locale: "nl",
      scan,
    });
  await ensurePortalUser(email);
  revalidatePath("/admin/scans");
  revalidatePath(`/admin/klanten/${encodeURIComponent(email)}`);
}
