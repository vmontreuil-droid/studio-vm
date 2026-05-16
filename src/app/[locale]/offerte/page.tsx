"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Send, RotateCcw, Printer, Loader2 } from "lucide-react";
import { submitQuote } from "@/app/actions/quote";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

type BaseKind = "onepager" | "starter" | "pro" | "webshop" | "custom";

const basePrice: Record<BaseKind, number> = {
  onepager: 750,
  starter: 1250,
  pro: 1900,
  webshop: 3900,
  custom: 4500,
};

const moduleKeys = [
  "meertalig",
  "copywriting",
  "fotoshoot",
  "formulieren",
  "reservatie",
  "blog",
  "ledenzone",
  "seoMigratie",
  "cookies",
  "pwa",
  "koppeling",
] as const;
type ModuleKey = (typeof moduleKeys)[number];

const modulePrice: Record<ModuleKey, number> = {
  meertalig: 75,
  copywriting: 145,
  fotoshoot: 450,
  formulieren: 100,
  reservatie: 200,
  blog: 125,
  ledenzone: 175,
  seoMigratie: 95,
  cookies: 65,
  pwa: 300,
  koppeling: 450,
};

type PlanKey = "geen" | "basis" | "care" | "plus" | "scale" | "partner";
const planMonthly: Record<PlanKey, number> = {
  geen: 0,
  basis: 19,
  care: 49,
  plus: 149,
  scale: 399,
  partner: 799,
};

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    step1: string;
    step2: string;
    step3: string;
    bases: Record<BaseKind, { label: string; desc: string }>;
    modules: Record<ModuleKey, { label: string; desc: string }>;
    plans: Record<PlanKey, { label: string; desc: string }>;
    estimate: string;
    estimateNote: string;
    oneOff: string;
    monthly: string;
    reset: string;
    printButton: string;
    docTitle: string;
    docDate: string;
    sendTitle: string;
    sendText: string;
    sendButton: string;
    formName: string;
    formEmail: string;
    formMsg: string;
    formSite: string;
    formSiteNote: string;
    formSending: string;
    formSent: string;
    formErr: string;
    mailSubject: string;
    mailIntro: string;
    mailBase: string;
    mailModules: string;
    mailPlan: string;
    mailEstimate: string;
    mailOutro: string;
    pricingLink: string;
    excl: string;
  }
> = {
  nl: {
    eyebrow: "Offerte-calculator",
    title: "Reken je project even uit.",
    intro:
      "Kies wat je nodig hebt en zie meteen een richtprijs. Geen verplichting — een exacte offerte volgt na een gesprek. Dit geeft je alvast een eerlijk idee.",
    step1: "1 · Wat heb je nodig?",
    step2: "2 · Extra modules",
    step3: "3 · Onderhoud achteraf",
    bases: {
      onepager: { label: "One-pager", desc: "1 sterke pagina, alles op één scroll" },
      starter: { label: "Starter", desc: "Tot ~5 pagina's, eigen design" },
      pro: { label: "Pro", desc: "Tot ~15 pagina's + eigen admin" },
      webshop: { label: "Webshop", desc: "Verkoop online, Mollie/Stripe" },
      custom: { label: "Custom", desc: "Multi-app, integraties, op maat" },
    },
    modules: {
      meertalig: { label: "Extra taal", desc: "Volledige extra taal + hreflang SEO" },
      copywriting: { label: "Teksten / copywriting", desc: "Professionele, SEO-bewuste webteksten" },
      fotoshoot: { label: "Fotoshoot", desc: "Halve dag pro shoot, webklaar" },
      formulieren: { label: "Formulieren + opvolging", desc: "Contact/offerte met spamfilter" },
      reservatie: { label: "Reservatie / afspraken", desc: "Boekingsmodule + bevestigingen" },
      blog: { label: "Blog / nieuws-CMS", desc: "Eigen redactie-omgeving" },
      ledenzone: { label: "Ledenzone", desc: "Afgeschermd deel met logins" },
      seoMigratie: { label: "SEO-behoud bij migratie", desc: "Volledig 301-plan, posities blijven" },
      cookies: { label: "Cookiebanner & GDPR", desc: "Consent vóór scripts — boetevrij" },
      pwa: { label: "Progressive Web App", desc: "Installeerbaar, offline" },
      koppeling: { label: "Koppeling / integratie", desc: "Boekhouding, CRM, nieuwsbrief…" },
    },
    plans: {
      geen: { label: "Geen", desc: "Free tier, support per uur" },
      basis: { label: "Basis", desc: "Hosting + SSL + backups" },
      care: { label: "Care", desc: "+ updates + 1u support/m" },
      plus: { label: "Plus", desc: "+ content-updates + 4u/m" },
      scale: { label: "Scale", desc: "+ features + onbeperkt support" },
      partner: { label: "Partner", desc: "Vaste partner, onbeperkt + dev" },
    },
    estimate: "Richtprijs",
    estimateNote:
      "Indicatief, excl. btw. De exacte prijs hangt af van de scope — die bepalen we samen in een vrijblijvend gesprek.",
    oneOff: "eenmalig",
    monthly: "per maand",
    reset: "Opnieuw",
    printButton: "Download als PDF",
    docTitle: "Offerte-raming",
    docDate: "Opgemaakt op",
    sendTitle: "Klaar om dit concreet te maken?",
    sendText:
      "Stuur deze samenvatting door. Ik bekijk 't en kom met een exacte offerte — meestal binnen één werkdag.",
    sendButton: "Stuur naar Studio VM",
    formName: "Je naam",
    formEmail: "Je e-mail",
    formMsg: "Iets toevoegen? (optioneel)",
    formSite: "Je huidige website (optioneel)",
    formSiteNote:
      "Vul je dit in, dan voeren we automatisch een snelle scan van je huidige site uit zodat we je beter van dienst kunnen zijn.",
    formSending: "Versturen…",
    formSent: "Bedankt! Je aanvraag is binnen — ik reageer meestal binnen één werkdag.",
    formErr: "Er ging iets mis. Probeer opnieuw of mail me rechtstreeks.",
    mailSubject: "Offerte-aanvraag via de calculator",
    mailIntro: "Hoi Vincent,\n\nIk rekende een project uit op studio-vm.be/offerte:",
    mailBase: "Type",
    mailModules: "Modules",
    mailPlan: "Onderhoud",
    mailEstimate: "Richtprijs",
    mailOutro: "Kan je hier een exacte offerte van maken?\n\nGroeten",
    pricingLink: "Of bekijk de vaste pakketten",
    excl: "excl. btw",
  },
  fr: {
    eyebrow: "Calculateur de devis",
    title: "Estimez votre projet.",
    intro:
      "Choisissez ce dont vous avez besoin et voyez un prix indicatif immédiat. Sans engagement — un devis exact suit après un entretien. Cela vous donne déjà une idée honnête.",
    step1: "1 · De quoi avez-vous besoin ?",
    step2: "2 · Modules supplémentaires",
    step3: "3 · Maintenance ensuite",
    bases: {
      onepager: { label: "One-pager", desc: "1 page forte, tout en un scroll" },
      starter: { label: "Starter", desc: "Jusqu'à ~5 pages, design propre" },
      pro: { label: "Pro", desc: "Jusqu'à ~15 pages + admin propre" },
      webshop: { label: "Boutique", desc: "Vente en ligne, Mollie/Stripe" },
      custom: { label: "Sur mesure", desc: "Multi-app, intégrations" },
    },
    modules: {
      meertalig: { label: "Langue supplémentaire", desc: "Langue complète + hreflang SEO" },
      copywriting: { label: "Textes / rédaction", desc: "Textes web pro, optimisés SEO" },
      fotoshoot: { label: "Shooting photo", desc: "Demi-journée pro, prêt web" },
      formulieren: { label: "Formulaires + suivi", desc: "Contact/devis avec anti-spam" },
      reservatie: { label: "Réservation / RDV", desc: "Module de réservation + confirmations" },
      blog: { label: "CMS blog / actus", desc: "Environnement de rédaction propre" },
      ledenzone: { label: "Espace membres", desc: "Zone protégée avec logins" },
      seoMigratie: { label: "Préservation SEO (migration)", desc: "Plan 301 complet, positions gardées" },
      cookies: { label: "Bannière cookies & RGPD", desc: "Consentement avant scripts" },
      pwa: { label: "Progressive Web App", desc: "Installable, hors ligne" },
      koppeling: { label: "Intégration / connexion", desc: "Compta, CRM, newsletter…" },
    },
    plans: {
      geen: { label: "Aucun", desc: "Free tier, support à l'heure" },
      basis: { label: "Basis", desc: "Hébergement + SSL + backups" },
      care: { label: "Care", desc: "+ mises à jour + 1h support/m" },
      plus: { label: "Plus", desc: "+ mises à jour contenu + 4h/m" },
      scale: { label: "Scale", desc: "+ fonctions + support illimité" },
      partner: { label: "Partner", desc: "Partenaire fixe, illimité + dev" },
    },
    estimate: "Prix indicatif",
    estimateNote:
      "Indicatif, HTVA. Le prix exact dépend du scope — on le définit ensemble lors d'un entretien sans engagement.",
    oneOff: "unique",
    monthly: "par mois",
    reset: "Recommencer",
    printButton: "Télécharger en PDF",
    docTitle: "Estimation de devis",
    docDate: "Établi le",
    sendTitle: "Prêt à concrétiser ?",
    sendText:
      "Envoyez ce résumé. Je l'examine et reviens avec un devis exact — généralement sous un jour ouvré.",
    sendButton: "Envoyer à Studio VM",
    formName: "Votre nom",
    formEmail: "Votre e-mail",
    formMsg: "Ajouter un mot ? (facultatif)",
    formSite: "Votre site actuel (facultatif)",
    formSiteNote:
      "Si vous le renseignez, nous effectuons automatiquement un scan rapide de votre site actuel pour mieux vous servir.",
    formSending: "Envoi…",
    formSent: "Merci ! Votre demande est bien reçue — je réponds généralement sous un jour ouvré.",
    formErr: "Une erreur est survenue. Réessayez ou écrivez-moi directement.",
    mailSubject: "Demande de devis via le calculateur",
    mailIntro: "Bonjour Vincent,\n\nJ'ai estimé un projet sur studio-vm.be/offerte :",
    mailBase: "Type",
    mailModules: "Modules",
    mailPlan: "Maintenance",
    mailEstimate: "Prix indicatif",
    mailOutro: "Pouvez-vous en faire un devis exact ?\n\nCordialement",
    pricingLink: "Ou voir les forfaits fixes",
    excl: "HTVA",
  },
  en: {
    eyebrow: "Quote calculator",
    title: "Estimate your project.",
    intro:
      "Pick what you need and see an indicative price right away. No obligation — an exact quote follows after a chat. This gives you an honest idea up front.",
    step1: "1 · What do you need?",
    step2: "2 · Extra modules",
    step3: "3 · Maintenance afterwards",
    bases: {
      onepager: { label: "One-pager", desc: "1 strong page, all on one scroll" },
      starter: { label: "Starter", desc: "Up to ~5 pages, custom design" },
      pro: { label: "Pro", desc: "Up to ~15 pages + own admin" },
      webshop: { label: "Webshop", desc: "Sell online, Mollie/Stripe" },
      custom: { label: "Custom", desc: "Multi-app, integrations" },
    },
    modules: {
      meertalig: { label: "Extra language", desc: "Full extra language + hreflang SEO" },
      copywriting: { label: "Copywriting / texts", desc: "Professional, SEO-aware web copy" },
      fotoshoot: { label: "Photo shoot", desc: "Half-day pro shoot, web-ready" },
      formulieren: { label: "Forms + follow-up", desc: "Contact/quote with spam filter" },
      reservatie: { label: "Booking / appointments", desc: "Booking module + confirmations" },
      blog: { label: "Blog / news CMS", desc: "Own editorial environment" },
      ledenzone: { label: "Member area", desc: "Gated section with logins" },
      seoMigratie: { label: "SEO preservation (migration)", desc: "Full 301 plan, rankings kept" },
      cookies: { label: "Cookie banner & GDPR", desc: "Consent before scripts — fine-free" },
      pwa: { label: "Progressive Web App", desc: "Installable, offline" },
      koppeling: { label: "Integration / connection", desc: "Accounting, CRM, newsletter…" },
    },
    plans: {
      geen: { label: "None", desc: "Free tier, hourly support" },
      basis: { label: "Basis", desc: "Hosting + SSL + backups" },
      care: { label: "Care", desc: "+ updates + 1h support/m" },
      plus: { label: "Plus", desc: "+ content updates + 4h/m" },
      scale: { label: "Scale", desc: "+ features + unlimited support" },
      partner: { label: "Partner", desc: "Dedicated partner, unlimited + dev" },
    },
    estimate: "Indicative price",
    estimateNote:
      "Indicative, excl. VAT. The exact price depends on scope — we define that together in a no-obligation chat.",
    oneOff: "one-off",
    monthly: "per month",
    reset: "Start over",
    printButton: "Download as PDF",
    docTitle: "Quote estimate",
    docDate: "Issued on",
    sendTitle: "Ready to make this concrete?",
    sendText:
      "Send this summary. I'll review it and come back with an exact quote — usually within one working day.",
    sendButton: "Send to Studio VM",
    formName: "Your name",
    formEmail: "Your email",
    formMsg: "Add something? (optional)",
    formSite: "Your current website (optional)",
    formSiteNote:
      "If you fill this in, we automatically run a quick scan of your current site so we can serve you better.",
    formSending: "Sending…",
    formSent: "Thanks! Your request is in — I usually reply within one working day.",
    formErr: "Something went wrong. Try again or email me directly.",
    mailSubject: "Quote request via the calculator",
    mailIntro: "Hi Vincent,\n\nI estimated a project on studio-vm.be/offerte:",
    mailBase: "Type",
    mailModules: "Modules",
    mailPlan: "Maintenance",
    mailEstimate: "Indicative price",
    mailOutro: "Can you turn this into an exact quote?\n\nBest",
    pricingLink: "Or see the fixed packages",
    excl: "excl. VAT",
  },
};

export default function OffertePage() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = T[locale];

  const [base, setBase] = useState<BaseKind>("starter");
  const [mods, setMods] = useState<ModuleKey[]>([]);
  const [plan, setPlan] = useState<PlanKey>("care");
  const [sent, setSent] = useState<"idle" | "ok" | "err">("idle");
  const [pending, startSend] = useTransition();

  const toggleMod = (m: ModuleKey) =>
    setMods((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));

  const oneOff =
    basePrice[base] + mods.reduce((sum, m) => sum + modulePrice[m], 0);
  const lo = Math.round((oneOff * 0.9) / 100) * 100;
  const hi = Math.round((oneOff * 1.15) / 100) * 100;
  const monthly = planMonthly[plan];

  const fmt = (n: number) => "€ " + n.toLocaleString("nl-BE");

  const reset = () => {
    setBase("starter");
    setMods([]);
    setPlan("care");
  };

  const mailBody = [
    c.mailIntro,
    "",
    `${c.mailBase}: ${c.bases[base].label}`,
    `${c.mailModules}: ${mods.length ? mods.map((m) => c.modules[m].label).join(", ") : "—"}`,
    `${c.mailPlan}: ${c.plans[plan].label}${monthly ? ` (${fmt(monthly)}/m)` : ""}`,
    `${c.mailEstimate}: ${fmt(lo)} – ${fmt(hi)} (${c.excl})`,
    "",
    c.mailOutro,
  ].join("\n");

  const mailto = `mailto:info@studio-vm.be?subject=${encodeURIComponent(
    c.mailSubject,
  )}&body=${encodeURIComponent(mailBody)}`;

  const today = new Date().toLocaleDateString(
    locale === "fr" ? "fr-BE" : locale === "en" ? "en-GB" : "nl-BE",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <main>
      {/* Print-only branded offerte-document */}
      <div className="hidden px-8 py-6 text-[#111] print:block">
        <p className="text-3xl font-extrabold lowercase tracking-tighter">
          vm<span style={{ color: "#b45309" }}>.</span>
        </p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          {c.docTitle}
        </h1>
        <p className="mt-1 font-mono text-xs text-[#666]">
          {c.docDate} {today} · studio-vm.be
        </p>
        <table className="mt-8 w-full text-sm">
          <tbody>
            <tr>
              <td className="py-2 pr-6 font-mono text-xs uppercase tracking-widest text-[#666]">
                {c.mailBase}
              </td>
              <td className="py-2 font-medium">{c.bases[base].label}</td>
            </tr>
            <tr>
              <td className="py-2 pr-6 font-mono text-xs uppercase tracking-widest text-[#666]">
                {c.mailModules}
              </td>
              <td className="py-2 font-medium">
                {mods.length
                  ? mods.map((m) => c.modules[m].label).join(", ")
                  : "—"}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-6 font-mono text-xs uppercase tracking-widest text-[#666]">
                {c.mailPlan}
              </td>
              <td className="py-2 font-medium">
                {c.plans[plan].label}
                {monthly ? ` (${fmt(monthly)}/m)` : ""}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-6 font-mono text-xs uppercase tracking-widest text-[#666]">
                {c.mailEstimate}
              </td>
              <td className="py-2 text-lg font-semibold">
                {fmt(lo)} – {fmt(hi)} ({c.excl})
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-8 max-w-xl text-xs leading-relaxed text-[#666]">
          {c.estimateNote}
        </p>
        <p className="mt-10 text-xs text-[#666]">
          Studio VM · Vincent Montreuil · West-Vlaanderen, België ·
          info@studio-vm.be · BE 0672.960.066
        </p>
      </div>

      <section className="border-b print:hidden">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.intro}
          </p>
        </div>
      </section>

      <section className="border-b print:hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-12">
            <div>
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-accent">
                {c.step1}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(basePrice) as BaseKind[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBase(b)}
                    className={`rounded-2xl border p-5 text-left transition-colors ${
                      base === b
                        ? "border-accent bg-card-hover"
                        : "border-border bg-card hover:bg-card-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold tracking-tight">
                        {c.bases[b].label}
                      </span>
                      {base === b && (
                        <Check className="h-4 w-4 text-accent" strokeWidth={2.5} />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{c.bases[b].desc}</p>
                    <p className="mt-3 font-mono text-xs text-muted">
                      {b === "custom" ? "vanaf " : ""}
                      {fmt(basePrice[b])}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-accent">
                {c.step2}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {moduleKeys.map((m) => {
                  const on = mods.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMod(m)}
                      className={`rounded-2xl border p-5 text-left transition-colors ${
                        on
                          ? "border-accent bg-card-hover"
                          : "border-border bg-card hover:bg-card-hover"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold tracking-tight">
                          {c.modules[m].label}
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            on
                              ? "border-accent bg-accent text-white"
                              : "border-border"
                          }`}
                        >
                          {on && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {c.modules[m].desc}
                      </p>
                      <p className="mt-3 font-mono text-xs text-muted">
                        + {fmt(modulePrice[m])}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="mb-5 font-mono text-xs uppercase tracking-widest text-accent">
                {c.step3}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(planMonthly) as PlanKey[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      plan === p
                        ? "border-accent bg-card-hover"
                        : "border-border bg-card hover:bg-card-hover"
                    }`}
                  >
                    <span className="font-semibold tracking-tight">
                      {c.plans[p].label}
                    </span>
                    <p className="mt-1 text-xs text-muted">{c.plans[p].desc}</p>
                    <p className="mt-2 font-mono text-xs text-muted">
                      {planMonthly[p] ? `${fmt(planMonthly[p])}/m` : "—"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                {c.estimate}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {fmt(lo)} <span className="text-muted">–</span> {fmt(hi)}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                {c.oneOff} · {c.excl}
              </p>
              {monthly > 0 && (
                <p className="mt-4 border-t pt-4 text-sm">
                  + <strong>{fmt(monthly)}</strong> {c.monthly}{" "}
                  <span className="text-muted">({c.plans[plan].label})</span>
                </p>
              )}
              <p className="mt-4 text-xs leading-relaxed text-muted">
                {c.estimateNote}
              </p>
              <a
                href="#aanvraag"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
                {c.sendButton}
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors hover:bg-card-hover"
              >
                <Printer className="h-4 w-4" strokeWidth={2} />
                {c.printButton}
              </button>
              <button
                type="button"
                onClick={reset}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs text-muted transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={2} />
                {c.reset}
              </button>
              <Link
                href={localePath(locale, "/pricing")}
                className="mt-4 block text-center font-mono text-xs text-accent hover:underline"
              >
                {c.pricingLink} →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section id="aanvraag" className="border-b print:hidden">
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {c.sendTitle}
          </h2>
          <p className="mt-3 text-muted">{c.sendText}</p>

          {sent === "ok" ? (
            <p className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm font-medium text-accent">
              {c.formSent}
            </p>
          ) : (
            <form
              action={(fd) =>
                startSend(async () => {
                  fd.set("locale", locale);
                  fd.set("base", base);
                  fd.set("modules", mods.join(","));
                  fd.set("plan", plan);
                  fd.set("estLow", String(lo));
                  fd.set("estHigh", String(hi));
                  fd.set("monthly", String(monthly));
                  const r = await submitQuote(fd);
                  if (r.ok) {
                    setSent("ok");
                  } else if (r.error === "not_configured") {
                    window.location.href = mailto;
                  } else {
                    setSent("err");
                  }
                })
              }
              className="mt-8 space-y-3 text-left"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="name"
                  required
                  placeholder={c.formName}
                  className="rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={c.formEmail}
                  className="rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <textarea
                name="message"
                rows={3}
                placeholder={c.formMsg}
                className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <div>
                <input
                  name="currentSite"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  placeholder={c.formSite}
                  className="w-full rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <p className="mt-1.5 px-1 text-xs text-muted">
                  {c.formSiteNote}
                </p>
              </div>
              {sent === "err" && (
                <p className="text-sm text-red-500">{c.formErr}</p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Send className="h-4 w-4" strokeWidth={2} />
                )}
                {pending ? c.formSending : c.sendButton}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
