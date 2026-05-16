"use server";

import { after } from "next/server";
import { resendFrom, leadsConfigured } from "@/lib/supabase/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { scanAndMail } from "@/lib/scan-report";

const TO = "info@studio-vm.be";
const FROM = resendFrom;
const esc = (s: unknown) => String(s ?? "").replace(/</g, "&lt;");

export type ContactState = {
  ok: boolean;
  message: string;
  fallbackMailto?: string;
};

export async function sendContact(formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "").trim();

  if (honeypot) {
    return { ok: true, message: "Bedankt!" };
  }

  if (!name || !email || !body) {
    return { ok: false, message: "Vul minstens naam, e-mail en bericht in." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Dat e-mailadres lijkt niet te kloppen." };
  }

  // Optioneel: bezoeker gaf z'n huidige site → scan + rapport naar mij,
  // ná de response zodat hun formulier niet wacht. Zij zien hier niets van.
  const currentSite = String(formData.get("currentSite") ?? "").trim();
  if (currentSite) {
    after(() => scanAndMail(currentSite, { source: "contact", name, email }));
  }

  // Ook opslaan als lead zodat het in Admin → Aanvragen (filter "contact")
  // verschijnt. Fail-safe: een DB-fout mag de mail/flow niet breken.
  if (leadsConfigured) {
    try {
      await getSupabaseAdmin()
        .from("quotes")
        .insert({
          locale: String(formData.get("locale") ?? "nl").slice(0, 5),
          name,
          email,
          message: [
            subject && `Onderwerp: ${subject}`,
            body,
            currentSite && `Huidige site: ${currentSite}`,
          ]
            .filter(Boolean)
            .join("\n\n")
            .slice(0, 4000),
          base: "contact",
          plan: "—",
          source: "contact",
        });
    } catch (e) {
      console.error("[contact] opslaan als lead mislukt:", e);
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const mailto = buildMailto({ name, email, subject, body });

  if (!apiKey) {
    console.log("[contact] Resend niet geconfigureerd — bericht ontvangen:", {
      name,
      email,
      subject,
      body,
    });
    return {
      ok: true,
      message:
        "Bedankt! Klik op de knop hieronder om je bericht te versturen — dan komt het gegarandeerd aan.",
      fallbackMailto: mailto,
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        reply_to: email,
        subject: subject
          ? `[studio-vm.be] ${subject}`
          : `[studio-vm.be] Bericht van ${name}`,
        text: `Van: ${name} <${email}>\n${subject ? `Onderwerp: ${subject}\n` : ""}${currentSite ? `Huidige site: ${currentSite}\n` : ""}\n${body}`,
        html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;color:#111;line-height:1.6">
<h2 style="margin:0 0 4px;font-size:18px">Nieuw bericht via het contactformulier</h2>
<p style="margin:0 0 16px;color:#777;font-size:13px">${new Date().toLocaleString(
          "nl-BE",
          { timeZone: "Europe/Brussels" },
        )}</p>
<table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
<tr><td style="padding:3px 16px 3px 0;color:#888">Naam</td><td><strong>${esc(
          name,
        )}</strong></td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#888">E-mail</td><td><a href="mailto:${esc(
          email,
        )}" style="color:#b45309">${esc(email)}</a></td></tr>
${subject ? `<tr><td style="padding:3px 16px 3px 0;color:#888">Onderwerp</td><td>${esc(subject)}</td></tr>` : ""}
${currentSite ? `<tr><td style="padding:3px 16px 3px 0;color:#888">Huidige site</td><td>${esc(currentSite)} <span style="color:#999">— auto-scan onderweg</span></td></tr>` : ""}
</table>
<div style="background:#faf9f7;border-radius:10px;padding:14px 16px;white-space:pre-wrap;font-size:14px">${esc(
          body,
        )}</div>
<p style="margin-top:18px;font-size:12px;color:#999">Antwoord rechtstreeks op deze mail om ${esc(
          name,
        )} te bereiken.</p>
</div>`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[contact] Resend faalde:", res.status, detail);
      return {
        ok: false,
        message: "Versturen mislukte. Probeer 't via mail.",
        fallbackMailto: mailto,
      };
    }

    return { ok: true, message: "Bericht verzonden — ik antwoord meestal binnen een dag." };
  } catch (err) {
    console.error("[contact] netwerk-error:", err);
    return {
      ok: false,
      message: "Kon je bericht niet versturen — probeer 't via mail.",
      fallbackMailto: mailto,
    };
  }
}

function buildMailto({
  name,
  email,
  subject,
  body,
}: {
  name: string;
  email: string;
  subject: string;
  body: string;
}): string {
  const subj = subject || `Bericht van ${name}`;
  const text = `${body}\n\n— ${name} (${email})`;
  return `mailto:${TO}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(text)}`;
}
