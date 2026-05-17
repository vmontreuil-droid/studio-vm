"use server";

import { resendFrom } from "@/lib/supabase/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Inzending van een contact-/reservatieformulier op een gepubliceerde
// klantsite. De bezoeker is NIET ingelogd — we draaien serverzijde met
// de service-role. Opslag in form_submissions + nette gebrande mail
// naar de site-eigenaar (Reply-To = bezoeker) + optionele bedankmail
// naar de bezoeker.

type Field = { label: string; value: string };

export type SiteFormState = { ok: boolean; message: string };

const esc = (s: unknown) =>
  String(s ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function submitSiteForm(input: {
  designId: string;
  page?: string;
  fields: Field[];
  hp?: string; // honeypot — moet leeg zijn
  ackText?: string; // bedanktekst (uit de site-config), optioneel
}): Promise<SiteFormState> {
  // Spam: gevuld honeypot → doe alsof het lukte, doe niets.
  if (input.hp && input.hp.trim()) return { ok: true, message: "ok" };

  const fields = (Array.isArray(input.fields) ? input.fields : [])
    .map((f) => ({
      label: String(f?.label ?? "").slice(0, 120),
      value: String(f?.value ?? "").slice(0, 4000),
    }))
    .filter((f) => f.label || f.value);

  if (fields.length === 0)
    return { ok: false, message: "Lege inzending." };

  if (!/^[0-9a-f-]{16,40}$/i.test(input.designId))
    return { ok: false, message: "Onbekende site." };

  const admin = getSupabaseAdmin();
  const { data: design } = await admin
    .from("builder_designs")
    .select("client_email, title")
    .eq("id", input.designId)
    .maybeSingle();
  const row = design as { client_email: string; title: string } | null;
  if (!row?.client_email)
    return { ok: false, message: "Onbekende site." };

  // Bezoeker-naam/-mail uit de velden halen voor overzicht + Reply-To.
  const findBy = (re: RegExp) =>
    fields.find((f) => re.test(f.label.toLowerCase()))?.value.trim() ?? "";
  const visitorEmail = (() => {
    const tagged = findBy(/e-?mail|courriel/);
    if (isEmail(tagged)) return tagged;
    const any = fields.map((f) => f.value).find((v) => isEmail(v.trim()));
    return any ? any.trim() : "";
  })();
  const visitorName = findBy(/naam|nom|name/);

  await admin.from("form_submissions").insert({
    client_email: row.client_email,
    design_id: input.designId,
    site_title: row.title ?? "",
    page: (input.page ?? "").slice(0, 120),
    visitor_name: visitorName.slice(0, 160),
    visitor_email: visitorEmail.slice(0, 200),
    fields,
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: true, message: "ok" };

  const when = new Date().toLocaleString("nl-BE", {
    timeZone: "Europe/Brussels",
  });
  const rowsHtml = fields
    .map(
      (f) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#888;vertical-align:top">${esc(
          f.label,
        )}</td><td style="white-space:pre-wrap"><strong>${esc(
          f.value,
        )}</strong></td></tr>`,
    )
    .join("");

  // 1) Notificatie naar de site-eigenaar — Reply-To = bezoeker.
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: row.client_email,
        ...(isEmail(visitorEmail) ? { reply_to: visitorEmail } : {}),
        subject: `Nieuw bericht via je website${
          row.title ? ` — ${row.title}` : ""
        }`,
        text:
          fields.map((f) => `${f.label}: ${f.value}`).join("\n") +
          `\n\n— ${when}`,
        html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;color:#111;line-height:1.6">
<h2 style="margin:0 0 4px;font-size:18px">Nieuw bericht via je website</h2>
<p style="margin:0 0 16px;color:#777;font-size:13px">${esc(row.title)} · ${when}</p>
<table style="border-collapse:collapse;font-size:14px;margin-bottom:8px">${rowsHtml}</table>
${
  isEmail(visitorEmail)
    ? `<p style="margin-top:18px;font-size:12px;color:#999">Antwoord rechtstreeks op deze mail om de bezoeker te bereiken.</p>`
    : ""
}
</div>`,
      }),
    });
  } catch (e) {
    console.error("[site-form] notificatie mislukt:", e);
  }

  // 2) Optionele bedankmail naar de bezoeker, in de huisstijl-tekst
  //    die de klant zelf in de builder zette.
  if (isEmail(visitorEmail) && input.ackText && input.ackText.trim()) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: visitorEmail,
          reply_to: row.client_email,
          subject: row.title
            ? `Bedankt — ${row.title}`
            : "Bedankt voor je bericht",
          text: input.ackText,
          html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;color:#111;line-height:1.6"><p style="white-space:pre-wrap;font-size:15px">${esc(
            input.ackText,
          )}</p>${
            row.title
              ? `<p style="margin-top:18px;font-size:12px;color:#999">— ${esc(
                  row.title,
                )}</p>`
              : ""
          }</div>`,
        }),
      });
    } catch (e) {
      console.error("[site-form] bedankmail mislukt:", e);
    }
  }

  return { ok: true, message: "ok" };
}
