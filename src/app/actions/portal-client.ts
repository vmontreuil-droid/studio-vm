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

export async function upgradeSubscription(slug: string): Promise<void> {
  const email = await authedEmail();
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
  if (row) await db.from("subscriptions").update(payload).eq("id", row.id);
  else await db.from("subscriptions").insert(payload);

  await notifyStudio(`Abonnement-upgrade — ${email}`, [
    `<strong>${email}</strong> wijzigde zijn onderhoudsabonnement naar <strong>${tier.name}</strong> (€ ${(
      tier.cents / 100
    ).toFixed(2)}/maand).`,
    "De maandfactuur wordt vanaf nu op dit bedrag aangepast.",
  ]);
  await sendMail(email, {
    subject: `Je abonnement is nu ${tier.name}`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#111"><p style="margin:0 0 8px">Je onderhoudsabonnement is gewijzigd naar <strong>${tier.name}</strong> — € ${(
      tier.cents / 100
    ).toFixed(2)}/maand, meteen actief.</p><p style="margin:0 0 8px">Je maandelijkse factuur wordt vanaf de volgende periode op dit bedrag aangepast.</p></div>`,
  }).catch(() => {});

  revalidatePath("/[locale]/portail/dashboard", "page");
  return;
}
