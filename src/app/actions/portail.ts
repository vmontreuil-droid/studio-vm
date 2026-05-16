"use server";

import { headers } from "next/headers";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/monitor";

export type AuthState = { ok: boolean; message: string };

const M: Record<
  string,
  {
    subject: string;
    title: string;
    intro: string;
    cta: string;
    note: string;
    ok: string;
    bad: string;
    fail: string;
  }
> = {
  nl: {
    subject: "Je login-link voor je klantenportaal",
    title: "Log in op je portaal",
    intro:
      "Klik op de knop hieronder om veilig in te loggen op je persoonlijke klantenportaal. Geen wachtwoord nodig.",
    cta: "Open mijn portaal",
    note: "Deze link is persoonlijk en ~1 uur geldig. Niet aangevraagd? Negeer deze mail gerust.",
    ok: "Check je inbox — de login-link is onderweg.",
    bad: "Dat e-mailadres lijkt niet te kloppen.",
    fail: "Versturen mislukte. Probeer 't opnieuw.",
  },
  fr: {
    subject: "Votre lien de connexion au portail client",
    title: "Connectez-vous à votre portail",
    intro:
      "Cliquez sur le bouton ci-dessous pour vous connecter en toute sécurité à votre portail client. Aucun mot de passe nécessaire.",
    cta: "Ouvrir mon portail",
    note: "Ce lien est personnel et valable ~1 heure. Pas demandé ? Ignorez cet e-mail.",
    ok: "Vérifiez votre boîte mail — le lien de connexion arrive.",
    bad: "Cette adresse e-mail semble incorrecte.",
    fail: "L'envoi a échoué. Réessayez.",
  },
  en: {
    subject: "Your login link for your client portal",
    title: "Log in to your portal",
    intro:
      "Click the button below to securely log in to your personal client portal. No password needed.",
    cta: "Open my portal",
    note: "This link is personal and valid for ~1 hour. Didn't request it? Just ignore this email.",
    ok: "Check your inbox — the login link is on its way.",
    bad: "That email address doesn't look right.",
    fail: "Sending failed. Please try again.",
  },
};

export async function sendMagicLink(
  formData: FormData,
): Promise<AuthState> {
  if (!supabaseConfigured) {
    return {
      ok: false,
      message: "Het portaal is nog niet geactiveerd op deze omgeving.",
    };
  }
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const honeypot = String(formData.get("website") ?? "").trim();
  const rawLocale = String(formData.get("locale") ?? "nl");
  const locale = ["nl", "fr", "en"].includes(rawLocale) ? rawLocale : "nl";
  const t = M[locale];
  if (honeypot) return { ok: true, message: "" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: t.bad };
  }

  const h = await headers();
  const origin =
    h.get("origin") ||
    (h.get("host") ? `https://${h.get("host")}` : "https://www.studio-vm.be");
  const redirectTo = `${origin}/auth/callback`;

  try {
    const admin = getSupabaseAdmin();

    // Zorg dat de gebruiker bestaat (scan-leads hebben nog geen account).
    let gen = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (gen.error) {
      await admin.auth.admin
        .createUser({ email, email_confirm: true })
        .catch(() => {});
      gen = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
    }
    const link = gen.data?.properties?.action_link;
    if (gen.error || !link) {
      return { ok: false, message: t.fail };
    }

    const accent = "#e08214";
    const font =
      "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    await sendMail(email, {
      subject: t.subject,
      html: `<!DOCTYPE html><html><body style="margin:0;background:#0c0a09">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;border-collapse:collapse"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;border-collapse:collapse">
  <tr><td style="padding:0 4px 18px;font:700 14px/1 ui-monospace,monospace;letter-spacing:.22em;text-transform:uppercase;color:${accent}">STUDIO&nbsp;VM<span style="color:${accent}">.</span></td></tr>
  <tr><td style="background:#161210;border:1px solid #2c2521;border-radius:18px;padding:32px">
    <h1 style="margin:0 0 14px;font:700 21px/1.3 ${font};color:#fafaf9">${t.title}</h1>
    <p style="margin:0 0 24px;font:400 15px/1.65 ${font};color:#a8a29e">${t.intro}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr>
      <td align="center" bgcolor="#fafaf9" style="border-radius:9999px">
        <a href="${link}" style="display:block;padding:16px 30px;font:700 15px/1 ${font};color:#0c0a09;text-decoration:none">${t.cta} &nbsp;→</a>
      </td>
    </tr></table>
    <p style="margin:22px 0 0;font:400 12px/1.6 ${font};color:#78716c">${t.note}</p>
  </td></tr>
  <tr><td style="padding:20px 4px 0;text-align:center;font:400 11px/1.5 ${font};color:#57534e">© ${new Date().getFullYear()} Studio VM · studio-vm.be</td></tr>
</table></td></tr></table></body></html>`,
    });

    return { ok: true, message: t.ok };
  } catch {
    return { ok: false, message: M.nl.fail };
  }
}

export async function signOut(): Promise<void> {
  if (!supabaseConfigured) return;
  try {
    const sb = await getSupabaseServer();
    await sb.auth.signOut();
  } catch {}
}
