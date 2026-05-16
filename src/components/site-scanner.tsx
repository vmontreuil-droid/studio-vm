"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { track } from "@vercel/analytics";
import {
  Search,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Gauge as GaugeIcon,
} from "lucide-react";
import {
  scanSite,
  type ScanResult,
  type Severity,
  type TechType,
} from "@/app/actions/scan";
import { submitScanLead } from "@/app/actions/scan-lead";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { MonitorSignup } from "@/components/monitor-signup";

type ModuleKey = "security" | "speed" | "seo" | "mobile" | "migration" | "rebuild" | "care";
const UI: Record<
  Locale,
  {
    domain: {
      title: string;
      cert: string;
      issuer: string;
      expires: string;
      protocol: string;
      mail: string;
      spf: string;
      dmarc: string;
      ipv6: string;
      yes: string;
      no: string;
      na: string;
      days: string;
    };
    placeholder: string;
    button: string;
    scanning: string;
    grade: string;
    again: string;
    print: string;
    copy: string;
    copied: string;
    factsHost: string;
    factsBuilt: string;
    factsIp: string;
    factsStack: string;
    factsSpeed: string;
    factsWeight: string;
    verdictTitle: string;
    verdictGood: string;
    verdictOk: string;
    verdictBad: string;
    honestTitle: string;
    honest: (f: ScanResult & { ok: true }) => string;
    catTitle: string;
    cats: Record<string, string>;
    cwvTitle: string;
    cwvLabels: Record<"low" | "medium" | "high", string>;
    cwvNote: string;
    pitfallTitle: string;
    pitfallNone: string;
    findingsTitle: string;
    sev: Record<Severity, string>;
    whyLabel: string;
    fixLabel: string;
    measured: string;
    techTitle: string;
    techTypes: Record<TechType, string>;
    techNone: string;
    headersTitle: string;
    headerNames: Record<string, string>;
    present: string;
    absent: string;
    seoTitle: string;
    seoTitleLen: string;
    seoDescLen: string;
    seoH1: string;
    seoAlt: string;
    benchTitle: string;
    benchYou: string;
    benchSvm: string;
    benchNote: string;
    planTitle: string;
    planIntro: string;
    planStep: string;
    planNothing: string;
    planTotal: string;
    planRebuild: string;
    planRebuildNote: string;
    planCare: string;
    planCareNote: string;
    excl: string;
    perMonth: string;
    from: string;
    ctaButton: string;
    disclaimer: string;
    reportFor: string;
    reportBy: string;
    gate: {
      eyebrow: string;
      title: (host: string) => string;
      lead: string;
      issues: (n: number) => string;
      noIssues: string;
      catTeaser: string;
      emailPh: string;
      submit: string;
      sending: string;
      privacy: string;
      sentTitle: string;
      sentLead: (email: string) => string;
      open: string;
      errEmail: string;
      errGeneric: string;
    };
    modules: Record<ModuleKey, { name: string; desc: string }>;
    plan: {
      title: (stack: string) => string;
      why: (stack: string, score: number) => string;
      haveTitle: string;
      feat: Record<string, string>;
      buildTitle: string;
      phasesTitle: string;
      phases: { t: string; d: string }[];
      mod: Record<string, { name: string; desc: string }>;
      base: string;
      addons: string;
      total: string;
      approx: string;
      timeline: string;
      timelineNote: string;
      weeks: (a: number, b: number) => string;
      careTitle: string;
      careNote: string;
      optTitle: string;
      optNote: string;
      own: string;
      cta: string;
    };
    copyTpl: (h: string, s: number, g: string, st: string) => string;
  }
> = {
  nl: {
    domain: { title: "Domein, mail & certificaat", cert: "SSL-certificaat", issuer: "Uitgever", expires: "Verloopt over", protocol: "TLS-protocol", mail: "Mailbeveiliging", spf: "SPF", dmarc: "DMARC", ipv6: "IPv6", yes: "ja", no: "nee", na: "n.v.t.", days: "dagen" },
    placeholder: "jouwhuidigesite.be",
    button: "Scan mijn site diepgaand",
    scanning: "Site wordt doorgelicht…",
    grade: "Rapportcijfer",
    again: "Andere site scannen",
    print: "Download rapport (PDF)",
    copy: "Kopieer samenvatting",
    copied: "Gekopieerd",
    factsHost: "Host",
    factsBuilt: "Gebouwd door",
    factsIp: "IP-adres",
    factsStack: "Platform",
    factsSpeed: "Reactietijd",
    factsWeight: "HTML",
    verdictTitle: "Samenvatting",
    verdictGood: "Deze site staat er sterk voor. De fundamenten zitten goed; het gaat hier om finetunen, niet om redden.",
    verdictOk: "Deze site werkt, maar laat punten liggen die zowel bezoekers als Google merken. Te repareren.",
    verdictBad: "Deze site staat er zwak voor. Elk rood punt hieronder is omzet, vertrouwen of vindbaarheid die wegloopt.",
    honestTitle: "Het eerlijke oordeel — sta je er goed voor, en betaal je niet te veel?",
    honest: (f) => {
      const lines: string[] = [];
      if (f.flags.modern)
        lines.push("Dit is een moderne, goed gebouwde site. Geen reden tot paniek, en geen teken dat je betaalt voor lucht.");
      else if (f.score >= 75)
        lines.push("Solide werk. Er is ruimte om te optimaliseren, maar je wordt hier niet bestolen.");
      if (f.flags.diyPlatform)
        lines.push(`Je site draait op ${f.stack}, een doe-het-zelf-platform. Dat mag — maar je kunt het in principe zélf beheren. Betaal je een bureau elke maand voor 'onderhoud' van een Wix/Squarespace-site, kijk dan kritisch naar wat je daar concreet voor terugkrijgt. Niet per se oplichting, wél de moeite om je factuur te durven bevragen.`);
      if (f.flags.outdated)
        lines.push("Er draait verouderde of opgestapelde techniek. Als je hiervoor betaalt zonder dat het ooit geüpdatet wordt, krijg je weinig waar voor je geld — en het is een veiligheidsrisico.");
      if (f.flags.insecure)
        lines.push("De beveiliging is onvoldoende. Dit is geen detail: het raakt het vertrouwen van je bezoekers en je AVG/GDPR-verplichtingen.");
      if (f.flags.slow)
        lines.push("De site is traag. Trage sites verliezen aantoonbaar bezoekers én Google-positie — dit kost je rechtstreeks geld.");
      if (f.flags.abandoned)
        lines.push("De site oogt verwaarloosd: oude techniek én een verouderd jaartal. Bezoekers vragen zich af of je nog actief bent — en je betaalt mogelijk voor 'onderhoud' dat duidelijk niet gebeurt.");
      if (f.flags.gdprRisk)
        lines.push("Er worden externe scripts/trackers geladen zonder zichtbare cookie-toestemming. Dat is een concreet GDPR-boeterisico, geen theorie.");
      if (f.flags.mailSpoofable)
        lines.push("Je domein heeft geen SPF én geen DMARC: iemand kan vandaag e-mails versturen die lijken te komen van jouw adres — naar je eigen klanten. Dat is een ernstig en vaak over het hoofd gezien lek.");
      if (f.flags.certExpiring)
        lines.push("Je SSL-certificaat verloopt binnenkort. Loopt het af, dan krijgen bezoekers een schrikwekkende waarschuwing en is je site de facto onbereikbaar.");
      if (!f.flags.modern && f.score < 60 && !f.flags.diyPlatform)
        lines.push("Kortom: wat je nu hebt, levert niet wat een site in 2026 hoort te leveren. Of dat 'oplichting' is hangt af van wat je ervoor betaalt — maar het kan beduidend beter, vaak voor minder dan je nu denkt.");
      if (lines.length === 0)
        lines.push("Niets alarmerends gevonden. Wat hieronder oranje of rood staat, is verbeterwerk — geen brand.");
      return lines.join(" ");
    },
    catTitle: "Score per categorie",
    cats: { speed: "Snelheid", seo: "SEO", mobile: "Mobiel", security: "Veiligheid", platform: "Platform" },
    cwvTitle: "Core Web Vitals — risico-inschatting",
    cwvLabels: { low: "Laag risico", medium: "Matig risico", high: "Hoog risico" },
    cwvNote: "Inschatting op basis van reactietijd, gewicht, render-blokkerende CSS, scripts en beeldaanpak. Google gebruikt Core Web Vitals als rankingfactor; hoog risico = traag aanvoelende site die bezoekers en posities kost.",
    pitfallTitle: "Waar de valkuilen zitten",
    pitfallNone: "Geen grote valkuilen gevonden — netjes.",
    findingsTitle: "Alle bevindingen, met uitleg",
    sev: { critical: "Kritiek", warning: "Aandacht", good: "In orde", info: "Info" },
    whyLabel: "Waarom dit telt",
    fixLabel: "Wat eraan te doen",
    measured: "Gemeten",
    techTitle: "Gedetecteerde technologie & plugins",
    techTypes: { cms: "CMS / platform", ecommerce: "Webshop", builder: "Bouwer / page-builder", theme: "Thema", plugin: "Plugins", analytics: "Analytics", marketing: "Marketing", library: "Libraries", font: "Lettertypes", framework: "Framework", cdn: "CDN", host: "Hosting" },
    techNone: "Geen herkenbare technologie gevonden (of goed afgeschermd).",
    headersTitle: "Beveiligingsheaders",
    headerNames: { hsts: "Strict-Transport-Security", csp: "Content-Security-Policy", xfo: "X-Frame-Options", xcto: "X-Content-Type-Options", referrer: "Referrer-Policy", permissions: "Permissions-Policy" },
    present: "Aanwezig",
    absent: "Ontbreekt",
    seoTitle: "SEO-meting in detail",
    seoTitleLen: "Titellengte (ideaal 30–60)",
    seoDescLen: "Omschrijving (ideaal 70–165)",
    seoH1: "Aantal H1-koppen (ideaal 1)",
    seoAlt: "Afbeeldingen met alt-tekst",
    benchTitle: "Jouw site vs. een Studio VM-build",
    benchYou: "Jouw site",
    benchSvm: "Studio VM-standaard",
    benchNote: "Een Studio VM-build mikt standaard op 100/100 op exact deze punten. Snelheid, SEO-basis en veiligheid zijn geen extra — ze zijn het vertrekpunt.",
    planTitle: "Jouw stappenplan + directe prijsindicatie",
    planIntro: "Op basis van wat hierboven rood en oranje staat, dit is de aangeraden volgorde — met een richtprijs per stap (excl. btw).",
    planStep: "Stap",
    planNothing: "Geen dringende ingrepen nodig. Een onderhoudsabonnement houdt dit zo.",
    planTotal: "Totaal losse ingrepen",
    planRebuild: "Of: alles in één — herbouw in Next.js",
    planRebuildNote: "In plaats van losse pleisters: een snelle, veilige site die standaard 100/100 scoort, waarvan jíj de code en data bezit. Vaak voordeliger dan de optelsom hierboven.",
    planCare: "Daarna: zorgeloos onderhoud",
    planCareNote: "Hosting, SSL, back-ups, updates en support — zodat het ook over een jaar nog 100/100 scoort.",
    excl: "excl. btw",
    perMonth: "per maand",
    from: "vanaf",
    ctaButton: "Bespreek dit rapport met mij",
    disclaimer: "Snelle, eerlijke heuristische check vanaf onze server — geen volledige pentest. De richtprijzen zijn indicatief; een exacte offerte volgt na een kort gesprek.",
    reportFor: "Website-doorlichting voor",
    reportBy: "Opgesteld door Studio VM · studio-vm.be · +32 477 99 56 51",
    gate: {
      eyebrow: "Scan voltooid",
      title: (host) => `Het rapport van ${host} staat klaar`,
      lead: "Ik heb je site volledig doorgelicht. Hieronder zie je alvast de score; je volledige, eerlijke analyse — mét het concrete plan en een offerte op maat — komt in je eigen beveiligde portaal.",
      issues: (n) =>
        n === 1
          ? "1 belangrijk aandachtspunt gevonden"
          : `${n} belangrijke aandachtspunten gevonden`,
      noIssues: "Geen grote valkuilen gevonden — netjes.",
      catTeaser: "Per categorie (detail in je portaal)",
      emailPh: "jouw@email.be",
      submit: "Stuur mijn volledige analyse",
      sending: "Versturen…",
      privacy:
        "Eén e-mail met je rapportlink. Geen nieuwsbrief, geen verkooptrechter, je adres blijft bij mij.",
      sentTitle: "Check je inbox",
      sentLead: (email) =>
        `Je volledige analyse is onderweg naar ${email}. Geen mail na een minuut? Kijk in spam — of open ’m hieronder meteen.`,
      open: "Open mijn analyse nu",
      errEmail: "Vul een geldig e-mailadres in.",
      errGeneric:
        "Versturen lukte niet. Probeer opnieuw of mail rechtstreeks naar hallo@studio-vm.be.",
    },
    modules: {
      security: { name: "Beveiligingspakket", desc: "HTTPS forceren, security-headers, versie-lek dichten, cookies hardenen." },
      speed: { name: "Snelheidsoptimalisatie", desc: "Caching, compressie, scripts opschonen, gewicht terugbrengen." },
      seo: { name: "SEO-fundament", desc: "Titels, meta's, koppenstructuur, Open Graph en gestructureerde data." },
      mobile: { name: "Mobiel & toegankelijkheid", desc: "Responsive viewport, alt-teksten, leesbaarheid op gsm." },
      migration: { name: "Migratie van content", desc: "Bestaande inhoud overzetten van WordPress/Wix/Squarespace." },
      rebuild: { name: "Volledige herbouw (Next.js)", desc: "Een nieuwe, snelle, veilige site die je zelf bezit." },
      care: { name: "Care-abonnement", desc: "Hosting, SSL, back-ups, updates en support." },
    },
    plan: {
      title: (st) => `Jouw plan: geen geprutsel meer aan ${st} — een schone herbouw die jíj bezit`,
      why: (st, s) =>
        `Op ${st} blijven repareren is goed geld naar slecht gooien: elke fix is tijdelijk, plugin-afhankelijk en lost de oorzaak niet op (score nu ${s}/100). Ik herbouw exact wat je site dóét — schoon, snel en veilig in Next.js — en migreer je inhoud mét behoud van je Google-posities. Geen plugins, geen verrassingen, jij bezit de code en data.`,
      haveTitle: "Wat ik op je site detecteerde",
      feat: {
        pages: "pagina's",
        shop: "Webshop / verkoop online",
        multilingual: "Meertalig",
        forms: "Formulieren",
        booking: "Reservatie / afspraken",
        blog: "Blog / nieuws",
        members: "Ledenzone / e-learning",
        mediaHeavy: "Veel beeld / galerijen",
        pageBuilder: "Page-builder (Elementor/Divi…)",
        plugins: "plugins gedetecteerd",
      },
      buildTitle: "Wat ik ervoor in de plaats bouw",
      phasesTitle: "Aanpak in fasen",
      phases: [
        { t: "1 · Audit & contentinventaris", d: "Ik lijst elke pagina, functie en URL op zodat niets verloren gaat." },
        { t: "2 · Design op jouw merk", d: "Een eigen, snel ontwerp — geen template, mobiel-first." },
        { t: "3 · Bouw in Next.js", d: "De volledige site native herbouwd, zonder plugins." },
        { t: "4 · Contentmigratie", d: "Teksten, beelden en pagina's overgezet en opgeschoond." },
        { t: "5 · SEO-behoud", d: "301-redirectplan zodat je Google-posities meeverhuizen i.p.v. kelderen." },
        { t: "6 · Lancering & overdracht", d: "Live gezet; jij krijgt code, data en een eigen admin." },
      ],
      mod: {
        base_starter: { name: "Basis-site (tot ±8 pagina's)", desc: "Eigen design, mobiel, contact, SEO-fundament — schoon herbouwd." },
        base_pro: { name: "Volwaardige site (Pro)", desc: "Meerdere secties, schoon gebouwd en klaar om mee te groeien." },
        base_webshop: { name: "Webshop", desc: "Volledige shop (Mollie/Stripe), voorraad, bestellingen-admin." },
        multilingual: { name: "Meertalig", desc: "Zelfde inhoud, nette taalswitch + hreflang voor SEO." },
        forms: { name: "Formulieren + opvolging", desc: "Contact/offerte-formulieren met spamfilter en mailopvolging." },
        booking: { name: "Reservatiemodule", desc: "Afspraken/boekingen met agenda en bevestigingsmails." },
        blog: { name: "Blog / nieuws-CMS", desc: "Eigen redactie-omgeving voor artikels — zonder WordPress." },
        members: { name: "Ledenzone", desc: "Afgeschermd gedeelte met logins en rollen." },
        admin: { name: "Eigen admin / CMS", desc: "Beheer zelf je teksten, beelden en pagina's — geen factuur voor elke wijziging." },
        content: { name: "Contentmigratie", desc: "Bestaande pagina's overgezet, geschaald op de omvang van je site." },
        seoPreserve: { name: "SEO-behoud & redirects", desc: "Volledig 301-plan + sitemap zodat je niet terugvalt in Google." },
        photoshoot: { name: "Fotoshoot / beeldmateriaal", desc: "Geen eigen foto's? Een halve dag professionele shoot van je zaak, producten of team — bewerkt en webklaar." },
      },
      base: "Vertrekpunt",
      addons: "Op maat van wat je hebt",
      total: "Totale richtprijs",
      approx: "indicatief, exacte offerte na een kort gesprek",
      timeline: "Doorlooptijd",
      timelineNote:
        "Uitvoering in 1–2 weken. Hangt enkel af van de vrijgave van je domein en of er fotomateriaal is.",
      weeks: (a, b) => `${a}–${b} weken`,
      careTitle: "Daarna: zorgeloos onderhoud",
      careNote: "Hosting, SSL, back-ups, updates en support — zodat het 100/100 blíjft.",
      optTitle: "Optioneel — als je nog geen beeldmateriaal hebt",
      optNote: "Goede foto's maken of breken een site. Heb je niets bruikbaars? Dan regel ik een fotoshoot. Enkel als je het nodig hebt — anders gewoon weglaten.",
      own: "Bij oplevering bezit jij de volledige code én data. Geen lock-in, geen verplichte afname.",
      cta: "Bespreek dit plan met mij",
    },
    copyTpl: (h, s, g, st) =>
      `Doorlichting van ${h} (via studio-vm.be/scan)\nRapportcijfer: ${g} — ${s}/100\nPlatform: ${st}\n\nEen Studio VM-build mikt op 100/100. Bespreek: studio-vm.be`,
  },
  fr: {
    domain: { title: "Domaine, mail & certificat", cert: "Certificat SSL", issuer: "Émetteur", expires: "Expire dans", protocol: "Protocole TLS", mail: "Sécurité mail", spf: "SPF", dmarc: "DMARC", ipv6: "IPv6", yes: "oui", no: "non", na: "s.o.", days: "jours" },
    placeholder: "votresiteactuel.be",
    button: "Scanner mon site en profondeur",
    scanning: "Analyse approfondie…",
    grade: "Note",
    again: "Scanner un autre site",
    print: "Télécharger le rapport (PDF)",
    copy: "Copier le résumé",
    copied: "Copié",
    factsHost: "Hébergeur",
    factsBuilt: "Réalisé par",
    factsIp: "Adresse IP",
    factsStack: "Plateforme",
    factsSpeed: "Temps de réponse",
    factsWeight: "HTML",
    verdictTitle: "Résumé",
    verdictGood: "Ce site est en bonne position. Les fondations sont saines ; il s'agit d'affiner, pas de sauver.",
    verdictOk: "Ce site fonctionne, mais laisse des points que visiteurs et Google remarquent. Réparable.",
    verdictBad: "Ce site est en mauvaise position. Chaque point rouge ci-dessous, c'est du chiffre et de la confiance qui s'en vont.",
    honestTitle: "Le verdict honnête — êtes-vous bien loti, et ne payez-vous pas trop ?",
    honest: (f) => {
      const lines: string[] = [];
      if (f.flags.modern)
        lines.push("Site moderne et bien construit. Pas de panique, et aucun signe que vous payez du vent.");
      else if (f.score >= 75)
        lines.push("Travail solide. Il y a de la marge pour optimiser, mais on ne vous vole pas.");
      if (f.flags.diyPlatform)
        lines.push(`Votre site tourne sur ${f.stack}, une plateforme do-it-yourself. C'est permis — mais vous pouvez en principe le gérer vous-même. Si une agence vous facture chaque mois « l'entretien » d'un site Wix/Squarespace, regardez de près ce que vous recevez concrètement.`);
      if (f.flags.outdated)
        lines.push("Une technique obsolète ou empilée tourne ici. Payer pour cela sans mises à jour, c'est peu de valeur — et un risque de sécurité.");
      if (f.flags.insecure)
        lines.push("La sécurité est insuffisante. Ce n'est pas un détail : cela touche la confiance des visiteurs et vos obligations RGPD.");
      if (f.flags.slow)
        lines.push("Le site est lent. Les sites lents perdent visiteurs et position Google — cela vous coûte directement de l'argent.");
      if (f.flags.abandoned)
        lines.push("Le site paraît négligé : technique ancienne et année périmée. Les visiteurs doutent que vous soyez encore actif — et vous payez peut-être un « entretien » qui n'a manifestement pas lieu.");
      if (f.flags.gdprRisk)
        lines.push("Des scripts/traceurs externes se chargent sans consentement cookie visible. C'est un risque d'amende RGPD concret, pas théorique.");
      if (f.flags.mailSpoofable)
        lines.push("Votre domaine n'a ni SPF ni DMARC : quelqu'un peut aujourd'hui envoyer des e-mails qui semblent venir de votre adresse — à vos propres clients. C'est une faille grave et souvent ignorée.");
      if (f.flags.certExpiring)
        lines.push("Votre certificat SSL expire bientôt. À l'expiration, les visiteurs voient un avertissement effrayant et votre site devient de facto inaccessible.");
      if (!f.flags.modern && f.score < 60 && !f.flags.diyPlatform)
        lines.push("Bref : ce que vous avez ne livre pas ce qu'un site devrait livrer en 2026. « Arnaque » ou non dépend du prix payé — mais c'est nettement améliorable.");
      if (lines.length === 0)
        lines.push("Rien d'alarmant. Ce qui est orange ou rouge ci-dessous, c'est de l'amélioration — pas un incendie.");
      return lines.join(" ");
    },
    catTitle: "Score par catégorie",
    cats: { speed: "Vitesse", seo: "SEO", mobile: "Mobile", security: "Sécurité", platform: "Plateforme" },
    cwvTitle: "Core Web Vitals — estimation du risque",
    cwvLabels: { low: "Risque faible", medium: "Risque modéré", high: "Risque élevé" },
    cwvNote: "Estimation basée sur le temps de réponse, le poids, le CSS bloquant, les scripts et la gestion des images. Google utilise les Core Web Vitals comme facteur de classement ; risque élevé = site ressenti comme lent qui coûte visiteurs et positions.",
    pitfallTitle: "Où sont les pièges",
    pitfallNone: "Aucun piège majeur trouvé — propre.",
    findingsTitle: "Toutes les observations, expliquées",
    sev: { critical: "Critique", warning: "Attention", good: "OK", info: "Info" },
    whyLabel: "Pourquoi ça compte",
    fixLabel: "Quoi faire",
    measured: "Mesuré",
    techTitle: "Technologies & plugins détectés",
    techTypes: { cms: "CMS / plateforme", ecommerce: "Boutique", builder: "Constructeur / page-builder", theme: "Thème", plugin: "Plugins", analytics: "Analytics", marketing: "Marketing", library: "Bibliothèques", font: "Polices", framework: "Framework", cdn: "CDN", host: "Hébergeur" },
    techNone: "Aucune technologie reconnaissable (ou bien masquée).",
    headersTitle: "En-têtes de sécurité",
    headerNames: { hsts: "Strict-Transport-Security", csp: "Content-Security-Policy", xfo: "X-Frame-Options", xcto: "X-Content-Type-Options", referrer: "Referrer-Policy", permissions: "Permissions-Policy" },
    present: "Présent",
    absent: "Absent",
    seoTitle: "Mesure SEO en détail",
    seoTitleLen: "Longueur du titre (idéal 30–60)",
    seoDescLen: "Description (idéal 70–165)",
    seoH1: "Nombre de H1 (idéal 1)",
    seoAlt: "Images avec texte alt",
    benchTitle: "Votre site vs. un build Studio VM",
    benchYou: "Votre site",
    benchSvm: "Standard Studio VM",
    benchNote: "Un build Studio VM vise par défaut 100/100 sur exactement ces points. Vitesse, base SEO et sécurité ne sont pas un extra — c'est le point de départ.",
    planTitle: "Votre plan d'action + estimation immédiate",
    planIntro: "Sur base de ce qui est rouge et orange ci-dessus, voici l'ordre conseillé — avec un prix indicatif par étape (HTVA).",
    planStep: "Étape",
    planNothing: "Aucune intervention urgente. Un abonnement d'entretien maintient cet état.",
    planTotal: "Total interventions séparées",
    planRebuild: "Ou : tout en un — reconstruction en Next.js",
    planRebuildNote: "Au lieu de rustines : un site rapide et sûr qui vise 100/100, dont vous possédez le code et les données. Souvent plus avantageux que la somme ci-dessus.",
    planCare: "Ensuite : entretien sans souci",
    planCareNote: "Hébergement, SSL, sauvegardes, mises à jour et support — pour rester à 100/100 dans un an aussi.",
    excl: "HTVA",
    perMonth: "par mois",
    from: "dès",
    ctaButton: "Discuter de ce rapport avec moi",
    disclaimer: "Check heuristique rapide et honnête depuis notre serveur — pas un pentest complet. Les prix sont indicatifs ; un devis exact suit un bref échange.",
    reportFor: "Analyse de site pour",
    reportBy: "Établi par Studio VM · studio-vm.be · +32 477 99 56 51",
    gate: {
      eyebrow: "Scan terminé",
      title: (host) => `Le rapport de ${host} est prêt`,
      lead: "J'ai passé votre site au crible. Voici déjà le score ; votre analyse complète et honnête — avec le plan concret et un devis sur mesure — vous attend dans votre portail sécurisé.",
      issues: (n) =>
        n === 1
          ? "1 point d'attention important trouvé"
          : `${n} points d'attention importants trouvés`,
      noIssues: "Aucun gros piège trouvé — propre.",
      catTeaser: "Par catégorie (détail dans votre portail)",
      emailPh: "votre@email.be",
      submit: "Envoyer mon analyse complète",
      sending: "Envoi…",
      privacy:
        "Un e-mail avec le lien de votre rapport. Pas de newsletter, pas d'entonnoir, votre adresse reste chez moi.",
      sentTitle: "Vérifiez votre boîte mail",
      sentLead: (email) =>
        `Votre analyse complète part vers ${email}. Pas de mail après une minute ? Regardez dans les spams — ou ouvrez-la ci-dessous tout de suite.`,
      open: "Ouvrir mon analyse maintenant",
      errEmail: "Saisissez une adresse e-mail valide.",
      errGeneric:
        "L'envoi a échoué. Réessayez ou écrivez directement à hallo@studio-vm.be.",
    },
    modules: {
      security: { name: "Pack sécurité", desc: "Forcer HTTPS, en-têtes de sécurité, masquer la version, durcir les cookies." },
      speed: { name: "Optimisation vitesse", desc: "Cache, compression, nettoyage des scripts, réduction du poids." },
      seo: { name: "Fondation SEO", desc: "Titres, métas, structure de titres, Open Graph et données structurées." },
      mobile: { name: "Mobile & accessibilité", desc: "Viewport responsive, textes alt, lisibilité sur mobile." },
      migration: { name: "Migration du contenu", desc: "Transfert du contenu existant depuis WordPress/Wix/Squarespace." },
      rebuild: { name: "Reconstruction complète (Next.js)", desc: "Un nouveau site rapide et sûr, que vous possédez." },
      care: { name: "Abonnement Care", desc: "Hébergement, SSL, sauvegardes, mises à jour et support." },
    },
    plan: {
      title: (st) => `Votre plan : fini de bricoler ${st} — une reconstruction propre que vous possédez`,
      why: (st, s) =>
        `Continuer à réparer ${st}, c'est jeter de l'argent par les fenêtres : chaque correctif est temporaire, dépend de plugins et ne règle pas la cause (score ${s}/100). Je reconstruis exactement ce que fait votre site — propre, rapide et sûr en Next.js — et je migre votre contenu en conservant vos positions Google. Pas de plugins, pas de surprises, vous possédez le code et les données.`,
      haveTitle: "Ce que j'ai détecté sur votre site",
      feat: {
        pages: "pages",
        shop: "Boutique / vente en ligne",
        multilingual: "Multilingue",
        forms: "Formulaires",
        booking: "Réservation / rendez-vous",
        blog: "Blog / actualités",
        members: "Espace membres / e-learning",
        mediaHeavy: "Beaucoup d'images / galeries",
        pageBuilder: "Page-builder (Elementor/Divi…)",
        plugins: "plugins détectés",
      },
      buildTitle: "Ce que je construis à la place",
      phasesTitle: "Approche par phases",
      phases: [
        { t: "1 · Audit & inventaire du contenu", d: "Je liste chaque page, fonction et URL pour ne rien perdre." },
        { t: "2 · Design à votre marque", d: "Un design propre et rapide — pas de template, mobile-first." },
        { t: "3 · Construction en Next.js", d: "Tout le site recodé en natif, sans plugins." },
        { t: "4 · Migration du contenu", d: "Textes, images et pages transférés et nettoyés." },
        { t: "5 · Préservation SEO", d: "Plan de redirections 301 pour que vos positions Google suivent." },
        { t: "6 · Mise en ligne & transfert", d: "Mis en ligne ; vous recevez code, données et un admin." },
      ],
      mod: {
        base_starter: { name: "Site de base (jusqu'à ±8 pages)", desc: "Design propre, mobile, contact, fondation SEO — recodé proprement." },
        base_pro: { name: "Site complet (Pro)", desc: "Plusieurs sections, proprement construit et prêt à évoluer." },
        base_webshop: { name: "Boutique", desc: "Boutique complète (Mollie/Stripe), stock, admin commandes." },
        multilingual: { name: "Multilingue", desc: "Même contenu, bascule de langue propre + hreflang SEO." },
        forms: { name: "Formulaires + suivi", desc: "Formulaires contact/devis avec anti-spam et suivi mail." },
        booking: { name: "Module de réservation", desc: "Rendez-vous/réservations avec agenda et confirmations." },
        blog: { name: "CMS blog / actus", desc: "Environnement de rédaction propre — sans WordPress." },
        members: { name: "Espace membres", desc: "Zone protégée avec logins et rôles." },
        admin: { name: "Admin / CMS propre", desc: "Gérez vous-même textes, images et pages — pas de facture pour chaque modification." },
        content: { name: "Migration du contenu", desc: "Pages existantes transférées, dimensionné selon la taille du site." },
        seoPreserve: { name: "Préservation SEO & redirections", desc: "Plan 301 complet + sitemap pour ne pas chuter dans Google." },
        photoshoot: { name: "Shooting photo / visuels", desc: "Pas de photos exploitables ? Une demi-journée de shooting pro de votre activité, produits ou équipe — retouché et prêt pour le web." },
      },
      base: "Point de départ",
      addons: "Sur mesure selon l'existant",
      total: "Estimation totale",
      approx: "indicatif, devis exact après un bref échange",
      timeline: "Délai",
      timelineNote:
        "Réalisation en 1–2 semaines. Dépend uniquement de la libération du domaine et de la présence de matériel photo.",
      weeks: (a, b) => `${a}–${b} semaines`,
      careTitle: "Ensuite : entretien sans souci",
      careNote: "Hébergement, SSL, sauvegardes, mises à jour et support — pour rester à 100/100.",
      optTitle: "Optionnel — si vous n'avez pas encore de visuels",
      optNote: "De bonnes photos font ou défont un site. Rien d'exploitable ? J'organise un shooting. Uniquement si nécessaire — sinon, à omettre.",
      own: "À la livraison, vous possédez tout le code et les données. Pas de lock-in, pas d'abonnement obligatoire.",
      cta: "Discuter de ce plan avec moi",
    },
    copyTpl: (h, s, g, st) =>
      `Analyse de ${h} (via studio-vm.be/scan)\nNote : ${g} — ${s}/100\nPlateforme : ${st}\n\nUn build Studio VM vise 100/100. Discutons : studio-vm.be`,
  },
  en: {
    domain: { title: "Domain, mail & certificate", cert: "SSL certificate", issuer: "Issuer", expires: "Expires in", protocol: "TLS protocol", mail: "Mail security", spf: "SPF", dmarc: "DMARC", ipv6: "IPv6", yes: "yes", no: "no", na: "n/a", days: "days" },
    placeholder: "yourcurrentsite.com",
    button: "Deep-scan my site",
    scanning: "Running a deep scan…",
    grade: "Grade",
    again: "Scan another site",
    print: "Download report (PDF)",
    copy: "Copy summary",
    copied: "Copied",
    factsHost: "Host",
    factsBuilt: "Built by",
    factsIp: "IP address",
    factsStack: "Platform",
    factsSpeed: "Response time",
    factsWeight: "HTML",
    verdictTitle: "Summary",
    verdictGood: "This site is in strong shape. The fundamentals are sound; this is fine-tuning, not rescue.",
    verdictOk: "This site works, but leaves points that both visitors and Google notice. Fixable.",
    verdictBad: "This site is in weak shape. Every red point below is revenue, trust or visibility walking away.",
    honestTitle: "The honest verdict — are you in good shape, and not overpaying?",
    honest: (f) => {
      const lines: string[] = [];
      if (f.flags.modern)
        lines.push("This is a modern, well-built site. No reason to panic, and no sign you're paying for thin air.");
      else if (f.score >= 75)
        lines.push("Solid work. There's room to optimize, but you're not being robbed here.");
      if (f.flags.diyPlatform)
        lines.push(`Your site runs on ${f.stack}, a do-it-yourself platform. That's fine — but you can largely manage it yourself. If an agency bills you monthly to 'maintain' a Wix/Squarespace site, look hard at what you actually get for it.`);
      if (f.flags.outdated)
        lines.push("Outdated or stacked tech is running here. Paying for this without it ever being updated is poor value — and a security risk.");
      if (f.flags.insecure)
        lines.push("Security is insufficient. Not a detail: it touches visitor trust and your GDPR obligations.");
      if (f.flags.slow)
        lines.push("The site is slow. Slow sites measurably lose visitors and Google ranking — this costs you money directly.");
      if (f.flags.abandoned)
        lines.push("The site looks neglected: old tech plus a stale year. Visitors wonder if you're still active — and you may be paying for 'maintenance' that clearly isn't happening.");
      if (f.flags.gdprRisk)
        lines.push("External scripts/trackers load without a visible cookie consent. That's a concrete GDPR fine risk, not theory.");
      if (f.flags.mailSpoofable)
        lines.push("Your domain has no SPF and no DMARC: someone can send emails today that look like they come from your address — to your own customers. That's a serious and often overlooked hole.");
      if (f.flags.certExpiring)
        lines.push("Your SSL certificate expires soon. Once it lapses, visitors get a scary warning and your site is effectively unreachable.");
      if (!f.flags.modern && f.score < 60 && !f.flags.diyPlatform)
        lines.push("In short: what you have doesn't deliver what a site should in 2026. Whether that's a 'rip-off' depends on what you pay — but it can be markedly better.");
      if (lines.length === 0)
        lines.push("Nothing alarming. What's amber or red below is improvement work — not a fire.");
      return lines.join(" ");
    },
    catTitle: "Score per category",
    cats: { speed: "Speed", seo: "SEO", mobile: "Mobile", security: "Security", platform: "Platform" },
    cwvTitle: "Core Web Vitals — risk estimate",
    cwvLabels: { low: "Low risk", medium: "Medium risk", high: "High risk" },
    cwvNote: "Estimate based on response time, weight, render-blocking CSS, scripts and image approach. Google uses Core Web Vitals as a ranking factor; high risk = a slow-feeling site that costs visitors and rankings.",
    pitfallTitle: "Where the pitfalls are",
    pitfallNone: "No major pitfalls found — clean.",
    findingsTitle: "Every finding, explained",
    sev: { critical: "Critical", warning: "Attention", good: "OK", info: "Info" },
    whyLabel: "Why this matters",
    fixLabel: "What to do",
    measured: "Measured",
    techTitle: "Detected technology & plugins",
    techTypes: { cms: "CMS / platform", ecommerce: "E-commerce", builder: "Builder / page-builder", theme: "Theme", plugin: "Plugins", analytics: "Analytics", marketing: "Marketing", library: "Libraries", font: "Fonts", framework: "Framework", cdn: "CDN", host: "Hosting" },
    techNone: "No recognizable technology found (or well shielded).",
    headersTitle: "Security headers",
    headerNames: { hsts: "Strict-Transport-Security", csp: "Content-Security-Policy", xfo: "X-Frame-Options", xcto: "X-Content-Type-Options", referrer: "Referrer-Policy", permissions: "Permissions-Policy" },
    present: "Present",
    absent: "Missing",
    seoTitle: "SEO measurement in detail",
    seoTitleLen: "Title length (ideal 30–60)",
    seoDescLen: "Description (ideal 70–165)",
    seoH1: "H1 count (ideal 1)",
    seoAlt: "Images with alt text",
    benchTitle: "Your site vs. a Studio VM build",
    benchYou: "Your site",
    benchSvm: "Studio VM standard",
    benchNote: "A Studio VM build aims for 100/100 on exactly these points by default. Speed, SEO basics and security aren't an extra — they're the starting point.",
    planTitle: "Your action plan + instant price estimate",
    planIntro: "Based on what's red and amber above, here's the recommended order — with an indicative price per step (excl. VAT).",
    planStep: "Step",
    planNothing: "No urgent interventions needed. A maintenance plan keeps it this way.",
    planTotal: "Total of individual fixes",
    planRebuild: "Or: all in one — rebuild in Next.js",
    planRebuildNote: "Instead of patches: a fast, secure site aiming for 100/100, whose code and data you own. Often better value than the sum above.",
    planCare: "Then: worry-free maintenance",
    planCareNote: "Hosting, SSL, backups, updates and support — so it still scores 100/100 a year from now.",
    excl: "excl. VAT",
    perMonth: "per month",
    from: "from",
    ctaButton: "Discuss this report with me",
    disclaimer: "Quick, honest heuristic check from our server — not a full pentest. Prices are indicative; an exact quote follows a short chat.",
    reportFor: "Website analysis for",
    reportBy: "Prepared by Studio VM · studio-vm.be · +32 477 99 56 51",
    gate: {
      eyebrow: "Scan complete",
      title: (host) => `The report for ${host} is ready`,
      lead: "I've gone through your site in full. Here's the score already; your complete, honest analysis — with the concrete plan and a tailored quote — is waiting in your own secure portal.",
      issues: (n) =>
        n === 1
          ? "1 important issue found"
          : `${n} important issues found`,
      noIssues: "No major pitfalls found — clean.",
      catTeaser: "By category (detail in your portal)",
      emailPh: "you@email.com",
      submit: "Send my full analysis",
      sending: "Sending…",
      privacy:
        "One email with your report link. No newsletter, no funnel, your address stays with me.",
      sentTitle: "Check your inbox",
      sentLead: (email) =>
        `Your full analysis is on its way to ${email}. No mail after a minute? Check spam — or open it right below now.`,
      open: "Open my analysis now",
      errEmail: "Enter a valid email address.",
      errGeneric:
        "Sending failed. Try again or email hallo@studio-vm.be directly.",
    },
    modules: {
      security: { name: "Security pack", desc: "Force HTTPS, security headers, close version leaks, harden cookies." },
      speed: { name: "Speed optimization", desc: "Caching, compression, script cleanup, weight reduction." },
      seo: { name: "SEO foundation", desc: "Titles, metas, heading structure, Open Graph and structured data." },
      mobile: { name: "Mobile & accessibility", desc: "Responsive viewport, alt text, readability on phones." },
      migration: { name: "Content migration", desc: "Move existing content off WordPress/Wix/Squarespace." },
      rebuild: { name: "Full rebuild (Next.js)", desc: "A new, fast, secure site that you own." },
      care: { name: "Care plan", desc: "Hosting, SSL, backups, updates and support." },
    },
    plan: {
      title: (st) => `Your plan: no more tinkering in ${st} — a clean rebuild you own`,
      why: (st, s) =>
        `Keeping ${st} patched is throwing good money after bad: every fix is temporary, plugin-dependent and doesn't address the cause (score ${s}/100). I rebuild exactly what your site does — clean, fast and secure in Next.js — and migrate your content while preserving your Google rankings. No plugins, no surprises, you own the code and data.`,
      haveTitle: "What I detected on your site",
      feat: {
        pages: "pages",
        shop: "Webshop / online sales",
        multilingual: "Multilingual",
        forms: "Forms",
        booking: "Booking / appointments",
        blog: "Blog / news",
        members: "Member area / e-learning",
        mediaHeavy: "Image-heavy / galleries",
        pageBuilder: "Page builder (Elementor/Divi…)",
        plugins: "plugins detected",
      },
      buildTitle: "What I build instead",
      phasesTitle: "Phased approach",
      phases: [
        { t: "1 · Audit & content inventory", d: "I list every page, feature and URL so nothing is lost." },
        { t: "2 · Design on your brand", d: "A custom, fast design — no template, mobile-first." },
        { t: "3 · Build in Next.js", d: "The whole site rebuilt natively, without plugins." },
        { t: "4 · Content migration", d: "Texts, images and pages moved over and cleaned up." },
        { t: "5 · SEO preservation", d: "A 301 redirect plan so your Google rankings move with you." },
        { t: "6 · Launch & handover", d: "Taken live; you get the code, data and an admin." },
      ],
      mod: {
        base_starter: { name: "Base site (up to ±8 pages)", desc: "Custom design, mobile, contact, SEO foundation — cleanly rebuilt." },
        base_pro: { name: "Full site (Pro)", desc: "Multiple sections, cleanly built and ready to scale." },
        base_webshop: { name: "Webshop", desc: "Full shop (Mollie/Stripe), stock, orders admin." },
        multilingual: { name: "Multilingual", desc: "Same content, clean language switch + hreflang for SEO." },
        forms: { name: "Forms + follow-up", desc: "Contact/quote forms with spam filter and mail follow-up." },
        booking: { name: "Booking module", desc: "Appointments/bookings with calendar and confirmations." },
        blog: { name: "Blog / news CMS", desc: "Own editorial environment for articles — without WordPress." },
        members: { name: "Member area", desc: "Gated section with logins and roles." },
        admin: { name: "Own admin / CMS", desc: "Manage texts, images and pages yourself — no invoice for every change." },
        content: { name: "Content migration", desc: "Existing pages moved over, scaled to your site's size." },
        seoPreserve: { name: "SEO preservation & redirects", desc: "Full 301 plan + sitemap so you don't drop in Google." },
        photoshoot: { name: "Photo shoot / visuals", desc: "No usable photos? A half-day professional shoot of your business, products or team — edited and web-ready." },
      },
      base: "Starting point",
      addons: "Tailored to what you have",
      total: "Total estimate",
      approx: "indicative, exact quote after a short chat",
      timeline: "Timeline",
      timelineNote:
        "Built in 1–2 weeks. Only depends on your domain release and whether photo material is available.",
      weeks: (a, b) => `${a}–${b} weeks`,
      careTitle: "Then: worry-free maintenance",
      careNote: "Hosting, SSL, backups, updates and support — so it stays 100/100.",
      optTitle: "Optional — if you don't have visuals yet",
      optNote: "Good photos make or break a site. Nothing usable? I arrange a shoot. Only if you need it — otherwise just leave it out.",
      own: "On delivery you own all the code and data. No lock-in, no mandatory subscription.",
      cta: "Discuss this plan with me",
    },
    copyTpl: (h, s, g, st) =>
      `Scan of ${h} (via studio-vm.be/scan)\nGrade: ${g} — ${s}/100\nPlatform: ${st}\n\nA Studio VM build aims for 100/100. Let's talk: studio-vm.be`,
  },
};

function Ring({ score, grade }: { score: number; grade: string }) {
  const color = score >= 75 ? "#16a34a" : score >= 45 ? "#f59e0b" : "#ef4444";
  const r = 52;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 flex-shrink-0">
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 60 60)" />
      <text x="60" y="52" textAnchor="middle" dominantBaseline="central" className="fill-foreground" style={{ fontSize: 30, fontWeight: 700 }}>
        {grade}
      </text>
      <text x="60" y="76" textAnchor="middle" dominantBaseline="central" className="fill-muted" style={{ fontSize: 13, fontWeight: 600 }}>
        {score}/100
      </text>
    </svg>
  );
}

export function SiteScanner({
  monitorEnabled = false,
}: {
  monitorEnabled?: boolean;
}) {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = UI[locale];

  const [result, setResult] = useState<ScanResult | null>(null);
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [lead, setLead] = useState<
    | { status: "idle" }
    | { status: "sending" }
    | { status: "sent"; url: string }
    | { status: "error"; msg: string }
  >({ status: "idle" });

  if (result && result.ok) {
    const r = result;
    const host = r.host;
    const issueCount = r.pitfalls.length;
    const g = t.gate;

    const sendLead = () => {
      const mail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        setLead({ status: "error", msg: g.errEmail });
        return;
      }
      setLead({ status: "sending" });
      start(async () => {
        try {
          const res = await submitScanLead({
            email: mail,
            url: r.finalUrl || host,
            locale,
            scan: r,
          });
          if (res.ok) {
            setLead({ status: "sent", url: res.url });
            track("scan_lead", { stack: r.stack });
          } else {
            setLead({
              status: "error",
              msg: res.error === "email" ? g.errEmail : g.errGeneric,
            });
          }
        } catch {
          setLead({ status: "error", msg: g.errGeneric });
        }
      });
    };

    return (
      <div className="space-y-7">
        {/* Score-teaser */}
        <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-8 text-center sm:flex-row sm:text-left">
          <Ring score={r.score} grade={r.grade} />
          <div className="flex-1">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {g.eyebrow}
            </p>
            <p className="mt-2 text-lg font-semibold leading-snug">
              {g.title(host)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{g.lead}</p>
            <p
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                issueCount > 0
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-green-500/10 text-green-600 dark:text-green-400"
              }`}
            >
              {issueCount > 0 ? (
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
              {issueCount > 0 ? g.issues(issueCount) : g.noIssues}
            </p>
          </div>
        </div>

        {/* Categorie-teaser (zonder cijferdetail dat in 't portaal zit) */}
        <div className="rounded-2xl border bg-card p-6">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <GaugeIcon className="h-4 w-4" strokeWidth={2} />
            {g.catTeaser}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {r.categories.map((c) => {
              const col =
                c.score >= 75 ? "#16a34a" : c.score >= 45 ? "#f59e0b" : "#ef4444";
              return (
                <div key={c.cat}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-xs font-medium">{t.cats[c.cat]}</span>
                    <span className="font-mono text-[11px] text-muted">
                      {c.score}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.score}%`, background: col }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* E-mailpoort */}
        {lead.status === "sent" ? (
          <div className="rounded-2xl border border-accent/40 bg-accent/5 p-8 text-center">
            <ShieldCheck
              className="mx-auto h-8 w-8 text-accent"
              strokeWidth={2}
            />
            <p className="mt-3 text-lg font-semibold">{g.sentTitle}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              {g.sentLead(email.trim().toLowerCase())}
            </p>
            <Link
              href={lead.url}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {g.open}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setLead({ status: "idle" });
                  setEmail("");
                }}
                className="text-sm text-muted underline transition-colors hover:text-foreground"
              >
                {t.again}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8">
            <p className="text-lg font-semibold">{g.title(host)}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{g.lead}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (lead.status !== "sending") sendLead();
              }}
              className="mt-5 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={g.emailPh}
                className="w-full flex-1 rounded-full border bg-background px-5 py-3 text-sm outline-none transition-colors focus:border-accent"
              />
              <button
                type="submit"
                disabled={lead.status === "sending"}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {lead.status === "sending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                )}
                {lead.status === "sending" ? g.sending : g.submit}
              </button>
            </form>
            {lead.status === "error" && (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-500">
                <X className="h-4 w-4" strokeWidth={2} />
                {lead.msg}
              </p>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {g.privacy}
            </p>
          </div>
        )}

        {monitorEnabled && <MonitorSignup url={host} locale={locale} />}

        <p className="text-center font-mono text-[11px] text-muted">
          {t.disclaimer}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form
        action={(fd) =>
          start(async () => {
            const res = await scanSite(fd);
            setResult(res);
            if (res.ok)
              track("site_scan", {
                stack: res.stack,
                score: res.score >= 75 ? "good" : res.score >= 45 ? "medium" : "poor",
              });
          })
        }
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={2} />
          <input
            name="url"
            required
            placeholder={t.placeholder}
            className="w-full rounded-full border bg-background py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Search className="h-4 w-4" strokeWidth={2} />
          )}
          {pending ? t.scanning : t.button}
        </button>
      </form>
      {result && !result.ok && (
        <p className="flex items-center gap-2 text-sm text-red-500">
          <X className="h-4 w-4" strokeWidth={2} />
          {result.error}
        </p>
      )}
      <p className="font-mono text-[11px] text-muted">{t.disclaimer}</p>
    </div>
  );
}
