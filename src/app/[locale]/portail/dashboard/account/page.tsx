import { redirect, notFound } from "next/navigation";
import {
  LogOut,
  User2,
  Mail,
  Globe2,
  ShieldCheck,
  KeyRound,
  BellRing,
} from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/app/actions/portail";
import { setNewsletter } from "@/app/actions/portal-client";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { PORTAL_T } from "@/lib/portal-shared";
import { LangSwitcher } from "@/components/lang-switcher";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  {
    sub: string;
    profile: string;
    email: string;
    lang: string;
    sessionTitle: string;
    sessionText: string;
    securityNote: string;
    verified: string;
    mailTitle: string;
    mailText: string;
    mailOn: string;
    mailOff: string;
    subOn: string;
    subOff: string;
    memberSince: string;
  }
> = {
  nl: {
    sub: "Profiel, taal, sessie en e-mailvoorkeuren — alles op één plek.",
    profile: "Profiel",
    email: "E-mailadres",
    lang: "Taal",
    sessionTitle: "Sessie & beveiliging",
    sessionText:
      "U blijft ingelogd op dit toestel tot u uitlogt. Inloggen gebeurt altijd via een veilige login-link — zonder wachtwoord.",
    securityNote: "Inloggen zonder wachtwoord via login-link",
    verified: "Geverifieerd",
    mailTitle: "Mailvoorkeuren",
    mailText:
      "Belangrijke mails over uw projecten (offertes, facturen, opgeleverde modellen, support) ontvangt u altijd. Nieuws en tips over machinesturing zijn optioneel.",
    mailOn: "Nieuws & tips: aan",
    mailOff: "Nieuws & tips: uit",
    subOn: "Uitschrijven",
    subOff: "Inschrijven",
    memberSince: "Klant sinds",
  },
  fr: {
    sub: "Profil, langue, session et préférences e-mail — tout au même endroit.",
    profile: "Profil",
    email: "Adresse e-mail",
    lang: "Langue",
    sessionTitle: "Session & sécurité",
    sessionText:
      "Vous restez connecté sur cet appareil jusqu'à la déconnexion. La connexion se fait toujours via un lien sécurisé — sans mot de passe.",
    securityNote: "Connexion sans mot de passe via lien sécurisé",
    verified: "Vérifié",
    mailTitle: "Préférences e-mail",
    mailText:
      "Les e-mails importants sur vos projets (devis, factures, modèles livrés, support) vous sont toujours envoyés. Les actualités et conseils sur le guidage d'engins sont facultatifs.",
    mailOn: "Actualités & conseils : activé",
    mailOff: "Actualités & conseils : désactivé",
    subOn: "Se désinscrire",
    subOff: "S'inscrire",
    memberSince: "Client depuis",
  },
  en: {
    sub: "Profile, language, session and email preferences — all in one place.",
    profile: "Profile",
    email: "Email address",
    lang: "Language",
    sessionTitle: "Session & security",
    sessionText:
      "You stay logged in on this device until you sign out. Login is always via a secure link — no password.",
    securityNote: "Passwordless login via secure link",
    verified: "Verified",
    mailTitle: "Email preferences",
    mailText:
      "Important emails about your projects (quotes, invoices, delivered models, support) are always sent. News and tips on machine control are optional.",
    mailOn: "News & tips: on",
    mailOff: "News & tips: off",
    subOn: "Unsubscribe",
    subOff: "Subscribe",
    memberSince: "Client since",
  },
  de: {
    sub: "Profil, Sprache, Sitzung und E-Mail-Einstellungen — alles an einem Ort.",
    profile: "Profil",
    email: "E-Mail-Adresse",
    lang: "Sprache",
    sessionTitle: "Sitzung & Sicherheit",
    sessionText:
      "Sie bleiben auf diesem Gerät angemeldet, bis Sie sich abmelden. Die Anmeldung erfolgt immer über einen sicheren Link — ohne Passwort.",
    securityNote: "Passwortlose Anmeldung per sicherem Link",
    verified: "Verifiziert",
    mailTitle: "E-Mail-Einstellungen",
    mailText:
      "Wichtige E-Mails zu Ihren Projekten (Angebote, Rechnungen, gelieferte Modelle, Support) erhalten Sie immer. Neuigkeiten und Tipps zur Maschinensteuerung sind optional.",
    mailOn: "Neuigkeiten & Tipps: an",
    mailOff: "Neuigkeiten & Tipps: aus",
    subOn: "Abbestellen",
    subOff: "Abonnieren",
    memberSince: "Kunde seit",
  },
  es: {
    sub: "Perfil, idioma, sesión y preferencias de correo — todo en un solo lugar.",
    profile: "Perfil",
    email: "Correo electrónico",
    lang: "Idioma",
    sessionTitle: "Sesión y seguridad",
    sessionText:
      "Permanecerá conectado en este dispositivo hasta que cierre la sesión. El acceso se realiza siempre mediante un enlace seguro — sin contraseña.",
    securityNote: "Acceso sin contraseña mediante enlace mágico",
    verified: "Verificado",
    mailTitle: "Preferencias de correo",
    mailText:
      "Los correos importantes sobre sus proyectos (presupuestos, facturas, modelos entregados, soporte) se envían siempre. Las novedades y consejos sobre control de máquina son opcionales.",
    mailOn: "Novedades y consejos: activado",
    mailOff: "Novedades y consejos: desactivado",
    subOn: "Darse de baja",
    subOff: "Suscribirse",
    memberSince: "Cliente desde",
  },
};

export default async function PortalAccount({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!supabaseConfigured) return null;
  const t = PORTAL_T[locale];
  const l = L[locale];

  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let newsletterOn = false;
  if (user?.email) {
    const { data: sub } = await getSupabaseAdmin()
      .from("newsletter_subscribers")
      .select("active")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    newsletterOn = Boolean((sub as { active?: boolean } | null)?.active);
  }

  // Account-leeftijd uit user.created_at (van Supabase auth)
  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const memberSinceLabel = createdAt
    ? createdAt.toLocaleDateString(
        ({ nl: "nl-BE", fr: "fr-BE", en: "en-GB", de: "de-DE", es: "es-ES" } as const)[locale],
        { day: "2-digit", month: "long", year: "numeric" },
      )
    : null;
  const memberMonths = createdAt
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30),
        ),
      )
    : 0;

  async function out() {
    "use server";
    await signOut();
    redirect(localePath(locale as Locale, "/portail"));
  }

  return (
    <>
      {/* Header met icon-bowl */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent">
            <User2 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t.account}
            </h1>
            <p className="mt-0.5 text-sm text-muted">{l.sub}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-green-600 dark:text-green-400">
          <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
          {l.verified}
        </span>
      </div>

      {/* Profiel-card */}
      <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          <User2 className="h-3.5 w-3.5" strokeWidth={2.5} />
          {l.profile}
        </p>
        <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {l.email}
            </p>
            <p className="mt-1 flex items-center gap-2 break-all text-sm">
              <Mail className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2} />
              {user?.email ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {l.lang}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Globe2 className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2} />
              <LangSwitcher current={locale} />
            </div>
          </div>
          {memberSinceLabel && (
            <div className="sm:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {l.memberSince}
              </p>
              <p className="mt-1 text-sm">
                {memberSinceLabel}
                {memberMonths > 0 && (
                  <span className="ml-2 font-mono text-xs text-muted">
                    ({memberMonths}{" "}
                    {{ nl: "maanden", fr: "mois", en: "months", de: "Monate", es: "meses" }[locale]})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Session & security */}
      <div className="mt-4 rounded-2xl bg-card p-6 shadow-sm">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
          <KeyRound className="h-3.5 w-3.5" strokeWidth={2.5} />
          {l.sessionTitle}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {l.sessionText}
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-green-600 dark:text-green-400">
          <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
          {l.securityNote}
        </div>
        <form action={out} className="mt-5">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            {t.signout}
          </button>
        </form>
      </div>

      {/* Mailvoorkeuren */}
      <div className="mt-4 rounded-2xl bg-card p-6 shadow-sm">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
          <BellRing className="h-3.5 w-3.5" strokeWidth={2.5} />
          {l.mailTitle}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {l.mailText}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] ${
              newsletterOn
                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : "bg-muted/15 text-muted"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                newsletterOn ? "bg-green-500" : "bg-muted"
              }`}
            />
            {newsletterOn ? l.mailOn : l.mailOff}
          </span>
          <form action={setNewsletter.bind(null, !newsletterOn)}>
            <button
              type="submit"
              className="rounded-full border px-5 py-2 text-sm transition-colors hover:bg-card-hover"
            >
              {newsletterOn ? l.subOn : l.subOff}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
