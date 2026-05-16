"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { sendMail } from "@/lib/monitor";
import { ensurePortalUser } from "@/lib/portal-access";

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
};

const CTA: Record<string, string> = {
  nl: "Open je klantenportaal",
  fr: "Ouvrir votre portail client",
  en: "Open your client portal",
};

async function notifyClient(
  email: string,
  kind: "offer" | "invoice" | "subscription" | "ticket" | "site",
  bodyLines: string[],
) {
  const locale = await clientLocale(email);
  const subject = SUBJECT[kind][locale] ?? SUBJECT[kind].nl;
  const portalUrl = `${siteUrl}/${locale}/portail`;
  const accent = "#e08214";
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  await sendMail(email, {
    subject,
    html: `<!DOCTYPE html><html><body style="margin:0;background:#0c0a09">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;border-collapse:collapse"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;border-collapse:collapse">
  <tr><td style="padding:0 4px 18px;font:700 14px/1 ui-monospace,monospace;letter-spacing:.22em;text-transform:uppercase;color:${accent}">STUDIO&nbsp;VM<span style="color:${accent}">.</span></td></tr>
  <tr><td style="background:#161210;border:1px solid #2c2521;border-radius:18px;padding:30px">
    <h1 style="margin:0 0 14px;font:700 20px/1.3 ${font};color:#fafaf9">${subject}</h1>
    ${bodyLines
      .map(
        (l) =>
          `<p style="margin:0 0 12px;font:400 15px/1.6 ${font};color:#a8a29e">${l}</p>`,
      )
      .join("")}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;border-collapse:separate"><tr>
      <td align="center" bgcolor="#fafaf9" style="border-radius:9999px">
        <a href="${portalUrl}" style="display:block;padding:15px 26px;font:700 15px/1 ${font};color:#0c0a09;text-decoration:none">${CTA[locale] ?? CTA.nl} &nbsp;→</a>
      </td>
    </tr></table>
    <p style="margin:18px 0 0;font:400 12px/1.5 ${font};color:#78716c">Log in met je e-mailadres — je krijgt een veilige login-link, geen wachtwoord nodig.</p>
  </td></tr>
  <tr><td style="padding:20px 4px 0;text-align:center;font:400 11px/1.5 ${font};color:#57534e">© ${new Date().getFullYear()} Studio VM · studio-vm.be</td></tr>
</table></td></tr></table></body></html>`,
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
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const body = String(formData.get("body") ?? "").trim().slice(0, 8000);
  const amount = cents(formData.get("amount"));
  const validUntil = String(formData.get("valid_until") ?? "").trim();
  if (!email || !title) return;

  const { error } = await getSupabaseAdmin().from("offers").insert({
    client_email: email,
    title,
    body: body || null,
    amount_cents: amount || null,
    valid_until: validUntil || null,
  });
  if (error) return;
  await ensurePortalUser(email);
  await notifyClient(email, "offer", [
    `Er staat een nieuwe offerte voor je klaar: <strong>${title}</strong>${
      amount ? ` — € ${(amount / 100).toFixed(2)}` : ""
    }.`,
    "Bekijk 'm in je portaal en aanvaard of wijs af met één klik.",
  ]);
  revalidatePath("/admin/klanten", "layout");
  return;
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
