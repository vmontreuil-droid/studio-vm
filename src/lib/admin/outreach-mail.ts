// Persoonlijke outreach-mail naar aannemers (grond-, weg- en waterbouw).
//
// Ziet eruit als een echte één-op-één-mail van een landmeter — geen
// marketing-template, geen groot logo, lichte achtergrond. Pitch: 3D-
// modellen voor machinesturing, klaar om in te laden, in het juiste
// coördinatenstelsel, transparant uurtarief. Merken worden enkel genoemd
// als ze op de site van de aannemer gevonden zijn.
//
// Talen: nl / fr / en / de. Elke mail heeft een afmeldlink en een
// wettelijke voet met de gegevens uit de bedrijfsinstellingen.

import type { OutreachConfig } from "@/lib/admin/outreach";
import type { CompanySettings } from "@/lib/admin/settings";
import { siteUrl } from "@/lib/supabase/config";
import { UURTARIEF_CENT, MINIMUM_UREN, euro } from "@/lib/tarieven";
import {
  heeftSturing,
  legeSignalen,
  type MailTaal,
  type ProspectLand,
  type Signalen,
} from "@/lib/admin/aannemers";

export type OutreachProspect = {
  land: ProspectLand;
  website: string | null;
  signalen: Signalen | null;
  /** Token voor de afmeldlink (prospect_outreach.scan_token). */
  token: string;
};

/** Gegevens voor de wettelijke voet — uit de bedrijfsinstellingen. */
export type MailBedrijf = {
  naam: string;
  adres: string | null;
  btw: string | null;
  email: string | null;
  website: string;
};

export function bedrijfVoorMail(s: Pick<CompanySettings, "address" | "vat_number" | "email" | "website">): MailBedrijf {
  return {
    // Handelsnaam — bewust vast, ook als de juridische naam anders is.
    naam: "Studio VM",
    adres: s.address?.trim() || null,
    btw: s.vat_number?.trim() || null,
    email: s.email?.trim() || null,
    website: (s.website || siteUrl || "https://www.studio-vm.be").replace(/\/$/, ""),
  };
}

export type OutreachMail = {
  subject: string;
  html: string;
  text: string;
  from: string;
};

type Haak = "merken" | "sturing" | "werk" | "algemeen";

const BASE = () => (process.env.NEXT_PUBLIC_SITE_URL || siteUrl || "https://www.studio-vm.be").replace(/\/$/, "");

function prijs(cat: keyof typeof UURTARIEF_CENT, lang: MailTaal): string {
  return euro(UURTARIEF_CENT[cat], lang);
}

// "Trimble" / "Trimble en Topcon" / "Trimble, Topcon en Leica"
function lijst(items: string[], en: string): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${en} ${items[items.length - 1]}`;
}

// Samenstelling met koppelteken: "Trimble- en Topcon-machinesturing"
function samenstelling(items: string[], en: string, woord: string): string {
  if (items.length === 0) return woord.replace(/^-/, "");
  if (items.length === 1) return `${items[0]}${woord}`;
  const kop = items.slice(0, -1).map((m) => `${m}-`);
  return `${kop.join(", ")} ${en} ${items[items.length - 1]}${woord}`;
}

function stelselVoorbeeld(land: ProspectLand, lang: MailTaal): string {
  if (land === "fr") {
    return lang === "fr"
      ? "Lambert-93 ou zones CC, altitudes NGF-IGN69"
      : lang === "de"
        ? "Lambert-93 oder CC-Zonen, Höhen NGF-IGN69"
        : lang === "en"
          ? "Lambert-93 or CC zones, NGF-IGN69 heights"
          : "Lambert-93 of CC-zones, NGF-IGN69-hoogtes";
  }
  if (land === "uk") {
    return lang === "en"
      ? "British National Grid, ODN heights"
      : lang === "fr"
        ? "British National Grid, altitudes ODN"
        : lang === "de"
          ? "British National Grid, Höhen ODN"
          : "British National Grid, ODN-hoogtes";
  }
  return lang === "fr"
    ? "Lambert 72 ou Lambert 2008, altitudes DNG"
    : lang === "de"
      ? "Lambert 72 oder Lambert 2008, Höhen TAW/DNG"
      : lang === "en"
        ? "Belgian Lambert 72 or 2008, TAW heights"
        : "Lambert 72 of Lambert 2008, TAW-hoogtes";
}

const LAND_NAAM: Record<MailTaal, string> = {
  nl: "België",
  fr: "Belgique",
  en: "Belgium",
  de: "Belgien",
};

type Tekst = {
  subject: (merken: string[]) => string;
  greeting: string;
  intro: string;
  haak: Record<Haak, (host: string, merken: string[]) => string>;
  watKop: string;
  wat: (stelsel: string, merken: string[]) => string[];
  prijs: string;
  ctaVoorbeelden: string;
  ctaOfferte: string;
  antwoord: string;
  followup: string[];
  followupStop: string;
  signOff: string;
  rol: string;
  waarom: string;
  afmelden: string;
  btwLabel: string;
};

const T: Record<MailTaal, Tekst> = {
  nl: {
    subject: (m) =>
      m.length
        ? `3D-modellen voor uw ${samenstelling(m.slice(0, 2), "en", "-machinesturing")}`
        : "3D-modellen voor uw machinesturing",
    greeting: "Goedendag,",
    intro:
      "Ik ben Vincent Montreuil, landmeter. Onder de naam Studio VM maak ik 3D-ontwerpmodellen voor machinesturing: van uw plannen (PDF, DWG of profielen) naar een model dat uw graafmachine, grader of dozer meteen kan inladen.",
    haak: {
      merken: (h, m) =>
        `Op ${h} zag ik dat u met ${lijst(m, "en")} werkt. Het model lever ik rechtstreeks in het formaat van ${m.length > 1 ? "die systemen" : "dat systeem"}.`,
      sturing: (h) =>
        `Op ${h} las ik dat u met machinesturing werkt. Dan weet u hoeveel tijd een goed model op de werf bespaart.`,
      werk: (h) =>
        `Op ${h} zag ik dat u grondwerken en wegenis uitvoert. Met een 3D-model op de machine werkt u zonder piketten of uitzetwerk, rechtstreeks op hoogte.`,
      algemeen: () =>
        "Ik contacteer u omdat uw bedrijf actief is in grond-, weg- of waterbouw. Werkt u (of een onderaannemer) met machinesturing, dan lever ik graag het model.",
    },
    watKop: "Wat u krijgt:",
    wat: (st, m) => [
      "ontwerpoppervlak, lijnwerk en hoogtelijnen, klaar om in te laden;",
      `in het coördinatenstelsel en de hoogtereferentie van uw werf (${st});`,
      m.length > 1
        ? `geleverd voor ${lijst(m, "en")}, elk in het eigen formaat, zonder meerprijs;`
        : "per systeem geleverd in het juiste formaat; meerdere systemen zonder meerprijs;",
      "snelle levering, ook last-minute binnen 5 werkdagen.",
    ],
    prijs: `Transparant uurtarief, excl. btw: ${prijs("vroegtijdig", "nl")}/u als u meer dan 3 weken vooraf aanvraagt, ${prijs("normaal", "nl")}/u normaal en ${prijs("last-minute", "nl")}/u last-minute. Minimum ${MINIMUM_UREN} uur; u krijgt vooraf een offerte met het geschatte aantal uren.`,
    ctaVoorbeelden: "Bekijk voorbeelden van modellen",
    ctaOfferte: "Vraag een offerte aan",
    antwoord: "Of antwoord gewoon op deze mail, met uw plannen in bijlage.",
    followup: [
      "Even een korte opvolging van mijn vorige mail over 3D-modellen voor machinesturing.",
      `Staat er binnenkort een werf gepland waarvoor u een model nodig heeft? Stuur gerust de plannen door: u krijgt eerst een offerte met het geschatte aantal uren, pas daarna begin ik eraan. Hoe vroeger u aanvraagt, hoe voordeliger (${prijs("vroegtijdig", "nl")}/u vanaf 3 weken op voorhand).`,
    ],
    followupStop: "Geen interesse? Laat het me gerust weten, dan hoort u niets meer van mij.",
    signOff: "Met vriendelijke groeten,",
    rol: "Landmeter",
    waarom:
      "U ontvangt deze e-mail omdat uw bedrijf actief is in grond-, weg- of waterbouw. Liever geen e-mails meer? Afmelden met één klik:",
    afmelden: "afmelden",
    btwLabel: "btw",
  },
  fr: {
    subject: (m) =>
      m.length
        ? `Modèles 3D pour votre guidage d'engins ${lijst(m.slice(0, 2), "et")}`
        : "Modèles 3D pour votre guidage d'engins",
    greeting: "Bonjour,",
    intro:
      "Je suis Vincent Montreuil, géomètre. Sous le nom Studio VM, je réalise des modèles 3D de conception pour le guidage d'engins : de vos plans (PDF, DWG ou profils) à un modèle que votre pelle, niveleuse ou bouteur peut charger directement.",
    haak: {
      merken: (h, m) =>
        `Sur ${h}, j'ai vu que vous travaillez avec ${lijst(m, "et")}. Je livre le modèle directement au format de ${m.length > 1 ? "ces systèmes" : "ce système"}.`,
      sturing: (h) =>
        `Sur ${h}, j'ai lu que vous travaillez avec le guidage d'engins : vous savez donc le temps qu'un bon modèle fait gagner sur chantier.`,
      werk: (h) =>
        `Sur ${h}, j'ai vu que vous réalisez des terrassements et de la voirie. Avec un modèle 3D dans la machine, vous travaillez sans piquets ni implantation, directement à la bonne cote.`,
      algemeen: () =>
        "Je vous contacte car votre entreprise est active en terrassement, voirie ou génie civil. Si vous (ou un sous-traitant) travaillez avec le guidage d'engins, je fournis volontiers le modèle.",
    },
    watKop: "Ce que vous recevez :",
    wat: (st, m) => [
      "surface de conception, lignes et courbes de niveau, prêtes à charger ;",
      `dans le système de coordonnées et la référence altimétrique de votre chantier (${st}) ;`,
      m.length > 1
        ? `livré pour ${lijst(m, "et")}, chacun dans son format, sans supplément ;`
        : "livré pour chaque système au bon format ; plusieurs systèmes sans supplément ;",
      "livraison rapide, y compris en urgence sous 5 jours ouvrables.",
    ],
    prijs: `Tarif horaire transparent, hors TVA : ${prijs("vroegtijdig", "fr")}/h si vous demandez plus de 3 semaines à l'avance, ${prijs("normaal", "fr")}/h en normal et ${prijs("last-minute", "fr")}/h en urgence. Minimum ${MINIMUM_UREN} heure ; vous recevez d'abord un devis avec le nombre d'heures estimé.`,
    ctaVoorbeelden: "Voir des exemples de modèles",
    ctaOfferte: "Demander un devis",
    antwoord: "Ou répondez simplement à ce mail, avec vos plans en pièce jointe.",
    followup: [
      "Un petit suivi de mon précédent message au sujet des modèles 3D pour le guidage d'engins.",
      `Avez-vous bientôt un chantier pour lequel il vous faut un modèle ? Envoyez-moi simplement les plans : vous recevez d'abord un devis avec le nombre d'heures estimé, je ne commence qu'après. Plus vous demandez tôt, plus c'est avantageux (${prijs("vroegtijdig", "fr")}/h à partir de 3 semaines à l'avance).`,
    ],
    followupStop: "Pas intéressé ? Dites-le-moi simplement, vous n'aurez plus de nouvelles de ma part.",
    signOff: "Bien cordialement,",
    rol: "Géomètre",
    waarom:
      "Vous recevez cet e-mail car votre entreprise est active en terrassement, voirie ou génie civil. Vous ne souhaitez plus recevoir d'e-mails ? Désinscription en un clic :",
    afmelden: "se désinscrire",
    btwLabel: "TVA",
  },
  en: {
    subject: (m) =>
      m.length
        ? `3D models for your ${lijst(m.slice(0, 2), "and")} machine control`
        : "3D models for your machine control",
    greeting: "Hello,",
    intro:
      "I'm Vincent Montreuil, a land surveyor. Under the name Studio VM I build 3D design models for machine control: from your drawings (PDF, DWG or sections) to a model your excavator, grader or dozer can load straight away.",
    haak: {
      merken: (h, m) =>
        `I noticed on ${h} that you work with ${lijst(m, "and")}. I deliver the model directly in ${m.length > 1 ? "the formats of those systems" : "that system's format"}.`,
      sturing: (h) =>
        `I read on ${h} that you use machine control, so you know how much time a good model saves on site.`,
      werk: (h) =>
        `I noticed on ${h} that you carry out earthworks and road construction. With a 3D model in the machine you work without pegs or setting out, straight to level.`,
      algemeen: () =>
        "I'm contacting you because your company works in earthworks, roads or civil engineering. If you (or a subcontractor) use machine control, I'd be glad to supply the model.",
    },
    watKop: "What you get:",
    wat: (st, m) => [
      "design surface, linework and contours, ready to load;",
      `in the coordinate system and height datum of your site (${st});`,
      m.length > 1
        ? `delivered for ${lijst(m, "and")}, each in its own format, at no extra cost;`
        : "delivered for each system in the right format; several systems at no extra cost;",
      "fast delivery, including last-minute within 5 working days.",
    ],
    prijs: `Transparent hourly rate, excl. VAT: ${prijs("vroegtijdig", "en")}/h when you request more than 3 weeks ahead, ${prijs("normaal", "en")}/h standard and ${prijs("last-minute", "en")}/h last-minute. Minimum ${MINIMUM_UREN} hour; you get a quote with the estimated hours first.`,
    ctaVoorbeelden: "See example models",
    ctaOfferte: "Request a quote",
    antwoord: "Or simply reply to this email with your drawings attached.",
    followup: [
      "A short follow-up to my previous email about 3D models for machine control.",
      `Do you have a site coming up that needs a model? Just send me the drawings: you get a quote with the estimated hours first, and I only start after that. The earlier you ask, the better the rate (${prijs("vroegtijdig", "en")}/h from 3 weeks ahead).`,
    ],
    followupStop: "Not interested? Just let me know and you won't hear from me again.",
    signOff: "Kind regards,",
    rol: "Land surveyor",
    waarom:
      "You are receiving this email because your company works in earthworks, roads or civil engineering. Prefer not to hear from me? Unsubscribe in one click:",
    afmelden: "unsubscribe",
    btwLabel: "VAT",
  },
  de: {
    subject: (m) =>
      m.length
        ? `3D-Modelle für Ihre ${samenstelling(m.slice(0, 2), "und", "-Maschinensteuerung")}`
        : "3D-Modelle für Ihre Maschinensteuerung",
    greeting: "Guten Tag,",
    intro:
      "mein Name ist Vincent Montreuil, ich bin Vermesser. Unter dem Namen Studio VM erstelle ich 3D-Planungsmodelle für Maschinensteuerungen: aus Ihren Plänen (PDF, DWG oder Profile) ein Modell, das Ihr Bagger, Grader oder Dozer direkt laden kann.",
    haak: {
      merken: (h, m) =>
        `Auf ${h} habe ich gesehen, dass Sie mit ${lijst(m, "und")} arbeiten. Ich liefere das Modell direkt im Format ${m.length > 1 ? "dieser Systeme" : "dieses Systems"}.`,
      sturing: (h) =>
        `Auf ${h} habe ich gelesen, dass Sie mit Maschinensteuerung arbeiten. Sie wissen also, wie viel Zeit ein gutes Modell auf der Baustelle spart.`,
      werk: (h) =>
        `Auf ${h} habe ich gesehen, dass Sie Erd- und Straßenbauarbeiten ausführen. Mit einem 3D-Modell in der Maschine arbeiten Sie ohne Pflöcke und Absteckung, direkt auf Höhe.`,
      algemeen: () =>
        "Ich schreibe Ihnen, weil Ihr Unternehmen im Erd-, Straßen- oder Tiefbau tätig ist. Wenn Sie (oder ein Subunternehmer) mit Maschinensteuerung arbeiten, liefere ich gern das Modell.",
    },
    watKop: "Was Sie erhalten:",
    wat: (st, m) => [
      "Planungsoberfläche, Linien und Höhenlinien, fertig zum Laden;",
      `im Koordinatensystem und Höhenbezug Ihrer Baustelle (${st});`,
      m.length > 1
        ? `geliefert für ${lijst(m, "und")}, jeweils im eigenen Format, ohne Aufpreis;`
        : "für jedes System im passenden Format geliefert; mehrere Systeme ohne Aufpreis;",
      "schnelle Lieferung, auch kurzfristig innerhalb von 5 Werktagen.",
    ],
    prijs: `Transparenter Stundensatz, zzgl. MwSt.: ${prijs("vroegtijdig", "de")}/h bei Anfrage mehr als 3 Wochen im Voraus, ${prijs("normaal", "de")}/h regulär und ${prijs("last-minute", "de")}/h kurzfristig. Mindestens ${MINIMUM_UREN} Stunde; Sie erhalten vorab ein Angebot mit der geschätzten Stundenzahl.`,
    ctaVoorbeelden: "Beispielmodelle ansehen",
    ctaOfferte: "Angebot anfordern",
    antwoord: "Oder antworten Sie einfach auf diese E-Mail und senden Sie Ihre Pläne mit.",
    followup: [
      "eine kurze Nachfrage zu meiner letzten E-Mail über 3D-Modelle für Maschinensteuerungen.",
      `Steht bald eine Baustelle an, für die Sie ein Modell brauchen? Senden Sie mir einfach die Pläne: Sie erhalten zuerst ein Angebot mit der geschätzten Stundenzahl, erst danach fange ich an. Je früher Sie anfragen, desto günstiger (${prijs("vroegtijdig", "de")}/h ab 3 Wochen im Voraus).`,
    ],
    followupStop: "Kein Interesse? Sagen Sie mir einfach Bescheid, dann hören Sie nichts mehr von mir.",
    signOff: "Mit freundlichen Grüßen",
    rol: "Vermesser",
    waarom:
      "Sie erhalten diese E-Mail, weil Ihr Unternehmen im Erd-, Straßen- oder Tiefbau tätig ist. Keine E-Mails mehr erwünscht? Mit einem Klick abmelden:",
    afmelden: "abmelden",
    btwLabel: "USt-IdNr.",
  },
};

function hostVan(website: string | null): string | null {
  if (!website) return null;
  const h = website
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/[/?#].*$/, "")
    .toLowerCase();
  return h || null;
}

function haakVoor(s: Signalen, host: string | null): Haak {
  if (!host || s.bron !== "site") return "algemeen";
  if (s.merken.length > 0) return "merken";
  if (heeftSturing(s)) return "sturing";
  if (s.werk.length > 0) return "werk";
  return "algemeen";
}

function utm(url: string, variant: "first" | "followup", lang: MailTaal): string {
  const q = new URLSearchParams({
    utm_source: "outreach",
    utm_medium: "email",
    utm_campaign: "aannemers-3d",
    utm_content: `${variant}-${lang}`,
  });
  return `${url}?${q.toString()}`;
}

const FONT =
  "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
const P = `margin:0 0 14px;font:400 15px/1.6 ${FONT};color:#1c1917`;

export function buildOutreachMail(
  p: OutreachProspect,
  cfg: Pick<OutreachConfig, "senderName" | "senderEmail">,
  bedrijf: MailBedrijf,
  lang: MailTaal,
  variant: "first" | "followup" = "first",
): OutreachMail {
  const t = T[lang] ?? T.nl;
  const s = p.signalen ?? legeSignalen(p.website ? "site" : "geen-site");
  const host = hostVan(p.website);
  const haak = haakVoor(s, host);
  const merken = haak === "merken" ? s.merken.slice(0, 3) : [];
  const base = BASE();
  const voorbeelden = utm(`${base}/${lang}/realisaties`, variant, lang);
  const offerte = utm(`${base}/${lang}/offerte`, variant, lang);
  const unsub = `${base}/api/outreach/unsubscribe?t=${encodeURIComponent(p.token)}&l=${lang}`;

  const firstSubject = t.subject(merken);
  const subject = variant === "first" ? firstSubject : `Re: ${firstSubject}`;
  // Franse typografie: spatie vóór het dubbelpunt.
  const dp = lang === "fr" ? " : " : ": ";

  const naam = cfg.senderName || "Vincent Montreuil";
  const voornaam = naam.split(/\s+/)[0] || naam;

  // Wettelijke voet
  const adres = bedrijf.adres
    ? new RegExp(LAND_NAAM[lang], "i").test(bedrijf.adres) || /belgi/i.test(bedrijf.adres)
      ? bedrijf.adres
      : `${bedrijf.adres}, ${LAND_NAAM[lang]}`
    : null;
  const voetDelen = [
    bedrijf.naam,
    adres,
    bedrijf.btw ? `${t.btwLabel} ${bedrijf.btw}` : null,
    bedrijf.email,
  ].filter((x): x is string => !!x);
  const siteLabel = bedrijf.website.replace(/^https?:\/\//, "").replace(/^www\./, "");

  const links = `<p style="margin:0 0 6px;font:400 15px/1.6 ${FONT}"><a href="${esc(voorbeelden)}" style="color:#c2410c;font-weight:600;text-decoration:underline">${esc(t.ctaVoorbeelden)} →</a></p>
  <p style="margin:0 0 18px;font:400 15px/1.6 ${FONT}"><a href="${esc(offerte)}" style="color:#c2410c;font-weight:600;text-decoration:underline">${esc(t.ctaOfferte)} →</a></p>`;

  let bodyHtml: string;
  let bodyText: string;
  if (variant === "first") {
    const haakTekst = t.haak[haak](host ?? "", merken);
    const wat = t.wat(stelselVoorbeeld(p.land, lang), merken);
    bodyHtml = `<p style="${P}">${esc(t.greeting)}</p>
  <p style="${P}">${esc(t.intro)}</p>
  <p style="${P}">${esc(haakTekst).replace(esc(host ?? "\u0000"), `<strong>${esc(host ?? "")}</strong>`)}</p>
  <p style="margin:0 0 6px;font:600 15px/1.6 ${FONT};color:#1c1917">${esc(t.watKop)}</p>
  <ul style="margin:0 0 14px;padding-left:20px;font:400 15px/1.6 ${FONT};color:#1c1917">${wat.map((w) => `<li style="margin:0 0 2px">${esc(w)}</li>`).join("")}</ul>
  <p style="${P}">${esc(t.prijs)}</p>
  ${links}
  <p style="${P}">${esc(t.antwoord)}</p>`;
    bodyText = [
      t.greeting,
      t.intro,
      haakTekst,
      `${t.watKop}\n${wat.map((w) => `- ${w}`).join("\n")}`,
      t.prijs,
      `${t.ctaVoorbeelden}${dp}${voorbeelden}\n${t.ctaOfferte}${dp}${offerte}`,
      t.antwoord,
    ].join("\n\n");
  } else {
    bodyHtml = `<p style="${P}">${esc(t.greeting)}</p>
  ${t.followup.map((f) => `<p style="${P}">${esc(f)}</p>`).join("\n  ")}
  ${links}
  <p style="margin:0 0 14px;font:400 14px/1.6 ${FONT};color:#57534e">${esc(t.followupStop)}</p>`;
    bodyText = [
      t.greeting,
      ...t.followup,
      `${t.ctaVoorbeelden}${dp}${voorbeelden}\n${t.ctaOfferte}${dp}${offerte}`,
      t.followupStop,
    ].join("\n\n");
  }

  const handtekeningHtml =
    variant === "first"
      ? `<p style="margin:18px 0 2px;font:400 15px/1.6 ${FONT};color:#1c1917">${esc(t.signOff)}</p>
  <p style="margin:0;font:600 15px/1.5 ${FONT};color:#1c1917">${esc(naam)}</p>
  <p style="margin:0;font:400 14px/1.5 ${FONT};color:#57534e">${esc(t.rol)} · ${esc(bedrijf.naam)} · <a href="${esc(bedrijf.website)}" style="color:#57534e;text-decoration:none">${esc(siteLabel)}</a></p>`
      : `<p style="margin:18px 0 2px;font:400 15px/1.6 ${FONT};color:#1c1917">${esc(t.signOff)}</p>
  <p style="margin:0;font:400 15px/1.5 ${FONT};color:#1c1917">${esc(voornaam)} · ${esc(bedrijf.naam)}</p>`;

  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="color-scheme" content="light only"><title>${esc(subject)}</title></head><body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:580px;margin:0 auto;padding:24px 16px;background:#ffffff">
  ${bodyHtml}
  ${handtekeningHtml}
  <p style="margin:36px 0 4px;padding-top:14px;border-top:1px solid #eeeceb;font:400 11px/1.6 ${FONT};color:#a8a29e">${esc(voetDelen.join(" · "))}</p>
  <p style="margin:0;font:400 11px/1.6 ${FONT};color:#a8a29e">${esc(t.waarom)} <a href="${esc(unsub)}" style="color:#a8a29e;text-decoration:underline">${esc(t.afmelden)}</a></p>
</div></body></html>`;

  const handtekeningText =
    variant === "first"
      ? `${t.signOff}\n${naam}\n${t.rol} · ${bedrijf.naam} · ${siteLabel}`
      : `${t.signOff}\n${voornaam} · ${bedrijf.naam}`;
  const text = `${bodyText}\n\n${handtekeningText}\n\n--\n${voetDelen.join(" · ")}\n${t.waarom} ${unsub}\n`;

  return {
    subject,
    html,
    text,
    from: `${naam} <${cfg.senderEmail}>`,
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────────────
// Voorbeeldmails — voor /admin/mail-preview en de testmail-knop.
// Fictieve aannemers, nooit een echte prospect.
// ─────────────────────────────────────────────────────────────────────

export type OutreachSample = {
  id: string;
  title: string;
  mail: OutreachMail;
};

type SampleDef = {
  key: string;
  label: string;
  lang: MailTaal;
  land: ProspectLand;
  website: string | null;
  signalen: Signalen;
};

const SAMPLE_DEFS: SampleDef[] = [
  {
    key: "nl",
    label: "NL — Trimble gevonden",
    lang: "nl",
    land: "be",
    website: "https://www.voorbeeld-grondwerken.be",
    signalen: { v: 1, merken: ["Trimble"], andereMerken: [], sturing: ["machinesturing"], werk: ["grondwerken", "wegenis"], taal: "nl", bron: "site" },
  },
  {
    key: "fr",
    label: "FR — Leica + Topcon gevonden",
    lang: "fr",
    land: "fr",
    website: "https://www.exemple-terrassement.fr",
    signalen: { v: 1, merken: ["Leica", "Topcon"], andereMerken: [], sturing: ["guidage d'engins"], werk: ["terrassement"], taal: "fr", bron: "site" },
  },
  {
    key: "en",
    label: "EN — machine control, geen merk",
    lang: "en",
    land: "uk",
    website: "https://www.example-groundworks.co.uk",
    signalen: { v: 1, merken: [], andereMerken: [], sturing: ["machine control", "GNSS"], werk: ["earthworks"], taal: "en", bron: "site" },
  },
  {
    key: "de",
    label: "DE — Erdbau (Ostbelgien)",
    lang: "de",
    land: "be",
    website: "https://www.beispiel-erdbau.be",
    signalen: { v: 1, merken: [], andereMerken: [], sturing: [], werk: ["Erdbau / Tiefbau", "machinepark"], taal: "de", bron: "site" },
  },
  {
    key: "nl-zonder-site",
    label: "NL — geen website (KBO-adres)",
    lang: "nl",
    land: "be",
    website: null,
    signalen: legeSignalen("geen-site"),
  },
  {
    key: "fr-be-grondwerk",
    label: "FR (Wallonië) — terrassement",
    lang: "fr",
    land: "be",
    website: "https://www.exemple-terrassements.be",
    signalen: { v: 1, merken: [], andereMerken: [], sturing: [], werk: ["terrassement", "voirie / VRD"], taal: "fr", bron: "site" },
  },
];

export function buildOutreachSamples(
  cfg: Pick<OutreachConfig, "senderName" | "senderEmail">,
  bedrijf: MailBedrijf,
): OutreachSample[] {
  const out: OutreachSample[] = [];
  for (const d of SAMPLE_DEFS) {
    for (const variant of ["first", "followup"] as const) {
      // Opvolgmail is identiek voor elke haak — enkel per taal tonen.
      if (variant === "followup" && !["nl", "fr", "en", "de"].includes(d.key)) continue;
      out.push({
        id: `outreach-${variant}-${d.key}`,
        title: `${variant === "first" ? "Eerste mail" : "Opvolgmail"} · ${variant === "first" ? d.label : d.lang.toUpperCase()}`,
        mail: buildOutreachMail(
          { land: d.land, website: d.website, signalen: d.signalen, token: "voorbeeld-token" },
          cfg,
          bedrijf,
          d.lang,
          variant,
        ),
      });
    }
  }
  return out;
}
