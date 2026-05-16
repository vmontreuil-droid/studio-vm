import { redirect, notFound } from "next/navigation";
import { LogOut } from "lucide-react";
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
    email: string;
    lang: string;
    sessionTitle: string;
    sessionText: string;
    mailTitle: string;
    mailText: string;
    mailOn: string;
    mailOff: string;
    subOn: string;
    subOff: string;
  }
> = {
  nl: {
    email: "E-mailadres",
    lang: "Taal",
    sessionTitle: "Sessie",
    sessionText:
      "Je blijft ingelogd op dit toestel tot je uitlogt. Inloggen gaat altijd via een veilige login-link — geen wachtwoord.",
    mailTitle: "Mailvoorkeuren",
    mailText:
      "Belangrijke mails over je project (offertes, facturen, tickets) krijg je altijd. Updates & tips zijn optioneel.",
    mailOn: "Updates & tips: aan",
    mailOff: "Updates & tips: uit",
    subOn: "Uitschrijven",
    subOff: "Inschrijven",
  },
  fr: {
    email: "Adresse e-mail",
    lang: "Langue",
    sessionTitle: "Session",
    sessionText:
      "Vous restez connecté sur cet appareil jusqu'à la déconnexion. La connexion se fait toujours via un lien sécurisé — sans mot de passe.",
    mailTitle: "Préférences e-mail",
    mailText:
      "Les e-mails importants (devis, factures, tickets) sont toujours envoyés. Les updates & astuces sont optionnels.",
    mailOn: "Updates & astuces : activé",
    mailOff: "Updates & astuces : désactivé",
    subOn: "Se désinscrire",
    subOff: "S'inscrire",
  },
  en: {
    email: "Email address",
    lang: "Language",
    sessionTitle: "Session",
    sessionText:
      "You stay logged in on this device until you sign out. Login is always via a secure link — no password.",
    mailTitle: "Email preferences",
    mailText:
      "Important project emails (quotes, invoices, tickets) are always sent. Updates & tips are optional.",
    mailOn: "Updates & tips: on",
    mailOff: "Updates & tips: off",
    subOn: "Unsubscribe",
    subOff: "Subscribe",
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

  async function out() {
    "use server";
    await signOut();
    redirect(localePath(locale as Locale, "/portail"));
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.account}
      </h1>

      <dl className="mt-8 grid gap-x-8 gap-y-5 rounded-2xl border bg-card p-6 sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {l.email}
          </dt>
          <dd className="mt-1 break-all text-sm">{user?.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {l.lang}
          </dt>
          <dd className="mt-2">
            <LangSwitcher current={locale} />
          </dd>
        </div>
      </dl>

      <div className="mt-6 rounded-2xl border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          {l.sessionTitle}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {l.sessionText}
        </p>
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

      <div className="mt-6 rounded-2xl border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          {l.mailTitle}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {l.mailText}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span
            className={`rounded-full px-3 py-1 font-mono text-[11px] ${
              newsletterOn
                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : "bg-muted/15 text-muted"
            }`}
          >
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
