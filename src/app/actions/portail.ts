"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/monitor";
import { loginMail } from "@/lib/klant-mails";

export type AuthState = { ok: boolean; message: string };

// Meldingen op het scherm. De mail zelf (onderwerp, tekst, knop) staat in
// loginMail() in src/lib/klant-mails.ts.
const M: Record<
  string,
  {
    ok: string;
    bad: string;
    fail: string;
    noaccess: string;
    inactive: string;
  }
> = {
  nl: {
    ok: "Kijk in uw mailbox — de inloglink is onderweg.",
    bad: "Dat e-mailadres lijkt niet te kloppen.",
    fail: "Versturen is mislukt. Probeer het opnieuw.",
    noaccess:
      "Er is geen toegang met dit e-mailadres. Vraag een 3D-model aan via het offerteformulier (studio-vm.be/nl/offerte) of neem contact op via info@studio-vm.be.",
    inactive: "Het portaal is nog niet geactiveerd in deze omgeving.",
  },
  fr: {
    ok: "Consultez votre boîte de réception — le lien de connexion est en route.",
    bad: "Cette adresse e-mail semble incorrecte.",
    fail: "L'envoi a échoué. Veuillez réessayer.",
    noaccess:
      "Aucun accès avec cette adresse. Demandez un modèle 3D via le formulaire de devis (studio-vm.be/fr/offerte) ou écrivez à info@studio-vm.be.",
    inactive: "Le portail n'est pas encore activé dans cet environnement.",
  },
  en: {
    ok: "Check your inbox — the login link is on its way.",
    bad: "That email address doesn't look right.",
    fail: "Sending failed. Please try again.",
    noaccess:
      "There is no access for this address. Request a 3D model via the quote form (studio-vm.be/en/offerte) or contact info@studio-vm.be.",
    inactive: "The portal is not yet activated in this environment.",
  },
  de: {
    ok: "Sehen Sie in Ihrem Posteingang nach — der Anmeldelink ist unterwegs.",
    bad: "Diese E-Mail-Adresse scheint nicht korrekt zu sein.",
    fail: "Der Versand ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
    noaccess:
      "Mit dieser Adresse besteht kein Zugang. Fragen Sie ein 3D-Modell über das Angebotsformular an (studio-vm.be/de/offerte) oder schreiben Sie an info@studio-vm.be.",
    inactive: "Das Portal ist in dieser Umgebung noch nicht aktiviert.",
  },
  es: {
    ok: "Revise su bandeja de entrada: el enlace de acceso está en camino.",
    bad: "Esa dirección de correo electrónico no parece correcta.",
    fail: "No se ha podido enviar. Inténtelo de nuevo.",
    noaccess:
      "No hay acceso con esta dirección. Solicite un modelo 3D mediante el formulario de presupuesto (studio-vm.be/es/offerte) o escriba a info@studio-vm.be.",
    inactive: "El portal aún no está activado en este entorno.",
  },
};

// Enkel interne portaalpaden (anti open-redirect, ook geen //host).
const PORTAAL_PAD = /^\/(nl|fr|en|de|es)\/portail(\/|$|\?)/;

export async function sendMagicLink(
  formData: FormData,
): Promise<AuthState> {
  const rawLocale = String(formData.get("locale") ?? "nl");
  const locale = ["nl", "fr", "en", "de", "es"].includes(rawLocale) ? rawLocale : "nl";
  const t = M[locale];
  if (!supabaseConfigured) {
    return { ok: false, message: t.inactive };
  }
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot) return { ok: true, message: "" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: t.bad };
  }
  // Waar de klant na inloggen belandt. Enkel interne portaalpaden
  // (anti open-redirect); standaard de dashboardstart.
  const rawNext = String(formData.get("next") ?? "");
  const nextPath = PORTAAL_PAD.test(rawNext)
    ? rawNext
    : `/${locale}/portail/dashboard`;

  const h = await headers();
  const origin =
    h.get("origin") ||
    (h.get("host") ? `https://${h.get("host")}` : "https://www.studio-vm.be");
  const redirectTo = `${origin}/auth/callback`;

  try {
    const admin = getSupabaseAdmin();

    // Invite-only: we maken hier GÉÉN account aan. Toegang ontstaat via
    // een offerte-aanvraag (3D-model) of doordat Studio VM de klant
    // toevoegt. Bestaat de gebruiker niet, dan faalt generateLink →
    // nette "geen toegang".
    const gen = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    const hashed = gen.data?.properties?.hashed_token;
    if (gen.error || !hashed) {
      return { ok: false, message: t.noaccess };
    }
    // Tussenpagina met knop: e-mailscanners (Outlook Safe Links) doen
    // enkel een GET en verbruiken de éénmalige token niet; pas als een
    // mens op de knop klikt (POST → confirmLogin) wordt ingelogd.
    const link = `${origin}/auth/confirm?token_hash=${encodeURIComponent(
      hashed,
    )}&type=magiclink&next=${encodeURIComponent(nextPath)}`;

    await sendMail(email, loginMail(locale, link));

    return { ok: true, message: t.ok };
  } catch {
    return { ok: false, message: t.fail };
  }
}

export async function confirmLogin(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const rawType = String(formData.get("type") ?? "magiclink");
  const rawNext = String(formData.get("next") ?? "");
  // Enkel een portaalpad (niet "//andere-site.be"): anders het overzicht.
  const next = PORTAAL_PAD.test(rawNext) ? rawNext : "/nl/portail/dashboard";
  // Bij een fout terug naar de aanmeldpagina in de taal van de link.
  const fout = `/${next.slice(1, 3)}/portail?fout=link`;

  if (!supabaseConfigured || !tokenHash) {
    redirect(fout);
  }
  let ok = false;
  try {
    const sb = await getSupabaseServer();
    const { error } = await sb.auth.verifyOtp({
      type: rawType as EmailOtpType,
      token_hash: tokenHash,
    });
    ok = !error;
  } catch {
    ok = false;
  }
  redirect(ok ? next : fout);
}

export async function signOut(): Promise<void> {
  if (!supabaseConfigured) return;
  try {
    const sb = await getSupabaseServer();
    await sb.auth.signOut();
  } catch {}
}
