// Alle mails van Studio VM aan klanten, als pure bouwers: gegevens + taal in,
// { subject, html, replyTo } uit. Geen databank, geen verzending — de server
// actions en crons zoeken de gegevens en de taal op en geven het resultaat
// aan sendMail(). Zo zijn alle klantmails op één plek na te lezen, en tonen
// de mail-preview in de admin en het voorbeeldscript exact wat er vertrekt.
//
// Regels voor elke klantmail:
// - in de taal van de klant (nl/fr/en/de/es), formeel (u/vous/Sie/usted),
//   in de ik-vorm van Studio VM, zonder persoonsnaam (dat is enkel voor
//   één-op-één-mails, juridische regels en facturen/offertes);
// - over 3D-modellen voor machinesturing — geen woorden uit de websitetijd,
//   behalve in de archiefmails onderaan (enkel oude websiteklanten);
// - lichte huisstijl (portalEmailHtml), links naar https://www.studio-vm.be
//   met de juiste /<taal>/…-deeplink, antwoorden gaan naar info@studio-vm.be;
// - alle tekst van klanten of uit de databank gaat door esc().

import {
  invoicePaidPreviewHtml,
  mailBedrag,
  mailDatum,
  offerPreviewHtml,
  portaalLink,
  portalEmailHtml,
  siteLink,
  type OfferPreview,
} from "@/lib/email";
import { BEDRIJF, FUNCTIE } from "@/lib/bedrijf";
import { KORTING_LABEL, MAIL, bedragMetBtw, modelLijn, systemenLijn, urenTekst, type Taal } from "@/lib/projecten-teksten";
import { TICKET_MAIL, revisieTariefZin } from "@/lib/tickets-teksten";
import { esc, soortVan, tekstNaarHtml, ticketRef, toonOnderwerp } from "@/lib/tickets";
import { UURTARIEF_CENT, euro, type Categorie } from "@/lib/tarieven";
import { CATEGORIE_LABEL } from "@/lib/projecten";
import { BANK, structuredComm } from "@/lib/bank";
import { verwijlinterest, type Verwijlinterest } from "@/lib/facturatie/rente";

export type { Taal };

/** Antwoorden op een klantmail komen in deze inbox. */
export const ANTWOORD_ADRES = BEDRIJF.email;

export type KlantMail = { subject: string; html: string; replyTo: string };

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

function taalVan(t: string | null | undefined): Taal {
  return t === "fr" || t === "en" || t === "de" || t === "es" ? t : "nl";
}

/** Het bericht zelf, als rustig citaatblok onder de inleiding. `html` is al veilig. */
export function citaatHtml(html: string): string {
  return `<div style="margin:0 0 18px;padding:14px 18px;background:#fafaf9;border:1px solid #e7e5e4;border-left:3px solid #e08214;border-radius:8px;font:400 15px/1.7 ${FONT};color:#1c1917">${html}</div>`;
}

/** Losse alinea binnen extraHtml. `html` is al veilig. */
export function alineaHtml(html: string, klein = false): string {
  return `<p style="margin:0 0 14px;font:400 ${klein ? "14px/1.6" : "16px/1.7"} ${FONT};color:${klein ? "#78716c" : "#44403c"}">${html}</p>`;
}

/** Kleine tabel "label — waarde" in een lichte kaart. Waarden zijn al veilig. */
function kaartTabel(kop: string, rijen: [string, string][]): string {
  const r = rijen
    .map(
      ([k, w]) =>
        `<tr><td valign="top" style="padding:6px 16px 6px 0;font:400 14px/1.5 ${FONT};color:#78716c;white-space:nowrap">${k}</td><td valign="top" style="padding:6px 0;font:600 14px/1.5 ${FONT};color:#1c1917">${w}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;border-collapse:separate"><tr><td class="svm-blok" style="padding:22px 26px">
<p style="margin:0 0 10px;font:700 12px/1 ${MONO};letter-spacing:.14em;text-transform:uppercase;color:#78716c">${kop}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${r}</table>
</td></tr></table>`;
}

const OVERSCHRIJVING: Record<Taal, { kop: string; begunstigde: string; bedrag: string; mededeling: string }> = {
  nl: { kop: "Betalen per overschrijving", begunstigde: "Begunstigde", bedrag: "Bedrag", mededeling: "Mededeling" },
  fr: { kop: "Paiement par virement", begunstigde: "Bénéficiaire", bedrag: "Montant", mededeling: "Communication" },
  en: { kop: "Pay by bank transfer", begunstigde: "Beneficiary", bedrag: "Amount", mededeling: "Reference" },
  de: { kop: "Zahlung per Überweisung", begunstigde: "Empfänger", bedrag: "Betrag", mededeling: "Mitteilung" },
  es: { kop: "Pago por transferencia", begunstigde: "Beneficiario", bedrag: "Importe", mededeling: "Comunicación" },
};

/** Betaalkaart voor een factuur: begunstigde, IBAN, BIC, bedrag en de gestructureerde mededeling. */
function overschrijving(taal: Taal, nummer: string, bedragInclCent: number): string {
  const T = OVERSCHRIJVING[taal];
  return kaartTabel(T.kop, [
    [T.begunstigde, esc(BANK.holder)],
    ["IBAN", `<span style="font-family:${MONO}">${esc(BANK.iban)}</span>`],
    ["BIC", `<span style="font-family:${MONO}">${esc(BANK.bic)}</span>`],
    [T.bedrag, mailBedrag(bedragInclCent, taal)],
    [T.mededeling, `<span style="font-family:${MONO};font-size:15px">${esc(structuredComm(nummer))}</span>`],
  ]);
}

// ── Gemeenschappelijke teksten ──────────────────────────────────────────

const ALG: Record<
  Taal,
  {
    eyebrowPortaal: string;
    ctaPortaal: string;
    hallo: (naam?: string | null) => string;
    vragen: string;
    groet: string;
  }
> = {
  nl: {
    eyebrowPortaal: "Uw klantenportaal",
    ctaPortaal: "Open uw klantenportaal",
    hallo: (n) => (n ? `Beste ${n},` : "Beste,"),
    vragen: "Vragen? Antwoord gewoon op deze mail.",
    groet: "Met vriendelijke groet,",
  },
  fr: {
    eyebrowPortaal: "Votre espace client",
    ctaPortaal: "Ouvrir votre espace client",
    hallo: (n) => (n ? `Bonjour ${n},` : "Bonjour,"),
    vragen: "Une question ? Répondez simplement à cet e-mail.",
    groet: "Bien cordialement,",
  },
  en: {
    eyebrowPortaal: "Your client portal",
    ctaPortaal: "Open your client portal",
    hallo: (n) => (n ? `Dear ${n},` : "Hello,"),
    vragen: "Any questions? Simply reply to this email.",
    groet: "Kind regards,",
  },
  de: {
    eyebrowPortaal: "Ihr Kundenportal",
    ctaPortaal: "Ihr Kundenportal öffnen",
    hallo: (n) => (n ? `Guten Tag ${n},` : "Guten Tag,"),
    vragen: "Fragen? Antworten Sie einfach auf diese E-Mail.",
    groet: "Mit freundlichen Grüßen",
  },
  es: {
    eyebrowPortaal: "Su portal de cliente",
    ctaPortaal: "Abrir su portal de cliente",
    hallo: (n) => (n ? `Estimado/a ${n}:` : "Buenos días:"),
    vragen: "¿Alguna pregunta? Basta con responder a este correo.",
    groet: "Atentamente,",
  },
};

/** Voornaam (eerste woord), HTML-veilig, of null. */
function voornaam(naam: string | null | undefined): string | null {
  const v = String(naam ?? "").trim().split(/\s+/)[0];
  return v ? esc(v) : null;
}

/** Ondertekening zonder persoonsnaam: "Met vriendelijke groet, / Studio VM · 3D-Topograaf". */
function ondertekening(taal: Taal): string {
  return `${ALG[taal].groet}<br><strong style="color:#44403c">Studio VM</strong> &middot; ${FUNCTIE[taal]}<br>${BEDRIJF.telefoon} &middot; <a href="mailto:${BEDRIJF.email}" style="color:#78716c">${BEDRIJF.email}</a>`;
}

function mail(
  taal: Taal,
  subject: string,
  o: {
    eyebrow: string;
    /** Platte tekst (wordt ge-escaped); standaard het onderwerp. */
    titel?: string;
    regels: string[];
    extraHtml?: string;
    cta: string;
    href: string;
    footnote?: string;
  },
): KlantMail {
  return {
    subject,
    replyTo: ANTWOORD_ADRES,
    html: portalEmailHtml({
      locale: taal,
      eyebrow: o.eyebrow,
      title: esc(o.titel ?? subject),
      bodyLines: o.regels,
      extraHtml: o.extraHtml,
      ctaLabel: o.cta,
      ctaHref: o.href,
      footnote: o.footnote,
    }),
  };
}

// ── 1. Inloglink (portaal) ──────────────────────────────────────────────

const LOGIN: Record<Taal, { subject: string; title: string; intro: string; cta: string; note: string }> = {
  nl: {
    subject: "Uw inloglink voor het klantenportaal van Studio VM",
    title: "Aanmelden op uw klantenportaal",
    intro:
      "Klik op de knop hieronder om veilig aan te melden op uw klantenportaal. Daar volgt u uw 3D-projecten op: van de plannen tot de modelbestanden per machinesturing. Een wachtwoord is niet nodig.",
    cta: "Open mijn portaal",
    note: "Deze link is persoonlijk, werkt één keer en is ongeveer 1 uur geldig. Niet aangevraagd? Dan mag u deze e-mail negeren.",
  },
  fr: {
    subject: "Votre lien de connexion à l'espace client Studio VM",
    title: "Connexion à votre espace client",
    intro:
      "Cliquez sur le bouton ci-dessous pour vous connecter en toute sécurité à votre espace client. Vous y suivez vos projets 3D : des plans jusqu'aux fichiers du modèle pour chaque système de guidage. Aucun mot de passe n'est nécessaire.",
    cta: "Ouvrir mon espace client",
    note: "Ce lien est personnel, utilisable une seule fois et valable environ 1 heure. Vous ne l'avez pas demandé ? Vous pouvez ignorer cet e-mail.",
  },
  en: {
    subject: "Your login link for the Studio VM client portal",
    title: "Sign in to your client portal",
    intro:
      "Click the button below to sign in securely to your client portal, where you follow your 3D projects: from the plans to the model files for each machine control system. No password needed.",
    cta: "Open my portal",
    note: "This link is personal, works once and is valid for about 1 hour. Didn't request it? You can safely ignore this email.",
  },
  de: {
    subject: "Ihr Anmeldelink für das Kundenportal von Studio VM",
    title: "Anmeldung in Ihrem Kundenportal",
    intro:
      "Klicken Sie auf die Schaltfläche unten, um sich sicher in Ihrem Kundenportal anzumelden. Dort verfolgen Sie Ihre 3D-Projekte: von den Plänen bis zu den Modelldateien für jede Maschinensteuerung. Ein Passwort ist nicht nötig.",
    cta: "Mein Portal öffnen",
    note: "Dieser Link ist persönlich, einmal verwendbar und etwa 1 Stunde gültig. Nicht angefordert? Dann können Sie diese E-Mail ignorieren.",
  },
  es: {
    subject: "Su enlace de acceso al portal de clientes de Studio VM",
    title: "Acceso a su portal de cliente",
    intro:
      "Haga clic en el botón de abajo para acceder de forma segura a su portal de cliente. Allí sigue sus proyectos 3D: desde los planos hasta los archivos del modelo para cada sistema de control de máquina. No necesita contraseña.",
    cta: "Abrir mi portal",
    note: "Este enlace es personal, funciona una sola vez y es válido durante aproximadamente 1 hora. ¿No lo ha solicitado? Puede ignorar este correo.",
  },
};

/** `link` = de tussenpagina /auth/confirm?token_hash=… (knop, zodat scanners de token niet verbruiken). */
export function loginMail(taalIn: string, link: string): KlantMail {
  const taal = taalVan(taalIn);
  const L = LOGIN[taal];
  return mail(taal, L.subject, {
    eyebrow: ALG[taal].eyebrowPortaal,
    titel: L.title,
    regels: [L.intro],
    cta: L.cta,
    href: link,
    footnote: L.note,
  });
}

// ── 2. Offerteaanvraag ontvangen (formulier /offerte of portaal) ─────────

const AANVRAAG: Record<
  Taal,
  {
    subject: string;
    eyebrow: string;
    titel: string;
    tekst: (metPlannen: boolean) => string;
    samenvatting: string;
    werf: string;
    stelsel: string;
    merk: string;
    plannen: string;
    geen: string;
    portaal: string;
    cta: string;
    vraag: string;
  }
> = {
  nl: {
    subject: "Uw aanvraag voor een 3D-model is goed ontvangen",
    eyebrow: "Offerteaanvraag",
    titel: "Bedankt voor uw aanvraag",
    tekst: (p) =>
      p
        ? "Ik bekijk uw plannen en bezorg u zo snel mogelijk een offerte op maat, met prijs en leverdatum."
        : "Ik bekijk uw aanvraag en bezorg u zo snel mogelijk een offerte op maat, met prijs en leverdatum. De plannen nog niet meegestuurd? Voeg ze toe in uw klantenportaal, of antwoord op deze mail met de plannen in bijlage.",
    samenvatting: "Wat ik ontving",
    werf: "Werf",
    stelsel: "Voorgesteld stelsel",
    merk: "Machinesturing",
    plannen: "Plannen",
    geen: "nog geen",
    portaal: "In uw klantenportaal volgt u dit project op: daar vindt u uw plannen, straks de offerte en daarna de modelbestanden. U meldt aan met dit e-mailadres — u krijgt een inloglink, geen wachtwoord nodig.",
    cta: "Open uw project",
    vraag: "Klopt er iets niet, of wilt u plannen bijsturen? Antwoord gewoon op deze mail.",
  },
  fr: {
    subject: "Votre demande de modèle 3D a bien été reçue",
    eyebrow: "Demande de devis",
    titel: "Merci pour votre demande",
    tekst: (p) =>
      p
        ? "J'examine vos plans et vous envoie au plus vite un devis sur mesure, avec prix et date de livraison."
        : "J'examine votre demande et vous envoie au plus vite un devis sur mesure, avec prix et date de livraison. Vous n'avez pas encore joint les plans ? Ajoutez-les dans votre espace client, ou répondez à cet e-mail avec les plans en pièce jointe.",
    samenvatting: "Ce que j'ai reçu",
    werf: "Chantier",
    stelsel: "Système proposé",
    merk: "Guidage d'engins",
    plannen: "Plans",
    geen: "pas encore",
    portaal: "Dans votre espace client, vous suivez ce projet : vous y trouvez vos plans, bientôt le devis, puis les fichiers du modèle. Connexion avec cette adresse e-mail — vous recevez un lien de connexion, sans mot de passe.",
    cta: "Ouvrir votre projet",
    vraag: "Une erreur, ou des plans à modifier ? Répondez simplement à cet e-mail.",
  },
  en: {
    subject: "Your request for a 3D model has been received",
    eyebrow: "Quote request",
    titel: "Thank you for your request",
    tekst: (p) =>
      p
        ? "I will review your plans and send you a tailored quote with price and delivery date as soon as possible."
        : "I will review your request and send you a tailored quote with price and delivery date as soon as possible. Haven't sent the plans yet? Add them in your client portal, or reply to this email with the plans attached.",
    samenvatting: "What I received",
    werf: "Site",
    stelsel: "Proposed coordinate system",
    merk: "Machine control",
    plannen: "Plans",
    geen: "none yet",
    portaal: "In your client portal you can follow this project: your plans are there, soon the quote and then the model files. You sign in with this email address — you get a login link, no password needed.",
    cta: "Open your project",
    vraag: "Anything incorrect, or plans to update? Simply reply to this email.",
  },
  de: {
    subject: "Ihre Anfrage für ein 3D-Modell ist eingegangen",
    eyebrow: "Angebotsanfrage",
    titel: "Vielen Dank für Ihre Anfrage",
    tekst: (p) =>
      p
        ? "Ich prüfe Ihre Pläne und sende Ihnen so schnell wie möglich ein individuelles Angebot mit Preis und Liefertermin."
        : "Ich prüfe Ihre Anfrage und sende Ihnen so schnell wie möglich ein individuelles Angebot mit Preis und Liefertermin. Pläne noch nicht mitgeschickt? Laden Sie sie in Ihrem Kundenportal hoch oder antworten Sie auf diese E-Mail mit den Plänen im Anhang.",
    samenvatting: "Was ich erhalten habe",
    werf: "Baustelle",
    stelsel: "Vorgeschlagenes Koordinatensystem",
    merk: "Maschinensteuerung",
    plannen: "Pläne",
    geen: "noch keine",
    portaal: "In Ihrem Kundenportal verfolgen Sie dieses Projekt: Dort finden Sie Ihre Pläne, demnächst das Angebot und danach die Modelldateien. Sie melden sich mit dieser E-Mail-Adresse an — Sie erhalten einen Anmeldelink, kein Passwort nötig.",
    cta: "Ihr Projekt öffnen",
    vraag: "Stimmt etwas nicht, oder möchten Sie Pläne anpassen? Antworten Sie einfach auf diese E-Mail.",
  },
  es: {
    subject: "Su solicitud de modelo 3D se ha recibido correctamente",
    eyebrow: "Solicitud de presupuesto",
    titel: "Gracias por su solicitud",
    tekst: (p) =>
      p
        ? "Revisaré sus planos y le enviaré lo antes posible un presupuesto a medida, con precio y fecha de entrega."
        : "Revisaré su solicitud y le enviaré lo antes posible un presupuesto a medida, con precio y fecha de entrega. ¿Aún no ha enviado los planos? Añádalos en su portal de cliente o responda a este correo con los planos adjuntos.",
    samenvatting: "Lo que he recibido",
    werf: "Obra",
    stelsel: "Sistema de coordenadas propuesto",
    merk: "Control de máquina",
    plannen: "Planos",
    geen: "ninguno todavía",
    portaal: "En su portal de cliente puede seguir este proyecto: allí encontrará sus planos, después el presupuesto y, más tarde, los archivos del modelo. Acceda con esta dirección de correo electrónico: recibirá un enlace de acceso, sin necesidad de contraseña.",
    cta: "Abrir su proyecto",
    vraag: "¿Hay algo incorrecto o desea modificar los planos? Basta con responder a este correo.",
  },
};

export function aanvraagOntvangenMail(
  taalIn: string,
  a: {
    naam: string;
    werfAdres: string;
    stelsel: string;
    hoogte: string;
    merk: string;
    aantalPlannen: number;
    projectId?: string | null;
  },
): KlantMail {
  const taal = taalVan(taalIn);
  const T = AANVRAAG[taal];
  const kaart = kaartTabel(T.samenvatting, [
    [T.werf, esc(a.werfAdres)],
    [T.stelsel, `${esc(a.stelsel)} &middot; ${esc(a.hoogte)}`],
    [T.merk, esc(a.merk)],
    [T.plannen, a.aantalPlannen > 0 ? String(a.aantalPlannen) : T.geen],
  ]);
  return mail(taal, T.subject, {
    eyebrow: T.eyebrow,
    titel: T.titel,
    regels: [ALG[taal].hallo(a.naam.trim() ? esc(a.naam.trim()) : null), T.tekst(a.aantalPlannen > 0)],
    extraHtml: kaart + alineaHtml(T.portaal),
    cta: T.cta,
    href: portaalLink(taal, a.projectId ? `/projecten/${a.projectId}` : "/projecten"),
    footnote: `${T.vraag}<br><br>${ondertekening(taal)}`,
  });
}

// ── 3. Projecten: offerte, factuur, levering ────────────────────────────

const OFFERTE_CTA: Record<Taal, string> = {
  nl: "Open uw offerte",
  fr: "Ouvrir votre devis",
  en: "Open your quote",
  de: "Ihr Angebot öffnen",
  es: "Abrir su presupuesto",
};

export type OfferteLijn = { label: string; desc?: string | null; cents: number; kind?: string | null };

/** Offerte voor een 3D-project (projectcockpit, of 'Herverstuur' bij een projectofferte). */
export function projectOfferteMail(
  taalIn: string,
  a: {
    naam?: string | null;
    titel: string;
    offerNo?: string | null;
    lijnen: OfferteLijn[];
    /** Totaal excl. btw (na korting). */
    totaalExclCent: number;
    verlegd: boolean;
    /** ISO-datum (YYYY-MM-DD). */
    geldigTot: string;
  },
): KlantMail {
  const taal = taalVan(taalIn);
  const M = MAIL[taal];
  const incl = a.totaalExclCent + (a.verlegd ? 0 : Math.round(a.totaalExclCent * 0.21));
  const korting = a.lijnen.reduce((s, l) => (l.cents < 0 ? s - l.cents : s), 0);
  const includes = a.lijnen
    .filter((l) => l.cents >= 0 && l.kind !== "korting")
    .map((l) => (l.kind === "incl" && l.desc ? `${esc(l.label)}${taal === "fr" ? " : " : ": "}${esc(l.desc)}` : esc(l.label)));
  const geldig = mailDatum(a.geldigTot, taal);
  return mail(taal, M.offerteOnderwerp(a.titel), {
    eyebrow: M.eyebrow,
    regels: [
      M.hallo(voornaam(a.naam)),
      M.offerteL1(esc(a.titel)),
      M.offerteL2(bedragMetBtw(taal, mailBedrag(incl, taal), a.verlegd ? "verlegd" : "incl"), geldig),
    ],
    extraHtml: offerPreviewHtml({
      locale: taal,
      offerNo: a.offerNo ? esc(a.offerNo) : null,
      amountExclCents: a.totaalExclCent,
      vatReverse: a.verlegd,
      validUntil: geldig,
      includes,
      discountCents: korting,
    }),
    cta: OFFERTE_CTA[taal],
    href: portaalLink(taal, "/offertes"),
    footnote: `${ALG[taal].vragen}<br>${M.footnote}`,
  });
}

/** Factuur voor een 3D-project (gewerkte uren × uurtarief). */
export function projectFactuurMail(
  taalIn: string,
  a: {
    naam?: string | null;
    nummer: string;
    titel: string;
    bedragExclCent: number;
    verlegd: boolean;
    /** ISO-datum (YYYY-MM-DD). */
    dueAt: string;
    projectId: string;
  },
): KlantMail {
  const taal = taalVan(taalIn);
  const M = MAIL[taal];
  const incl = a.bedragExclCent + (a.verlegd ? 0 : Math.round(a.bedragExclCent * 0.21));
  return mail(taal, M.factuurOnderwerp(a.nummer), {
    eyebrow: M.eyebrow,
    regels: [
      M.hallo(voornaam(a.naam)),
      M.factuurL1(esc(a.nummer), esc(a.titel), bedragMetBtw(taal, mailBedrag(incl, taal), a.verlegd ? "verlegd" : "incl")),
      M.factuurL2(mailDatum(a.dueAt, taal)),
    ],
    extraHtml: overschrijving(taal, a.nummer, incl),
    cta: M.cta,
    href: portaalLink(taal, `/projecten/${a.projectId}`),
    footnote: M.footnote,
  });
}

/** Nieuwe modelbestanden (een versie) staan klaar. */
export function leveringMail(
  taalIn: string,
  a: {
    naam?: string | null;
    titel: string;
    versie: number;
    systemen: string[];
    betaald: boolean;
    projectId: string;
  },
): KlantMail {
  const taal = taalVan(taalIn);
  const M = MAIL[taal];
  return mail(taal, M.leveringOnderwerp(a.titel), {
    eyebrow: M.eyebrow,
    regels: [
      M.hallo(voornaam(a.naam)),
      M.leveringL1(esc(a.titel), a.versie),
      M.leveringSystemen(esc(a.systemen.join(", "))),
      a.betaald ? M.leveringBetaald : M.leveringOnbetaald,
      M.leveringControle,
    ],
    cta: M.cta,
    href: portaalLink(taal, `/projecten/${a.projectId}`),
    footnote: M.footnote,
  });
}

// ── 4. Herinneringen: offerte verloopt, factuur onbetaald ───────────────

const OFFERTE_HERINNERING: Record<
  Taal,
  { subject: (nr: string) => string; eyebrow: string; titel: string; body: (t: string, nr: string, d: string) => string; cta: string }
> = {
  nl: {
    subject: (nr) => `Herinnering: uw offerte${nr ? ` ${nr}` : ""} verloopt binnenkort`,
    eyebrow: "Herinnering",
    titel: "Uw offerte verloopt over 2 dagen",
    body: (t, nr, d) => `De offerte <strong>${t}</strong>${nr ? ` (${nr})` : ""} is geldig tot <strong>${d}</strong>. Daarna vervalt ze automatisch. Aanvaarden of afwijzen kan met één klik in uw portaal.`,
    cta: "Bekijk en beslis",
  },
  fr: {
    subject: (nr) => `Rappel : votre devis${nr ? ` ${nr}` : ""} expire bientôt`,
    eyebrow: "Rappel",
    titel: "Votre devis expire dans 2 jours",
    body: (t, nr, d) => `Le devis <strong>${t}</strong>${nr ? ` (${nr})` : ""} est valable jusqu'au <strong>${d}</strong>. Il expire ensuite automatiquement. Accepter ou refuser se fait en un clic dans votre espace client.`,
    cta: "Consulter et décider",
  },
  en: {
    subject: (nr) => `Reminder: your quote${nr ? ` ${nr}` : ""} expires soon`,
    eyebrow: "Reminder",
    titel: "Your quote expires in 2 days",
    body: (t, nr, d) => `The quote <strong>${t}</strong>${nr ? ` (${nr})` : ""} is valid until <strong>${d}</strong>. After that it expires automatically. You can accept or decline with one click in your portal.`,
    cta: "View and decide",
  },
  de: {
    subject: (nr) => `Erinnerung: Ihr Angebot${nr ? ` ${nr}` : ""} läuft bald ab`,
    eyebrow: "Erinnerung",
    titel: "Ihr Angebot läuft in 2 Tagen ab",
    body: (t, nr, d) => `Das Angebot <strong>${t}</strong>${nr ? ` (${nr})` : ""} ist gültig bis <strong>${d}</strong>. Danach verfällt es automatisch. Annehmen oder ablehnen können Sie mit einem Klick in Ihrem Portal.`,
    cta: "Ansehen und entscheiden",
  },
  es: {
    subject: (nr) => `Recordatorio: su presupuesto${nr ? ` ${nr}` : ""} vence pronto`,
    eyebrow: "Recordatorio",
    titel: "Su presupuesto vence dentro de 2 días",
    body: (t, nr, d) => `El presupuesto <strong>${t}</strong>${nr ? ` (${nr})` : ""} es válido hasta el <strong>${d}</strong>. Después vence automáticamente. Puede aceptarlo o rechazarlo con un clic en su portal.`,
    cta: "Ver y decidir",
  },
};

export function offerteHerinneringMail(
  taalIn: string,
  a: { titel: string; offerNo?: string | null; geldigTot: string },
): KlantMail {
  const taal = taalVan(taalIn);
  const T = OFFERTE_HERINNERING[taal];
  const nr = String(a.offerNo ?? "").trim();
  return mail(taal, T.subject(nr), {
    eyebrow: T.eyebrow,
    titel: T.titel,
    regels: [T.body(esc(a.titel), esc(nr), mailDatum(a.geldigTot, taal))],
    cta: T.cta,
    href: portaalLink(taal, "/offertes"),
    footnote: `${ALG[taal].vragen}<br>${MAIL[taal].footnote}`,
  });
}

type Niveau = 1 | 2 | 3;

const BETAAL_HERINNERING: Record<
  Taal,
  {
    eyebrow: Record<Niveau, string>;
    titel: Record<Niveau, (nr: string) => string>;
    lijn: Record<Niveau, (nr: string, d: string) => string>;
    subject: (eyebrow: string, nr: string) => string;
    bedrag: (b: string) => string;
    betaal: string;
    cta: string;
    voet: string;
    voetLaatste: string;
  }
> = {
  nl: {
    eyebrow: { 1: "Vriendelijke herinnering", 2: "Tweede herinnering", 3: "Laatste herinnering" },
    titel: { 1: (nr) => `Herinnering: factuur ${nr}`, 2: (nr) => `Factuur ${nr} staat nog open`, 3: (nr) => `Laatste herinnering voor factuur ${nr}` },
    lijn: {
      1: (nr, d) => `Factuur <strong>${nr}</strong> was betaalbaar tegen ${d} en staat nog open. Wellicht is ze aan uw aandacht ontsnapt.`,
      2: (nr, d) => `Factuur <strong>${nr}</strong> staat meer dan een week na de vervaldag (${d}) nog open. Gelieve ze zo snel mogelijk te betalen.`,
      3: (nr, d) => `Factuur <strong>${nr}</strong> is meer dan twee weken vervallen (vervaldag ${d}). Dit is de laatste herinnering vóór verdere stappen.`,
    },
    subject: (e, nr) => `${e}: factuur ${nr}`,
    bedrag: (b) => `Openstaand bedrag: <strong>${b}</strong>.`,
    betaal: "U betaalt veilig online via uw klantenportaal of via overschrijving — daar vindt u ook de volledige factuur.",
    cta: "Betaal in uw portaal",
    voet: "Reeds betaald? Dan mag u deze herinnering als onbestaande beschouwen.",
    voetLaatste: "Reeds betaald? Dan mag u deze mail negeren — excuses voor het ongemak.",
  },
  fr: {
    eyebrow: { 1: "Rappel amical", 2: "Deuxième rappel", 3: "Dernier rappel" },
    titel: { 1: (nr) => `Rappel : facture ${nr}`, 2: (nr) => `La facture ${nr} reste impayée`, 3: (nr) => `Dernier rappel pour la facture ${nr}` },
    lijn: {
      1: (nr, d) => `La facture <strong>${nr}</strong> était payable pour le ${d} et reste ouverte. Elle vous a peut-être échappé.`,
      2: (nr, d) => `La facture <strong>${nr}</strong> reste impayée plus d'une semaine après l'échéance (${d}). Je vous prie de la régler dans les meilleurs délais.`,
      3: (nr, d) => `La facture <strong>${nr}</strong> est échue depuis plus de deux semaines (échéance le ${d}). Ceci est le dernier rappel avant d'autres démarches.`,
    },
    subject: (e, nr) => `${e} : facture ${nr}`,
    bedrag: (b) => `Montant dû : <strong>${b}</strong>.`,
    betaal: "Vous payez en toute sécurité en ligne via votre espace client ou par virement — vous y trouvez aussi la facture complète.",
    cta: "Payer dans votre espace client",
    voet: "Déjà payé ? Dans ce cas, veuillez ignorer ce rappel.",
    voetLaatste: "Déjà payé ? Veuillez ignorer cet e-mail — toutes mes excuses pour le désagrément.",
  },
  en: {
    eyebrow: { 1: "Friendly reminder", 2: "Second reminder", 3: "Final reminder" },
    titel: { 1: (nr) => `Reminder: invoice ${nr}`, 2: (nr) => `Invoice ${nr} is still open`, 3: (nr) => `Final reminder for invoice ${nr}` },
    lijn: {
      1: (nr, d) => `Invoice <strong>${nr}</strong> was due on ${d} and is still open. Perhaps it slipped your attention.`,
      2: (nr, d) => `Invoice <strong>${nr}</strong> is still open more than a week after the due date (${d}). Please settle it as soon as possible.`,
      3: (nr, d) => `Invoice <strong>${nr}</strong> is more than two weeks overdue (due date ${d}). This is the final reminder before further steps.`,
    },
    subject: (e, nr) => `${e}: invoice ${nr}`,
    bedrag: (b) => `Amount due: <strong>${b}</strong>.`,
    betaal: "You can pay securely online in your client portal or by bank transfer — the full invoice is there as well.",
    cta: "Pay in your portal",
    voet: "Already paid? Then please disregard this reminder.",
    voetLaatste: "Already paid? Then please ignore this email — apologies for the inconvenience.",
  },
  de: {
    eyebrow: { 1: "Freundliche Erinnerung", 2: "Zweite Erinnerung", 3: "Letzte Mahnung" },
    titel: { 1: (nr) => `Erinnerung: Rechnung ${nr}`, 2: (nr) => `Rechnung ${nr} ist noch offen`, 3: (nr) => `Letzte Mahnung für Rechnung ${nr}` },
    lijn: {
      1: (nr, d) => `Die Rechnung <strong>${nr}</strong> war am ${d} fällig und ist noch offen. Vielleicht ist sie Ihnen entgangen.`,
      2: (nr, d) => `Die Rechnung <strong>${nr}</strong> ist mehr als eine Woche nach dem Fälligkeitsdatum (${d}) noch offen. Bitte begleichen Sie sie so bald wie möglich.`,
      3: (nr, d) => `Die Rechnung <strong>${nr}</strong> ist seit mehr als zwei Wochen überfällig (fällig am ${d}). Dies ist die letzte Erinnerung vor weiteren Schritten.`,
    },
    subject: (e, nr) => `${e}: Rechnung ${nr}`,
    bedrag: (b) => `Offener Betrag: <strong>${b}</strong>.`,
    betaal: "Sie bezahlen sicher online in Ihrem Kundenportal oder per Überweisung — dort finden Sie auch die vollständige Rechnung.",
    cta: "Im Portal bezahlen",
    voet: "Bereits bezahlt? Dann betrachten Sie diese Erinnerung bitte als gegenstandslos.",
    voetLaatste: "Bereits bezahlt? Dann ignorieren Sie diese E-Mail bitte — entschuldigen Sie die Unannehmlichkeiten.",
  },
  es: {
    eyebrow: { 1: "Recordatorio amable", 2: "Segundo recordatorio", 3: "Último recordatorio" },
    titel: { 1: (nr) => `Recordatorio: factura ${nr}`, 2: (nr) => `La factura ${nr} sigue pendiente`, 3: (nr) => `Último recordatorio de la factura ${nr}` },
    lijn: {
      1: (nr, d) => `La factura <strong>${nr}</strong> vencía el ${d} y sigue pendiente. Quizá se le haya pasado por alto.`,
      2: (nr, d) => `La factura <strong>${nr}</strong> sigue pendiente más de una semana después de su vencimiento (${d}). Le ruego que la abone lo antes posible.`,
      3: (nr, d) => `La factura <strong>${nr}</strong> lleva más de dos semanas vencida (vencimiento: ${d}). Este es el último recordatorio antes de tomar otras medidas.`,
    },
    subject: (e, nr) => `${e}: factura ${nr}`,
    bedrag: (b) => `Importe pendiente: <strong>${b}</strong>.`,
    betaal: "Puede pagar de forma segura en línea en su portal de cliente o por transferencia bancaria; allí encontrará también la factura completa.",
    cta: "Pagar en su portal",
    voet: "¿Ya ha pagado? En ese caso, ignore este recordatorio.",
    voetLaatste: "¿Ya ha pagado? En ese caso, ignore este correo; disculpe las molestias.",
  },
};

/** Betalingsherinnering (1 = op de vervaldag, 2 = +7 dagen, 3 = +14 dagen, laatste). */
const HERINNERING_RENTE: Record<
  Taal,
  {
    lopend: (pct: string) => string;
    bedrag: (interest: string, dagen: number, pct: string) => string;
    forfait: string;
    zonderPct: string;
  }
> = {
  nl: {
    lopend: (pct) => `Sinds de vervaldag loopt van rechtswege verwijlinterest aan de wettelijke rentevoet voor handelstransacties: <strong>${pct} % per jaar</strong>.`,
    bedrag: (x, d, pct) => `Op vandaag bedraagt de verwijlinterest <strong>${x}</strong> (${d} dagen aan ${pct} % per jaar).`,
    forfait: "Daarnaast is een forfaitaire vergoeding van € 40 verschuldigd (wet van 2 augustus 2002).",
    zonderPct: "Sinds de vervaldag loopt van rechtswege verwijlinterest aan de wettelijke rentevoet voor handelstransacties, en is een forfaitaire vergoeding van € 40 verschuldigd (wet van 2 augustus 2002).",
  },
  fr: {
    lopend: (pct) => `Depuis l'échéance, des intérêts de retard courent de plein droit au taux légal pour les transactions commerciales : <strong>${pct} % par an</strong>.`,
    bedrag: (x, d, pct) => `À ce jour, les intérêts de retard s'élèvent à <strong>${x}</strong> (${d} jours à ${pct} % par an).`,
    forfait: "S'y ajoute une indemnité forfaitaire de 40 € (loi du 2 août 2002).",
    zonderPct: "Depuis l'échéance, des intérêts de retard courent de plein droit au taux légal pour les transactions commerciales, et une indemnité forfaitaire de 40 € est due (loi du 2 août 2002).",
  },
  en: {
    lopend: (pct) => `Since the due date, late-payment interest has been accruing by law at the statutory rate for commercial transactions: <strong>${pct}% per year</strong>.`,
    bedrag: (x, d, pct) => `As of today, the late-payment interest amounts to <strong>${x}</strong> (${d} days at ${pct}% per year).`,
    forfait: "In addition, a fixed compensation of € 40 is due (Belgian Act of 2 August 2002).",
    zonderPct: "Since the due date, late-payment interest has been accruing by law at the statutory rate for commercial transactions, and a fixed compensation of € 40 is due (Belgian Act of 2 August 2002).",
  },
  de: {
    lopend: (pct) => `Seit dem Fälligkeitsdatum laufen von Rechts wegen Verzugszinsen zum gesetzlichen Zinssatz für Handelsgeschäfte: <strong>${pct} % pro Jahr</strong>.`,
    bedrag: (x, d, pct) => `Bis heute betragen die Verzugszinsen <strong>${x}</strong> (${d} Tage zu ${pct} % pro Jahr).`,
    forfait: "Hinzu kommt eine Pauschalentschädigung von 40 € (belgisches Gesetz vom 2. August 2002).",
    zonderPct: "Seit dem Fälligkeitsdatum laufen von Rechts wegen Verzugszinsen zum gesetzlichen Zinssatz für Handelsgeschäfte, und eine Pauschalentschädigung von 40 € ist geschuldet (belgisches Gesetz vom 2. August 2002).",
  },
  es: {
    lopend: (pct) => `Desde la fecha de vencimiento se devengan de pleno derecho intereses de demora al tipo legal para operaciones comerciales: <strong>${pct} % anual</strong>.`,
    bedrag: (x, d, pct) => `A día de hoy, los intereses de demora ascienden a <strong>${x}</strong> (${d} días al ${pct} % anual).`,
    forfait: "Además, se adeuda una indemnización fija de 40 € (ley belga de 2 de agosto de 2002).",
    zonderPct: "Desde la fecha de vencimiento se devengan de pleno derecho intereses de demora al tipo legal para operaciones comerciales, y se adeuda una indemnización fija de 40 € (ley belga de 2 de agosto de 2002).",
  },
};

function procent(pct: number, taal: Taal): string {
  return pct.toLocaleString(taal === "en" ? "en-GB" : `${taal}-BE`, { maximumFractionDigits: 2 });
}

/**
 * Zinnen over verwijlinterest in een betaalherinnering. undefined = niets
 * vermelden; null = rentevoet van dit semester onbekend (algemene zin zonder
 * cijfer). Niveau 1 noemt het percentage, niveau 2 en 3 ook het bedrag.
 */
function renteRegels(taal: Taal, niveau: Niveau, rente: Verwijlinterest | null | undefined): string[] {
  if (rente === undefined) return [];
  const R = HERINNERING_RENTE[taal];
  if (rente === null) return [R.zonderPct];
  const pct = procent(rente.pctNu, taal);
  if (niveau === 1) return [R.lopend(pct)];
  return [`${R.bedrag(mailBedrag(rente.interestCent, taal), rente.dagen, pct)} ${R.forfait}`];
}

export function betaalHerinneringMail(
  taalIn: string,
  niveau: Niveau,
  a: {
    nummer: string;
    bedragCent: number;
    btw: "incl" | "verlegd" | "geen";
    dueAt: string;
    /** Verwijlinterest tot vandaag; null = rentevoet onbekend; weglaten = niet vermelden. */
    rente?: Verwijlinterest | null;
  },
): KlantMail {
  const taal = taalVan(taalIn);
  const T = BETAAL_HERINNERING[taal];
  const nr = String(a.nummer ?? "").trim();
  return mail(taal, T.subject(T.eyebrow[niveau], nr), {
    eyebrow: T.eyebrow[niveau],
    titel: T.titel[niveau](nr),
    regels: [
      T.lijn[niveau](esc(nr), mailDatum(a.dueAt, taal)),
      T.bedrag(bedragMetBtw(taal, mailBedrag(a.bedragCent, taal), a.btw)),
      ...renteRegels(taal, niveau, a.rente),
      T.betaal,
    ],
    extraHtml: overschrijving(taal, nr, a.bedragCent),
    cta: T.cta,
    href: portaalLink(taal, "/facturen"),
    footnote: `${niveau === 3 ? T.voetLaatste : T.voet}<br>${ALG[taal].vragen}`,
  });
}

// ── 5. Betaling ontvangen (Mollie) ──────────────────────────────────────

const BETAALD: Record<
  Taal,
  { subject: (nr: string) => string; eyebrow: string; l1: string; l2: string; project: string; cta: string }
> = {
  nl: {
    subject: (nr) => `Betaling ontvangen — factuur ${nr}`,
    eyebrow: "Betaling bevestigd",
    l1: "Bedankt — uw betaling is goed ontvangen.",
    l2: "Uw factuur is volledig betaald. Hieronder vindt u de bevestiging; in uw portaal staat de factuur met de betaalstempel.",
    project: "De modelbestanden van uw project zijn nu vrijgegeven: u kunt ze downloaden in het portaal.",
    cta: "Bekijk uw factuur in het portaal",
  },
  fr: {
    subject: (nr) => `Paiement reçu — facture ${nr}`,
    eyebrow: "Paiement confirmé",
    l1: "Merci — votre paiement a bien été reçu.",
    l2: "Votre facture est entièrement payée. Vous trouverez la confirmation ci-dessous ; la facture avec le cachet « payée » est disponible dans votre espace client.",
    project: "Les fichiers du modèle de votre projet sont maintenant débloqués : vous pouvez les télécharger dans votre espace client.",
    cta: "Voir votre facture dans l'espace client",
  },
  en: {
    subject: (nr) => `Payment received — invoice ${nr}`,
    eyebrow: "Payment confirmed",
    l1: "Thank you — your payment has been received.",
    l2: "Your invoice is fully paid. Below is the confirmation; the invoice with the paid stamp is available in your portal.",
    project: "The model files of your project are now released: you can download them in the portal.",
    cta: "View your invoice in the portal",
  },
  de: {
    subject: (nr) => `Zahlung erhalten — Rechnung ${nr}`,
    eyebrow: "Zahlung bestätigt",
    l1: "Vielen Dank — Ihre Zahlung ist eingegangen.",
    l2: "Ihre Rechnung ist vollständig bezahlt. Unten finden Sie die Bestätigung; in Ihrem Portal steht die Rechnung mit dem Bezahlt-Stempel bereit.",
    project: "Die Modelldateien Ihres Projekts sind jetzt freigegeben: Sie können sie im Portal herunterladen.",
    cta: "Rechnung im Portal ansehen",
  },
  es: {
    subject: (nr) => `Pago recibido — factura ${nr}`,
    eyebrow: "Pago confirmado",
    l1: "Gracias: su pago se ha recibido correctamente.",
    l2: "Su factura está totalmente pagada. A continuación encontrará la confirmación; la factura con el sello de pagada está disponible en su portal.",
    project: "Los archivos del modelo de su proyecto ya están liberados: puede descargarlos en el portal.",
    cta: "Ver su factura en el portal",
  },
};

export function betalingOntvangenMail(
  taalIn: string,
  a: {
    nummer: string;
    /** Platte tekst (wordt ge-escaped). */
    omschrijving?: string | null;
    bedragExclCent: number;
    metBtw: boolean;
    verlegd: boolean;
    paidAt: string;
    soort: "project" | "revisie" | "andere";
    /** Knop: magic link of portaalLink(taal, "/facturen"). */
    link: string;
  },
): KlantMail {
  const taal = taalVan(taalIn);
  const T = BETAALD[taal];
  return mail(taal, T.subject(a.nummer), {
    eyebrow: T.eyebrow,
    regels: [T.l1, a.soort === "project" ? `${T.l2} ${T.project}` : T.l2],
    extraHtml: invoicePaidPreviewHtml({
      number: esc(a.nummer),
      description: a.omschrijving ? esc(a.omschrijving) : null,
      amountExclCents: a.bedragExclCent,
      vatReverse: a.verlegd,
      metBtw: a.metBtw,
      paidAt: a.paidAt,
      locale: taal,
    }),
    cta: T.cta,
    href: a.link,
    footnote: ALG[taal].vragen,
  });
}

// ── 6. Tickets (Support) ────────────────────────────────────────────────

/** Genoeg van een ticket voor de mail. */
export type TicketKop = {
  id: string;
  subject: string | null;
  nummer?: number | null;
  soort?: string | null;
  client_email?: string | null;
};

function ticketMail(
  taal: Taal,
  t: TicketKop,
  m: {
    onderwerp: string;
    regels: string[];
    extraHtml?: string;
    ctaLabel?: string;
    doel?: string;
    /** Zonder de oproep om via het portaal te antwoorden (bv. bij een factuur). */
    zonderViaPortaal?: boolean;
  },
  replyTo?: string,
): KlantMail {
  const M = TICKET_MAIL[taal];
  return {
    subject: m.onderwerp,
    replyTo: replyTo || ANTWOORD_ADRES,
    html: portalEmailHtml({
      locale: taal,
      eyebrow: M.eyebrow,
      title: esc(m.onderwerp),
      bodyLines: m.regels,
      extraHtml: m.extraHtml,
      ctaLabel: m.ctaLabel ?? M.cta,
      ctaHref: portaalLink(taal, m.doel ?? `/tickets/${t.id}`),
      footnote: m.zonderViaPortaal ? M.footnote : `${M.viaPortaal}<br>${M.footnote}`,
    }),
  };
}

/** Ontvangstbevestiging (24-u-belofte; bij een revisie met het tarief van de projectcategorie). */
export function ticketOntvangenMail(
  taalIn: string,
  t: TicketKop,
  a: { categorie?: Categorie | null } = {},
  replyTo?: string,
): KlantMail {
  const taal = taalVan(taalIn);
  const M = TICKET_MAIL[taal];
  const regels = [M.hallo, M.ontvangenL1(esc(toonOnderwerp(t))), M.ontvangenL2];
  const cat = a.categorie;
  if (soortVan(t) === "revisie" && cat && UURTARIEF_CENT[cat]) {
    regels.push(esc(revisieTariefZin(taal, euro(UURTARIEF_CENT[cat], taal), CATEGORIE_LABEL[cat][taal])));
  }
  return ticketMail(taal, t, { onderwerp: M.ontvangenOnderwerp(ticketRef(t), toonOnderwerp(t)), regels }, replyTo);
}

/** Antwoord van de studio, met de VOLLEDIGE tekst (regeleinden blijven). */
export function ticketAntwoordMail(
  taalIn: string,
  t: TicketKop,
  a: { body: string; bijlageNamen?: string[]; gesloten?: boolean },
  replyTo?: string,
): KlantMail {
  const taal = taalVan(taalIn);
  const M = TICKET_MAIL[taal];
  const namen = (a.bijlageNamen ?? []).filter(Boolean).map((n) => esc(n));
  const extra = [
    citaatHtml(tekstNaarHtml(a.body)),
    namen.length ? alineaHtml(M.bijlagen(namen), true) : "",
    a.gesloten ? alineaHtml(M.ookGesloten) : "",
  ].join("");
  return ticketMail(
    taal,
    t,
    {
      onderwerp: M.antwoordOnderwerp(ticketRef(t), toonOnderwerp(t)),
      regels: [M.hallo, M.antwoordL1(esc(toonOnderwerp(t)))],
      extraHtml: extra,
    },
    replyTo,
  );
}

/** Ticket gesloten (door de studio, of automatisch na stilte van de klant). */
export function ticketGeslotenMail(taalIn: string, t: TicketKop, a: { automatisch: boolean }, replyTo?: string): KlantMail {
  const taal = taalVan(taalIn);
  const M = TICKET_MAIL[taal];
  const x = esc(toonOnderwerp(t));
  return ticketMail(
    taal,
    t,
    {
      onderwerp: M.geslotenOnderwerp(ticketRef(t), toonOnderwerp(t)),
      regels: [M.hallo, a.automatisch ? M.autoGeslotenL1(x) : M.geslotenL1(x), M.heropenenL2],
    },
    replyTo,
  );
}

/** Aparte revisiefactuur staat klaar; knop naar de facturen in het portaal. */
export function revisieFactuurMail(
  taalIn: string,
  t: TicketKop,
  a: { nummer: string; titel: string; bedragExclCent: number; verlegd: boolean; uren: number; dueAt: string },
  replyTo?: string,
): KlantMail {
  const taal = taalVan(taalIn);
  const M = TICKET_MAIL[taal];
  const incl = a.bedragExclCent + (a.verlegd ? 0 : Math.round(a.bedragExclCent * 0.21));
  return ticketMail(
    taal,
    t,
    {
      onderwerp: M.revisieFactuurOnderwerp(a.nummer),
      regels: [
        M.hallo,
        M.revisieFactuurL1(
          esc(a.nummer),
          esc(a.titel),
          bedragMetBtw(taal, mailBedrag(incl, taal), a.verlegd ? "verlegd" : "incl"),
          urenTekst(a.uren, taal),
        ),
        M.revisieFactuurL2(mailDatum(String(a.dueAt ?? "").slice(0, 10), taal)),
      ],
      extraHtml: overschrijving(taal, a.nummer, incl),
      ctaLabel: M.ctaFactuur,
      doel: "/facturen",
      zonderViaPortaal: true,
    },
    replyTo,
  );
}

// ── 7. Meldingen vanuit de klantfiche (admin) ───────────────────────────
// Algemeen bruikbaar (ook voor 3D-klanten): factuur, document, offerte.

const FACTUUR_KLAAR: Record<
  Taal,
  { subject: (nr: string) => string; dank: (x: string) => string; l1: (nr: string, b: string) => string; due: (d: string) => string; cta: string }
> = {
  nl: {
    subject: (nr) => `Uw factuur ${nr} staat klaar`,
    dank: (x) => `Bedankt voor uw akkoord op <strong>${x}</strong>.`,
    l1: (nr, b) => `Factuur <strong>${nr}</strong> (${b}) staat klaar in uw klantenportaal.`,
    due: (d) => `Betaalbaar tegen ${d}, online via uw portaal of via overschrijving.`,
    cta: "Bekijk uw factuur",
  },
  fr: {
    subject: (nr) => `Votre facture ${nr} est prête`,
    dank: (x) => `Merci pour votre accord sur <strong>${x}</strong>.`,
    l1: (nr, b) => `La facture <strong>${nr}</strong> (${b}) est disponible dans votre espace client.`,
    due: (d) => `Payable pour le ${d}, en ligne via votre espace client ou par virement.`,
    cta: "Voir votre facture",
  },
  en: {
    subject: (nr) => `Your invoice ${nr} is ready`,
    dank: (x) => `Thank you for approving <strong>${x}</strong>.`,
    l1: (nr, b) => `Invoice <strong>${nr}</strong> (${b}) is ready in your client portal.`,
    due: (d) => `Payable by ${d}, online via your portal or by bank transfer.`,
    cta: "View your invoice",
  },
  de: {
    subject: (nr) => `Ihre Rechnung ${nr} ist bereit`,
    dank: (x) => `Vielen Dank für Ihre Zustimmung zu <strong>${x}</strong>.`,
    l1: (nr, b) => `Die Rechnung <strong>${nr}</strong> (${b}) steht in Ihrem Kundenportal bereit.`,
    due: (d) => `Zahlbar bis ${d}, online über Ihr Portal oder per Überweisung.`,
    cta: "Rechnung ansehen",
  },
  es: {
    subject: (nr) => `Su factura ${nr} está lista`,
    dank: (x) => `Gracias por su aprobación de <strong>${x}</strong>.`,
    l1: (nr, b) => `La factura <strong>${nr}</strong> (${b}) está disponible en su portal de cliente.`,
    due: (d) => `Pagadera antes del ${d}, en línea a través de su portal o por transferencia bancaria.`,
    cta: "Ver su factura",
  },
};

/** Losse factuur (klantfiche, of oude websiteofferte na akkoord). Bedrag zoals op de factuur. */
export function factuurKlaarMail(
  taalIn: string,
  a: { nummer: string; bedragCent: number; btw?: "incl" | "verlegd" | "geen"; dueAt?: string | null; akkoordOp?: string | null },
): KlantMail {
  const taal = taalVan(taalIn);
  const T = FACTUUR_KLAAR[taal];
  const regels = [
    ...(a.akkoordOp ? [T.dank(esc(a.akkoordOp))] : []),
    T.l1(esc(a.nummer), bedragMetBtw(taal, mailBedrag(a.bedragCent, taal), a.btw ?? "geen")),
    ...(a.dueAt ? [T.due(mailDatum(a.dueAt, taal))] : []),
  ];
  return mail(taal, T.subject(a.nummer), {
    eyebrow: ALG[taal].eyebrowPortaal,
    regels,
    extraHtml: overschrijving(taal, a.nummer, a.bedragCent),
    cta: T.cta,
    href: portaalLink(taal, "/facturen"),
    footnote: MAIL[taal].footnote,
  });
}

const DOCUMENT: Record<Taal, { subject: string; l1: (x: string) => string; cta: string }> = {
  nl: { subject: "Nieuw document in uw klantenportaal", l1: (x) => `Er staat een nieuw document voor u klaar: <strong>${x}</strong>.`, cta: "Bekijk uw documenten" },
  fr: { subject: "Nouveau document dans votre espace client", l1: (x) => `Un nouveau document vous attend : <strong>${x}</strong>.`, cta: "Voir vos documents" },
  en: { subject: "New document in your client portal", l1: (x) => `A new document is ready for you: <strong>${x}</strong>.`, cta: "View your documents" },
  de: { subject: "Neues Dokument in Ihrem Kundenportal", l1: (x) => `Ein neues Dokument liegt für Sie bereit: <strong>${x}</strong>.`, cta: "Ihre Dokumente ansehen" },
  es: { subject: "Nuevo documento en su portal de cliente", l1: (x) => `Tiene un nuevo documento disponible: <strong>${x}</strong>.`, cta: "Ver sus documentos" },
};

export function documentMail(taalIn: string, a: { naam: string }): KlantMail {
  const taal = taalVan(taalIn);
  const T = DOCUMENT[taal];
  return mail(taal, T.subject, {
    eyebrow: ALG[taal].eyebrowPortaal,
    regels: [T.l1(esc(a.naam))],
    cta: T.cta,
    href: portaalLink(taal, "/documenten"),
    footnote: MAIL[taal].footnote,
  });
}

const LOSSE_OFFERTE: Record<Taal, { subject: string; l1: (x: string, opnieuw: boolean) => string; l2: string }> = {
  nl: {
    subject: "Er staat een offerte voor u klaar",
    l1: (x, o) => `Hierbij ${o ? "opnieuw " : ""}uw offerte voor <strong>${x}</strong>. Hieronder vindt u alvast het overzicht.`,
    l2: "In uw klantenportaal ziet u de volledige offerte met alle details. Aanvaarden of afwijzen kan met één klik.",
  },
  fr: {
    subject: "Un devis vous attend",
    l1: (x, o) => `Voici ${o ? "à nouveau " : ""}votre devis pour <strong>${x}</strong>. Vous trouverez un aperçu ci-dessous.`,
    l2: "Dans votre espace client, vous trouvez le devis complet avec tous les détails. Accepter ou refuser se fait en un clic.",
  },
  en: {
    subject: "A quote is ready for you",
    l1: (x, o) => `Please find ${o ? "again " : ""}your quote for <strong>${x}</strong>. An overview is shown below.`,
    l2: "Your client portal shows the full quote with all details. You can accept or decline with one click.",
  },
  de: {
    subject: "Ein Angebot liegt für Sie bereit",
    l1: (x, o) => `Anbei ${o ? "erneut " : ""}Ihr Angebot für <strong>${x}</strong>. Unten finden Sie eine Übersicht.`,
    l2: "In Ihrem Kundenportal sehen Sie das vollständige Angebot mit allen Details. Annehmen oder ablehnen können Sie mit einem Klick.",
  },
  es: {
    subject: "Tiene un presupuesto disponible",
    l1: (x, o) => `Le envío ${o ? "de nuevo " : ""}su presupuesto para <strong>${x}</strong>. A continuación encontrará un resumen.`,
    l2: "En su portal de cliente encontrará el presupuesto completo con todos los detalles. Puede aceptarlo o rechazarlo con un clic.",
  },
};

/** Offerte die niet uit de projectcockpit komt (klantfiche / oude websiteofferte). */
export function losseOfferteMail(
  taalIn: string,
  a: { naam?: string | null; titel: string; opnieuw: boolean; kaart: Omit<OfferPreview, "locale"> },
): KlantMail {
  const taal = taalVan(taalIn);
  const T = LOSSE_OFFERTE[taal];
  return mail(taal, T.subject, {
    eyebrow: ALG[taal].eyebrowPortaal,
    regels: [ALG[taal].hallo(voornaam(a.naam)), T.l1(esc(a.titel), a.opnieuw), T.l2],
    extraHtml: offerPreviewHtml({ ...a.kaart, locale: taal }),
    cta: OFFERTE_CTA[taal],
    href: portaalLink(taal, "/offertes"),
    footnote: `${ALG[taal].vragen}<br>${MAIL[taal].footnote}`,
  });
}

// ── 8. Archief websites ─────────────────────────────────────────────────
// Enkel voor oude websiteklanten (Archief websites in de admin, de
// support-cron en de Mollie-incasso van een websiteabonnement). Hier gaat
// het wél over een website of een abonnement — dat is waar de klant voor
// betaalt. Formeel en in vijf talen, net als de rest.

const ABO_STATUS: Record<string, Record<Taal, string>> = {
  actief: { nl: "actief", fr: "actif", en: "active", de: "aktiv", es: "activa" },
  gepauzeerd: { nl: "gepauzeerd", fr: "en pause", en: "paused", de: "pausiert", es: "en pausa" },
  gestopt: { nl: "gestopt", fr: "arrêté", en: "stopped", de: "beendet", es: "finalizada" },
};

const ABONNEMENT: Record<
  Taal,
  {
    subject: string;
    l1: (plan: string, prijs: string, status: string) => string;
    gestart: (plan: string, prijs: string) => string;
    gratis: (n: number) => string;
    maandelijks: string;
  }
> = {
  nl: {
    subject: "Uw abonnement is bijgewerkt",
    l1: (p, b, s) => `Uw abonnement: <strong>${p}</strong> — ${b} per maand${s ? ` (${s})` : ""}.`,
    gestart: (p, b) => `Uw website staat online en uw supportabonnement <strong>${p}</strong> (${b} per maand) is gestart.`,
    gratis: (n) => `De eerste ${n} maanden zijn gratis; daarna ontvangt u maandelijks een factuur in uw klantenportaal.`,
    maandelijks: "U ontvangt maandelijks een factuur in uw klantenportaal.",
  },
  fr: {
    subject: "Votre abonnement a été mis à jour",
    l1: (p, b, s) => `Votre abonnement : <strong>${p}</strong> — ${b} par mois${s ? ` (${s})` : ""}.`,
    gestart: (p, b) => `Votre site est en ligne et votre abonnement de support <strong>${p}</strong> (${b} par mois) a démarré.`,
    gratis: (n) => `Les ${n} premiers mois sont gratuits ; ensuite, vous recevez chaque mois une facture dans votre espace client.`,
    maandelijks: "Vous recevez chaque mois une facture dans votre espace client.",
  },
  en: {
    subject: "Your subscription has been updated",
    l1: (p, b, s) => `Your subscription: <strong>${p}</strong> — ${b} per month${s ? ` (${s})` : ""}.`,
    gestart: (p, b) => `Your website is online and your <strong>${p}</strong> support subscription (${b} per month) has started.`,
    gratis: (n) => `The first ${n} months are free; after that you receive a monthly invoice in your client portal.`,
    maandelijks: "You receive a monthly invoice in your client portal.",
  },
  de: {
    subject: "Ihr Abonnement wurde aktualisiert",
    l1: (p, b, s) => `Ihr Abonnement: <strong>${p}</strong> — ${b} pro Monat${s ? ` (${s})` : ""}.`,
    gestart: (p, b) => `Ihre Website ist online und Ihr Support-Abonnement <strong>${p}</strong> (${b} pro Monat) hat begonnen.`,
    gratis: (n) => `Die ersten ${n} Monate sind kostenlos; danach erhalten Sie monatlich eine Rechnung in Ihrem Kundenportal.`,
    maandelijks: "Sie erhalten monatlich eine Rechnung in Ihrem Kundenportal.",
  },
  es: {
    subject: "Su suscripción se ha actualizado",
    l1: (p, b, s) => `Su suscripción: <strong>${p}</strong> — ${b} al mes${s ? ` (${s})` : ""}.`,
    gestart: (p, b) => `Su sitio web está en línea y su suscripción de soporte <strong>${p}</strong> (${b} al mes) ha comenzado.`,
    gratis: (n) => `Los ${n} primeros meses son gratuitos; después recibirá cada mes una factura en su portal de cliente.`,
    maandelijks: "Recibirá cada mes una factura en su portal de cliente.",
  },
};

export function abonnementMail(
  taalIn: string,
  a: { plan: string; prijsCent: number; status?: string | null; gestart?: boolean; gratisMaanden?: number },
): KlantMail {
  const taal = taalVan(taalIn);
  const T = ABONNEMENT[taal];
  const prijs = mailBedrag(a.prijsCent, taal);
  const plan = esc(a.plan);
  const regels = a.gestart
    ? [T.gestart(plan, prijs), (a.gratisMaanden ?? 0) > 0 ? T.gratis(a.gratisMaanden ?? 0) : T.maandelijks]
    : [T.l1(plan, prijs, a.status ? ABO_STATUS[a.status]?.[taal] ?? esc(a.status) : "")];
  return mail(taal, T.subject, {
    eyebrow: ALG[taal].eyebrowPortaal,
    regels,
    cta: ALG[taal].ctaPortaal,
    href: portaalLink(taal),
    footnote: MAIL[taal].footnote,
  });
}

const SITE_STATUS: Record<string, Record<Taal, string>> = {
  in_aanbouw: { nl: "in opbouw", fr: "en construction", en: "under construction", de: "im Aufbau", es: "en construcción" },
  online: { nl: "online", fr: "en ligne", en: "online", de: "online", es: "en línea" },
  onderhoud: { nl: "in onderhoud", fr: "en maintenance", en: "under maintenance", de: "in Wartung", es: "en mantenimiento" },
  offline: { nl: "offline", fr: "hors ligne", en: "offline", de: "offline", es: "fuera de línea" },
};

const WEBSITE: Record<Taal, { subject: string; nieuw: (n: string, url: string) => string; status: (n: string, s: string) => string }> = {
  nl: {
    subject: "Update over uw website",
    nieuw: (n, u) => `Uw website <strong>${n}</strong> staat in uw klantenportaal${u ? ` — ${u}` : ""}.`,
    status: (n, s) => `Status van uw website <strong>${n}</strong>: <strong>${s}</strong>.`,
  },
  fr: {
    subject: "Mise à jour de votre site web",
    nieuw: (n, u) => `Votre site <strong>${n}</strong> figure dans votre espace client${u ? ` — ${u}` : ""}.`,
    status: (n, s) => `Statut de votre site <strong>${n}</strong> : <strong>${s}</strong>.`,
  },
  en: {
    subject: "Update on your website",
    nieuw: (n, u) => `Your website <strong>${n}</strong> is now in your client portal${u ? ` — ${u}` : ""}.`,
    status: (n, s) => `Status of your website <strong>${n}</strong>: <strong>${s}</strong>.`,
  },
  de: {
    subject: "Neuigkeiten zu Ihrer Website",
    nieuw: (n, u) => `Ihre Website <strong>${n}</strong> steht in Ihrem Kundenportal${u ? ` — ${u}` : ""}.`,
    status: (n, s) => `Status Ihrer Website <strong>${n}</strong>: <strong>${s}</strong>.`,
  },
  es: {
    subject: "Novedades sobre su sitio web",
    nieuw: (n, u) => `Su sitio web <strong>${n}</strong> ya figura en su portal de cliente${u ? ` — ${u}` : ""}.`,
    status: (n, s) => `Estado de su sitio web <strong>${n}</strong>: <strong>${s}</strong>.`,
  },
};

export function websiteMail(taalIn: string, a: { naam: string; url?: string | null; status?: string | null }): KlantMail {
  const taal = taalVan(taalIn);
  const T = WEBSITE[taal];
  const n = esc(a.naam);
  const regel = a.status
    ? T.status(n, SITE_STATUS[a.status]?.[taal] ?? esc(a.status))
    : T.nieuw(n, a.url ? esc(a.url) : "");
  return mail(taal, T.subject, {
    eyebrow: ALG[taal].eyebrowPortaal,
    regels: [regel],
    cta: ALG[taal].ctaPortaal,
    href: portaalLink(taal),
    footnote: MAIL[taal].footnote,
  });
}

const STAP: Record<string, Record<Taal, string>> = {
  briefing: { nl: "briefing", fr: "briefing", en: "briefing", de: "Briefing", es: "briefing" },
  ontwerp: { nl: "ontwerp", fr: "conception", en: "design", de: "Entwurf", es: "diseño" },
  bouw: { nl: "uitwerking", fr: "réalisation", en: "build", de: "Umsetzung", es: "desarrollo" },
  online: { nl: "online", fr: "en ligne", en: "live", de: "online", es: "en línea" },
  nazorg: { nl: "nazorg", fr: "suivi", en: "aftercare", de: "Nachbetreuung", es: "seguimiento" },
};

const VOORTGANG: Record<Taal, { subject: string; l1: (s: string) => string; cta: string }> = {
  nl: { subject: "Voortgang van uw project", l1: (s) => `Uw project staat nu op: <strong>${s}</strong>.`, cta: "Bekijk de voortgang" },
  fr: { subject: "Avancement de votre projet", l1: (s) => `Votre projet en est maintenant à l'étape : <strong>${s}</strong>.`, cta: "Voir l'avancement" },
  en: { subject: "Progress of your project", l1: (s) => `Your project is now at: <strong>${s}</strong>.`, cta: "View progress" },
  de: { subject: "Fortschritt Ihres Projekts", l1: (s) => `Ihr Projekt ist jetzt in der Phase: <strong>${s}</strong>.`, cta: "Fortschritt ansehen" },
  es: { subject: "Avance de su proyecto", l1: (s) => `Su proyecto se encuentra ahora en la fase: <strong>${s}</strong>.`, cta: "Ver el avance" },
};

export function voortgangMail(taalIn: string, a: { stap: string }): KlantMail {
  const taal = taalVan(taalIn);
  const T = VOORTGANG[taal];
  return mail(taal, T.subject, {
    eyebrow: ALG[taal].eyebrowPortaal,
    regels: [T.l1(STAP[a.stap]?.[taal] ?? esc(a.stap))],
    cta: T.cta,
    href: portaalLink(taal, "/voortgang"),
    footnote: MAIL[taal].footnote,
  });
}

const SUPPORT: Record<
  Taal,
  {
    eyebrow: string;
    gratisSubject: (c: number, n: number) => string;
    gratisTitel: (c: number) => string;
    gratisL1: (c: number, plan: string) => string;
    gratisNog: (rest: number) => string;
    gratisLaatste: string;
    factuurSubject: (nr: string) => string;
    factuurTitel: (nr: string) => string;
    factuurL1: (plan: string, periode: string, excl: string, incl: string) => string;
    factuurL2: (d: string) => string;
    ctaPortaal: string;
    ctaFactuur: string;
    actie: string;
    offlineSubject: string;
    offlineTitel: string;
    offlineL1: (plan: string) => string;
    offlineL2: string;
    misluktSubject: string;
    misluktTitel: string;
    misluktL1: (plan: string) => string;
    misluktL2: (d: string) => string;
    ctaRegel: string;
  }
> = {
  nl: {
    eyebrow: "Uw supportabonnement",
    gratisSubject: (c, n) => `Gratis supportmaand ${c}/${n}`,
    gratisTitel: (c) => `Maand ${c}: gratis`,
    gratisL1: (c, p) => `Maand ${c} van uw supportabonnement <strong>${p}</strong> is <strong>gratis</strong> — u hoeft niets te betalen.`,
    gratisNog: (r) => `Nog ${r} gratis ${r === 1 ? "maand" : "maanden"}; daarna ontvangt u maandelijks een factuur in uw klantenportaal.`,
    gratisLaatste: "Vanaf volgende maand ontvangt u maandelijks een factuur in uw klantenportaal.",
    factuurSubject: (nr) => `Supportfactuur ${nr}`,
    factuurTitel: (nr) => `Factuur ${nr} staat klaar`,
    factuurL1: (p, per, e, i) => `Uw maandelijkse supportfactuur <strong>${p}</strong> (${per}) staat in uw klantenportaal: ${e} excl. btw — ${i} incl. btw.`,
    factuurL2: (d) => `Betaalbaar tegen ${d}, online via uw portaal of via overschrijving.`,
    ctaPortaal: "Open uw klantenportaal",
    ctaFactuur: "Bekijk uw factuur",
    actie: "Actie nodig",
    offlineSubject: "Uw website is tijdelijk offline — abonnement onbetaald",
    offlineTitel: "Uw website staat tijdelijk offline",
    offlineL1: (p) => `De betaling van uw abonnement <strong>${p}</strong> is na de hersteltermijn nog niet in orde. Daarom is uw website tijdelijk offline gehaald.`,
    offlineL2: "Zodra de betaling in orde is, gaat uw website automatisch weer online. U regelt het in uw klantenportaal, of neem gerust contact op.",
    misluktSubject: "Betaling mislukt — actie nodig binnen 10 dagen",
    misluktTitel: "De betaling van uw abonnement is mislukt",
    misluktL1: (p) => `De automatische incasso voor uw abonnement <strong>${p}</strong> is mislukt.`,
    misluktL2: (d) => `Gelieve dit vóór <strong>${d}</strong> te regelen in uw klantenportaal. Blijft de betaling uit, dan wordt uw website na die datum tijdelijk offline gehaald tot het abonnement weer in orde is.`,
    ctaRegel: "Regel het in uw portaal",
  },
  fr: {
    eyebrow: "Votre abonnement de support",
    gratisSubject: (c, n) => `Mois de support offert ${c}/${n}`,
    gratisTitel: (c) => `Mois ${c} : offert`,
    gratisL1: (c, p) => `Le mois ${c} de votre abonnement de support <strong>${p}</strong> est <strong>offert</strong> — vous n'avez rien à payer.`,
    gratisNog: (r) => `Encore ${r} mois offert${r === 1 ? "" : "s"} ; ensuite, vous recevez chaque mois une facture dans votre espace client.`,
    gratisLaatste: "À partir du mois prochain, vous recevez chaque mois une facture dans votre espace client.",
    factuurSubject: (nr) => `Facture de support ${nr}`,
    factuurTitel: (nr) => `La facture ${nr} est prête`,
    factuurL1: (p, per, e, i) => `Votre facture mensuelle de support <strong>${p}</strong> (${per}) est disponible dans votre espace client : ${e} HTVA — ${i} TVAC.`,
    factuurL2: (d) => `Payable pour le ${d}, en ligne via votre espace client ou par virement.`,
    ctaPortaal: "Ouvrir votre espace client",
    ctaFactuur: "Voir votre facture",
    actie: "Action requise",
    offlineSubject: "Votre site est temporairement hors ligne — abonnement impayé",
    offlineTitel: "Votre site est temporairement hors ligne",
    offlineL1: (p) => `Le paiement de votre abonnement <strong>${p}</strong> n'est toujours pas en ordre après le délai de régularisation. Votre site a donc été temporairement mis hors ligne.`,
    offlineL2: "Dès que le paiement est en ordre, votre site revient automatiquement en ligne. Vous pouvez régler cela dans votre espace client, ou me contacter.",
    misluktSubject: "Échec du paiement — action requise sous 10 jours",
    misluktTitel: "Le paiement de votre abonnement a échoué",
    misluktL1: (p) => `Le prélèvement automatique de votre abonnement <strong>${p}</strong> a échoué.`,
    misluktL2: (d) => `Veuillez régulariser la situation avant le <strong>${d}</strong> dans votre espace client. À défaut, votre site sera temporairement mis hors ligne après cette date, jusqu'à la régularisation de l'abonnement.`,
    ctaRegel: "Régulariser dans votre espace client",
  },
  en: {
    eyebrow: "Your support subscription",
    gratisSubject: (c, n) => `Free support month ${c}/${n}`,
    gratisTitel: (c) => `Month ${c}: free`,
    gratisL1: (c, p) => `Month ${c} of your <strong>${p}</strong> support subscription is <strong>free</strong> — there is nothing to pay.`,
    gratisNog: (r) => `${r} more free ${r === 1 ? "month" : "months"}; after that you receive a monthly invoice in your client portal.`,
    gratisLaatste: "From next month you receive a monthly invoice in your client portal.",
    factuurSubject: (nr) => `Support invoice ${nr}`,
    factuurTitel: (nr) => `Invoice ${nr} is ready`,
    factuurL1: (p, per, e, i) => `Your monthly <strong>${p}</strong> support invoice (${per}) is in your client portal: ${e} excl. VAT — ${i} incl. VAT.`,
    factuurL2: (d) => `Payable by ${d}, online via your portal or by bank transfer.`,
    ctaPortaal: "Open your client portal",
    ctaFactuur: "View your invoice",
    actie: "Action required",
    offlineSubject: "Your website is temporarily offline — subscription unpaid",
    offlineTitel: "Your website is temporarily offline",
    offlineL1: (p) => `The payment for your <strong>${p}</strong> subscription is still outstanding after the grace period. Your website has therefore been taken offline temporarily.`,
    offlineL2: "As soon as the payment is settled, your website goes back online automatically. You can arrange it in your client portal, or feel free to get in touch.",
    misluktSubject: "Payment failed — action required within 10 days",
    misluktTitel: "Your subscription payment failed",
    misluktL1: (p) => `The automatic direct debit for your <strong>${p}</strong> subscription failed.`,
    misluktL2: (d) => `Please settle this before <strong>${d}</strong> in your client portal. If the payment remains outstanding, your website will be taken offline temporarily after that date until the subscription is in order again.`,
    ctaRegel: "Settle it in your portal",
  },
  de: {
    eyebrow: "Ihr Support-Abonnement",
    gratisSubject: (c, n) => `Kostenloser Supportmonat ${c}/${n}`,
    gratisTitel: (c) => `Monat ${c}: kostenlos`,
    gratisL1: (c, p) => `Monat ${c} Ihres Support-Abonnements <strong>${p}</strong> ist <strong>kostenlos</strong> — Sie müssen nichts bezahlen.`,
    gratisNog: (r) => `Noch ${r} kostenlose${r === 1 ? "r Monat" : " Monate"}; danach erhalten Sie monatlich eine Rechnung in Ihrem Kundenportal.`,
    gratisLaatste: "Ab nächstem Monat erhalten Sie monatlich eine Rechnung in Ihrem Kundenportal.",
    factuurSubject: (nr) => `Support-Rechnung ${nr}`,
    factuurTitel: (nr) => `Rechnung ${nr} ist bereit`,
    factuurL1: (p, per, e, i) => `Ihre monatliche Support-Rechnung <strong>${p}</strong> (${per}) steht in Ihrem Kundenportal: ${e} exkl. MwSt. — ${i} inkl. MwSt.`,
    factuurL2: (d) => `Zahlbar bis ${d}, online über Ihr Portal oder per Überweisung.`,
    ctaPortaal: "Ihr Kundenportal öffnen",
    ctaFactuur: "Rechnung ansehen",
    actie: "Handlungsbedarf",
    offlineSubject: "Ihre Website ist vorübergehend offline — Abonnement unbezahlt",
    offlineTitel: "Ihre Website ist vorübergehend offline",
    offlineL1: (p) => `Die Zahlung für Ihr Abonnement <strong>${p}</strong> ist nach der Nachfrist noch nicht erfolgt. Ihre Website wurde daher vorübergehend offline genommen.`,
    offlineL2: "Sobald die Zahlung erfolgt ist, geht Ihre Website automatisch wieder online. Sie können das in Ihrem Kundenportal erledigen oder sich gern bei mir melden.",
    misluktSubject: "Zahlung fehlgeschlagen — Handlungsbedarf innerhalb von 10 Tagen",
    misluktTitel: "Die Zahlung Ihres Abonnements ist fehlgeschlagen",
    misluktL1: (p) => `Die automatische Lastschrift für Ihr Abonnement <strong>${p}</strong> ist fehlgeschlagen.`,
    misluktL2: (d) => `Bitte regeln Sie dies vor dem <strong>${d}</strong> in Ihrem Kundenportal. Bleibt die Zahlung aus, wird Ihre Website nach diesem Datum vorübergehend offline genommen, bis das Abonnement wieder in Ordnung ist.`,
    ctaRegel: "Im Portal regeln",
  },
  es: {
    eyebrow: "Su suscripción de soporte",
    gratisSubject: (c, n) => `Mes de soporte gratuito ${c}/${n}`,
    gratisTitel: (c) => `Mes ${c}: gratuito`,
    gratisL1: (c, p) => `El mes ${c} de su suscripción de soporte <strong>${p}</strong> es <strong>gratuito</strong>: no tiene que pagar nada.`,
    gratisNog: (r) => `Le ${r === 1 ? "queda 1 mes gratuito" : `quedan ${r} meses gratuitos`}; después recibirá cada mes una factura en su portal de cliente.`,
    gratisLaatste: "A partir del mes que viene recibirá cada mes una factura en su portal de cliente.",
    factuurSubject: (nr) => `Factura de soporte ${nr}`,
    factuurTitel: (nr) => `La factura ${nr} está lista`,
    factuurL1: (p, per, e, i) => `Su factura mensual de soporte <strong>${p}</strong> (${per}) está en su portal de cliente: ${e} IVA no incluido — ${i} IVA incluido.`,
    factuurL2: (d) => `Pagadera antes del ${d}, en línea a través de su portal o por transferencia bancaria.`,
    ctaPortaal: "Abrir su portal de cliente",
    ctaFactuur: "Ver su factura",
    actie: "Acción necesaria",
    offlineSubject: "Su sitio web está temporalmente fuera de línea — suscripción impagada",
    offlineTitel: "Su sitio web está temporalmente fuera de línea",
    offlineL1: (p) => `El pago de su suscripción <strong>${p}</strong> sigue pendiente tras el plazo de regularización. Por ello, su sitio web se ha desactivado temporalmente.`,
    offlineL2: "En cuanto se regularice el pago, su sitio web volverá a estar en línea automáticamente. Puede solucionarlo en su portal de cliente o ponerse en contacto conmigo.",
    misluktSubject: "Pago fallido — acción necesaria en un plazo de 10 días",
    misluktTitel: "El pago de su suscripción ha fallado",
    misluktL1: (p) => `La domiciliación automática de su suscripción <strong>${p}</strong> ha fallado.`,
    misluktL2: (d) => `Le ruego que lo solucione antes del <strong>${d}</strong> en su portal de cliente. Si el pago sigue pendiente, su sitio web se desactivará temporalmente después de esa fecha hasta que la suscripción vuelva a estar en regla.`,
    ctaRegel: "Solucionarlo en su portal",
  },
};

export function supportGratisMaandMail(taalIn: string, a: { plan: string; maand: number; gratis: number }): KlantMail {
  const taal = taalVan(taalIn);
  const T = SUPPORT[taal];
  const rest = a.gratis - a.maand;
  return mail(taal, T.gratisSubject(a.maand, a.gratis), {
    eyebrow: T.eyebrow,
    titel: T.gratisTitel(a.maand),
    regels: [T.gratisL1(a.maand, esc(a.plan)), rest > 0 ? T.gratisNog(rest) : T.gratisLaatste],
    cta: T.ctaPortaal,
    href: portaalLink(taal),
    footnote: MAIL[taal].footnote,
  });
}

export function supportFactuurMail(
  taalIn: string,
  a: { plan: string; nummer: string; periodeIso: string; exclCent: number; dueAt: string },
): KlantMail {
  const taal = taalVan(taalIn);
  const T = SUPPORT[taal];
  const d = new Date(`${a.periodeIso.slice(0, 7)}-01T12:00:00`);
  const periode = Number.isNaN(d.getTime())
    ? a.periodeIso
    : d.toLocaleDateString({ nl: "nl-BE", fr: "fr-BE", en: "en-GB", de: "de-DE", es: "es-ES" }[taal], { month: "long", year: "numeric" });
  const incl = Math.round(a.exclCent * 1.21);
  return mail(taal, T.factuurSubject(a.nummer), {
    eyebrow: T.eyebrow,
    titel: T.factuurTitel(a.nummer),
    regels: [
      T.factuurL1(esc(a.plan), periode, mailBedrag(a.exclCent, taal), mailBedrag(incl, taal)),
      T.factuurL2(mailDatum(a.dueAt, taal)),
    ],
    extraHtml: overschrijving(taal, a.nummer, incl),
    cta: T.ctaFactuur,
    href: portaalLink(taal, "/facturen"),
    footnote: MAIL[taal].footnote,
  });
}

export function websiteOfflineMail(taalIn: string, a: { plan: string }): KlantMail {
  const taal = taalVan(taalIn);
  const T = SUPPORT[taal];
  return mail(taal, T.offlineSubject, {
    eyebrow: T.actie,
    titel: T.offlineTitel,
    regels: [T.offlineL1(esc(a.plan)), T.offlineL2],
    cta: T.ctaRegel,
    href: portaalLink(taal, "/facturen"),
    footnote: MAIL[taal].footnote,
  });
}

export function incassoMisluktMail(taalIn: string, a: { plan: string; grace: string }): KlantMail {
  const taal = taalVan(taalIn);
  const T = SUPPORT[taal];
  return mail(taal, T.misluktSubject, {
    eyebrow: T.actie,
    titel: T.misluktTitel,
    regels: [T.misluktL1(esc(a.plan)), T.misluktL2(mailDatum(a.grace, taal))],
    cta: T.ctaRegel,
    href: portaalLink(taal, "/facturen"),
    footnote: MAIL[taal].footnote,
  });
}

// ── Voorbeelden (admin mail-preview, testmail, voorbeeldscript) ─────────

export type VoorbeeldMail = { id: string; titel: string; groep: "Klant" | "Support" | "Archief websites"; mail: KlantMail };

/** Elke klantmail met voorbeeldgegevens, in één taal — exact zoals de echte bouwers ze maken. */
export function klantMailVoorbeelden(taalIn: string): VoorbeeldMail[] {
  const taal = taalVan(taalIn);
  const pid = "00000000-0000-4000-8000-000000000001";
  const t: TicketKop = { id: "00000000-0000-4000-8000-0000000000aa", subject: "Hoogte talud klopt niet op de machine", nummer: 1001, soort: "machine" };
  const rev: TicketKop = { id: "00000000-0000-4000-8000-0000000000bb", subject: "Aangepast rioleringsplan rev. C", nummer: 1002, soort: "revisie" };
  const vandaag = new Date();
  const iso = (dagen: number) => new Date(vandaag.getTime() + dagen * 86400000).toISOString().slice(0, 10);
  const lijnen: OfferteLijn[] = [
    { ...modelLijn(taal, 6, 5000, "normaal"), cents: 30000, kind: "uren" },
    { ...systemenLijn(taal, ["Trimble", "Topcon"]), cents: 0, kind: "incl" },
  ];
  const v: VoorbeeldMail[] = [
    { id: "login", titel: "Inloglink", groep: "Klant", mail: loginMail(taal, siteLink("/auth/confirm?token_hash=VOORBEELD&type=magiclink")) },
    {
      id: "aanvraag",
      titel: "Offerteaanvraag ontvangen",
      groep: "Klant",
      mail: aanvraagOntvangenMail(taal, {
        naam: "Jan Peeters",
        werfAdres: "Kerkstraat 12, 8500 Kortrijk, BE",
        stelsel: "Belge 1972 / Belgian Lambert 72",
        hoogte: "TAW / DNG (Oostende)",
        merk: "Trimble, Topcon",
        aantalPlannen: 3,
        projectId: pid,
      }),
    },
    {
      id: "aanvraag-zonder-plannen",
      titel: "Offerteaanvraag ontvangen (zonder plannen)",
      groep: "Klant",
      mail: aanvraagOntvangenMail(taal, {
        naam: "Jan Peeters",
        werfAdres: "8500 Kortrijk, BE",
        stelsel: "Belge 1972 / Belgian Lambert 72",
        hoogte: "TAW / DNG (Oostende)",
        merk: "Leica",
        aantalPlannen: 0,
        projectId: pid,
      }),
    },
    {
      id: "offerte",
      titel: "Offerte (3D-project)",
      groep: "Klant",
      mail: projectOfferteMail(taal, {
        naam: "Jan Peeters",
        titel: "Wegenis — Kortrijk",
        offerNo: "OFF-2026-014",
        lijnen: [...lijnen, { label: KORTING_LABEL[taal], cents: -2000, kind: "korting" }],
        totaalExclCent: 28000,
        verlegd: false,
        geldigTot: iso(14),
      }),
    },
    {
      id: "offerte-verlegd",
      titel: "Offerte (3D-project, btw verlegd)",
      groep: "Klant",
      mail: projectOfferteMail(taal, {
        naam: "Marie Dubois",
        titel: "Plateforme logistique — Lille",
        offerNo: "OFF-2026-015",
        lijnen,
        totaalExclCent: 30000,
        verlegd: true,
        geldigTot: iso(30),
      }),
    },
    { id: "offerte-herinnering", titel: "Offerte verloopt over 2 dagen", groep: "Klant", mail: offerteHerinneringMail(taal, { titel: "Wegenis — Kortrijk", offerNo: "OFF-2026-014", geldigTot: iso(2) }) },
    {
      id: "factuur",
      titel: "Factuur (3D-project)",
      groep: "Klant",
      mail: projectFactuurMail(taal, { naam: "Jan Peeters", nummer: "FAC-2026-021", titel: "Wegenis — Kortrijk", bedragExclCent: 30000, verlegd: false, dueAt: iso(14), projectId: pid }),
    },
    {
      id: "levering",
      titel: "Nieuwe modelbestanden (nog niet betaald)",
      groep: "Klant",
      mail: leveringMail(taal, { naam: "Jan Peeters", titel: "Wegenis — Kortrijk", versie: 2, systemen: ["Trimble", "Topcon"], betaald: false, projectId: pid }),
    },
    {
      id: "levering-betaald",
      titel: "Nieuwe modelbestanden (betaald)",
      groep: "Klant",
      mail: leveringMail(taal, { naam: null, titel: "Wegenis — Kortrijk", versie: 3, systemen: ["Trimble"], betaald: true, projectId: pid }),
    },
    ...([1, 2, 3] as const).map((n) => ({
      id: `herinnering-${n}`,
      titel: `Betalingsherinnering ${n}`,
      groep: "Klant" as const,
      mail: betaalHerinneringMail(taal, n, { nummer: "FAC-2026-021", bedragCent: 36300, btw: "incl", dueAt: iso(-7 * n), rente: verwijlinterest(36300, iso(-7 * n), iso(0)) }),
    })),
    {
      id: "betaald",
      titel: "Betaling ontvangen (project)",
      groep: "Klant",
      mail: betalingOntvangenMail(taal, {
        nummer: "FAC-2026-021",
        omschrijving: "3D-model — Wegenis — Kortrijk · 6 u × € 50",
        bedragExclCent: 30000,
        metBtw: true,
        verlegd: false,
        paidAt: vandaag.toISOString(),
        soort: "project",
        link: portaalLink(taal, "/facturen"),
      }),
    },
    { id: "ticket-ontvangen", titel: "Ticket ontvangen", groep: "Support", mail: ticketOntvangenMail(taal, t) },
    { id: "ticket-ontvangen-revisie", titel: "Revisie ontvangen (met tarief)", groep: "Support", mail: ticketOntvangenMail(taal, rev, { categorie: "normaal" }) },
    {
      id: "ticket-antwoord",
      titel: "Antwoord op ticket",
      groep: "Support",
      mail: ticketAntwoordMail(taal, t, {
        body: "Het talud lag 5 cm te hoog door de verkeerde geoïde.\nIk heb versie 3 opgeladen in het juiste stelsel.",
        bijlageNamen: ["controle-punten.pdf"],
      }),
    },
    { id: "ticket-antwoord-gesloten", titel: "Antwoord + gesloten", groep: "Support", mail: ticketAntwoordMail(taal, t, { body: "Opgelost in versie 3.", gesloten: true }) },
    { id: "ticket-gesloten", titel: "Ticket gesloten", groep: "Support", mail: ticketGeslotenMail(taal, t, { automatisch: false }) },
    { id: "ticket-auto-gesloten", titel: "Ticket automatisch gesloten", groep: "Support", mail: ticketGeslotenMail(taal, t, { automatisch: true }) },
    {
      id: "revisiefactuur",
      titel: "Revisiefactuur",
      groep: "Support",
      mail: revisieFactuurMail(taal, rev, { nummer: "FAC-2026-022", titel: "Wegenis — Kortrijk", bedragExclCent: 7500, verlegd: false, uren: 1.5, dueAt: iso(14) }),
    },
    { id: "factuur-los", titel: "Losse factuur (klantfiche)", groep: "Klant", mail: factuurKlaarMail(taal, { nummer: "FAC-2026-023", bedragCent: 12100, dueAt: iso(14) }) },
    { id: "document", titel: "Nieuw document (klantfiche)", groep: "Klant", mail: documentMail(taal, { naam: "Uitzetplan werf Kortrijk.pdf" }) },
    {
      id: "offerte-los",
      titel: "Offerte vanuit de klantfiche",
      groep: "Archief websites",
      mail: losseOfferteMail(taal, {
        naam: "Jan Peeters",
        titel: "Onderhoud",
        opnieuw: false,
        kaart: { offerNo: "OFF-2026-016", amountExclCents: 50000, validUntil: mailDatum(iso(14), taal), includes: ["Onderhoud"] },
      }),
    },
    { id: "abonnement", titel: "Abonnement bijgewerkt", groep: "Archief websites", mail: abonnementMail(taal, { plan: "Care", prijsCent: 4900, status: "actief" }) },
    { id: "website", titel: "Website-status", groep: "Archief websites", mail: websiteMail(taal, { naam: "voorbeeld.be", status: "online" }) },
    { id: "voortgang", titel: "Voortgang", groep: "Archief websites", mail: voortgangMail(taal, { stap: "ontwerp" }) },
    { id: "support-gratis", titel: "Gratis supportmaand", groep: "Archief websites", mail: supportGratisMaandMail(taal, { plan: "Care", maand: 1, gratis: 2 }) },
    { id: "support-factuur", titel: "Supportfactuur", groep: "Archief websites", mail: supportFactuurMail(taal, { plan: "Care", nummer: "FAC-2026-030", periodeIso: iso(0), exclCent: 4900, dueAt: iso(14) }) },
    { id: "website-offline", titel: "Website offline (onbetaald)", groep: "Archief websites", mail: websiteOfflineMail(taal, { plan: "Care" }) },
    { id: "incasso-mislukt", titel: "Incasso mislukt", groep: "Archief websites", mail: incassoMisluktMail(taal, { plan: "Care", grace: iso(10) }) },
  ];
  return v;
}
