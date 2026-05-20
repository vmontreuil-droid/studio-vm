export type Channel =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "bluesky"
  | "mastodon";

export const CHANNELS: Channel[] = [
  "facebook",
  "instagram",
  "linkedin",
  "bluesky",
  "mastodon",
];

export const CHANNEL_LABEL: Record<Channel, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
};

export const CHANNEL_LIMIT: Record<Channel, number> = {
  facebook: 2000,
  instagram: 2200,
  linkedin: 2900,
  bluesky: 300,
  mastodon: 500,
};

export type Locale = "nl" | "fr" | "en";
export const LOCALES: Locale[] = ["nl", "fr", "en"];

export type Variant = { text: string };
export type Variants = Partial<Record<Channel, Variant>>;

export type Base = {
  hook: string;
  body: string;
  cta?: string;
  link?: string;
  hashtags?: string[];
};

function hashtagBlock(tags: string[], max: number): string {
  if (tags.length === 0) return "";
  return tags
    .slice(0, max)
    .map((t) => "#" + t.replace(/\s+/g, "").replace(/[^\p{L}\p{N}_]/gu, ""))
    .filter((t) => t.length > 1)
    .join(" ");
}

export function formatForChannel(
  ch: Channel,
  b: Base,
  locale: Locale,
): string {
  const limit = CHANNEL_LIMIT[ch];
  let text = "";

  if (ch === "bluesky" || ch === "mastodon") {
    const hook = b.hook;
    const link = b.link ?? "";
    text = link ? `${hook} ${link}` : hook;
    if (text.length > limit) {
      const room = limit - (link ? link.length + 2 : 1);
      text = `${hook.slice(0, Math.max(0, room - 1))}… ${link}`.trim();
    }
  } else if (ch === "instagram") {
    const igCta = b.link
      ? `${b.cta ?? ctaDefault(locale)} — ${linkInBio(locale)}`
      : (b.cta ?? "");
    const tags = hashtagBlock(b.hashtags ?? [], 15);
    text = [b.hook, b.body, igCta, tags].filter(Boolean).join("\n\n");
  } else if (ch === "linkedin") {
    const tags = hashtagBlock(b.hashtags ?? [], 5);
    text = [b.hook, b.body, b.cta, b.link, tags]
      .filter(Boolean)
      .join("\n\n");
  } else {
    // facebook
    const tags = hashtagBlock(b.hashtags ?? [], 3);
    text = [b.hook, b.body, b.cta, b.link, tags]
      .filter(Boolean)
      .join("\n\n");
  }

  if (text.length > limit) text = text.slice(0, limit - 1) + "…";
  return text;
}

function ctaDefault(locale: Locale): string {
  return locale === "fr"
    ? "Découvrez-en plus"
    : locale === "en"
      ? "Find out more"
      : "Lees meer";
}

function linkInBio(locale: Locale): string {
  return locale === "fr"
    ? "lien dans la bio"
    : locale === "en"
      ? "link in bio"
      : "link in bio";
}

export function expandAllVariants(
  b: Base,
  locale: Locale,
  channels: Channel[] = CHANNELS,
): Variants {
  const out: Variants = {};
  for (const ch of channels) out[ch] = { text: formatForChannel(ch, b, locale) };
  return out;
}

// ---------- Generatoren ----------

type LocalizedCopy<T> = Record<Locale, T>;

const ANNOUNCE_HOOK: LocalizedCopy<(title: string) => string> = {
  nl: (t) => `Nieuw op de blog: ${t}.`,
  fr: (t) => `Nouveau sur le blog : ${t}.`,
  en: (t) => `New on the blog: ${t}.`,
};

const INSIGHT_HOOK: LocalizedCopy<(title: string) => string> = {
  nl: (t) => `Iets dat we leerden: ${t}.`,
  fr: (t) => `Une chose retenue : ${t}.`,
  en: (t) => `One thing we learned: ${t}.`,
};

const CTA_READ: LocalizedCopy<string> = {
  nl: "Lees het volledige stuk →",
  fr: "Lire l'article complet →",
  en: "Read the full piece →",
};

const CHANGELOG_HOOK: LocalizedCopy<(v: string, title: string) => string> = {
  nl: (v, t) => `Update ${v ? v + " — " : ""}${t}.`,
  fr: (v, t) => `Mise à jour ${v ? v + " — " : ""}${t}.`,
  en: (v, t) => `Update ${v ? v + " — " : ""}${t}.`,
};

const CHANGELOG_CTA: LocalizedCopy<string> = {
  nl: "Bekijk de changelog →",
  fr: "Voir le changelog →",
  en: "See the changelog →",
};

export type NewSocialPost = {
  kind: string;
  source_ref: string | null;
  locale: Locale;
  headline: string;
  link: string | null;
  channels: Channel[];
  variants: Variants;
};

type JournalRow = {
  id: string;
  slug: string;
  content: Record<string, { title?: string; excerpt?: string; tag?: string } | undefined>;
};

export function buildFromJournal(
  p: JournalRow,
  siteUrl: string,
): NewSocialPost[] {
  const out: NewSocialPost[] = [];
  for (const loc of LOCALES) {
    const c = p.content?.[loc];
    if (!c || !c.title) continue;
    const link = `${siteUrl}/${loc}/journal/${p.slug}`;
    const tag = (c.tag ?? "").replace(/\s+/g, "");
    const baseTags = ["StudioVM", tag || "web"].filter(Boolean);

    const announce: Base = {
      hook: ANNOUNCE_HOOK[loc](c.title),
      body: c.excerpt ?? "",
      cta: CTA_READ[loc],
      link,
      hashtags: baseTags,
    };
    out.push({
      kind: "journal-announce",
      source_ref: p.id,
      locale: loc,
      headline: c.title,
      link,
      channels: CHANNELS,
      variants: expandAllVariants(announce, loc),
    });

    const insight: Base = {
      hook: INSIGHT_HOOK[loc](c.title),
      body: c.excerpt ?? "",
      cta: CTA_READ[loc],
      link,
      hashtags: [...baseTags, "webdev"],
    };
    out.push({
      kind: "journal-insight",
      source_ref: p.id,
      locale: loc,
      headline: c.title,
      link,
      channels: CHANNELS,
      variants: expandAllVariants(insight, loc),
    });
  }
  return out;
}

type ChangelogRow = {
  id: string;
  version: string;
  kind: string;
  content: Record<string, { title?: string; detail?: string } | undefined>;
};

export function buildFromChangelog(
  e: ChangelogRow,
  siteUrl: string,
): NewSocialPost[] {
  const out: NewSocialPost[] = [];
  for (const loc of LOCALES) {
    const c = e.content?.[loc];
    if (!c || !c.title) continue;
    const link = `${siteUrl}/${loc}/changelog`;
    const base: Base = {
      hook: CHANGELOG_HOOK[loc](e.version, c.title),
      body: c.detail ?? "",
      cta: CHANGELOG_CTA[loc],
      link,
      hashtags: ["StudioVM", "release"],
    };
    out.push({
      kind: "changelog",
      source_ref: e.id,
      locale: loc,
      headline: c.title,
      link,
      channels: CHANNELS,
      variants: expandAllVariants(base, loc),
    });
  }
  return out;
}

// ---------- Evergreen-tipsbibliotheek ----------

type Tip = {
  slug: string;
  hook: LocalizedCopy<string>;
  body: LocalizedCopy<string>;
  cta: LocalizedCopy<string>;
  link?: string; // pad zonder locale-prefix, bv. "/scan"
  hashtags: string[];
};

export const TIPS: Tip[] = [
  {
    slug: "unused-plugin",
    hook: {
      nl: "Tip: een ongebruikte WordPress-plugin is een open deur.",
      fr: "Astuce : un plugin WordPress inutilisé est une porte ouverte.",
      en: "Tip: an unused WordPress plugin is an open door.",
    },
    body: {
      nl: "Plugins die je niet gebruikt krijgen updates die jij vergeet — gratis ingangen voor aanvallers. Schoon ze op of laat ze automatisch monitoren.",
      fr: "Les plugins inutilisés reçoivent des mises à jour que vous oubliez d'appliquer — autant de portes d'entrée gratuites. Désinstallez ou faites-les surveiller.",
      en: "Plugins you don't use still receive updates you forget to apply — free doors for attackers. Remove them or have them monitored.",
    },
    cta: {
      nl: "Doe een gratis scan van je site:",
      fr: "Lancez une analyse gratuite :",
      en: "Run a free site scan:",
    },
    link: "/scan",
    hashtags: ["WordPress", "Beveiliging", "StudioVM"],
  },
  {
    slug: "core-web-vitals",
    hook: {
      nl: "Snelle site = meer omzet. Letterlijk.",
      fr: "Site rapide = plus de revenus. Littéralement.",
      en: "A fast site means more revenue. Literally.",
    },
    body: {
      nl: "Google's onderzoek toont +7% conversie per 100 ms tijdwinst. Onze scan vertelt je in 30 seconden waar jij die ms's verliest.",
      fr: "Les études de Google montrent +7 % de conversion par 100 ms gagnées. Notre analyse vous dit en 30 secondes où vous perdez ces ms.",
      en: "Google research shows +7% conversion for every 100 ms saved. Our scan tells you in 30 seconds where you're losing them.",
    },
    cta: {
      nl: "Test je site:",
      fr: "Testez votre site :",
      en: "Test your site:",
    },
    link: "/scan",
    hashtags: ["Performance", "CoreWebVitals", "StudioVM"],
  },
  {
    slug: "https-mixed-content",
    hook: {
      nl: "HTTPS zonder mixed-content. Klein detail, groot verschil.",
      fr: "HTTPS sans contenu mixte. Petit détail, grande différence.",
      en: "HTTPS without mixed content. Small detail, big difference.",
    },
    body: {
      nl: "Eén afbeelding over HTTP en je slotje verdwijnt. Bezoekers haken af, Google waarschuwt. Onze scan vist die rotte appels eruit.",
      fr: "Une image en HTTP et votre cadenas disparaît. Les visiteurs partent, Google avertit. Notre analyse repère ces failles.",
      en: "One image over HTTP and your padlock vanishes. Visitors leave, Google warns. Our scan flags every weak link.",
    },
    cta: {
      nl: "Check je site gratis:",
      fr: "Vérifiez gratuitement :",
      en: "Check your site for free:",
    },
    link: "/scan",
    hashtags: ["Security", "HTTPS", "StudioVM"],
  },
  {
    slug: "monthly-care",
    hook: {
      nl: "Je site is een product, geen project.",
      fr: "Votre site est un produit, pas un projet.",
      en: "Your site is a product, not a project.",
    },
    body: {
      nl: "Eenmalig bouwen en hopen werkt niet. Wij onderhouden, updaten en optimaliseren je site elke maand — voorspelbaar, transparant.",
      fr: "Construire une fois et croiser les doigts ne suffit pas. Nous entretenons, mettons à jour et optimisons chaque mois — prévisible et transparent.",
      en: "Build once and hope is not a strategy. We maintain, update and optimise every month — predictable, transparent.",
    },
    cta: {
      nl: "Ontdek onze maandformules:",
      fr: "Découvrez nos formules mensuelles :",
      en: "See our monthly plans:",
    },
    link: "/pricing",
    hashtags: ["WebOnderhoud", "StudioVM", "Webdev"],
  },
  {
    slug: "builder",
    hook: {
      nl: "Bouw je eigen site, wij doen de rest.",
      fr: "Construisez votre site, on s'occupe du reste.",
      en: "Build your own site, we handle the rest.",
    },
    body: {
      nl: "Onze visuele builder geeft je controle zonder gedoe. Hosting, updates en monitoring lopen mee op de achtergrond. Geen klikfrustratie, geen verrassingen.",
      fr: "Notre éditeur visuel vous donne le contrôle sans complications. Hébergement, mises à jour et surveillance tournent en arrière-plan. Pas de clics frustrants, pas de surprises.",
      en: "Our visual builder gives you control without hassle. Hosting, updates and monitoring run in the background. No click frustration, no surprises.",
    },
    cta: {
      nl: "Probeer de builder:",
      fr: "Essayez l'éditeur :",
      en: "Try the builder:",
    },
    link: "/builder",
    hashtags: ["Webdev", "StudioVM", "NoCode"],
  },
  {
    slug: "local-trust",
    hook: {
      nl: "Belgisch studio, Belgisch tempo.",
      fr: "Studio belge, rythme belge.",
      en: "Belgian studio, Belgian pace.",
    },
    body: {
      nl: "Je belt, wij antwoorden. Geen ticket-tombola, geen offshore-spel telefoon. Korte lijnen, direct resultaat.",
      fr: "Vous appelez, on répond. Pas de loterie de tickets, pas de jeu du téléphone offshore. Lignes courtes, résultats directs.",
      en: "You call, we answer. No ticket lottery, no offshore game of telephone. Short lines, direct results.",
    },
    cta: {
      nl: "Bekijk wie we zijn:",
      fr: "Découvrez qui nous sommes :",
      en: "See who we are:",
    },
    link: "/over",
    hashtags: ["BelgischOndernemen", "StudioVM", "Webdev"],
  },
  {
    slug: "domain-renewal",
    hook: {
      nl: "Je domein vergeten te verlengen = je merk weggeven.",
      fr: "Oublier de renouveler son domaine = donner sa marque.",
      en: "Forgetting to renew your domain = handing over your brand.",
    },
    body: {
      nl: "Domeinkapers wachten op die ene dag dat jouw vervaldatum voorbij is. Wij houden je domein, DNS én hosting in één overzicht in je portaal.",
      fr: "Les pirates de noms guettent ce jour où votre échéance passe. Nous gardons votre domaine, DNS et hébergement dans un seul tableau de bord.",
      en: "Domain squatters wait for the day your renewal lapses. We keep your domain, DNS and hosting in one dashboard.",
    },
    cta: {
      nl: "Laat ons je domein bewaken:",
      fr: "Laissez-nous surveiller votre domaine :",
      en: "Let us watch your domain:",
    },
    link: "/diensten",
    hashtags: ["Domein", "StudioVM"],
  },
  {
    slug: "transparency",
    hook: {
      nl: "Prijzen op de site. Altijd.",
      fr: "Prix sur le site. Toujours.",
      en: "Prices on the site. Always.",
    },
    body: {
      nl: "Geen \"vraag een offerte aan om de prijs te zien\". Onze tarieven staan online, met een rekentool zodat je vooraf weet wat het kost.",
      fr: "Pas de « demandez un devis pour voir le prix ». Nos tarifs sont en ligne, avec un calculateur pour savoir d'avance ce que ça coûte.",
      en: "No \"request a quote to see the price\". Our rates are online, with a calculator so you know upfront what it costs.",
    },
    cta: {
      nl: "Bereken jouw site:",
      fr: "Estimez votre site :",
      en: "Estimate your site:",
    },
    link: "/offerte",
    hashtags: ["Transparantie", "StudioVM", "Webdev"],
  },
];

// Deterministische "shuffle" zodat verschillende seeds een ander selectievenster geven.
function rotate<T>(arr: T[], seed: number): T[] {
  const n = arr.length;
  if (n === 0) return arr;
  const k = ((seed % n) + n) % n;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

export function buildEvergreenBatch(
  siteUrl: string,
  count: number,
  seed: number,
): NewSocialPost[] {
  const picked = rotate(TIPS, seed).slice(0, Math.min(count, TIPS.length));
  const out: NewSocialPost[] = [];
  for (const t of picked) {
    for (const loc of LOCALES) {
      const link = t.link ? `${siteUrl}/${loc}${t.link}` : undefined;
      const base: Base = {
        hook: t.hook[loc],
        body: t.body[loc],
        cta: t.cta[loc],
        link,
        hashtags: t.hashtags,
      };
      out.push({
        kind: "tip",
        source_ref: t.slug,
        locale: loc,
        headline: t.hook[loc],
        link: link ?? null,
        channels: CHANNELS,
        variants: expandAllVariants(base, loc),
      });
    }
  }
  return out;
}

// ---------- Planning ----------

// Spreid posts over de eerstvolgende N werkdagen, 2 posts/dag (10:00 + 16:00
// Brusselse tijd). De starttijd wordt opgeschoven als die in het verleden ligt.
export function spreadSchedule(
  count: number,
  startFrom: Date = new Date(),
  perDay: 1 | 2 | 3 = 2,
): string[] {
  // Brusselse uren waarop we posten — eenvoudig: gebruik UTC-uren die in
  // Brussel (UTC+1/+2) op redelijke kantooruren vallen.
  const HOURS = perDay === 3 ? [8, 12, 16] : perDay === 2 ? [8, 14] : [8];
  const out: string[] = [];
  const d = new Date(startFrom);
  d.setUTCHours(HOURS[0], 0, 0, 0);
  // begin op morgenochtend als de eerste slot al voorbij is
  if (d.getTime() <= startFrom.getTime()) {
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(HOURS[0], 0, 0, 0);
  }
  let dayIdx = 0;
  let slot = 0;
  for (let i = 0; i < count; i++) {
    const day = new Date(d);
    day.setUTCDate(d.getUTCDate() + dayIdx);
    day.setUTCHours(HOURS[slot], 0, 0, 0);
    out.push(day.toISOString());
    slot++;
    if (slot >= HOURS.length) {
      slot = 0;
      dayIdx++;
    }
  }
  return out;
}
