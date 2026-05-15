"use server";

import { resendFrom } from "@/lib/supabase/config";

const TO = "info@studio-vm.be";
const FROM = resendFrom;

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
        subject: subject ? `[studio-vm.be] ${subject}` : `[studio-vm.be] Bericht van ${name}`,
        text: `Van: ${name} <${email}>\n\n${body}`,
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
