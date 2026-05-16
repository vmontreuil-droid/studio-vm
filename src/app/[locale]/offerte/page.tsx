"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Send, Loader2, AlertTriangle } from "lucide-react";
import { submitQuote, startOffer, lookupVat } from "@/app/actions/quote";
import {
  offerCatalog,
  OFFER_INCLUDED,
  subscriptionTiers,
} from "@/lib/pricing";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

const eur = (c: number) => "€ " + (c / 100).toLocaleString("nl-BE");

const TERMS = [0, 3, 6, 12, 24] as const;
const DEPOSIT = 0.3;
const MIN_SPREAD = 75000; // eenmalig ≥ € 750
const MIN_MONTHLY = 7500; // afbetaling ≥ € 75/maand
const LOCKIN_DISCOUNT = 0.07; // transparante directe-vastlegkorting op het eenmalig bedrag

const TRANSFER_CENTS = 7500; // domeinverhuis, eenmalig
const REGISTER_CENTS = 3900; // nieuw domein, per jaar
const MAIL_ONE_CENTS = 500; // 1 mailbox, per maand
const MAIL_USER_CENTS = 600; // team, per gebruiker per maand
const VAT_RATE = 0.21; // prijzen excl. btw; bij afrekenen komt 21% erbij

type Domain = "connect" | "register" | "transfer";
type Mail = "none" | "one" | "team";

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    l1: string;
    l1note: string;
    incl: string;
    extra: string;
    l2: string;
    l2note: string;
    l3: string;
    domain: string;
    domConnect: string;
    domConnectD: string;
    domRegister: string;
    domRegisterD: string;
    domTransfer: string;
    domTransferD: string;
    email: string;
    mailNone: string;
    mailNoneD: string;
    mailOne: string;
    mailOneD: string;
    mailTeam: string;
    mailTeamD: string;
    users: string;
    total: string;
    oneOff: string;
    excl: string;
    lockin: string;
    lockinWhy: string;
    lockinSave: string;
    was: string;
    spread: string;
    spreadNote: string;
    spreadLocked: string;
    atOnce: string;
    deposit: string;
    thenPay: string;
    perMonth: string;
    monthlySub: string;
    perMonthShort: string;
    domainYear: string;
    perYear: string;
    pickBase: string;
    pickSub: string;
    sendTitle: string;
    sendText: string;
    sendButton: string;
    sending: string;
    sent: string;
    err: string;
    name: string;
    email2: string;
    msg: string;
    site: string;
    siteNote: string;
    pricingLink: string;
    sumHead: string;
    company: string;
    address: string;
    vat: string;
    phone: string;
    viesChecking: string;
    viesOk: string;
    viesBad: string;
    noWeb: string;
    reqHint: string;
    depositBtn: string;
    quoteBtn2: string;
    payNote: string;
    depRow: string;
    restRow: string;
    restRowSpread: string;
    monthRow: string;
    monthFromNote: string;
    domainPrepaid: string;
    nonpay: string;
    redirect: string;
    intakeOk: string;
  }
> = {
  nl: {
    eyebrow: "Offerte op maat",
    title: "Stel je project samen.",
    intro:
      "Kies je pakket, je onderhoud en je domein. Je ziet meteen je exacte prijs — eenmalig of gespreid, mét je vaste maandbedrag. Geen sterretjes, geen verrassingen.",
    l1: "1 · Kies je pakket",
    l1note: "Inbegrepen opties verschijnen automatisch. Extra opties kies je zelf.",
    incl: "Inbegrepen in dit pakket",
    extra: "Extra opties",
    l2: "2 · Onderhoud & doorgroei",
    l2note:
      "Eén onderhoudsabonnement is verplicht, vanaf maand 1. Je kiest vrij — niet gekoppeld aan je pakket — en je kan later in je klantenportaal zelf opgraden.",
    l3: "3 · Domein & e-mail",
    domain: "Domein",
    domConnect: "Eigen domein koppelen",
    domConnectD: "Je hebt al een domein — wij koppelen het. Gratis.",
    domRegister: "Nieuw domein registreren",
    domRegisterD: "Wij registreren en beheren je nieuwe domein.",
    domTransfer: "Domeinverhuis",
    domTransferD: "Je domein volledig naar ons verhuizen. Eenmalig.",
    email: "E-mail",
    mailNone: "Geen e-mail",
    mailNoneD: "Je regelt e-mail zelf of hebt het al.",
    mailOne: "1 mailbox",
    mailOneD: "Eén professioneel adres op je domein.",
    mailTeam: "Team e-mail",
    mailTeamD: "Eén adres per medewerker.",
    users: "Aantal gebruikers",
    total: "Jouw totaal",
    oneOff: "eenmalig",
    excl: "excl. btw",
    lockin: "Leg de scope nu vast",
    lockinWhy:
      "Je legt je samenstelling meteen vast — geen heen-en-weer. Ik werk daardoor efficiënter en geef dat voordeel door: {pct} % korting op het eenmalig bedrag.",
    lockinSave: "Je bespaart",
    was: "was",
    spread: "Spreiding",
    spreadNote:
      "0 % toeslag — je betaalt nooit méér dan de prijs zelf. 30 % bij opstart, de rest in gelijke maanddelen.",
    spreadLocked:
      "Spreiden kan vanaf € 750 eenmalig en min. € 75/maand. Kies (meer) opties of betaal ineens.",
    atOnce: "Ineens",
    deposit: "Aanbetaling bij opstart",
    thenPay: "daarna",
    perMonth: " / maand",
    monthlySub: "Maandelijks (verplicht abonnement)",
    perMonthShort: " / maand",
    domainYear: "Domein",
    perYear: " / jaar",
    pickBase: "Kies eerst een pakket.",
    pickSub: "Kies een onderhoudsabonnement.",
    sendTitle: "Alles juist? Vraag je offerte aan.",
    sendText:
      "Je krijgt deze samenstelling als nette offerte terug — meestal binnen één werkdag. Niets verandert tot je akkoord geeft.",
    sendButton: "Vraag deze offerte aan",
    sending: "Versturen…",
    sent: "Bedankt! Je aanvraag is binnen — ik reageer meestal binnen één werkdag.",
    err: "Er ging iets mis. Probeer opnieuw of mail info@studio-vm.be.",
    name: "Je naam",
    email2: "Je e-mail",
    msg: "Iets toevoegen? (optioneel)",
    site: "Je huidige website (optioneel)",
    siteNote:
      "Vul je dit in, dan voeren we automatisch een snelle scan uit zodat we je beter kunnen helpen.",
    pricingLink: "Of bekijk de vaste pakketten",
    sumHead: "Samenstelling",
    company: "Bedrijfsnaam (automatisch via BTW)",
    address: "Facturatieadres (automatisch via BTW)",
    vat: "BTW-nummer (bv. BE0123456789)",
    phone: "Telefoonnummer",
    viesChecking: "BTW controleren via VIES…",
    viesOk: "BTW gevonden — gegevens automatisch ingevuld",
    viesBad: "BTW niet gevonden — vul gegevens handmatig in",
    noWeb: "Ik heb (nog) geen website",
    reqHint: "Velden met * zijn verplicht",
    depositBtn: "Leg vast & betaal 30% aanbetaling",
    quoteBtn2: "Of vraag eerst een vrijblijvende offerte aan",
    payNote:
      "Je betaalt nu 30% van het project + het eerste jaar domein om je samenstelling vast te leggen. Vanaf oplevering wordt je maandfactuur opgemaakt: het maanddeel (indien gespreid) + je onderhoudsabonnement. Het domein verlengt nadien jaarlijks (€ 39/jaar).",
    depRow: "Aanbetaling — nu",
    restRow: "Saldo bij oplevering",
    restRowSpread: "Saldo gespreid",
    monthRow: "Maandfactuur vanaf oplevering",
    monthFromNote: "incl. onderhoudsabonnement",
    domainPrepaid: "incl. domein € 39 — eerste jaar vooruit",
    nonpay:
      "Bij een onbetaalde factuur wordt de website tijdelijk afgesloten tot de openstaande schuld vereffend is.",
    redirect: "Je wordt doorgestuurd naar de beveiligde betaalpagina…",
    intakeOk:
      "Je aanvraag is vastgelegd. Je ontvangt de betaallink voor de aanbetaling per e-mail.",
  },
  fr: {
    eyebrow: "Devis sur mesure",
    title: "Composez votre projet.",
    intro:
      "Choisissez votre forfait, votre maintenance et votre domaine. Vous voyez votre prix exact — en une fois ou échelonné, avec votre montant mensuel fixe. Sans astérisques.",
    l1: "1 · Choisissez votre forfait",
    l1note:
      "Les options incluses apparaissent automatiquement. Les options en plus, vous les choisissez.",
    incl: "Inclus dans ce forfait",
    extra: "Options supplémentaires",
    l2: "2 · Maintenance & évolution",
    l2note:
      "Un abonnement de maintenance est obligatoire dès le 1er mois. Choix libre — non lié au forfait — et évolutif depuis votre espace client.",
    l3: "3 · Domaine & e-mail",
    domain: "Domaine",
    domConnect: "Connecter mon domaine",
    domConnectD: "Vous avez déjà un domaine — on le connecte. Gratuit.",
    domRegister: "Enregistrer un nouveau domaine",
    domRegisterD: "On enregistre et gère votre nouveau domaine.",
    domTransfer: "Transfert de domaine",
    domTransferD: "Transférer entièrement votre domaine. Une fois.",
    email: "E-mail",
    mailNone: "Pas d'e-mail",
    mailNoneD: "Vous gérez l'e-mail vous-même ou l'avez déjà.",
    mailOne: "1 boîte mail",
    mailOneD: "Une adresse pro sur votre domaine.",
    mailTeam: "E-mail équipe",
    mailTeamD: "Une adresse par collaborateur.",
    users: "Nombre d'utilisateurs",
    total: "Votre total",
    oneOff: "unique",
    excl: "HTVA",
    lockin: "Verrouiller le scope maintenant",
    lockinWhy:
      "Vous figez votre composition tout de suite — sans allers-retours. Je travaille donc plus efficacement et je vous transmets cet avantage : {pct} % de réduction sur le montant unique.",
    lockinSave: "Vous économisez",
    was: "avant",
    spread: "Échelonnement",
    spreadNote:
      "0 % de supplément — vous ne payez jamais plus que le prix. 30 % au démarrage, le reste en parts mensuelles égales.",
    spreadLocked:
      "Échelonnement dès € 750 unique et min. € 75/mois. Ajoutez des options ou payez en une fois.",
    atOnce: "En une fois",
    deposit: "Acompte au démarrage",
    thenPay: "ensuite",
    perMonth: " / mois",
    monthlySub: "Mensuel (abonnement obligatoire)",
    perMonthShort: " / mois",
    domainYear: "Domaine",
    perYear: " / an",
    pickBase: "Choisissez d'abord un forfait.",
    pickSub: "Choisissez un abonnement de maintenance.",
    sendTitle: "Tout est bon ? Demandez votre devis.",
    sendText:
      "Vous recevez cette composition en devis soigné — généralement sous un jour ouvré. Rien ne change avant votre accord.",
    sendButton: "Demander ce devis",
    sending: "Envoi…",
    sent: "Merci ! Votre demande est reçue — je réponds généralement sous un jour ouvré.",
    err: "Une erreur est survenue. Réessayez ou écrivez à info@studio-vm.be.",
    name: "Votre nom",
    email2: "Votre e-mail",
    msg: "Ajouter un mot ? (facultatif)",
    site: "Votre site actuel (facultatif)",
    siteNote:
      "Si vous le renseignez, on lance un scan rapide pour mieux vous aider.",
    pricingLink: "Ou voir les forfaits fixes",
    sumHead: "Composition",
    company: "Nom de société (auto via TVA)",
    address: "Adresse de facturation (auto via TVA)",
    vat: "Numéro de TVA (ex. BE0123456789)",
    phone: "Numéro de téléphone",
    viesChecking: "Vérification TVA via VIES…",
    viesOk: "TVA trouvée — données remplies automatiquement",
    viesBad: "TVA introuvable — remplissez manuellement",
    noWeb: "Je n'ai pas (encore) de site",
    reqHint: "Les champs avec * sont obligatoires",
    depositBtn: "Verrouiller & payer l'acompte de 30 %",
    quoteBtn2: "Ou demandez d'abord un devis sans engagement",
    payNote:
      "Vous payez maintenant 30 % du projet + la première année de domaine pour verrouiller votre composition. Dès la livraison : la part mensuelle (si échelonnée) + votre abonnement de maintenance. Le domaine se renouvelle ensuite chaque année (39 €/an).",
    depRow: "Acompte — maintenant",
    restRow: "Solde à la livraison",
    restRowSpread: "Solde échelonné",
    monthRow: "Facture mensuelle dès la livraison",
    monthFromNote: "incl. abonnement de maintenance",
    domainPrepaid: "incl. domaine 39 € — 1ère année d'avance",
    nonpay:
      "En cas de facture impayée, le site est temporairement suspendu jusqu'au règlement de la dette.",
    redirect: "Vous êtes redirigé vers la page de paiement sécurisée…",
    intakeOk:
      "Votre demande est enregistrée. Vous recevez le lien de paiement de l'acompte par e-mail.",
  },
  en: {
    eyebrow: "Tailored quote",
    title: "Build your project.",
    intro:
      "Pick your package, your maintenance and your domain. You see your exact price — one-off or split, with your fixed monthly amount. No asterisks.",
    l1: "1 · Pick your package",
    l1note:
      "Included options appear automatically. Extra options you choose yourself.",
    incl: "Included in this package",
    extra: "Extra options",
    l2: "2 · Maintenance & growth",
    l2note:
      "One maintenance subscription is required from month 1. Free choice — not tied to your package — and upgradable later from your client portal.",
    l3: "3 · Domain & email",
    domain: "Domain",
    domConnect: "Connect my domain",
    domConnectD: "You already have a domain — we connect it. Free.",
    domRegister: "Register a new domain",
    domRegisterD: "We register and manage your new domain.",
    domTransfer: "Domain transfer",
    domTransferD: "Move your domain to us entirely. One-off.",
    email: "Email",
    mailNone: "No email",
    mailNoneD: "You handle email yourself or already have it.",
    mailOne: "1 mailbox",
    mailOneD: "One professional address on your domain.",
    mailTeam: "Team email",
    mailTeamD: "One address per team member.",
    users: "Number of users",
    total: "Your total",
    oneOff: "one-off",
    excl: "excl. VAT",
    lockin: "Lock the scope now",
    lockinWhy:
      "You lock your composition right away — no back-and-forth. I work more efficiently and pass that benefit on: {pct}% off the one-off amount.",
    lockinSave: "You save",
    was: "was",
    spread: "Instalments",
    spreadNote:
      "0 % surcharge — you never pay more than the price itself. 30 % at start, the rest in equal monthly parts.",
    spreadLocked:
      "Instalments from € 750 one-off and min. € 75/month. Add options or pay at once.",
    atOnce: "At once",
    deposit: "Deposit at start",
    thenPay: "then",
    perMonth: " / month",
    monthlySub: "Monthly (required subscription)",
    perMonthShort: " / month",
    domainYear: "Domain",
    perYear: " / year",
    pickBase: "Pick a package first.",
    pickSub: "Pick a maintenance subscription.",
    sendTitle: "All correct? Request your quote.",
    sendText:
      "You get this composition back as a clean quote — usually within one working day. Nothing changes until you agree.",
    sendButton: "Request this quote",
    sending: "Sending…",
    sent: "Thanks! Your request is in — I usually reply within one working day.",
    err: "Something went wrong. Try again or email info@studio-vm.be.",
    name: "Your name",
    email2: "Your email",
    msg: "Add something? (optional)",
    site: "Your current website (optional)",
    siteNote:
      "If you fill this in, we run a quick scan so we can help you better.",
    pricingLink: "Or see the fixed packages",
    sumHead: "Composition",
    company: "Company name (auto via VAT)",
    address: "Billing address (auto via VAT)",
    vat: "VAT number (e.g. BE0123456789)",
    phone: "Phone number",
    viesChecking: "Checking VAT via VIES…",
    viesOk: "VAT found — details filled automatically",
    viesBad: "VAT not found — fill in manually",
    noWeb: "I don't have a website (yet)",
    reqHint: "Fields marked * are required",
    depositBtn: "Lock in & pay 30% deposit",
    quoteBtn2: "Or request a no-obligation quote first",
    payNote:
      "You pay 30% of the project + the first domain year now to lock your composition. From delivery, your monthly invoice is issued: the monthly part (if split) + your maintenance subscription. The domain then renews yearly (€ 39/year).",
    depRow: "Deposit — now",
    restRow: "Balance at delivery",
    restRowSpread: "Balance split",
    monthRow: "Monthly invoice from delivery",
    monthFromNote: "incl. maintenance subscription",
    domainPrepaid: "incl. domain € 39 — first year upfront",
    nonpay:
      "If an invoice is left unpaid, the website is temporarily suspended until the outstanding debt is settled.",
    redirect: "You are being redirected to the secure payment page…",
    intakeOk:
      "Your request is registered. You'll receive the deposit payment link by email.",
  },
};

export default function OffertePage() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = T[locale];

  const { bases, addons } = useMemo(() => offerCatalog(), []);
  const subs = useMemo(() => subscriptionTiers(), []);

  const [baseSlug, setBaseSlug] = useState("");
  const [extras, setExtras] = useState<Set<string>>(new Set());
  const [subSlug, setSubSlug] = useState("");
  const [domain, setDomain] = useState<Domain>("connect");
  const [mail, setMail] = useState<Mail>("none");
  const [users, setUsers] = useState(3);
  const [term, setTerm] = useState<number>(0);
  const [lockin, setLockin] = useState(false);
  const [sent, setSent] = useState<"idle" | "ok" | "err" | "intake">(
    "idle",
  );
  const [vatNo, setVatNo] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [vies, setVies] = useState<"idle" | "checking" | "ok" | "bad">(
    "idle",
  );
  const [noWeb, setNoWeb] = useState(false);
  const [website, setWebsite] = useState("");

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
  const [pending, startSend] = useTransition();

  const base = bases.find((b) => b.slug === baseSlug);
  const inc = baseSlug ? OFFER_INCLUDED[baseSlug] : undefined;
  const incNames = useMemo(() => inc?.addons ?? [], [inc]);
  const subTier = subs.find((s) => s.slug === subSlug);

  const toggleExtra = (key: string) =>
    setExtras((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  // Eenmalige lijnen
  const paidExtras = useMemo(
    () =>
      addons.filter(
        (a) => extras.has(a.key) && !incNames.includes(a.name),
      ),
    [addons, extras, incNames],
  );

  const eenmalig =
    (base?.cents ?? 0) +
    paidExtras.reduce((s, a) => s + a.cents, 0) +
    (domain === "transfer" ? TRANSFER_CENTS : 0);

  const mailMonthly =
    mail === "one"
      ? MAIL_ONE_CENTS
      : mail === "team"
        ? MAIL_USER_CENTS * Math.max(1, users)
        : 0;

  const monthlyRecurring = (subTier?.cents ?? 0) + mailMonthly;
  const domainYear = domain === "register" ? REGISTER_CENTS : 0;

  const pct = Math.round(LOCKIN_DISCOUNT * 100);
  const discount = lockin ? Math.round(eenmalig * LOCKIN_DISCOUNT) : 0;
  const payable = eenmalig - discount;

  const deposit = Math.round(payable * DEPOSIT);
  const rest = payable - deposit;
  const planFor = (n: number) => {
    if (n === 0) return { eligible: true, monthly: 0, deposit: 0 };
    const m = Math.ceil(rest / n);
    const eligible = payable >= MIN_SPREAD && m >= MIN_MONTHLY;
    return { eligible, monthly: m, deposit };
  };
  const spreadPossible = payable >= MIN_SPREAD;
  const plan = planFor(term);
  const depositTotal = deposit + domainYear;
  const monthlyAfter =
    (term > 0 && plan.eligible ? plan.monthly : 0) + monthlyRecurring;

  const domMailNote =
    locale === "fr"
      ? "Domaine & e-mail : à voir ensemble après le projet (hors prix)"
      : locale === "en"
        ? "Domain & email: discussed together after the project (not in price)"
        : "Domein & e-mail: nog samen te bespreken (niet in de prijs)";
  const termLabel =
    term === 0
      ? c.atOnce
      : `${c.spread}: ${term}× ${eur(plan.monthly)}${c.perMonth}`;

  const fld =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  function submit(fd: FormData) {
    if (String(fd.get("website") ?? "")) {
      setSent("ok");
      return;
    }
    const intent = String(fd.get("intent") ?? "quote");
    startSend(async () => {
      if (intent === "deposit") {
        const r = await startOffer(fd);
        if (r.ok && r.pay) {
          window.location.href = r.url;
          return;
        }
        if (r.ok) {
          setSent("intake");
          return;
        }
        setSent("err");
        return;
      }
      const sumLines = [
        `Pakket: ${base ? base.name : "—"} (${eur(base?.cents ?? 0)})`,
        inc
          ? `Inbegrepen: ${incNames.join(", ")} · ${subs.find((s) => s.slug === inc.sub)?.name ?? inc.sub} · ${inc.lang}`
          : "",
        paidExtras.length
          ? `Extra opties: ${paidExtras
              .map((a) => `${a.name} (${eur(a.cents)})`)
              .join(", ")}`
          : "Extra opties: —",
        `Onderhoud (verplicht): ${subTier ? `${subTier.name} — ${eur(subTier.cents)}/maand` : "—"}`,
        domMailNote,
        "",
        discount > 0
          ? `Eenmalig: ${eur(payable)} (${c.excl}) — directe-vastlegkorting ${pct} % toegepast (was ${eur(eenmalig)}, bespaart ${eur(discount)})`
          : `Eenmalig: ${eur(eenmalig)} (${c.excl})`,
        term === 0
          ? `Betaling: ineens`
          : `Betaling: ${eur(plan.deposit)} bij opstart, daarna ${term}× ${eur(plan.monthly)}/maand`,
        `Maandelijks abonnement: ${eur(monthlyRecurring)}/maand`,
        `Aanbetaling nu (excl. btw): ${eur(depositTotal)}`,
        `Nu te betalen incl. 21% btw: ${eur(Math.round(depositTotal * (1 + VAT_RATE)))}`,
        `Maandfactuur vanaf oplevering: ${eur(monthlyAfter)}/maand`,
      ].filter(Boolean);

      const userMsg = String(fd.get("message") ?? "").trim();
      const message =
        `— Samenstelling via configurator —\n${sumLines.join("\n")}` +
        (userMsg ? `\n\n— Bericht van de klant —\n${userMsg}` : "");

      fd.set("locale", locale);
      fd.set("base", base?.slug ?? "");
      fd.set("plan", subSlug);
      fd.set(
        "modules",
        [
          ...paidExtras.map((a) => a.name),
          termLabel,
          domMailNote,
          ...(discount > 0 ? [`Scope vastgelegd −${pct}%`] : []),
        ].join(", "),
      );
      fd.set("estLow", String(Math.round(payable / 100)));
      fd.set("estHigh", String(Math.round(payable / 100)));
      fd.set("monthly", String(Math.round(monthlyRecurring / 100)));
      fd.set("message", message);

      const r = await submitQuote(fd);
      if (r.ok) setSent("ok");
      else setSent("err");
    });
  }

  const canSend = !!base && !!subSlug;

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
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-14">
            {/* Luik 1 — pakket */}
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
                {c.l1}
              </h2>
              <p className="mb-5 mt-1 text-sm text-muted">{c.l1note}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {bases.map((b) => {
                  const on = baseSlug === b.slug;
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setBaseSlug(b.slug ?? "")}
                      className={`rounded-2xl border p-5 text-left transition-colors ${
                        on
                          ? "border-accent bg-card-hover"
                          : "border-border bg-card hover:bg-card-hover"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold tracking-tight">
                          {b.name}
                        </span>
                        {on && (
                          <Check
                            className="h-4 w-4 shrink-0 text-accent"
                            strokeWidth={2.5}
                          />
                        )}
                      </div>
                      <p className="mt-3 font-mono text-xs text-muted">
                        {eur(b.cents)} {c.oneOff}
                      </p>
                    </button>
                  );
                })}
              </div>

              {inc && (
                <div className="mt-5 rounded-2xl border border-accent/30 bg-accent/5 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    {c.incl} · {inc.lang}
                  </p>
                  <ul className="mt-3 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
                    {incNames.map((n) => (
                      <li key={n} className="flex items-center gap-2">
                        <Check
                          className="h-3.5 w-3.5 shrink-0 text-accent"
                          strokeWidth={2.5}
                        />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {base && (
                <div className="mt-5">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {c.extra}
                  </p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {addons
                      .filter((a) => !incNames.includes(a.name))
                      .map((a) => {
                        const on = extras.has(a.key);
                        return (
                          <label
                            key={a.key}
                            className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              on
                                ? "border-accent bg-accent/5"
                                : "bg-background hover:bg-card-hover"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={on}
                              onChange={() => toggleExtra(a.key)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="font-medium">{a.name}</span>
                              {a.desc && (
                                <span className="mt-0.5 block text-xs text-muted">
                                  {a.desc}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 font-mono text-xs text-muted">
                              {eur(a.cents)}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Luik 2 — onderhoud */}
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-accent">
                {c.l2}
              </h2>
              <p className="mb-5 mt-1 text-sm text-muted">{c.l2note}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {subs.map((s) => {
                  const on = subSlug === s.slug;
                  return (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => setSubSlug(s.slug)}
                      className={`flex flex-col rounded-2xl border p-5 text-left transition-colors ${
                        on
                          ? "border-accent bg-card-hover"
                          : "border-border bg-card hover:bg-card-hover"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold tracking-tight">
                          {s.name}
                        </span>
                        {on && (
                          <Check
                            className="h-4 w-4 shrink-0 text-accent"
                            strokeWidth={2.5}
                          />
                        )}
                      </div>
                      <p className="mt-1 min-h-[2.25rem] text-xs leading-snug text-muted">
                        {s.tagline}
                      </p>
                      <p className="mt-2 font-mono text-sm">
                        {eur(s.cents)}
                        <span className="text-muted">{c.perMonthShort}</span>
                      </p>
                      <ul className="mt-3 flex-1 space-y-1.5 text-xs leading-snug text-muted">
                        {s.features.slice(0, 4).map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <Check
                              className="mt-0.5 h-3 w-3 shrink-0 text-accent"
                              strokeWidth={3}
                            />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Luik 3 — domein & e-mail (info, niet in de prijs) */}
            <div>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
                {c.l3}
              </h2>
              <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
                <p className="text-sm font-semibold">
                  {locale === "fr"
                    ? "À voir ensemble après le projet"
                    : locale === "en"
                      ? "Discussed together after the project"
                      : "Achteraf samen te bekijken"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {locale === "fr"
                    ? "Domaine, e-mail et transfert éventuel restent volontairement hors de ce prix. Votre projet démarre sur une adresse Vercel temporaire ; ensuite on regarde tranquillement ce qui est possible et nécessaire — entièrement négociable, même si vous avez déjà payé un domaine ailleurs. Les montants ci-dessous sont indicatifs."
                    : locale === "en"
                      ? "Domain, email and any transfer are deliberately kept out of this price. Your project starts on a temporary Vercel address; afterwards we calmly look at what's possible and needed — fully open to discuss, even if you've already paid for a domain elsewhere. The amounts below are indicative."
                      : "Domein, e-mail en een eventuele verhuis houden we bewust buiten deze prijs. Je project start op een tijdelijk Vercel-adres; daarna bekijken we samen rustig wat kan en moet — volledig bespreekbaar, ook als je je domein al ergens betaald hebt. Onderstaande bedragen zijn richtprijzen ter info."}
                </p>
              </div>

              <p className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.domain}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    [c.domConnect, c.domConnectD, "gratis"],
                    [
                      c.domRegister,
                      c.domRegisterD,
                      `${eur(REGISTER_CENTS)}${c.perYear}`,
                    ],
                    [
                      c.domTransfer,
                      c.domTransferD,
                      `${eur(TRANSFER_CENTS)} ${c.oneOff}`,
                    ],
                  ] as [string, string, string][]
                ).map(([label, d, price]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-dashed border-border bg-card/50 p-4"
                  >
                    <span className="font-semibold tracking-tight">
                      {label}
                    </span>
                    <p className="mt-1 min-h-[2.25rem] text-xs leading-snug text-muted">
                      {d}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {price}{" "}
                      <span className="opacity-70">
                        ·{" "}
                        {locale === "fr"
                          ? "indicatif"
                          : locale === "en"
                            ? "indicative"
                            : "richtprijs"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              <p className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.email}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    [c.mailNone, c.mailNoneD, "—"],
                    [
                      c.mailOne,
                      c.mailOneD,
                      `${eur(MAIL_ONE_CENTS)}${c.perMonth}`,
                    ],
                    [
                      c.mailTeam,
                      c.mailTeamD,
                      `${eur(MAIL_USER_CENTS)}${c.perMonth}`,
                    ],
                  ] as [string, string, string][]
                ).map(([label, d, price]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-dashed border-border bg-card/50 p-4"
                  >
                    <span className="font-semibold tracking-tight">
                      {label}
                    </span>
                    <p className="mt-1 min-h-[2.25rem] text-xs leading-snug text-muted">
                      {d}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {price}
                      {price !== "—" && (
                        <span className="opacity-70">
                          {" "}
                          ·{" "}
                          {locale === "fr"
                            ? "indicatif"
                            : locale === "en"
                              ? "indicative"
                              : "richtprijs"}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky eindtotaal */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                {c.total}
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {eur(payable)}
                {discount > 0 && (
                  <span className="ml-2 align-middle font-mono text-sm font-normal text-muted line-through">
                    {eur(eenmalig)}
                  </span>
                )}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                {c.oneOff} · {c.excl}
              </p>
              {discount > 0 && (
                <p className="mt-1 font-mono text-xs text-accent">
                  {c.lockinSave} {eur(discount)} ({pct} %)
                </p>
              )}

              {/* Directe-vastlegkorting — transparant */}
              {eenmalig > 0 && (
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-accent/30 bg-accent/5 p-3">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={lockin}
                    onChange={(e) => setLockin(e.target.checked)}
                  />
                  <span className="min-w-0 text-sm">
                    <span className="font-medium">
                      {c.lockin} · −{pct} %
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {c.lockinWhy.replace("{pct}", String(pct))}
                    </span>
                  </span>
                </label>
              )}

              {/* Aflossingstabel */}
              <div className="mt-5 border-t pt-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {c.spread}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TERMS.map((n) => {
                    const p = planFor(n);
                    const sel = term === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={!p.eligible}
                        onClick={() => setTerm(n)}
                        className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          sel
                            ? "border-accent bg-accent text-white"
                            : "border-border hover:bg-card-hover"
                        }`}
                      >
                        {n === 0 ? c.atOnce : `${n}×`}
                      </button>
                    );
                  })}
                </div>
                {term > 0 && plan.eligible ? (
                  <div className="mt-3 text-sm">
                    <p>
                      {c.deposit}:{" "}
                      <strong>{eur(plan.deposit)}</strong>
                    </p>
                    <p className="mt-0.5">
                      {c.thenPay} {term}×{" "}
                      <strong>{eur(plan.monthly)}</strong>
                      {c.perMonth}
                    </p>
                  </div>
                ) : null}
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {spreadPossible ? c.spreadNote : c.spreadLocked}
                </p>
              </div>

              {/* Betaalplan */}
              <div className="mt-4 border-t pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">{c.depRow}</span>
                  <strong>{eur(depositTotal)}</strong>
                </div>
                {domainYear > 0 && (
                  <p className="mt-0.5 font-mono text-[10px] text-muted">
                    {c.domainPrepaid}
                  </p>
                )}
                <div className="mt-1.5 flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2">
                  <span className="text-xs font-medium text-accent">
                    {locale === "fr"
                      ? "À payer maintenant (TVA 21 % incl.)"
                      : locale === "en"
                        ? "To pay now (incl. 21% VAT)"
                        : "Nu te betalen (incl. 21% btw)"}
                  </span>
                  <strong className="text-accent">
                    {eur(Math.round(depositTotal * (1 + VAT_RATE)))}
                  </strong>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-muted">
                    {term > 0 && plan.eligible ? c.restRowSpread : c.restRow}
                  </span>
                  <strong>
                    {term > 0 && plan.eligible
                      ? `${term}× ${eur(plan.monthly)}`
                      : eur(rest)}
                  </strong>
                </div>
                <div className="mt-2 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{c.monthRow}</span>
                    <strong>
                      {eur(monthlyAfter)}
                      {c.perMonthShort}
                    </strong>
                  </div>
                  <div className="mt-1.5 space-y-0.5 font-mono text-[10px] text-muted">
                    {term > 0 && plan.eligible && (
                      <div className="flex items-center justify-between">
                        <span>
                          {locale === "fr"
                            ? "Part mensuelle projet"
                            : locale === "en"
                              ? "Project instalment"
                              : "Maanddeel project"}
                        </span>
                        <span>{eur(plan.monthly)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>
                        {locale === "fr"
                          ? "Maintenance"
                          : locale === "en"
                            ? "Maintenance"
                            : "Onderhoud"}
                      </span>
                      <span>
                        {subTier
                          ? eur(subTier.cents)
                          : locale === "fr"
                            ? "à choisir"
                            : locale === "en"
                              ? "pick one"
                              : "kies abonnement"}
                      </span>
                    </div>
                    {mail !== "none" && (
                      <div className="flex items-center justify-between">
                        <span>
                          {locale === "fr"
                            ? "E-mail"
                            : locale === "en"
                              ? "Email"
                              : "E-mail"}
                          {mail === "team"
                            ? ` (${Math.max(1, users)}×)`
                            : ""}
                        </span>
                        <span>{eur(mailMonthly)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-muted">
                  {c.monthFromNote}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {c.payNote}
                </p>
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 dark:border-amber-600/70 dark:bg-amber-950/50">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                    strokeWidth={2.5}
                  />
                  <p className="text-xs font-semibold leading-relaxed text-amber-900 dark:text-amber-200">
                    {c.nonpay}
                  </p>
                </div>
              </div>

              {!base && (
                <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">
                  {c.pickBase}
                </p>
              )}
              {base && !subSlug && (
                <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">
                  {c.pickSub}
                </p>
              )}

              <a
                href="#aanvraag"
                aria-disabled={!canSend}
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-opacity ${
                  canSend
                    ? "bg-foreground text-background hover:opacity-90"
                    : "pointer-events-none bg-border text-muted"
                }`}
              >
                <Send className="h-4 w-4" strokeWidth={2} />
                {c.depositBtn}
              </a>
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

      <section id="aanvraag" className="scroll-mt-28 border-b">
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {c.sendTitle}
          </h2>
          <p className="mt-3 text-muted">{c.sendText}</p>

          {sent === "ok" || sent === "intake" ? (
            <p className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm font-medium text-accent">
              {sent === "intake" ? c.intakeOk : c.sent}
            </p>
          ) : (
            <form action={submit} className="mt-8 space-y-3 text-left">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              <input type="hidden" name="locale" value={locale} />
              <input
                type="hidden"
                name="baseSlug"
                value={base?.slug ?? ""}
              />
              <input type="hidden" name="subSlug" value={subSlug} />
              <input
                type="hidden"
                name="extras"
                value={Array.from(extras).join(",")}
              />
              <input type="hidden" name="domain" value={domain} />
              <input type="hidden" name="mail" value={mail} />
              <input type="hidden" name="users" value={users} />
              <input type="hidden" name="term" value={term} />
              <p className="px-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                {c.reqHint}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="name"
                  required
                  placeholder={`${c.name} *`}
                  className="rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={`${c.email2} *`}
                  className="rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="phone"
                  type="tel"
                  required
                  placeholder={`${c.phone} *`}
                  className="rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <input
                  name="vat_number"
                  value={vatNo}
                  onChange={(e) => setVatNo(e.target.value)}
                  onBlur={checkVat}
                  placeholder={c.vat}
                  className="rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
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
                    <Loader2
                      className="h-3 w-3 animate-spin"
                      strokeWidth={2}
                    />
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
                className="w-full rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={c.address}
                className="w-full rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
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
                  value={noWeb ? "" : website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder={noWeb ? c.site : `${c.site} *`}
                  className="w-full rounded-full border bg-background px-4 py-3 text-sm outline-none focus:border-accent disabled:opacity-50"
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
              <button
                type="submit"
                name="intent"
                value="deposit"
                disabled={pending || !canSend}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Send className="h-4 w-4" strokeWidth={2} />
                )}
                {pending ? c.redirect : c.depositBtn}
              </button>
              <button
                type="submit"
                name="intent"
                value="quote"
                disabled={pending || !canSend}
                className="block w-full text-center font-mono text-xs text-muted transition-colors hover:text-foreground disabled:opacity-60"
              >
                {c.quoteBtn2}
              </button>
              <div className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 dark:border-amber-600/70 dark:bg-amber-950/50">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                  strokeWidth={2.5}
                />
                <p className="text-xs font-semibold leading-relaxed text-amber-900 dark:text-amber-200">
                  {c.nonpay}
                </p>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
