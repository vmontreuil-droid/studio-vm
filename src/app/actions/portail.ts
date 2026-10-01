"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";

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
    noaccess: string;
    inactive: string;
  }
> = {
  nl: {
    subject: "Uw login-link voor het klantenportaal van Studio VM",
    title: "Inloggen op uw klantenportaal",
    intro:
      "Klik op de knop hieronder om veilig in te loggen op uw klantenportaal. Daar volgt u uw 3D-projecten op: van de plannen tot de modelbestanden per machinesturing. Een wachtwoord is niet nodig.",
    cta: "Open mijn portaal",
    note: "Deze link is persoonlijk en ongeveer 1 uur geldig. Niet aangevraagd? Dan mag u deze e-mail negeren.",
    ok: "Kijk in uw mailbox — de login-link is onderweg.",
    bad: "Dat e-mailadres lijkt niet te kloppen.",
    fail: "Versturen is mislukt. Probeer het opnieuw.",
    noaccess:
      "Er is geen toegang met dit e-mailadres. Vraag een 3D-model aan via het offerteformulier (studio-vm.be/nl/offerte) of neem contact op via info@studio-vm.be.",
    inactive: "Het portaal is nog niet geactiveerd in deze omgeving.",
  },
  fr: {
    subject: "Votre lien de connexion au portail client Studio VM",
    title: "Connectez-vous à votre portail client",
    intro:
      "Cliquez sur le bouton ci-dessous pour vous connecter en toute sécurité à votre portail client. Vous y suivez vos projets 3D : des plans jusqu'aux fichiers du modèle par système de guidage. Aucun mot de passe n'est nécessaire.",
    cta: "Ouvrir mon portail",
    note: "Ce lien est personnel et valable environ 1 heure. Vous ne l'avez pas demandé ? Vous pouvez ignorer cet e-mail.",
    ok: "Consultez votre boîte de réception — le lien de connexion est en route.",
    bad: "Cette adresse e-mail semble incorrecte.",
    fail: "L'envoi a échoué. Veuillez réessayer.",
    noaccess:
      "Aucun accès avec cette adresse. Demandez un modèle 3D via le formulaire de devis (studio-vm.be/fr/offerte) ou écrivez à info@studio-vm.be.",
    inactive: "Le portail n'est pas encore activé dans cet environnement.",
  },
  en: {
    subject: "Your login link for the Studio VM client portal",
    title: "Log in to your client portal",
    intro:
      "Click the button below to log in securely to your client portal, where you follow your 3D projects: from the plans to the model files per machine control system. No password needed.",
    cta: "Open my portal",
    note: "This link is personal and valid for about 1 hour. Didn't request it? You can safely ignore this email.",
    ok: "Check your inbox — the login link is on its way.",
    bad: "That email address doesn't look right.",
    fail: "Sending failed. Please try again.",
    noaccess:
      "There is no access for this address. Request a 3D model via the quote form (studio-vm.be/en/offerte) or contact info@studio-vm.be.",
    inactive: "The portal is not yet activated in this environment.",
  },
  de: {
    subject: "Ihr Anmeldelink für das Kundenportal von Studio VM",
    title: "Melden Sie sich in Ihrem Kundenportal an",
    intro:
      "Klicken Sie auf die Schaltfläche unten, um sich sicher in Ihrem Kundenportal anzumelden. Dort verfolgen Sie Ihre 3D-Projekte: von den Plänen bis zu den Modelldateien pro Maschinensteuerung. Ein Passwort ist nicht nötig.",
    cta: "Mein Portal öffnen",
    note: "Dieser Link ist persönlich und etwa 1 Stunde gültig. Nicht angefordert? Dann können Sie diese E-Mail ignorieren.",
    ok: "Sehen Sie in Ihrem Posteingang nach — der Anmeldelink ist unterwegs.",
    bad: "Diese E-Mail-Adresse scheint nicht korrekt zu sein.",
    fail: "Der Versand ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
    noaccess:
      "Mit dieser Adresse besteht kein Zugang. Fragen Sie ein 3D-Modell über das Angebotsformular an (studio-vm.be/de/offerte) oder schreiben Sie an info@studio-vm.be.",
    inactive: "Das Portal ist in dieser Umgebung noch nicht aktiviert.",
  },
  es: {
    subject: "Su enlace de acceso al portal de clientes de Studio VM",
    title: "Acceda a su portal de clientes",
    intro:
      "Haga clic en el botón de abajo para acceder de forma segura a su portal de clientes. Allí sigue sus proyectos 3D: desde los planos hasta los archivos del modelo para cada sistema de control de máquina. No necesita contraseña.",
    cta: "Abrir mi portal",
    note: "Este enlace es personal y válido durante aproximadamente 1 hora. ¿No lo ha solicitado? Puede ignorar este correo.",
    ok: "Revise su bandeja de entrada: el enlace de acceso está en camino.",
    bad: "Esa dirección de correo electrónico no parece correcta.",
    fail: "No se ha podido enviar. Inténtelo de nuevo.",
    noaccess:
      "No hay acceso con esta dirección. Solicite un modelo 3D mediante el formulario de presupuesto (studio-vm.be/es/offerte) o escriba a info@studio-vm.be.",
    inactive: "El portal aún no está activado en este entorno.",
  },
};

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
  const nextPath = /^\/(nl|fr|en|de|es)\/portail(\/|$)/.test(rawNext)
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

    const eyebrow =
      (
        {
          nl: "Uw klantenportaal",
          fr: "Votre portail client",
          en: "Your client portal",
          de: "Ihr Kundenportal",
          es: "Su portal de clientes",
        } as Record<string, string>
      )[locale] ?? "Uw klantenportaal";
    await sendMail(email, {
      subject: t.subject,
      html: portalEmailHtml({
        locale,
        eyebrow,
        title: t.title,
        bodyLines: [t.intro],
        ctaLabel: t.cta,
        ctaHref: link,
        footnote: t.note,
      }),
    });

    return { ok: true, message: t.ok };
  } catch {
    return { ok: false, message: t.fail };
  }
}

export async function confirmLogin(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const rawType = String(formData.get("type") ?? "magiclink");
  const rawNext = String(formData.get("next") ?? "/nl/portail/dashboard");
  const next = rawNext.startsWith("/") ? rawNext : "/nl/portail/dashboard";

  if (!supabaseConfigured || !tokenHash) {
    redirect("/nl/portail?fout=link");
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
  redirect(ok ? next : "/nl/portail?fout=link");
}

export async function signOut(): Promise<void> {
  if (!supabaseConfigured) return;
  try {
    const sb = await getSupabaseServer();
    await sb.auth.signOut();
  } catch {}
}
