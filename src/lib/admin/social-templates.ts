// Social-post template-bibliotheek voor de AI Content Engine.
//
// Elke template is een "bouwsteen" met:
//   - id, platform, post_kind, target_url
//   - optional days[]: wanneer geschikt (ma=1, di=2, ...; geen lijst = alle dagen)
//   - build(ctx): geeft { title, body, hashtags }
//
// De generator (social-generator.ts) kiest elke dag 3 templates die NIET
// recent zijn gebruikt, varieert per platform en injecteert ctx-variabelen.

export type TemplateCtx = {
  dayName: string; // "maandag", "dinsdag", ...
  dayShort: string; // "ma", "di", ...
  date: string; // "22 mei"
  client: { name: string; site: string; sector: string };
  altClient: { name: string; site: string; sector: string };
};

export type Template = {
  id: string;
  platform: "facebook" | "linkedin";
  post_kind: "persoonlijk" | "page" | "group" | "article";
  target_url: string;
  days?: number[]; // 1-5 = ma-vr
  category: "showcase" | "tip" | "case" | "question" | "story" | "case-study";
  build: (ctx: TemplateCtx) => { title: string; body: string; hashtags: string };
};

// Klanten-portfolio — wordt in roterende slots gebruikt voor variatie.
// Allemaal publieke sites; geen privacy-issue om te vermelden.
export const PORTFOLIO = [
  {
    name: "Céline (zus, interieur)",
    site: "celine-interieur.be",
    sector: "interieur",
  },
  {
    name: "Jean-Paul Montreuil (vader, wildlife)",
    site: "jp-montreuil.be",
    sector: "fotografie",
  },
  {
    name: "Allard Philippe",
    site: "allardphilippe.be",
    sector: "wildlife-fotografie",
  },
  { name: "Rik (Mari-Lines)", site: "mari-lines.be", sector: "wegmarkeringen" },
  { name: "Bar'Botte Waregem", site: "barbotte.be", sector: "horeca" },
  {
    name: "Cottage Waregem",
    site: "cottagewaregem.be",
    sector: "horeca",
  },
] as const;

// ============================================================================
// TEMPLATES — handgeschreven, geen LLM nodig. AI-modus voegt variatie toe.
// ============================================================================
export const TEMPLATES: Template[] = [
  // ---------- 1. FB persoonlijk — recente build showcase ----------
  {
    id: "fb-showcase-recent",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [2, 4], // dinsdag + donderdag
    category: "showcase",
    build: ({ client }) => ({
      title: `Showcase ${client.name} — FB persoonlijk`,
      body: `Eén van de sites die ik dit jaar bouwde: ${client.site}.

Voor ${client.name}.

Wat erin zit:
• Eigen admin-paneel zodat ze zelf hun teksten/foto's/prijzen kunnen aanpassen (geen telefoontje meer nodig)
• Laadt onder 1 seconde op mobiel — Google's Core Web Vitals goedgekeurd
• Vaste prijs vooraf, geen verrassingen achteraf
• Mobile-first design (60-80% van bezoekers komt via telefoon)

Solo gebouwd vanuit Waregem.

Ken jij een zelfstandige of KMO die vastzit met een trage of onbeheerbare site? Stuur ze even door. Of doe zelf de gratis scan op studio-vm.be — duurt 30 seconden, geeft je site een eerlijke score.`,
      hashtags: "",
    }),
  },

  // ---------- 2. FB persoonlijk — site-speed tip ----------
  {
    id: "fb-tip-pagespeed",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [3], // woensdag
    category: "tip",
    build: ({ dayName }) => ({
      title: `Tip — pagespeed test (${dayName})`,
      body: `Snelle ${dayName}ochtend-tip voor zelfstandigen:

Ga naar pagespeed.web.dev → typ jouw website-URL in → kijk naar je mobiele score.

Onder 70? Je verliest Google-bezoekers — die ranking-factor is reëel sinds Core Web Vitals (2021).

De drie meest voorkomende oorzaken die ik tegenkom bij overnames:
1️⃣ Onverkleinde foto's (3 MB ipv 80 KB)
2️⃣ Tien tracking-scripts die elk een halve seconde kosten
3️⃣ WordPress-thema's met 47 plugins waar je 6 van gebruikt

Een goede site doet 90+ op mobiel. Mijn klanten zitten allemaal boven 95.

Wil je weten of jouw site OK is? Health Check voor €99 — ik scan, schrijf 't rapport, en geef je 3 concrete fixes. Geen abonnement, eenmalig.`,
      hashtags: "",
    }),
  },

  // ---------- 3. FB persoonlijk — admin-paneel-voordeel ----------
  {
    id: "fb-tip-admin",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [1, 5], // maandag of vrijdag
    category: "tip",
    build: ({ client }) => ({
      title: "Tip — admin-paneel hoort standaard",
      body: `"Ik moet bellen om een tekst aan te passen."

Hoor ik te vaak. En het hoort niet zo.

Élke site die ik bouw krijgt een eigen admin-paneel — dezelfde technologie die ik voor mijn eigen studio-vm.be gebruik. Klanten passen teksten, foto's, prijzen, openingsuren zelf aan. Geen ticket, geen wachttijd, geen extra factuur.

Voor ${client.name} (${client.site}) → eigen admin met ${client.sector === "horeca" ? "menu's, dag-suggesties en reservaties" : client.sector === "interieur" ? "producten, prijzen en offerte-aanvragen" : "alles wat ze willen tonen"} die ze in een minuut kunnen wijzigen.

Dat is geen luxe — dat is gewoon zoals 't moet.

Als jouw huidige webbouwer je een uurtje aanrekent voor een spelfout, ben je gegijzeld. Kijk eens of er geen alternatief is.`,
      hashtags: "",
    }),
  },

  // ---------- 4. FB persoonlijk — vraag aan netwerk ----------
  {
    id: "fb-question-network",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [5], // vrijdag
    category: "question",
    build: () => ({
      title: "Vraag aan netwerk — vrijdag",
      body: `Vrijdag-vraagje aan m'n netwerk:

Ken jij een zelfstandige of KMO in Vlaanderen die:
→ een nieuwe site nodig heeft?
→ of vastzit met een trage/lelijke/onbeheerbare site?
→ of gewoon te veel betaalt voor hosting + "onderhoud"?

Tag ze in de comments of stuur een DM. Eén verwijzing van jou kan iemand maandelijks honderden euro's besparen.

Studio-vm.be — solo, vaste prijs, eigen admin-paneel, laadtijd onder 1 seconde. Geen verkoopspraat, gewoon werk.

Bedankt op voorhand — de meeste van mijn opdrachten komen zo via een doorverwijzing.`,
      hashtags: "",
    }),
  },

  // ---------- 5. FB persoonlijk — case-story Bar'Botte/horeca ----------
  {
    id: "fb-case-horeca",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [2, 3], // di/woe
    category: "case-study",
    build: () => ({
      title: "Case — horeca-sites",
      body: `Twee horeca-sites die ik dit jaar live zette:

→ Bar'Botte Waregem (barbotte.be) — bar/bistro met dagsuggesties en reservatiemodule
→ Cottage Waregem (cottagewaregem.be) — restaurant met menu's en eventruimte

Beide vorige sites waren op WordPress + traag + niemand in huis kon ze aanpassen.

Nieuwe sites:
✓ Onder 1s laadtijd op mobiel
✓ Eigen admin om menu's & dagsuggesties zelf te wisselen
✓ Reserveren rechtstreeks op de site
✓ Foto's optimaal en automatisch verkleind

Vaste prijs. Klaar in 3 weken.

Horeca-zaak in West-/Oost-Vlaanderen die met haar website worstelt? Stuur een DM, of doe eerst de gratis scan op studio-vm.be om te zien hoe je huidige site scoort.`,
      hashtags: "",
    }),
  },

  // ============================================================================
  // LinkedIn templates — meer professional, langere vorm
  // ============================================================================

  // ---------- 6. LinkedIn — story/observation ----------
  {
    id: "li-story-2years",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [2], // dinsdag (peak LI day)
    category: "story",
    build: () => ({
      title: "LinkedIn — 2 jaar observation",
      body: `Wat ik in 2 jaar websites-bouwen voor KMO's in Vlaanderen geleerd heb:

→ Snelheid is geen luxe meer. Google's Core Web Vitals straffen trage sites af in de zoekresultaten. Mijn klanten laden in ~0.8 seconden — versus 4-6 seconden bij de gemiddelde KMO-site. Dat verschil is letterlijk meetbaar in organisch verkeer.

→ Onderhoud hoort niet maandelijks geld te kosten. Een statische site op moderne infrastructuur draait voor minder dan €10/maand. Wie je €100+/maand vraagt zonder dat er iets gebeurt, melkt je.

→ Klanten moeten zelf hun inhoud kunnen wijzigen. Elke site die ik bouw heeft een eigen admin-paneel. Geen ticket meer naar de bouwer voor een spelfout.

→ Vaste prijs is moedig, maar correct. Ik werk niet op uurbasis. Je krijgt een prijs voor wat je krijgt — geen verrassingen achteraf.

Studio-vm.be is mijn solo-bureau in Waregem. Geen tussenpersonen, geen WordPress-bouwpakket, geen sales-funnel.

Wie heeft een KMO of zelfstandige in z'n netwerk die met website-frustratie zit?`,
      hashtags:
        "#websiteontwikkeling #kmo #vlaanderen #digitalisering #zelfstandige",
    }),
  },

  // ---------- 7. LinkedIn — tip/educational ----------
  {
    id: "li-tip-corewebvitals",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [3], // woensdag
    category: "tip",
    build: () => ({
      title: "LinkedIn — Core Web Vitals uitgelegd",
      body: `"Wat zijn Core Web Vitals en moet ik me daar als KMO druk over maken?"

Korte versie: ja.

Google meet sinds 2021 drie performance-cijfers op elke site:
• LCP (Largest Contentful Paint) — hoe snel de hoofdinhoud zichtbaar is
• INP (Interaction to Next Paint) — hoe snel je site reageert op een klik
• CLS (Cumulative Layout Shift) — hoeveel je layout "springt" tijdens laden

Site die hier slecht op scoort = lager in zoekresultaten = minder organisch verkeer = minder leads.

Gratis check: pagespeed.web.dev → typ je URL in → mobiele score onder 70 = je hebt werk.

Voor mijn klanten zit ik systematisch boven 95. Dat is geen toeval — dat is bewust gebouwd zonder WordPress-overhead, met afbeeldingen geoptimaliseerd, en zonder 12 trackers van vroegere agencies.

Wil je weten waar jij staat? Studio-vm Health Check voor €99 — concreet rapport + 3 fixes die het verschil maken.`,
      hashtags: "#corewebvitals #seo #kmo #webperformance #digitalisering",
    }),
  },

  // ---------- 8. LinkedIn — case-study showcase ----------
  {
    id: "li-case-showcase",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [4], // donderdag
    category: "case-study",
    build: ({ client, altClient }) => ({
      title: `LinkedIn — case ${client.name}`,
      body: `Twee recente projecten die ik solo opleverde:

🔹 ${client.name} → ${client.site}
   Sector: ${client.sector}
   Stack: zelf gebouwd in moderne code, eigen admin-paneel
   Laadtijd: < 1 seconde
   Onderhoud: < €10/maand

🔹 ${altClient.name} → ${altClient.site}
   Sector: ${altClient.sector}
   Vergelijkbaar setup — vaste prijs, oplevering in weken, niet maanden

Wat verschilt mijn aanpak van een typisch web-bureau?

1. Geen WordPress-bouwpakket. Ik bouw vanaf nul in code die ik volledig begrijp.
2. Klanten krijgen geen "WordPress-dashboard met 50 plugins" — wel een minimalistisch admin-paneel speciaal voor hen.
3. Vaste prijs vooraf. Geen "scope-creep"-facturen.
4. Solo betekent: jij praat met wie de site bouwt. Geen account-manager als tussenstap.

Ik werk vanuit Waregem en bedien KMO's in Vlaanderen. Wie zit met een website-vraag in z'n netwerk?`,
      hashtags: "#kmo #vlaanderen #website #waregem #ondernemen",
    }),
  },

  // ---------- 9. LinkedIn — industry observation ----------
  {
    id: "li-observation-wp",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [1], // maandag
    category: "tip",
    build: () => ({
      title: "LinkedIn — WP-economie observation",
      body: `Eerlijke observatie uit 2 jaar overnames van WordPress-sites voor KMO-klanten:

De gemiddelde WordPress-site die ik overneem heeft:
→ 23 plugins, waarvan de klant er 4 actief gebruikt
→ €840/jaar aan "hosting + onderhoud" voor wat in realiteit €60/jaar moet kosten
→ Laadtijd 4-7 seconden (mobiel)
→ Een dashboard waar de klant niet aan durft komen uit angst iets stuk te maken

Dat is geen kritiek op WordPress als technologie — het is wel kritiek op het ecosysteem dat eromheen ontstaan is: bureaus die klanten in maandkost-abonnementen lokken voor onderhoud dat ze nooit zien.

Mijn alternatief voor KMO's: statisch gegenereerde sites op moderne infrastructuur. Resultaat:
✓ Laadtijd < 1 seconde
✓ Hosting < €10/maand (klant betaalt direct, ik krijg geen commissie)
✓ Geen plugins die op je dashboard om aandacht vragen
✓ Eigen mini-admin alleen voor wat jouw site nodig heeft

Vraag jezelf eens af wat je vandaag maandelijks betaalt — en wat je daarvoor in de plaats krijgt.`,
      hashtags: "#wordpress #kmo #websitehosting #digitalisering #vlaanderen",
    }),
  },

  // ---------- 10. LinkedIn — process / behind-scenes ----------
  {
    id: "li-process",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [3, 5],
    category: "story",
    build: () => ({
      title: "LinkedIn — hoe een project loopt",
      body: `Hoe een typisch project bij studio-vm loopt — voor wie nieuwsgierig is:

Week 0 — Eerste gesprek (30 min, gratis)
We bespreken: wat doet je bedrijf, voor wie, en wat moet je site doen? Geen sales-funnel.

Week 1 — Concept + ontwerp
Ik stuur je 2-3 ontwerprichtingen. Je kiest, we verfijnen.

Week 2 — Bouw
Ik bouw de site. Je krijgt elke dag een preview-link.

Week 3 — Admin-training + content
Ik zet samen met jou alle teksten/foto's/prijzen erin. Daarna krijg jij toegang tot het admin-paneel — een halfuurtje training en je doet 't zelf.

Week 3 of 4 — Live
Domein omschakelen, e-mail-check, Google Analytics aanzetten, klaar.

Wat ik niet doe:
× Geen "scope-creep"-facturen achteraf
× Geen "onderhoudscontract" van €100/maand voor niks
× Geen verkoop van extra "SEO-pakketten" die niets doen

Vaste prijs. Concreet werk. Wie wil starten? DM of via studio-vm.be.`,
      hashtags: "#projectmanagement #kmo #websiteproject #waregem #ondernemen",
    }),
  },

  // ---------- 11. FB persoonlijk — milestone/personal ----------
  {
    id: "fb-personal-thanks",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [5],
    category: "story",
    build: () => ({
      title: "FB — persoonlijke noot",
      body: `Soms is 't goed om dit hardop te zeggen:

Studio-vm bestaat dankzij familie en vrienden die als eersten "ja" zeiden. Mijn zus Céline. Mijn vader. Een paar oud-collega's. Vrienden die mij doorverwezen.

Elke site die ik tegenwoordig bouw is — direct of indirect — het gevolg van iemand die ergens zei "Vincent doet dat, contacteer 'm eens."

Dus: dank u. Voor iedereen die ooit een doorverwijzing deed, een DM beantwoordde, een testimonial schreef, of gewoon op een post een like gaf.

Als je iemand kent die een website nodig heeft of vastzit met de huidige — laat 't weten. Eén tag, één DM, één doorgestuurde URL. Dat is hoe dit blijft groeien.

Studio-vm.be — solo, in Waregem, voor heel Vlaanderen.`,
      hashtags: "",
    }),
  },

  // ---------- 12. LinkedIn — concrete numbers / proof ----------
  {
    id: "li-numbers-2026",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [4],
    category: "tip",
    build: () => ({
      title: "LinkedIn — concrete cijfers",
      body: `Voor wie nog twijfelt of "snelle site" écht een verschil maakt — drie cijfers uit Google's eigen onderzoek:

📊 Bezoekers haken af bij 3+ seconden laadtijd:
• 3s → 32% bouncerate
• 5s → 90% bouncerate

📊 1 seconde extra laadtijd = 7% minder conversie (Akamai)

📊 Sites die in <2s laden krijgen 70% meer pageviews per sessie

Wat doet de gemiddelde KMO-site in België? 4-7 seconden op mobiel. Dat is geen kleine inefficiëntie — dat is geld dat je elke dag verliest.

Voor mijn klanten zit ik op 0.8 seconden gemiddeld. Geen toeval, wel bewust gebouwd:
→ Geen WordPress + 30 plugins
→ Afbeeldingen vooraf geoptimaliseerd
→ Hosting op CDN (geen shared-hosting bij goedkope BE-provider)

Dat is geen "extra service" — dat hoort gewoon standaard te zijn.

Test je site: pagespeed.web.dev. Bel mij niet — kijk eerst zelf naar de score.`,
      hashtags: "#websnelheid #seo #kmo #digitalisering #conversie",
    }),
  },

  // ---------- 13. FB groep — generic value-first ----------
  {
    id: "fb-group-tips",
    platform: "facebook",
    post_kind: "group",
    target_url: "/nl/health-check",
    days: [2, 4],
    category: "tip",
    build: () => ({
      title: "FB groep — 3 tips voor zelfstandigen",
      body: `Vraag aan de zelfstandigen hier — hoeveel betaal je per maand voor je website?

Drie problemen die ik het vaakst tegenkom bij overnames:

1️⃣ Site laadt 4-8 seconden op mobiel. Google straft dit af, bezoekers haken af. Goede sites doen <1.5s. Test op pagespeed.web.dev.

2️⃣ "Ik moet bellen om een tekst te wijzigen." Geen eigen admin-paneel = je bent gegijzeld door je webbouwer.

3️⃣ €50-150/maand voor "hosting + onderhoud" terwijl de échte hosting €5/maand kost. Verschil = pure marge voor 't bureau.

Geen verkooppraatje hier — doe gewoon die pagespeed-test en kijk wat je betaalt versus krijgt.

Wie zit met vragen? Comments staan open.

— Vincent (studio-vm.be — solo-bureau Waregem)`,
      hashtags: "",
    }),
  },

  // ---------- 14. LinkedIn — micro-tip (kort) ----------
  {
    id: "li-microtip",
    platform: "linkedin",
    post_kind: "persoonlijk",
    target_url: "/",
    days: [1, 3, 5],
    category: "tip",
    build: () => ({
      title: "LinkedIn — korte micro-tip",
      body: `KMO-tip in 30 seconden gelezen:

Als je vandaag een offerte krijgt voor een nieuwe website, vraag deze 3 dingen vóór je tekent:

1. "Krijg ik een eigen admin-paneel waarmee ik zelf teksten/foto's/prijzen kan aanpassen?"
2. "Wat is de maandelijkse kost en wat krijg ik daarvoor in ruil?"
3. "Wie is technisch eigenaar van de site — ik of jullie?"

Drie ja's = je kan vooruit.
Eén "ja maar…" = onderhandel of zoek verder.

Bij studio-vm zijn alle drie antwoorden standaard ja.`,
      hashtags: "#websiteoffer #kmo #ondernemerstips",
    }),
  },

  // ---------- 15. FB persoonlijk — direct CTA ----------
  {
    id: "fb-cta-direct",
    platform: "facebook",
    post_kind: "persoonlijk",
    target_url: "/nl/health-check",
    days: [4],
    category: "tip",
    build: () => ({
      title: "FB — direct CTA Health Check",
      body: `Snelle vraag — is jouw site:
□ Sneller dan 2 seconden op mobiel?
□ Aanpasbaar door jezelf (zonder bouwer te bellen)?
□ Kost minder dan €30/maand om te draaien?

Drie vinkjes? Top, ga zo door.

Géén drie vinkjes? Tijd voor een Health Check (€99): ik scan je site, schrijf een rapport van 5 paginas met 3 concrete fixes, en je weet exact waar je staat. Geen abonnement, geen vervolgcontract.

studio-vm.be → Health Check.

Voor wie eerst gratis wil testen: pagespeed.web.dev geeft je in 30 seconden je score.`,
      hashtags: "",
    }),
  },
];

// Hulp — kies n niet-recent-gebruikte templates voor een dag.
export function pickTemplatesForDay(
  dayOfWeek: number, // 1=ma, 5=vr
  recentIds: string[],
  n: number,
): Template[] {
  const recent = new Set(recentIds);
  // 1. Filter templates die deze dag mogen + niet recent zijn
  let candidates = TEMPLATES.filter(
    (t) => (!t.days || t.days.includes(dayOfWeek)) && !recent.has(t.id),
  );
  // 2. Als er te weinig zijn, neem ook templates buiten dag-restrictie
  if (candidates.length < n) {
    candidates = TEMPLATES.filter((t) => !recent.has(t.id));
  }
  // 3. Mix per platform: probeer 50/50 verdeling tussen FB en LinkedIn
  const fb = candidates.filter((t) => t.platform === "facebook");
  const li = candidates.filter((t) => t.platform === "linkedin");
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const fbShuf = shuffle(fb);
  const liShuf = shuffle(li);
  const out: Template[] = [];
  let fi = 0;
  let li2 = 0;
  for (let i = 0; i < n; i++) {
    // Alterneren — bij voorkeur FB-FB-LI of FB-LI-FB
    const pickFb = i === 0 || i === 2;
    if (pickFb && fi < fbShuf.length) out.push(fbShuf[fi++]);
    else if (li2 < liShuf.length) out.push(liShuf[li2++]);
    else if (fi < fbShuf.length) out.push(fbShuf[fi++]);
  }
  return out;
}

// Hulp — kies 2 verschillende klanten uit PORTFOLIO voor variatie binnen 1 dag.
export function pickClients(): {
  client: TemplateCtx["client"];
  altClient: TemplateCtx["altClient"];
} {
  const shuffled = [...PORTFOLIO].sort(() => Math.random() - 0.5);
  return {
    client: shuffled[0]!,
    altClient: shuffled[1]!,
  };
}
