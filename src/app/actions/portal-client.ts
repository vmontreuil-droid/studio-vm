"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  supabaseConfigured,
  mollieConfigured,
  siteUrl,
} from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/monitor";
import { createMolliePayment } from "@/lib/mollie";
import { subscriptionTiers } from "@/lib/pricing";

const STUDIO_INBOX = "hallo@studio-vm.be";

async function authedEmail() {
  if (!supabaseConfigured) return null;
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.email ? user.email.toLowerCase() : null;
}

function notifyStudio(subject: string, lines: string[]) {
  // Faalt stil: de actie van de klant mag nooit blokkeren op mail.
  return sendMail(STUDIO_INBOX, {
    subject,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#111">${lines
      .map((l) => `<p style="margin:0 0 8px">${l}</p>`)
      .join("")}</div>`,
  }).catch(() => {});
}

export async function decideOffer(
  id: string,
  decision: "akkoord" | "afgewezen",
): Promise<void> {
  const email = await authedEmail();
  if (!email) return;
  const sb = await getSupabaseServer();
  const { error } = await sb
    .from("offers")
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_email", email);
  if (error) return;
  await notifyStudio(`Offerte ${decision} — ${email}`, [
    `<strong>${email}</strong> heeft een offerte <strong>${decision}</strong>.`,
    `Offerte-id: ${id}`,
  ]);

  // Auto-factuur bij akkoord (eenmalig, idempotent via invoiced_at).
  if (decision === "akkoord") {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("offers")
      .select(
        "id, client_email, offer_no, title, amount_cents, invoiced_at",
      )
      .eq("id", id)
      .maybeSingle();
    const o = data as
      | {
          id: string;
          client_email: string;
          offer_no: string | null;
          title: string;
          amount_cents: number | null;
          invoiced_at: string | null;
        }
      | null;
    if (
      o &&
      o.client_email === email &&
      !o.invoiced_at &&
      (o.amount_cents ?? 0) > 0
    ) {
      const year = new Date().getFullYear();
      const { count } = await db
        .from("invoices")
        .select("id", { count: "exact", head: true });
      const invNo = `FAC-${year}-${String((count ?? 0) + 1).padStart(
        3,
        "0",
      )}`;
      const dueAt = new Date(Date.now() + 14 * 86400000)
        .toISOString()
        .slice(0, 10);
      const { error: invErr } = await db.from("invoices").insert({
        client_email: email,
        number: invNo,
        description: `${o.title}${o.offer_no ? ` (${o.offer_no})` : ""}`,
        amount_cents: o.amount_cents,
        status: "open",
        due_at: dueAt,
        offer_id: o.id,
      });
      if (!invErr) {
        await db
          .from("offers")
          .update({ invoiced_at: new Date().toISOString() })
          .eq("id", o.id);
        await sendMail(email, {
          subject: `Je factuur ${invNo} staat klaar`,
          html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#111"><p style="margin:0 0 8px">Bedankt voor je akkoord op <strong>${o.title}</strong>.</p><p style="margin:0 0 8px">Factuur <strong>${invNo}</strong> (€ ${(
            (o.amount_cents ?? 0) / 100
          ).toFixed(
            2,
          )}) staat klaar in je portaal, betaalbaar tegen ${dueAt}.</p></div>`,
        }).catch(() => {});
      }
    }
  }

  revalidatePath("/[locale]/portail/dashboard", "page");
  return;
}

export async function openTicket(
  formData: FormData,
): Promise<void> {
  const email = await authedEmail();
  if (!email) return;
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 160);
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  if (!subject || !body) return;

  const sb = await getSupabaseServer();
  const { data, error } = await sb
    .from("tickets")
    .insert({ client_email: email, subject })
    .select("id")
    .single();
  if (error || !data) return;
  await sb
    .from("ticket_messages")
    .insert({ ticket_id: data.id, sender: "klant", body });

  await notifyStudio(`Nieuw ticket — ${email}`, [
    `<strong>${email}</strong> opende een ticket: <strong>${subject}</strong>`,
    body.replace(/</g, "&lt;"),
  ]);
  revalidatePath("/[locale]/portail/dashboard", "page");
  return;
}

export async function replyTicket(
  formData: FormData,
): Promise<void> {
  const email = await authedEmail();
  if (!email) return;
  const ticketId = String(formData.get("ticket_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  if (!ticketId || !body) return;

  const sb = await getSupabaseServer();
  const { error } = await sb
    .from("ticket_messages")
    .insert({ ticket_id: ticketId, sender: "klant", body });
  if (error) return;
  // Heropen het ticket zodat het bij jou bovenaan komt.
  await getSupabaseAdmin()
    .from("tickets")
    .update({ status: "in_behandeling", updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("client_email", email);

  await notifyStudio(`Ticket-reactie — ${email}`, [
    `<strong>${email}</strong> reageerde op ticket ${ticketId}:`,
    body.replace(/</g, "&lt;"),
  ]);
  revalidatePath("/[locale]/portail/dashboard", "page");
  return;
}

export async function setNewsletter(on: boolean): Promise<void> {
  const email = await authedEmail();
  if (!email) return;
  const db = getSupabaseAdmin();
  if (on) {
    await db.from("newsletter_subscribers").upsert(
      {
        email,
        locale: "nl",
        source: "portaal",
        active: true,
        unsubscribed_at: null,
      },
      { onConflict: "email" },
    );
  } else {
    await db
      .from("newsletter_subscribers")
      .update({ active: false, unsubscribed_at: new Date().toISOString() })
      .eq("email", email);
  }
  revalidatePath("/[locale]/portail/dashboard", "page");
  return;
}

export async function payInvoice(id: string): Promise<void> {
  const email = await authedEmail();
  const facturen = `${siteUrl}/nl/portail/dashboard/facturen`;
  if (!email || !mollieConfigured) redirect(facturen);

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("invoices")
    .select("id, number, amount_cents, status")
    .eq("id", id)
    .maybeSingle();
  const inv = data as
    | { id: string; number: string; amount_cents: number; status: string }
    | null;
  if (!inv || inv.status === "betaald" || inv.amount_cents <= 0) {
    redirect(facturen);
  }

  const pay = await createMolliePayment({
    amountCents: inv!.amount_cents,
    description: `Factuur ${inv!.number} — Studio VM`,
    redirectUrl: facturen,
    webhookUrl: `${siteUrl}/api/mollie/webhook`,
    metadata: { invoice_id: inv!.id },
  });
  if (!pay) redirect(facturen);

  await getSupabaseAdmin()
    .from("invoices")
    .update({ mollie_payment_id: pay!.id })
    .eq("id", inv!.id);

  redirect(pay!.checkoutUrl);
}

export async function toggleChecklistItem(
  id: string,
  done: boolean,
): Promise<void> {
  const email = await authedEmail();
  if (!email) return;
  const sb = await getSupabaseServer();
  await sb
    .from("checklist_items")
    .update({ done })
    .eq("id", id)
    .eq("client_email", email);
  revalidatePath("/[locale]/portail/dashboard", "page");
  return;
}

export async function upgradeSubscription(
  slug: string,
  formData?: FormData,
): Promise<void> {
  const email = await authedEmail();
  if (!email) return;
  const tiers = subscriptionTiers();
  const tier = tiers.find((s) => s.slug === slug);
  if (!tier) return;
  const rawLoc = String(formData?.get("locale") ?? "nl");
  const loc: "nl" | "fr" | "en" =
    rawLoc === "fr" || rawLoc === "en" ? rawLoc : "nl";

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("subscriptions")
    .select("id, plan, price_cents")
    .eq("client_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = data as
    | { id: string; plan: string; price_cents: number }
    | null;
  const prevTier =
    tiers.find((tt) => tt.name === row?.plan) ??
    tiers.find((tt) => tt.cents === row?.price_cents);

  const payload = {
    client_email: email,
    plan: tier.name,
    price_cents: tier.cents,
    status: "actief",
    updated_at: new Date().toISOString(),
  };
  if (row) await db.from("subscriptions").update(payload).eq("id", row.id);
  else await db.from("subscriptions").insert(payload);

  const gained = tier.features.filter(
    (f) => !(prevTier?.features ?? []).includes(f),
  );
  const lost = (prevTier?.features ?? []).filter(
    (f) => !tier.features.includes(f),
  );
  const delta = tier.cents - (prevTier?.cents ?? 0);

  await notifyStudio(`Abonnement-wijziging — ${email}`, [
    `<strong>${email}</strong> wijzigde van <strong>${
      prevTier?.name ?? row?.plan ?? "—"
    }</strong> naar <strong>${tier.name}</strong> (€ ${(
      tier.cents / 100
    ).toFixed(2)}/maand).`,
    "De maandfactuur wordt vanaf de volgende periode aangepast.",
  ]);

  // Magic-link zodat de klant meteen in zijn portaal kan.
  let portalUrl = `${siteUrl}/${loc}/portail`;
  try {
    const gen = await db.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const hashed = gen.data?.properties?.hashed_token;
    if (!gen.error && hashed) {
      portalUrl = `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(
        hashed,
      )}&type=magiclink&next=${encodeURIComponent(
        `/${loc}/portail/dashboard/abonnement`,
      )}`;
    }
  } catch {
    /* val terug op portaal-login */
  }

  const eur = (c: number) =>
    "€ " +
    (c / 100).toLocaleString("nl-BE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const accent = "#e08214";
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const TR = {
    nl: {
      subject: `Je onderhoudsabonnement is nu ${tier.name}`,
      hi: "Dag,",
      intro: `Je hebt je onderhoudsabonnement gewijzigd van <strong>${
        prevTier?.name ?? "—"
      }</strong> naar <strong>${tier.name}</strong> — meteen actief. Je maandfactuur wordt vanaf de volgende periode aangepast.`,
      from: "Vorig",
      to: "Nieuw",
      deltaUp: "per maand méér",
      deltaDown: "per maand minder",
      deltaSame: "zelfde maandbedrag",
      gain: "Wat je erbij krijgt",
      lose: "Wat je verliest",
      none: "—",
      cta: "Open je klantenportaal",
      reassure:
        "Vragen? Antwoord gerust gewoon op deze mail — je krijgt mij, geen bot.",
      sign: "Tot snel,<br>Vincent — Studio VM",
      terms: `Onze <a href="${siteUrl}/${loc}/voorwaarden" style="color:${accent}">algemene voorwaarden</a> en <a href="${siteUrl}/${loc}/privacy" style="color:${accent}">privacyverklaring</a> blijven van toepassing.`,
    },
    fr: {
      subject: `Votre abonnement de maintenance est maintenant ${tier.name}`,
      hi: "Bonjour,",
      intro: `Vous avez changé votre abonnement de maintenance de <strong>${
        prevTier?.name ?? "—"
      }</strong> à <strong>${tier.name}</strong> — actif immédiatement. Votre facture mensuelle est adaptée dès la période suivante.`,
      from: "Ancien",
      to: "Nouveau",
      deltaUp: "de plus par mois",
      deltaDown: "de moins par mois",
      deltaSame: "même montant mensuel",
      gain: "Ce que vous gagnez",
      lose: "Ce que vous perdez",
      none: "—",
      cta: "Ouvrir votre espace client",
      reassure:
        "Une question ? Répondez simplement à cet e-mail — vous m'avez, moi, pas un bot.",
      sign: "À bientôt,<br>Vincent — Studio VM",
      terms: `Nos <a href="${siteUrl}/${loc}/voorwaarden" style="color:${accent}">conditions générales</a> et notre <a href="${siteUrl}/${loc}/privacy" style="color:${accent}">politique de confidentialité</a> restent d'application.`,
    },
    en: {
      subject: `Your maintenance subscription is now ${tier.name}`,
      hi: "Hi,",
      intro: `You changed your maintenance subscription from <strong>${
        prevTier?.name ?? "—"
      }</strong> to <strong>${tier.name}</strong> — effective immediately. Your monthly invoice adjusts from the next period.`,
      from: "Previous",
      to: "New",
      deltaUp: "more per month",
      deltaDown: "less per month",
      deltaSame: "same monthly amount",
      gain: "What you gain",
      lose: "What you lose",
      none: "—",
      cta: "Open your client portal",
      reassure:
        "A question? Just reply to this email — you get me, not a bot.",
      sign: "Talk soon,<br>Vincent — Studio VM",
      terms: `Our <a href="${siteUrl}/${loc}/voorwaarden" style="color:${accent}">general terms</a> and <a href="${siteUrl}/${loc}/privacy" style="color:${accent}">privacy policy</a> still apply.`,
    },
  }[loc];

  const list = (items: string[]) =>
    items.length
      ? `<ul style="margin:8px 0 0;padding-left:18px;font:400 14px/1.6 ${font};color:#44403c">${items
          .map((f) => `<li style="margin:0 0 4px">${f}</li>`)
          .join("")}</ul>`
      : `<p style="margin:8px 0 0;font:400 14px/1.6 ${font};color:#78716c">${TR.none}</p>`;
  const deltaTxt =
    delta === 0
      ? TR.deltaSame
      : `${eur(Math.abs(delta))} ${delta > 0 ? TR.deltaUp : TR.deltaDown}`;

  await sendMail(email, {
    subject: TR.subject,
    html: `<!DOCTYPE html><html lang="${loc}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-collapse:collapse"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;border-collapse:collapse">
  <tr><td style="background:#ffffff;border:1px solid #e7e5e4;box-shadow:0 1px 3px rgba(0,0,0,0.06);padding:40px 38px">
    <p style="margin:0 0 26px;font:800 66px/1 ${font};letter-spacing:-4px;color:#1c1917">vm<span style="color:${accent}">.</span></p>
    <p style="margin:0 0 6px;font:700 13px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:${accent}">${TR.subject}</p>
    <h1 style="margin:10px 0 14px;font:700 22px/1.3 ${font};color:#1c1917">${TR.hi}</h1>
    <p style="margin:0 0 24px;font:400 15px/1.65 ${font};color:#44403c">${TR.intro}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td style="background:#fafaf9;border:1px solid #e7e5e4;padding:18px 22px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tbody>
        <tr><td style="padding:6px 18px 6px 0;font:400 13px/1.5 ${font};color:#78716c">${TR.from}</td><td style="padding:6px 0;font:600 14px/1.5 ${font};color:#1c1917">${prevTier?.name ?? "—"} · ${eur(prevTier?.cents ?? 0)}</td></tr>
        <tr><td style="padding:6px 18px 6px 0;font:400 13px/1.5 ${font};color:#78716c">${TR.to}</td><td style="padding:6px 0;font:700 14px/1.5 ${font};color:#1c1917">${tier.name} · ${eur(tier.cents)}</td></tr>
        <tr><td style="padding:6px 18px 6px 0;font:400 13px/1.5 ${font};color:#78716c">Δ</td><td style="padding:6px 0;font:600 14px/1.5 ${font};color:${accent}">${deltaTxt}</td></tr>
      </tbody></table>
    </td></tr></table>
    <p style="margin:24px 0 0;font:700 12px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#16a34a">+ ${TR.gain}</p>${list(gained)}
    <p style="margin:20px 0 0;font:700 12px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#dc2626">− ${TR.lose}</p>${list(lost)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;border-collapse:separate"><tr><td bgcolor="${accent}" style="background:${accent}"><a href="${portalUrl}" style="display:inline-block;padding:14px 28px;font:700 14px/1 ${font};color:#ffffff;text-decoration:none">${TR.cta} &nbsp;→</a></td></tr></table>
    <p style="margin:24px 0 0;font:400 14px/1.65 ${font};color:#44403c">${TR.reassure}</p>
    <p style="margin:22px 0 0;font:400 15px/1.6 ${font};color:#1c1917">${TR.sign}</p>
    <p style="margin:24px 0 0;padding-top:18px;border-top:1px solid #e7e5e4;font:400 12px/1.6 ${font};color:#78716c">${TR.terms}</p>
  </td></tr>
  <tr><td style="padding:20px 4px 0;text-align:center;font:400 11px/1.6 ${font};color:#57534e">Studio VM · Vincent Montreuil · Nieuwpoortstraat 14-301, 8570 Anzegem · info@studio-vm.be · BE 0672.960.066</td></tr>
</table></td></tr></table></body></html>`,
  }).catch(() => {});

  revalidatePath("/[locale]/portail/dashboard", "page");
  return;
}

export async function deleteOwnDocument(id: string): Promise<void> {
  const email = await authedEmail();
  if (!email || !id) return;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("documents")
    .select("id, url, client_email, uploaded_by")
    .eq("id", id)
    .maybeSingle();
  const doc = data as
    | {
        id: string;
        url: string;
        client_email: string;
        uploaded_by: string;
      }
    | null;
  // Klant mag enkel zijn eigen, zelf-geüploade documenten verwijderen.
  if (!doc || doc.client_email !== email || doc.uploaded_by !== "klant") {
    return;
  }
  if (doc.url && !/^https?:\/\//i.test(doc.url)) {
    await db.storage.from("client-docs").remove([doc.url]);
  }
  await db.from("documents").delete().eq("id", id);
  revalidatePath("/[locale]/portail/dashboard", "page");
  return;
}
