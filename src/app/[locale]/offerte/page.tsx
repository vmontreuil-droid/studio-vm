"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Send, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { submitQuote, lookupVat } from "@/app/actions/quote";
import { FLAT_OFFER, CUSTOM_OFFER } from "@/lib/pricing";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    inclTitle: string;
    customNote: string;
    selfPre: string;
    selfLink: string;
    sendTitle: string;
    sendText: string;
    sent: string;
    err: string;
    name: string;
    email2: string;
    phone: string;
    vat: string;
    company: string;
    address: string;
    msg: string;
    site: string;
    siteNote: string;
    noWeb: string;
    reqHint: string;
    submit: string;
    sending: string;
    viesChecking: string;
    viesOk: string;
    viesBad: string;
  }
> = {
  nl: {
    eyebrow: "Start je website",
    title: "Eén prijs, alles inbegrepen.",
    intro:
      "Ik bouw je website, host 'm en hou 'm veilig en up-to-date — voor één vast bedrag per maand. Laat hieronder je gegevens na, dan neem ik contact op. Geen opstartkost, geen verrassingen.",
    inclTitle: "Wat je krijgt voor",
    customNote:
      "Webshop of maatwerk nodig (online verkopen, integraties, migratie)? Dat valt buiten het vaste maandtarief — vermeld het kort in je bericht, dan bespreken we de scope samen.",
    selfPre: "Kleiner budget of liever zelf doen? ",
    selfLink: "Bekijk het zelfbouwpakket (€29/maand) →",
    sendTitle: "Laat je gegevens na",
    sendText:
      "Ik reageer meestal binnen één werkdag. Niets ligt vast — dit is gewoon een eerste contact.",
    sent: "Bedankt! Je aanvraag is binnen — ik reageer meestal binnen één werkdag.",
    err: "Er ging iets mis. Probeer opnieuw of mail info@studio-vm.be.",
    name: "Je naam",
    email2: "Je e-mail",
    phone: "Telefoonnummer",
    vat: "BTW-nummer (optioneel, bv. BE0123456789)",
    company: "Bedrijfsnaam (automatisch via BTW)",
    address: "Adres (automatisch via BTW)",
    msg: "Vertel kort wat je nodig hebt (optioneel)",
    site: "Je huidige website (optioneel)",
    siteNote:
      "Vul je dit in, dan voeren we automatisch een snelle scan uit zodat we je beter kunnen helpen.",
    noWeb: "Ik heb (nog) geen website",
    reqHint: "Velden met * zijn verplicht",
    submit: "Verstuur mijn aanvraag",
    sending: "Versturen…",
    viesChecking: "BTW controleren via VIES…",
    viesOk: "BTW gevonden — gegevens automatisch ingevuld",
    viesBad: "BTW niet gevonden — vul gegevens handmatig in",
  },
  fr: {
    eyebrow: "Démarrez votre site",
    title: "Un prix, tout inclus.",
    intro:
      "Je construis votre site, je l'héberge et je le garde sûr et à jour — pour un montant fixe par mois. Laissez vos coordonnées ci-dessous et je vous recontacte. Sans frais de démarrage, sans surprises.",
    inclTitle: "Ce que vous obtenez pour",
    customNote:
      "Besoin d'une boutique ou de sur-mesure (vente en ligne, intégrations, migration) ? Cela sort du tarif mensuel fixe — mentionnez-le brièvement dans votre message et on discute le scope ensemble.",
    selfPre: "Budget plus serré ou envie de le faire vous-même ? ",
    selfLink: "Découvrez le forfait Construire soi-même (€29/mois) →",
    sendTitle: "Laissez vos coordonnées",
    sendText:
      "Je réponds généralement sous un jour ouvré. Rien n'est figé — c'est juste un premier contact.",
    sent: "Merci ! Votre demande est reçue — je réponds généralement sous un jour ouvré.",
    err: "Une erreur est survenue. Réessayez ou écrivez à info@studio-vm.be.",
    name: "Votre nom",
    email2: "Votre e-mail",
    phone: "Numéro de téléphone",
    vat: "Numéro de TVA (facultatif, ex. BE0123456789)",
    company: "Nom de société (auto via TVA)",
    address: "Adresse (auto via TVA)",
    msg: "Dites brièvement ce dont vous avez besoin (facultatif)",
    site: "Votre site actuel (facultatif)",
    siteNote:
      "Si vous le renseignez, on lance un scan rapide pour mieux vous aider.",
    noWeb: "Je n'ai pas (encore) de site",
    reqHint: "Les champs avec * sont obligatoires",
    submit: "Envoyer ma demande",
    sending: "Envoi…",
    viesChecking: "Vérification TVA via VIES…",
    viesOk: "TVA trouvée — données remplies automatiquement",
    viesBad: "TVA introuvable — remplissez manuellement",
  },
  en: {
    eyebrow: "Start your website",
    title: "One price, all included.",
    intro:
      "I build your website, host it and keep it secure and up to date — for one fixed monthly amount. Leave your details below and I'll get in touch. No setup fee, no surprises.",
    inclTitle: "What you get for",
    customNote:
      "Need a webshop or custom work (selling online, integrations, migration)? That sits outside the fixed monthly rate — mention it briefly in your message and we'll discuss the scope together.",
    selfPre: "Tighter budget or rather do it yourself? ",
    selfLink: "See the self-build package (€29/month) →",
    sendTitle: "Leave your details",
    sendText:
      "I usually reply within one working day. Nothing is fixed — this is just a first contact.",
    sent: "Thanks! Your request is in — I usually reply within one working day.",
    err: "Something went wrong. Try again or email info@studio-vm.be.",
    name: "Your name",
    email2: "Your email",
    phone: "Phone number",
    vat: "VAT number (optional, e.g. BE0123456789)",
    company: "Company name (auto via VAT)",
    address: "Address (auto via VAT)",
    msg: "Tell us briefly what you need (optional)",
    site: "Your current website (optional)",
    siteNote:
      "If you fill this in, we run a quick scan so we can help you better.",
    noWeb: "I don't have a website (yet)",
    reqHint: "Fields marked * are required",
    submit: "Send my request",
    sending: "Sending…",
    viesChecking: "Checking VAT via VIES…",
    viesOk: "VAT found — details filled automatically",
    viesBad: "VAT not found — fill in manually",
  },
};

export default function OffertePage() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = T[locale];
  const flat = FLAT_OFFER[locale];
  const custom = CUSTOM_OFFER[locale];

  const [vatNo, setVatNo] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [vies, setVies] = useState<"idle" | "checking" | "ok" | "bad">("idle");
  const [noWeb, setNoWeb] = useState(false);
  const [website, setWebsite] = useState("");
  const [sent, setSent] = useState<"idle" | "ok" | "err">("idle");
  const [pending, startSend] = useTransition();

  async function checkVat() {
    const v = vatNo.trim();
    if (!v) {
      setVies("idle");
      return;
    }
    setVies("checking");
    const r = await lookupVat(v);
    if (r.name) setCompany(r.name);
    if (r.address) setAddress(r.address);
    setVies(
      r.valid === false
        ? "bad"
        : r.name || r.address || r.valid === true
          ? "ok"
          : "bad",
    );
  }

  function submit(fd: FormData) {
    // Honeypot — bots vullen het verborgen veld in.
    if (String(fd.get("website") ?? "")) {
      setSent("ok");
      return;
    }
    startSend(async () => {
      fd.set("locale", locale);
      fd.set("base", "Website €49/maand (alles inbegrepen)");
      fd.set("plan", "care");
      fd.set("monthly", "49");
      const r = await submitQuote(fd);
      setSent(r.ok ? "ok" : "err");
    });
  }

  const fldRound =
    "w-full rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent";

  return (
    <main>
      <section className="border-b">
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
          <p className="mt-5 text-sm text-muted">
            {c.selfPre}
            <Link
              href={localePath(locale, "/zelf-bouwen")}
              className="font-medium text-accent underline underline-offset-2 hover:opacity-80"
            >
              {c.selfLink}
            </Link>
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1fr] lg:items-start">
          {/* Wat je krijgt */}
          <div className="lg:sticky lg:top-24">
            <div className="relative rounded-3xl border border-accent bg-accent/5 p-8 shadow-[0_0_0_1px_var(--accent)]">
              <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                {flat.badge}
              </span>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">
                {c.inclTitle}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight">
                  {flat.price}
                </span>
                <span className="text-sm text-muted">{flat.priceNote}</span>
              </div>
              <p className="mt-2 font-mono text-xs text-accent">{flat.terms}</p>
              <ul className="mt-6 space-y-2.5">
                {flat.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
                      strokeWidth={2.5}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-5">
              <p className="text-sm font-semibold tracking-tight">
                {custom.name}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {c.customNote}
              </p>
            </div>
          </div>

          {/* Intake-formulier */}
          <div id="aanvraag" className="scroll-mt-28">
            <h2 className="text-balance text-2xl font-semibold tracking-tight">
              {c.sendTitle}
            </h2>
            <p className="mt-2 text-sm text-muted">{c.sendText}</p>

            {sent === "ok" ? (
              <p className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm font-medium text-accent">
                {c.sent}
              </p>
            ) : (
              <form action={submit} className="mt-6 space-y-3">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <p className="px-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {c.reqHint}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    name="name"
                    required
                    placeholder={`${c.name} *`}
                    className={fldRound}
                  />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder={`${c.email2} *`}
                    className={fldRound}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder={`${c.phone} *`}
                    className={fldRound}
                  />
                  <input
                    name="vat_number"
                    value={vatNo}
                    onChange={(e) => setVatNo(e.target.value)}
                    onBlur={checkVat}
                    placeholder={c.vat}
                    className={fldRound}
                  />
                </div>
                {vies !== "idle" && (
                  <p
                    className={`flex items-center gap-1.5 px-1 text-xs ${
                      vies === "ok"
                        ? "text-accent"
                        : vies === "bad"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted"
                    }`}
                  >
                    {vies === "checking" ? (
                      <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                    ) : vies === "ok" ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
                    )}
                    {vies === "checking"
                      ? c.viesChecking
                      : vies === "ok"
                        ? c.viesOk
                        : c.viesBad}
                  </p>
                )}
                <input
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={c.company}
                  className={fldRound}
                />
                <input
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={c.address}
                  className={fldRound}
                />
                <textarea
                  name="message"
                  rows={3}
                  placeholder={c.msg}
                  className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <div>
                  <input
                    name="currentSite"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    required={!noWeb}
                    disabled={noWeb}
                    placeholder={noWeb ? c.site : `${c.site} *`}
                    className={`${fldRound} disabled:opacity-50`}
                  />
                  <label className="mt-2 flex cursor-pointer items-center gap-2 px-1 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={noWeb}
                      onChange={(e) => setNoWeb(e.target.checked)}
                    />
                    {c.noWeb}
                  </label>
                  <p className="mt-1.5 px-1 text-xs text-muted">{c.siteNote}</p>
                </div>
                {sent === "err" && (
                  <p className="text-sm text-red-500">{c.err}</p>
                )}
                <p className="px-1 text-xs leading-relaxed text-muted">
                  {locale === "fr" ? (
                    <>
                      En envoyant, vous acceptez que vos données soient traitées
                      pour cette demande, conformément à notre{" "}
                      <Link
                        href={localePath(locale, "/privacy")}
                        className="text-accent underline"
                      >
                        politique de confidentialité
                      </Link>
                      .
                    </>
                  ) : locale === "en" ? (
                    <>
                      By submitting, you agree that your data is processed for
                      this request, per our{" "}
                      <Link
                        href={localePath(locale, "/privacy")}
                        className="text-accent underline"
                      >
                        privacy policy
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Door te versturen ga je akkoord dat je gegevens verwerkt
                      worden voor deze aanvraag, conform ons{" "}
                      <Link
                        href={localePath(locale, "/privacy")}
                        className="text-accent underline"
                      >
                        privacybeleid
                      </Link>
                      .
                    </>
                  )}
                </p>
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
                  {pending ? c.sending : c.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
