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
  Info,
  ArrowRight,
  Loader2,
  Printer,
  ClipboardCheck,
  Clipboard,
  Server,
  Code2,
  ShieldCheck,
  Gauge as GaugeIcon,
  Layers,
  ListChecks,
} from "lucide-react";
import {
  scanSite,
  type ScanResult,
  type Severity,
  type TechType,
} from "@/app/actions/scan";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

type Txt = { title: string; why: string; fix: string };

const FIND: Record<Locale, Record<string, Txt>> = {
  nl: {
    https: { title: "HTTPS-versleuteling", why: "Zonder HTTPS kan iedereen op het netwerk meelezen. Browsers tonen 'Niet veilig' en Google rankt je lager.", fix: "SSL-certificaat installeren (gratis via Let's Encrypt) en alles forceren naar https." },
    hsts: { title: "HSTS-header", why: "HSTS dwingt de browser om altijd via HTTPS te verbinden, ook bij de eerste klik. Mist die, dan blijft een man-in-the-middle mogelijk.", fix: "Strict-Transport-Security header toevoegen met een lange max-age." },
    csp: { title: "Content-Security-Policy", why: "Zonder CSP kan een gekaapt script ongehinderd data stelen of de pagina kapen (XSS).", fix: "Een CSP-header opstellen die enkel jouw eigen + vertrouwde bronnen toelaat." },
    xfo: { title: "Clickjacking-bescherming", why: "Zonder X-Frame-Options kan je site in een onzichtbare iframe geladen worden om bezoekers te misleiden.", fix: "X-Frame-Options: SAMEORIGIN (of CSP frame-ancestors) instellen." },
    xcto: { title: "MIME-sniffing", why: "Zonder X-Content-Type-Options kan de browser bestanden verkeerd interpreteren — een klassiek aanvalspad.", fix: "X-Content-Type-Options: nosniff toevoegen." },
    referrer: { title: "Referrer-Policy", why: "Standaard lekt je site interne URL's naar externe partijen wanneer bezoekers wegklikken.", fix: "Referrer-Policy: strict-origin-when-cross-origin instellen." },
    permissions: { title: "Permissions-Policy", why: "Beperkt camera, microfoon, locatie… Zonder deze header mag elk ingesloten script alles aanvragen.", fix: "Permissions-Policy instellen en enkel toestaan wat je echt gebruikt." },
    versionLeak: { title: "Server-versie lekt", why: "Je server vertelt aanvallers exact welke software en versie draait — een kant-en-klare lijst van bekende lekken.", fix: "Server- en X-Powered-By-headers onderdrukken of anonimiseren." },
    mixedContent: { title: "Mixed content", why: "Een HTTPS-pagina die HTTP-bestanden inlaadt is deels onveilig; de browser blokkeert of waarschuwt.", fix: "Alle resources via https laden." },
    cookieFlags: { title: "Cookie-beveiliging", why: "Cookies zonder Secure/HttpOnly zijn te stelen via scripts of onversleutelde verbindingen.", fix: "Secure-, HttpOnly- en SameSite-vlaggen op alle cookies zetten." },
    ttfb: { title: "Reactietijd (TTFB)", why: "Trage servers laten bezoekers afhaken nog vóór ze iets zien. Google gebruikt dit als rankingsignaal.", fix: "Caching, een snellere host of een statische/edge-render aanpak." },
    htmlWeight: { title: "HTML-gewicht", why: "Zware HTML vertraagt vooral mobiel op een matige verbinding — daar verlies je de meeste bezoekers.", fix: "Onnodige markup, page-builder-bloat en inline data weghalen." },
    compression: { title: "Compressie", why: "Zonder gzip/brotli wordt onnodig veel data over de lijn gestuurd — trager én duurder.", fix: "Gzip of Brotli activeren op de server/CDN." },
    scripts: { title: "Aantal scripts", why: "Elk script blokkeert mogelijk het renderen. Veel scripts = klassiek symptoom van plugin-stapeling.", fix: "Scripts bundelen, uitstellen (defer) of overbodige plugins schrappen." },
    externalDomains: { title: "Externe domeinen", why: "Elke externe bron is een extra DNS-lookup, verbinding én een privacy/uptime-afhankelijkheid.", fix: "Externe scripts zelf hosten of schrappen waar mogelijk." },
    inlineCss: { title: "Inline-stijlen", why: "Veel inline style-attributen wijzen op page-builder-output: moeilijk te onderhouden en zwaar.", fix: "Naar een centrale, herbruikbare stylesheet werken." },
    title: { title: "Paginatitel", why: "De <title> is wat in Google en de browsertab staat. Geen titel = geen klikbaar zoekresultaat.", fix: "Een unieke, beschrijvende titel per pagina zetten." },
    titleLen: { title: "Titellengte", why: "Te kort verspilt ruimte, te lang wordt afgekapt in Google (±30–60 tekens is ideaal).", fix: "Titel herschrijven naar 30–60 tekens met je belangrijkste term vooraan." },
    metaDesc: { title: "Meta-omschrijving", why: "Zonder omschrijving verzint Google zelf je zoeksnippet — vaak niet je sterkste verkoopzin.", fix: "Een wervende meta-description van 70–160 tekens per pagina schrijven." },
    metaDescLen: { title: "Lengte omschrijving", why: "Te kort = weinig overtuiging; te lang = afgekapt in de zoekresultaten.", fix: "Mik op 70–165 tekens." },
    h1: { title: "H1-koppen", why: "Precies één H1 vertelt Google én screenreaders waar de pagina over gaat. Geen of meerdere = verwarrend.", fix: "Eén duidelijke H1 per pagina; rest als H2/H3." },
    canonical: { title: "Canonical-tag", why: "Zonder canonical kan dezelfde inhoud onder meerdere URL's je SEO verwateren (duplicate content).", fix: "Een rel=canonical naar de voorkeurs-URL toevoegen." },
    noindex: { title: "Indexeerbaarheid", why: "Een noindex-tag houdt de pagina volledig uit Google. Soms per ongeluk blijven staan na een lancering.", fix: "De noindex onmiddellijk verwijderen als de pagina wél vindbaar moet zijn." },
    og: { title: "Open Graph", why: "Zonder OG-tags krijgt je link op WhatsApp/LinkedIn/Facebook een kale, klikonvriendelijke preview.", fix: "og:title, og:description en og:image toevoegen." },
    twitter: { title: "Twitter/X-card", why: "Bepaalt hoe je link op X getoond wordt. Klein, maar gratis extra zichtbaarheid.", fix: "Een twitter:card-meta toevoegen." },
    structuredData: { title: "Gestructureerde data", why: "JSON-LD geeft Google rich results (sterren, FAQ, bedrijfsinfo). Zonder val je visueel weg.", fix: "Schema.org JSON-LD toevoegen (Organization, FAQ, Product…)." },
    favicon: { title: "Favicon", why: "Het kleine icoon in de tab en bij favorieten. Ontbreekt het, oogt de site onaf.", fix: "Een favicon en apple-touch-icon toevoegen." },
    imgAlt: { title: "Alt-teksten op afbeeldingen", why: "Alt-tekst is cruciaal voor blinde bezoekers én voor Google Afbeeldingen. Ontbreekt vaak volledig.", fix: "Beschrijvende alt-tekst bij elke inhoudelijke afbeelding." },
    viewport: { title: "Mobiele viewport", why: "Zonder viewport-meta schaalt de site niet op gsm — onleesbaar voor het grootste deel van je bezoek.", fix: "De viewport-meta toevoegen en responsive uitwerken." },
    langAttr: { title: "Taal-attribuut", why: "<html lang> helpt screenreaders, vertaling en Google de juiste taal te bepalen.", fix: "lang-attribuut correct instellen per taalversie." },
    stack: { title: "Platform", why: "Het onderliggende systeem bepaalt snelheid, veiligheid en onderhoudskost van je site.", fix: "Bij een traag/gesloten platform: overweeg een herbouw die je zelf in handen houdt." },
    pluginBloat: { title: "Plugin-stapeling", why: "Elke plugin is extra code, extra updates en een extra mogelijk lek. Veel plugins = traag en kwetsbaar.", fix: "Plugins drastisch verminderen of functionaliteit native herbouwen." },
    outdatedLib: { title: "Verouderde libraries", why: "Oude bibliotheken (zoals oude jQuery) hebben bekende, publiek gedocumenteerde beveiligingslekken.", fix: "Updaten naar een veilige versie of vervangen door moderne code." },
    builderLockin: { title: "Platform lock-in", why: "Op een gesloten DIY-platform ben je de code, data en prijszetting niet de baas — overstappen is duur.", fix: "Naar een open stack (eigen code, eigen hosting) waar je niets verplicht afneemt." },
  },
  fr: {
    https: { title: "Chiffrement HTTPS", why: "Sans HTTPS, tout le monde sur le réseau peut lire. Les navigateurs affichent « Non sécurisé » et Google déclasse.", fix: "Installer un certificat SSL (gratuit via Let's Encrypt) et tout forcer en https." },
    hsts: { title: "En-tête HSTS", why: "HSTS force le navigateur à toujours utiliser HTTPS, dès le premier clic. Absent, un man-in-the-middle reste possible.", fix: "Ajouter l'en-tête Strict-Transport-Security avec un max-age long." },
    csp: { title: "Content-Security-Policy", why: "Sans CSP, un script détourné peut voler des données ou pirater la page (XSS).", fix: "Définir une CSP n'autorisant que vos sources + sources de confiance." },
    xfo: { title: "Protection clickjacking", why: "Sans X-Frame-Options, votre site peut être chargé dans une iframe invisible pour tromper le visiteur.", fix: "Définir X-Frame-Options: SAMEORIGIN (ou CSP frame-ancestors)." },
    xcto: { title: "MIME-sniffing", why: "Sans X-Content-Type-Options, le navigateur peut mal interpréter des fichiers — voie d'attaque classique.", fix: "Ajouter X-Content-Type-Options: nosniff." },
    referrer: { title: "Referrer-Policy", why: "Par défaut, votre site fuite des URL internes vers des tiers quand le visiteur clique ailleurs.", fix: "Définir Referrer-Policy: strict-origin-when-cross-origin." },
    permissions: { title: "Permissions-Policy", why: "Limite caméra, micro, localisation… Sans cet en-tête, tout script intégré peut tout demander.", fix: "Définir Permissions-Policy et n'autoriser que le nécessaire." },
    versionLeak: { title: "Version serveur exposée", why: "Votre serveur indique aux attaquants la version exacte — une liste prête à l'emploi de failles connues.", fix: "Masquer ou anonymiser les en-têtes Server et X-Powered-By." },
    mixedContent: { title: "Contenu mixte", why: "Une page HTTPS qui charge du HTTP est partiellement non sécurisée ; le navigateur bloque ou avertit.", fix: "Charger toutes les ressources en https." },
    cookieFlags: { title: "Sécurité des cookies", why: "Des cookies sans Secure/HttpOnly sont volables via scripts ou connexions non chiffrées.", fix: "Activer les drapeaux Secure, HttpOnly et SameSite." },
    ttfb: { title: "Temps de réponse (TTFB)", why: "Un serveur lent fait fuir le visiteur avant même qu'il voie quelque chose. Google s'en sert pour classer.", fix: "Cache, hébergeur plus rapide ou rendu statique/edge." },
    htmlWeight: { title: "Poids du HTML", why: "Un HTML lourd ralentit surtout sur mobile en réseau moyen — là où vous perdez le plus de visiteurs.", fix: "Retirer le markup inutile, le bloat de page-builder et les données inline." },
    compression: { title: "Compression", why: "Sans gzip/brotli, trop de données circulent — plus lent et plus cher.", fix: "Activer Gzip ou Brotli sur le serveur/CDN." },
    scripts: { title: "Nombre de scripts", why: "Chaque script peut bloquer le rendu. Beaucoup de scripts = symptôme classique d'empilement de plugins.", fix: "Regrouper, différer (defer) ou supprimer les plugins superflus." },
    externalDomains: { title: "Domaines externes", why: "Chaque ressource externe = un DNS, une connexion et une dépendance vie privée/disponibilité de plus.", fix: "Héberger soi-même ou supprimer les scripts externes." },
    inlineCss: { title: "Styles inline", why: "Beaucoup de styles inline trahissent une sortie de page-builder : lourd et difficile à maintenir.", fix: "Passer à une feuille de style centrale et réutilisable." },
    title: { title: "Titre de page", why: "Le <title> apparaît dans Google et l'onglet. Pas de titre = pas de résultat cliquable.", fix: "Un titre unique et descriptif par page." },
    titleLen: { title: "Longueur du titre", why: "Trop court gaspille de l'espace, trop long est tronqué dans Google (±30–60 caractères idéalement).", fix: "Réécrire en 30–60 caractères, terme clé en premier." },
    metaDesc: { title: "Méta-description", why: "Sans description, Google invente votre extrait — rarement votre meilleur argument.", fix: "Écrire une méta-description vendeuse de 70–160 caractères par page." },
    metaDescLen: { title: "Longueur de la description", why: "Trop court = peu convaincant ; trop long = tronqué dans les résultats.", fix: "Visez 70–165 caractères." },
    h1: { title: "Titres H1", why: "Exactement un H1 indique à Google et aux lecteurs d'écran le sujet de la page.", fix: "Un seul H1 clair par page ; le reste en H2/H3." },
    canonical: { title: "Balise canonical", why: "Sans canonical, le même contenu sous plusieurs URL dilue votre SEO (contenu dupliqué).", fix: "Ajouter un rel=canonical vers l'URL préférée." },
    noindex: { title: "Indexabilité", why: "Une balise noindex retire totalement la page de Google. Parfois oubliée après une mise en ligne.", fix: "Retirer le noindex si la page doit être trouvable." },
    og: { title: "Open Graph", why: "Sans balises OG, votre lien sur WhatsApp/LinkedIn/Facebook a un aperçu fade et peu cliquable.", fix: "Ajouter og:title, og:description et og:image." },
    twitter: { title: "Carte Twitter/X", why: "Détermine l'affichage de votre lien sur X. Petit, mais visibilité gratuite.", fix: "Ajouter une méta twitter:card." },
    structuredData: { title: "Données structurées", why: "Le JSON-LD donne à Google des résultats enrichis (étoiles, FAQ, infos entreprise).", fix: "Ajouter du JSON-LD Schema.org (Organization, FAQ, Product…)." },
    favicon: { title: "Favicon", why: "La petite icône dans l'onglet et les favoris. Absente, le site paraît inachevé.", fix: "Ajouter un favicon et un apple-touch-icon." },
    imgAlt: { title: "Textes alternatifs", why: "L'alt est crucial pour les non-voyants et pour Google Images. Souvent totalement absent.", fix: "Un alt descriptif sur chaque image de contenu." },
    viewport: { title: "Viewport mobile", why: "Sans méta viewport, le site ne s'adapte pas au mobile — illisible pour la majorité du trafic.", fix: "Ajouter la méta viewport et rendre responsive." },
    langAttr: { title: "Attribut de langue", why: "<html lang> aide lecteurs d'écran, traduction et Google à déterminer la langue.", fix: "Définir correctement l'attribut lang par version linguistique." },
    stack: { title: "Plateforme", why: "Le système sous-jacent détermine vitesse, sécurité et coût d'entretien.", fix: "Plateforme lente/fermée : envisager une reconstruction que vous maîtrisez." },
    pluginBloat: { title: "Empilement de plugins", why: "Chaque plugin = du code, des mises à jour et une faille potentielle en plus. Beaucoup = lent et vulnérable.", fix: "Réduire drastiquement les plugins ou recoder en natif." },
    outdatedLib: { title: "Bibliothèques obsolètes", why: "Les vieilles bibliothèques (vieux jQuery) ont des failles connues et publiquement documentées.", fix: "Mettre à jour vers une version sûre ou remplacer par du code moderne." },
    builderLockin: { title: "Verrouillage plateforme", why: "Sur une plateforme DIY fermée, vous ne maîtrisez ni le code, ni les données, ni le prix.", fix: "Passer à une stack ouverte (votre code, votre hébergement)." },
  },
  en: {
    https: { title: "HTTPS encryption", why: "Without HTTPS anyone on the network can eavesdrop. Browsers show 'Not secure' and Google ranks you lower.", fix: "Install an SSL certificate (free via Let's Encrypt) and force everything to https." },
    hsts: { title: "HSTS header", why: "HSTS forces the browser to always use HTTPS, even on the first click. Missing it leaves a man-in-the-middle open.", fix: "Add a Strict-Transport-Security header with a long max-age." },
    csp: { title: "Content-Security-Policy", why: "Without CSP a hijacked script can freely steal data or take over the page (XSS).", fix: "Define a CSP that only allows your own + trusted sources." },
    xfo: { title: "Clickjacking protection", why: "Without X-Frame-Options your site can be loaded in an invisible iframe to trick visitors.", fix: "Set X-Frame-Options: SAMEORIGIN (or CSP frame-ancestors)." },
    xcto: { title: "MIME sniffing", why: "Without X-Content-Type-Options the browser can misinterpret files — a classic attack path.", fix: "Add X-Content-Type-Options: nosniff." },
    referrer: { title: "Referrer-Policy", why: "By default your site leaks internal URLs to third parties when visitors click away.", fix: "Set Referrer-Policy: strict-origin-when-cross-origin." },
    permissions: { title: "Permissions-Policy", why: "Limits camera, mic, location… Without it any embedded script may request anything.", fix: "Set Permissions-Policy and only allow what you actually use." },
    versionLeak: { title: "Server version leak", why: "Your server tells attackers the exact software and version — a ready-made list of known exploits.", fix: "Suppress or anonymise Server and X-Powered-By headers." },
    mixedContent: { title: "Mixed content", why: "An HTTPS page loading HTTP files is partly insecure; the browser blocks or warns.", fix: "Load all resources over https." },
    cookieFlags: { title: "Cookie security", why: "Cookies without Secure/HttpOnly can be stolen via scripts or unencrypted connections.", fix: "Set Secure, HttpOnly and SameSite flags on all cookies." },
    ttfb: { title: "Response time (TTFB)", why: "Slow servers make visitors bounce before they see anything. Google uses this as a ranking signal.", fix: "Caching, a faster host or a static/edge rendering approach." },
    htmlWeight: { title: "HTML weight", why: "Heavy HTML slows down mobile on a mediocre connection most — where you lose the most visitors.", fix: "Strip unnecessary markup, page-builder bloat and inline data." },
    compression: { title: "Compression", why: "Without gzip/brotli far too much data goes over the wire — slower and costlier.", fix: "Enable Gzip or Brotli on the server/CDN." },
    scripts: { title: "Script count", why: "Each script may block rendering. Lots of scripts is a classic plugin-stacking symptom.", fix: "Bundle, defer or remove unnecessary plugins." },
    externalDomains: { title: "External domains", why: "Every external resource is an extra DNS lookup, connection and privacy/uptime dependency.", fix: "Self-host or remove external scripts where possible." },
    inlineCss: { title: "Inline styles", why: "Many inline style attributes signal page-builder output: hard to maintain and heavy.", fix: "Move to a central, reusable stylesheet." },
    title: { title: "Page title", why: "The <title> is what shows in Google and the browser tab. No title = no clickable result.", fix: "Set a unique, descriptive title per page." },
    titleLen: { title: "Title length", why: "Too short wastes space, too long is truncated in Google (±30–60 chars is ideal).", fix: "Rewrite to 30–60 chars with your key term first." },
    metaDesc: { title: "Meta description", why: "Without a description Google invents your snippet — rarely your strongest pitch.", fix: "Write a compelling 70–160 char meta description per page." },
    metaDescLen: { title: "Description length", why: "Too short = unconvincing; too long = truncated in results.", fix: "Aim for 70–165 characters." },
    h1: { title: "H1 headings", why: "Exactly one H1 tells Google and screen readers what the page is about.", fix: "One clear H1 per page; the rest as H2/H3." },
    canonical: { title: "Canonical tag", why: "Without canonical the same content under multiple URLs dilutes your SEO (duplicate content).", fix: "Add a rel=canonical to the preferred URL." },
    noindex: { title: "Indexability", why: "A noindex tag removes the page from Google entirely. Sometimes left on after launch by mistake.", fix: "Remove the noindex if the page should be findable." },
    og: { title: "Open Graph", why: "Without OG tags your link on WhatsApp/LinkedIn/Facebook gets a bland, unclickable preview.", fix: "Add og:title, og:description and og:image." },
    twitter: { title: "Twitter/X card", why: "Determines how your link shows on X. Small, but free extra visibility.", fix: "Add a twitter:card meta." },
    structuredData: { title: "Structured data", why: "JSON-LD gives Google rich results (stars, FAQ, business info). Without it you visually disappear.", fix: "Add Schema.org JSON-LD (Organization, FAQ, Product…)." },
    favicon: { title: "Favicon", why: "The small icon in the tab and bookmarks. Missing it makes the site look unfinished.", fix: "Add a favicon and apple-touch-icon." },
    imgAlt: { title: "Image alt text", why: "Alt text is crucial for blind visitors and for Google Images. Often missing entirely.", fix: "Descriptive alt text on every content image." },
    viewport: { title: "Mobile viewport", why: "Without a viewport meta the site doesn't scale on phones — unreadable for most of your traffic.", fix: "Add the viewport meta and make it responsive." },
    langAttr: { title: "Language attribute", why: "<html lang> helps screen readers, translation and Google determine the right language.", fix: "Set the lang attribute correctly per language version." },
    stack: { title: "Platform", why: "The underlying system determines speed, security and maintenance cost.", fix: "On a slow/closed platform: consider a rebuild you control yourself." },
    pluginBloat: { title: "Plugin stacking", why: "Every plugin is extra code, updates and a potential exploit. Many plugins = slow and vulnerable.", fix: "Drastically reduce plugins or rebuild functionality natively." },
    outdatedLib: { title: "Outdated libraries", why: "Old libraries (like old jQuery) have known, publicly documented security holes.", fix: "Update to a safe version or replace with modern code." },
    builderLockin: { title: "Platform lock-in", why: "On a closed DIY platform you don't own the code, data or pricing — moving away is costly.", fix: "Move to an open stack (your code, your hosting)." },
  },
};

type ModuleKey = "security" | "speed" | "seo" | "mobile" | "migration" | "rebuild" | "care";
const PRICE: Record<ModuleKey, number> = {
  security: 450,
  speed: 750,
  seo: 650,
  mobile: 550,
  migration: 1200,
  rebuild: 2500,
  care: 49,
};

const UI: Record<
  Locale,
  {
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
    modules: Record<ModuleKey, { name: string; desc: string }>;
    copyTpl: (h: string, s: number, g: string, st: string) => string;
  }
> = {
  nl: {
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
      if (!f.flags.modern && f.score < 60 && !f.flags.diyPlatform)
        lines.push("Kortom: wat je nu hebt, levert niet wat een site in 2026 hoort te leveren. Of dat 'oplichting' is hangt af van wat je ervoor betaalt — maar het kan beduidend beter, vaak voor minder dan je nu denkt.");
      if (lines.length === 0)
        lines.push("Niets alarmerends gevonden. Wat hieronder oranje of rood staat, is verbeterwerk — geen brand.");
      return lines.join(" ");
    },
    catTitle: "Score per categorie",
    cats: { speed: "Snelheid", seo: "SEO", mobile: "Mobiel", security: "Veiligheid", platform: "Platform" },
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
    modules: {
      security: { name: "Beveiligingspakket", desc: "HTTPS forceren, security-headers, versie-lek dichten, cookies hardenen." },
      speed: { name: "Snelheidsoptimalisatie", desc: "Caching, compressie, scripts opschonen, gewicht terugbrengen." },
      seo: { name: "SEO-fundament", desc: "Titels, meta's, koppenstructuur, Open Graph en gestructureerde data." },
      mobile: { name: "Mobiel & toegankelijkheid", desc: "Responsive viewport, alt-teksten, leesbaarheid op gsm." },
      migration: { name: "Migratie van content", desc: "Bestaande inhoud overzetten van WordPress/Wix/Squarespace." },
      rebuild: { name: "Volledige herbouw (Next.js)", desc: "Een nieuwe, snelle, veilige site die je zelf bezit." },
      care: { name: "Care-abonnement", desc: "Hosting, SSL, back-ups, updates en support." },
    },
    copyTpl: (h, s, g, st) =>
      `Doorlichting van ${h} (via studio-vm.be/scan)\nRapportcijfer: ${g} — ${s}/100\nPlatform: ${st}\n\nEen Studio VM-build mikt op 100/100. Bespreek: studio-vm.be`,
  },
  fr: {
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
      if (!f.flags.modern && f.score < 60 && !f.flags.diyPlatform)
        lines.push("Bref : ce que vous avez ne livre pas ce qu'un site devrait livrer en 2026. « Arnaque » ou non dépend du prix payé — mais c'est nettement améliorable.");
      if (lines.length === 0)
        lines.push("Rien d'alarmant. Ce qui est orange ou rouge ci-dessous, c'est de l'amélioration — pas un incendie.");
      return lines.join(" ");
    },
    catTitle: "Score par catégorie",
    cats: { speed: "Vitesse", seo: "SEO", mobile: "Mobile", security: "Sécurité", platform: "Plateforme" },
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
    modules: {
      security: { name: "Pack sécurité", desc: "Forcer HTTPS, en-têtes de sécurité, masquer la version, durcir les cookies." },
      speed: { name: "Optimisation vitesse", desc: "Cache, compression, nettoyage des scripts, réduction du poids." },
      seo: { name: "Fondation SEO", desc: "Titres, métas, structure de titres, Open Graph et données structurées." },
      mobile: { name: "Mobile & accessibilité", desc: "Viewport responsive, textes alt, lisibilité sur mobile." },
      migration: { name: "Migration du contenu", desc: "Transfert du contenu existant depuis WordPress/Wix/Squarespace." },
      rebuild: { name: "Reconstruction complète (Next.js)", desc: "Un nouveau site rapide et sûr, que vous possédez." },
      care: { name: "Abonnement Care", desc: "Hébergement, SSL, sauvegardes, mises à jour et support." },
    },
    copyTpl: (h, s, g, st) =>
      `Analyse de ${h} (via studio-vm.be/scan)\nNote : ${g} — ${s}/100\nPlateforme : ${st}\n\nUn build Studio VM vise 100/100. Discutons : studio-vm.be`,
  },
  en: {
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
      if (!f.flags.modern && f.score < 60 && !f.flags.diyPlatform)
        lines.push("In short: what you have doesn't deliver what a site should in 2026. Whether that's a 'rip-off' depends on what you pay — but it can be markedly better.");
      if (lines.length === 0)
        lines.push("Nothing alarming. What's amber or red below is improvement work — not a fire.");
      return lines.join(" ");
    },
    catTitle: "Score per category",
    cats: { speed: "Speed", seo: "SEO", mobile: "Mobile", security: "Security", platform: "Platform" },
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
    modules: {
      security: { name: "Security pack", desc: "Force HTTPS, security headers, close version leaks, harden cookies." },
      speed: { name: "Speed optimization", desc: "Caching, compression, script cleanup, weight reduction." },
      seo: { name: "SEO foundation", desc: "Titles, metas, heading structure, Open Graph and structured data." },
      mobile: { name: "Mobile & accessibility", desc: "Responsive viewport, alt text, readability on phones." },
      migration: { name: "Content migration", desc: "Move existing content off WordPress/Wix/Squarespace." },
      rebuild: { name: "Full rebuild (Next.js)", desc: "A new, fast, secure site that you own." },
      care: { name: "Care plan", desc: "Hosting, SSL, backups, updates and support." },
    },
    copyTpl: (h, s, g, st) =>
      `Scan of ${h} (via studio-vm.be/scan)\nGrade: ${g} — ${s}/100\nPlatform: ${st}\n\nA Studio VM build aims for 100/100. Let's talk: studio-vm.be`,
  },
};

const fmt = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "en" ? "en-IE" : locale === "fr" ? "fr-BE" : "nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

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

function Bar({ label, value, max, ideal }: { label: string; value: number; max: number; ideal?: [number, number] }) {
  const pct = Math.min(100, (value / max) * 100);
  const inIdeal = ideal ? value >= ideal[0] && value <= ideal[1] : true;
  const col = inIdeal ? "#16a34a" : value === 0 ? "#ef4444" : "#f59e0b";
  return (
    <div className="print-avoid-break">
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-xs text-muted">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }} />
      </div>
    </div>
  );
}

const SEV_ICON: Record<Severity, React.ReactNode> = {
  good: <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" strokeWidth={2.5} />,
  info: <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-500" strokeWidth={2} />,
  warning: <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" strokeWidth={2} />,
  critical: <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" strokeWidth={2.5} />,
};

export function SiteScanner() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = UI[locale];
  const f = FIND[locale];

  const [result, setResult] = useState<ScanResult | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  if (result && result.ok) {
    const r = result;
    const verdict =
      r.score >= 75 ? t.verdictGood : r.score >= 45 ? t.verdictOk : t.verdictBad;

    const grouped = r.technologies.reduce<Record<string, string[]>>((acc, x) => {
      (acc[x.type] ||= []).push(x.version ? `${x.name} ${x.version}` : x.name);
      return acc;
    }, {});

    const sevRank: Record<Severity, number> = { critical: 0, warning: 1, info: 2, good: 3 };
    const findingsSorted = [...r.findings].sort(
      (a, b) => sevRank[a.severity] - sevRank[b.severity],
    );

    // Stappenplan: modules afgeleid uit findings
    const cat = (c: string, sev: Severity[]) =>
      r.findings.some((x) => x.cat === c && sev.includes(x.severity));
    const need = {
      security: cat("security", ["critical", "warning"]),
      speed: cat("speed", ["critical", "warning"]),
      seo: cat("seo", ["critical", "warning"]),
      mobile: cat("mobile", ["critical", "warning"]),
      migration: r.flags.diyPlatform || r.stack === "WordPress",
    };
    const steps: ModuleKey[] = [];
    if (need.security) steps.push("security");
    if (need.speed) steps.push("speed");
    if (need.seo) steps.push("seo");
    if (need.mobile) steps.push("mobile");
    const fixesTotal = steps.reduce((s, k) => s + PRICE[k], 0);
    const recommendRebuild =
      r.flags.diyPlatform ||
      r.flags.outdated ||
      r.score < 55 ||
      steps.length >= 3;

    const host = r.host;
    const copySummary = async () => {
      try {
        await navigator.clipboard.writeText(t.copyTpl(host, r.score, r.grade, r.stack));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    };

    const Fact = ({ label, value }: { label: string; value: string }) => (
      <span>
        {label}: <strong className="text-foreground">{value}</strong>
      </span>
    );

    return (
      <div id="scan-report" className="space-y-7">
        <div className="print-only mb-4 border-b pb-3">
          <p className="text-lg font-bold">
            {t.reportFor} {host}
          </p>
          <p className="text-xs text-muted">
            {t.reportBy} ·{" "}
            {new Date().toLocaleDateString(
              locale === "en" ? "en-GB" : `${locale}-BE`,
            )}
          </p>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-8 text-center sm:flex-row sm:text-left print-avoid-break">
          <Ring score={r.score} grade={r.grade} />
          <div className="flex-1">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">{host}</p>
            <p className="mt-2 text-lg leading-relaxed">{verdict}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted">
              {r.hosting && <Fact label={t.factsHost} value={r.hosting} />}
              {r.builtBy && <Fact label={t.factsBuilt} value={r.builtBy} />}
              <Fact label={t.factsStack} value={r.stack} />
              {r.ip && <Fact label={t.factsIp} value={r.ip} />}
              <Fact label={t.factsSpeed} value={`${r.responseMs} ms`} />
              <Fact label={t.factsWeight} value={`${r.htmlKb} KB`} />
            </div>
          </div>
        </div>

        {/* Eerlijk oordeel */}
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 print-avoid-break">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 text-accent" strokeWidth={2} />
            {t.honestTitle}
          </p>
          <p className="mt-3 leading-relaxed">{t.honest(r)}</p>
        </div>

        {/* Categorie-scores */}
        <div className="rounded-2xl border bg-card p-6 print-avoid-break">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <GaugeIcon className="h-4 w-4" strokeWidth={2} />
            {t.catTitle}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {r.categories.map((c) => {
              const col = c.score >= 75 ? "#16a34a" : c.score >= 45 ? "#f59e0b" : "#ef4444";
              return (
                <div key={c.cat}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-xs font-medium">{t.cats[c.cat]}</span>
                    <span className="font-mono text-[11px] text-muted">{c.score}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: col }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Valkuilen */}
        <div className="rounded-2xl border bg-card p-6 print-avoid-break">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <AlertTriangle className="h-4 w-4" strokeWidth={2} />
            {t.pitfallTitle}
          </p>
          {r.pitfalls.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t.pitfallNone}</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {r.pitfalls.map((key, i) => {
                const fd = r.findings.find((x) => x.key === key);
                const txt = f[key];
                if (!fd || !txt) return null;
                return (
                  <li key={key} className="flex gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {txt.title}{" "}
                        <span className={fd.severity === "critical" ? "text-red-500" : "text-amber-500"}>
                          · {t.sev[fd.severity]}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{txt.why}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Alle bevindingen */}
        <div className="rounded-2xl border bg-card p-6">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <ListChecks className="h-4 w-4" strokeWidth={2} />
            {t.findingsTitle}
          </p>
          <div className="mt-4 divide-y divide-border">
            {findingsSorted.map((fd) => {
              const txt = f[fd.key];
              if (!txt) return null;
              return (
                <details key={fd.key} className="group py-3 print-avoid-break">
                  <summary className="flex cursor-pointer list-none items-start gap-3">
                    {SEV_ICON[fd.severity]}
                    <span className="flex-1">
                      <span className="text-sm font-semibold">{txt.title}</span>
                      {fd.value && (
                        <span className="ml-2 font-mono text-[11px] text-muted">
                          {t.measured}: {fd.value}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                      {t.sev[fd.severity]}
                    </span>
                  </summary>
                  <div className="mt-2 space-y-2 pl-7 text-xs leading-relaxed">
                    <p>
                      <span className="font-semibold text-foreground">{t.whyLabel}: </span>
                      <span className="text-muted">{txt.why}</span>
                    </p>
                    {fd.severity !== "good" && (
                      <p>
                        <span className="font-semibold text-accent">{t.fixLabel}: </span>
                        <span className="text-muted">{txt.fix}</span>
                      </p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>

        {/* Technologie */}
        <div className="rounded-2xl border bg-card p-6 print-avoid-break">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <Layers className="h-4 w-4" strokeWidth={2} />
            {t.techTitle}
          </p>
          {r.technologies.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t.techNone}</p>
          ) : (
            <div className="mt-5 space-y-4">
              {(Object.keys(grouped) as TechType[]).map((type) => (
                <div key={type}>
                  <p className="mb-2 text-xs font-semibold text-muted">{t.techTypes[type]}</p>
                  <div className="flex flex-wrap gap-2">
                    {grouped[type].map((n) => (
                      <span key={n} className="rounded-full border bg-background px-3 py-1 text-xs">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security headers + SEO detail */}
        <div className="grid gap-7 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 print-avoid-break">
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
              <Server className="h-4 w-4" strokeWidth={2} />
              {t.headersTitle}
            </p>
            <ul className="mt-4 space-y-2">
              {r.headers.map((hd) => (
                <li key={hd.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-xs">{t.headerNames[hd.key]}</span>
                  {hd.present ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> {t.present}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} /> {t.absent}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-card p-6 print-avoid-break">
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
              <Code2 className="h-4 w-4" strokeWidth={2} />
              {t.seoTitle}
            </p>
            <div className="mt-5 space-y-4">
              <Bar label={t.seoTitleLen} value={r.titleLen} max={80} ideal={[30, 65]} />
              <Bar label={t.seoDescLen} value={r.metaDescLen} max={200} ideal={[70, 165]} />
              <Bar label={t.seoH1} value={r.h1Count} max={Math.max(3, r.h1Count)} ideal={[1, 1]} />
              <Bar
                label={t.seoAlt}
                value={r.imgCount - r.imgMissingAlt}
                max={Math.max(1, r.imgCount)}
                ideal={[Math.max(1, r.imgCount), r.imgCount]}
              />
            </div>
          </div>
        </div>

        {/* Benchmark */}
        <div className="rounded-2xl border bg-card p-6 print-avoid-break">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">{t.benchTitle}</p>
          <div className="mt-5 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{t.benchYou}</span>
                <span className="font-mono text-xs text-muted">{r.score}/100</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: r.score >= 75 ? "#16a34a" : r.score >= 45 ? "#f59e0b" : "#ef4444" }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-accent">{t.benchSvm}</span>
                <span className="font-mono text-xs text-muted">100/100</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full" style={{ width: "100%", background: "var(--accent)" }} />
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">{t.benchNote}</p>
        </div>

        {/* Stappenplan + prijs */}
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 print-avoid-break">
          <p className="text-base font-semibold">{t.planTitle}</p>
          <p className="mt-2 text-sm text-muted">
            {steps.length ? t.planIntro : t.planNothing}
          </p>

          {steps.length > 0 && (
            <>
              <ol className="mt-5 space-y-3">
                {steps.map((k, i) => (
                  <li key={k} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {t.planStep} {i + 1}: {t.modules[k].name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{t.modules[k].desc}</p>
                    </div>
                    <span className="whitespace-nowrap font-mono text-sm font-semibold">
                      {fmt(PRICE[k], locale)}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold">{t.planTotal}</span>
                <span className="font-mono text-base font-bold">
                  {fmt(fixesTotal, locale)}{" "}
                  <span className="text-xs font-normal text-muted">{t.excl}</span>
                </span>
              </div>
            </>
          )}

          {recommendRebuild && (
            <div className="mt-5 rounded-xl border border-accent/40 bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t.planRebuild}</p>
                <span className="whitespace-nowrap font-mono text-sm font-bold">
                  {t.from} {fmt(PRICE.rebuild, locale)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">{t.planRebuildNote}</p>
            </div>
          )}

          <div className="mt-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{t.planCare}</p>
              <span className="whitespace-nowrap font-mono text-sm font-bold">
                {fmt(PRICE.care, locale)}
                <span className="text-xs font-normal text-muted"> / {t.perMonth}</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{t.planCareNote}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={localePath(locale, "/#contact")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t.ctaButton}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors hover:bg-card-hover"
            >
              <Printer className="h-4 w-4" strokeWidth={2} />
              {t.print}
            </button>
            <button
              type="button"
              onClick={copySummary}
              className="no-print inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors hover:bg-card-hover"
            >
              {copied ? (
                <ClipboardCheck className="h-4 w-4 text-accent" strokeWidth={2} />
              ) : (
                <Clipboard className="h-4 w-4" strokeWidth={2} />
              )}
              {copied ? t.copied : t.copy}
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="no-print inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors hover:bg-card-hover"
            >
              {t.again}
            </button>
          </div>
        </div>

        <p className="text-center font-mono text-[11px] text-muted">{t.disclaimer}</p>
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
