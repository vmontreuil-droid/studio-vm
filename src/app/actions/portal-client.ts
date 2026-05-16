"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/monitor";

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
