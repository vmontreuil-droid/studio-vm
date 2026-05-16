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
import { MonitorSignup } from "@/components/monitor-signup";

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
    scripts: { title: "Render-blokkerende scripts", why: "Externe scripts zonder defer/async houden het tekenen van de pagina op. Veel ervan = klassiek symptoom van plugin-stapeling.", fix: "Scripts bundelen, uitstellen (defer/async) of overbodige plugins schrappen." },
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
    deprecatedHtml: { title: "Verouderde HTML", why: "Tags als <center>, <font> of layout-tabellen wijzen op code uit een ander tijdperk: slecht voor mobiel, toegankelijkheid en onderhoud.", fix: "Hercoderen naar moderne, semantische HTML met CSS voor opmaak." },
    staleCopyright: { title: "Verouderd copyright-jaartal", why: "Een jaartal van enkele jaren terug onderaan de site doet bezoekers (en Google) vermoeden dat de zaak niet meer actief is — dat kost vertrouwen en klanten.", fix: "Het jaartal automatisch laten meelopen en de inhoud actueel houden." },
    httpsRedirect: { title: "HTTP → HTTPS-omleiding", why: "Wie http:// intikt, hoort automatisch naar de veilige https-versie gestuurd te worden. Gebeurt dat niet, dan blijft een onversleutelde versie bereikbaar.", fix: "Een permanente 301-redirect van http naar https instellen." },
    securityTxt: { title: "security.txt", why: "Een security.txt (RFC 9116) vertelt onderzoekers hoe ze een lek veilig kunnen melden. Professioneel, en steeds vaker verwacht.", fix: "Een /.well-known/security.txt met een contactadres plaatsen." },
    inlineHandlers: { title: "Inline JavaScript-handlers", why: "onclick=… rechtstreeks in de HTML maakt een strikte CSP onmogelijk en is een klassieke XSS-vergroter.", fix: "Event-handlers in een apart script zetten i.p.v. inline." },
    consentBanner: { title: "Cookie-/consent-banner", why: "Laad je tracking of externe scripts zonder geldige toestemming, dan overtreed je de GDPR/AVG — met boeterisico.", fix: "Een consent-banner plaatsen die scripts pas na toestemming laadt." },
    robotsTxt: { title: "robots.txt", why: "Zonder robots.txt mis je sturing voor zoekmachines; een verkeerde 'Disallow: /' houdt je hele site uit Google.", fix: "Een correcte robots.txt plaatsen die naar je sitemap verwijst." },
    sitemapXml: { title: "XML-sitemap", why: "Een sitemap helpt Google al je pagina's snel en volledig te vinden. Zonder, blijft diepe inhoud soms onontdekt.", fix: "Een sitemap.xml genereren en in robots.txt + Search Console aanmelden." },
    soft404: { title: "Soft-404", why: "Een onbestaande pagina die toch '200 OK' teruggeeft verwart Google en laat fouten ongemerkt — slecht voor SEO én UX.", fix: "Echte 404-statuscodes teruggeven voor onbestaande pagina's." },
    headingOrder: { title: "Koppenhiërarchie", why: "Een sprong van H1 naar H3 verwart screenreaders en zwakt je SEO-structuur af.", fix: "Koppen logisch nesten: H1 → H2 → H3, zonder niveaus over te slaan." },
    thinContent: { title: "Dunne inhoud", why: "Erg weinig tekst geeft Google nauwelijks iets om op te ranken en bezoekers weinig reden om te blijven.", fix: "Substantiële, waardevolle inhoud toevoegen per pagina." },
    cacheHeaders: { title: "Cache-headers", why: "Zonder Cache-Control/ETag laadt elke bezoeker alles opnieuw — trager en duurder in bandbreedte.", fix: "Verstandige Cache-Control- en validatie-headers instellen." },
    renderBlockingCss: { title: "Render-blokkerende CSS", why: "Veel stylesheets in de <head> stellen het eerste zichtbare beeld uit — direct voelbaar als 'traag'.", fix: "CSS bundelen, kritieke CSS inline en de rest uitgesteld laden." },
    responsiveImg: { title: "Responsieve afbeeldingen", why: "Zonder srcset/<picture> krijgt een gsm dezelfde zware desktopfoto's — onnodig databverbruik en traagheid.", fix: "srcset en moderne formaten (WebP/AVIF) gebruiken." },
    lazyImg: { title: "Lazy-loading", why: "Alle afbeeldingen meteen laden vertraagt de eerste indruk, ook voor beelden die nog niet in beeld zijn.", fix: "loading=\"lazy\" toepassen op afbeeldingen onder de vouw." },
    linkText: { title: "Lege links", why: "Links zonder tekst of label zijn onbruikbaar met een screenreader en geven Google geen context.", fix: "Elke link beschrijvende tekst of een aria-label geven." },
    spf: { title: "SPF (mail-spoofing)", why: "Zonder SPF-record kan iemand e-mails versturen die lijken te komen van jouw domein — phishing in jouw naam, en je eigen mails belanden vaker in spam.", fix: "Een SPF TXT-record instellen dat enkel je echte mailservers toelaat." },
    dmarc: { title: "DMARC (mail-spoofing)", why: "Zonder DMARC negeren ontvangers SPF/DKIM-fouten. Je domein is dan vrij te misbruiken voor nepmails aan je klanten.", fix: "Een _dmarc TXT-record toevoegen (start met p=none om te monitoren)." },
    caaRecord: { title: "CAA-record", why: "Een CAA-record bepaalt wélke certificaatautoriteiten een certificaat voor je domein mogen uitgeven — extra slot op je SSL.", fix: "Een CAA-record toevoegen voor je gebruikte certificaatautoriteit." },
    mxRecord: { title: "MX-record", why: "Zonder MX kan je domein geen e-mail ontvangen. Soms bewust (alleen website), soms een vergeten configuratie.", fix: "MX-records instellen als je op dit domein mail wil ontvangen." },
    ipv6: { title: "IPv6-bereikbaarheid", why: "Een groeiend deel van het internet is IPv6. Zonder AAAA-record zijn die bezoekers afhankelijk van vertragende tussenstappen.", fix: "Een AAAA-record toevoegen of een host kiezen die IPv6 ondersteunt." },
    tlsExpiry: { title: "Certificaat-vervaldatum", why: "Een verlopen SSL-certificaat zet bezoekers voor een grote rode waarschuwing — instant verlies van vertrouwen en omzet.", fix: "Automatische vernieuwing instellen (Let's Encrypt verlengt zichzelf)." },
    tlsProtocol: { title: "TLS-protocolversie", why: "Oude TLS-versies (1.0/1.1) zijn gebroken en worden door browsers geweigerd. Enkel TLS 1.2/1.3 is nog veilig.", fix: "Server zo configureren dat enkel TLS 1.2 en 1.3 worden aangeboden." },
    brokenLinks: { title: "Dode links", why: "Links naar onbestaande pagina's frustreren bezoekers en laten Google twijfelen aan de kwaliteit van je hele site.", fix: "De gebroken links herstellen of laten doorverwijzen (301)." },
    crossPage: { title: "Subpagina's nagekeken", why: "We keken niet enkel naar je homepage: ontbreekt op binnenpagina's een titel of H1, dan lekt SEO-waarde over de hele site weg.", fix: "Elke pagina een unieke titel en één duidelijke H1 geven." },
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
    scripts: { title: "Scripts bloquants", why: "Les scripts externes sans defer/async retardent l'affichage de la page. Beaucoup = symptôme classique d'empilement de plugins.", fix: "Regrouper, différer (defer/async) ou supprimer les plugins superflus." },
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
    deprecatedHtml: { title: "HTML obsolète", why: "Des balises comme <center>, <font> ou des tableaux de mise en page trahissent du code d'une autre époque : mauvais pour le mobile, l'accessibilité et la maintenance.", fix: "Recoder en HTML moderne et sémantique avec du CSS pour la mise en forme." },
    staleCopyright: { title: "Année de copyright périmée", why: "Une année de plusieurs ans en pied de page fait croire aux visiteurs (et à Google) que l'activité n'est plus active — cela coûte de la confiance.", fix: "Faire défiler l'année automatiquement et garder le contenu à jour." },
    httpsRedirect: { title: "Redirection HTTP → HTTPS", why: "Qui tape http:// doit être renvoyé automatiquement vers la version sécurisée https. Sinon, une version non chiffrée reste accessible.", fix: "Mettre une redirection 301 permanente de http vers https." },
    securityTxt: { title: "security.txt", why: "Un security.txt (RFC 9116) indique aux chercheurs comment signaler une faille en toute sécurité. Professionnel et de plus en plus attendu.", fix: "Placer un /.well-known/security.txt avec une adresse de contact." },
    inlineHandlers: { title: "Gestionnaires JS inline", why: "onclick=… directement dans le HTML rend une CSP stricte impossible et amplifie le XSS.", fix: "Mettre les gestionnaires d'événements dans un script séparé." },
    consentBanner: { title: "Bannière de consentement", why: "Charger du tracking ou des scripts externes sans consentement valable enfreint le RGPD — avec risque d'amende.", fix: "Placer une bannière qui ne charge les scripts qu'après consentement." },
    robotsTxt: { title: "robots.txt", why: "Sans robots.txt, pas de pilotage pour les moteurs ; un mauvais 'Disallow: /' retire tout votre site de Google.", fix: "Placer un robots.txt correct qui pointe vers votre sitemap." },
    sitemapXml: { title: "Sitemap XML", why: "Un sitemap aide Google à trouver toutes vos pages vite et complètement. Sans, le contenu profond reste parfois invisible.", fix: "Générer un sitemap.xml et le déclarer dans robots.txt + Search Console." },
    soft404: { title: "Soft-404", why: "Une page inexistante qui renvoie '200 OK' trouble Google et masque les erreurs — mauvais pour le SEO et l'UX.", fix: "Renvoyer un vrai code 404 pour les pages inexistantes." },
    headingOrder: { title: "Hiérarchie des titres", why: "Un saut de H1 à H3 trouble les lecteurs d'écran et affaiblit votre structure SEO.", fix: "Imbriquer les titres logiquement : H1 → H2 → H3, sans sauter de niveau." },
    thinContent: { title: "Contenu mince", why: "Très peu de texte donne peu à Google pour classer et peu de raisons de rester aux visiteurs.", fix: "Ajouter un contenu substantiel et utile par page." },
    cacheHeaders: { title: "En-têtes de cache", why: "Sans Cache-Control/ETag, chaque visiteur recharge tout — plus lent et plus coûteux en bande passante.", fix: "Définir des en-têtes Cache-Control et de validation pertinents." },
    renderBlockingCss: { title: "CSS bloquant le rendu", why: "Beaucoup de feuilles de style dans le <head> retardent le premier affichage — ressenti comme « lent ».", fix: "Regrouper le CSS, inliner le CSS critique et différer le reste." },
    responsiveImg: { title: "Images responsives", why: "Sans srcset/<picture>, un mobile reçoit les mêmes photos lourdes que le desktop — données et lenteur inutiles.", fix: "Utiliser srcset et des formats modernes (WebP/AVIF)." },
    lazyImg: { title: "Lazy-loading", why: "Charger toutes les images d'emblée ralentit la première impression, même pour ce qui n'est pas encore visible.", fix: "Appliquer loading=\"lazy\" aux images sous la ligne de flottaison." },
    linkText: { title: "Liens vides", why: "Des liens sans texte ni libellé sont inutilisables au lecteur d'écran et ne donnent aucun contexte à Google.", fix: "Donner à chaque lien un texte descriptif ou un aria-label." },
    spf: { title: "SPF (usurpation mail)", why: "Sans enregistrement SPF, n'importe qui peut envoyer des e-mails qui semblent venir de votre domaine — phishing en votre nom, et vos propres mails finissent plus souvent en spam.", fix: "Définir un enregistrement TXT SPF n'autorisant que vos vrais serveurs mail." },
    dmarc: { title: "DMARC (usurpation mail)", why: "Sans DMARC, les destinataires ignorent les erreurs SPF/DKIM. Votre domaine est librement exploitable pour de faux mails à vos clients.", fix: "Ajouter un enregistrement TXT _dmarc (commencez par p=none pour surveiller)." },
    caaRecord: { title: "Enregistrement CAA", why: "Un enregistrement CAA détermine quelles autorités peuvent émettre un certificat pour votre domaine — un verrou de plus sur votre SSL.", fix: "Ajouter un enregistrement CAA pour l'autorité de certification utilisée." },
    mxRecord: { title: "Enregistrement MX", why: "Sans MX, votre domaine ne peut pas recevoir d'e-mails. Parfois voulu, parfois une config oubliée.", fix: "Configurer des enregistrements MX si vous voulez recevoir du mail sur ce domaine." },
    ipv6: { title: "Accessibilité IPv6", why: "Une part croissante d'Internet est en IPv6. Sans AAAA, ces visiteurs dépendent d'étapes intermédiaires plus lentes.", fix: "Ajouter un enregistrement AAAA ou choisir un hébergeur compatible IPv6." },
    tlsExpiry: { title: "Expiration du certificat", why: "Un certificat SSL expiré place les visiteurs devant un grand avertissement rouge — perte instantanée de confiance et de chiffre.", fix: "Activer le renouvellement automatique (Let's Encrypt se renouvelle seul)." },
    tlsProtocol: { title: "Version du protocole TLS", why: "Les vieilles versions TLS (1.0/1.1) sont cassées et refusées par les navigateurs. Seul TLS 1.2/1.3 est encore sûr.", fix: "Configurer le serveur pour ne proposer que TLS 1.2 et 1.3." },
    brokenLinks: { title: "Liens morts", why: "Des liens vers des pages inexistantes frustrent les visiteurs et font douter Google de la qualité de tout le site.", fix: "Réparer les liens cassés ou les rediriger (301)." },
    crossPage: { title: "Sous-pages vérifiées", why: "Nous n'avons pas regardé que votre page d'accueil : s'il manque un titre ou un H1 sur des pages internes, la valeur SEO fuit sur tout le site.", fix: "Donner à chaque page un titre unique et un seul H1 clair." },
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
    scripts: { title: "Render-blocking scripts", why: "External scripts without defer/async hold up page rendering. Many of them is a classic plugin-stacking symptom.", fix: "Bundle, defer/async or remove unnecessary plugins." },
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
    deprecatedHtml: { title: "Outdated HTML", why: "Tags like <center>, <font> or layout tables signal code from another era: bad for mobile, accessibility and maintenance.", fix: "Recode to modern, semantic HTML with CSS for styling." },
    staleCopyright: { title: "Stale copyright year", why: "A year several years old in the footer makes visitors (and Google) suspect the business is no longer active — that costs trust.", fix: "Auto-roll the year and keep content current." },
    httpsRedirect: { title: "HTTP → HTTPS redirect", why: "Anyone typing http:// should be sent automatically to the secure https version. If not, an unencrypted version stays reachable.", fix: "Set a permanent 301 redirect from http to https." },
    securityTxt: { title: "security.txt", why: "A security.txt (RFC 9116) tells researchers how to report a flaw safely. Professional, and increasingly expected.", fix: "Place a /.well-known/security.txt with a contact address." },
    inlineHandlers: { title: "Inline JS handlers", why: "onclick=… directly in HTML makes a strict CSP impossible and is a classic XSS amplifier.", fix: "Move event handlers into a separate script instead of inline." },
    consentBanner: { title: "Cookie/consent banner", why: "Loading tracking or external scripts without valid consent breaches GDPR — with fine risk.", fix: "Add a consent banner that loads scripts only after consent." },
    robotsTxt: { title: "robots.txt", why: "Without robots.txt there's no search-engine steering; a wrong 'Disallow: /' removes your whole site from Google.", fix: "Place a correct robots.txt that points to your sitemap." },
    sitemapXml: { title: "XML sitemap", why: "A sitemap helps Google find all your pages fast and fully. Without it, deep content sometimes stays undiscovered.", fix: "Generate a sitemap.xml and declare it in robots.txt + Search Console." },
    soft404: { title: "Soft 404", why: "A non-existent page that still returns '200 OK' confuses Google and hides errors — bad for SEO and UX.", fix: "Return real 404 status codes for non-existent pages." },
    headingOrder: { title: "Heading hierarchy", why: "A jump from H1 to H3 confuses screen readers and weakens your SEO structure.", fix: "Nest headings logically: H1 → H2 → H3, without skipping levels." },
    thinContent: { title: "Thin content", why: "Very little text gives Google little to rank and visitors little reason to stay.", fix: "Add substantial, valuable content per page." },
    cacheHeaders: { title: "Cache headers", why: "Without Cache-Control/ETag every visitor reloads everything — slower and costlier in bandwidth.", fix: "Set sensible Cache-Control and validation headers." },
    renderBlockingCss: { title: "Render-blocking CSS", why: "Many stylesheets in the <head> delay the first visible paint — directly felt as 'slow'.", fix: "Bundle CSS, inline critical CSS and defer the rest." },
    responsiveImg: { title: "Responsive images", why: "Without srcset/<picture> a phone gets the same heavy desktop photos — needless data and slowness.", fix: "Use srcset and modern formats (WebP/AVIF)." },
    lazyImg: { title: "Lazy-loading", why: "Loading all images at once slows the first impression, even for images not yet in view.", fix: "Apply loading=\"lazy\" to below-the-fold images." },
    linkText: { title: "Empty links", why: "Links without text or label are unusable with a screen reader and give Google no context.", fix: "Give every link descriptive text or an aria-label." },
    spf: { title: "SPF (mail spoofing)", why: "Without an SPF record anyone can send emails that look like they come from your domain — phishing in your name, and your own mail lands in spam more often.", fix: "Set an SPF TXT record allowing only your real mail servers." },
    dmarc: { title: "DMARC (mail spoofing)", why: "Without DMARC, receivers ignore SPF/DKIM failures. Your domain is then free to abuse for fake mail to your customers.", fix: "Add a _dmarc TXT record (start with p=none to monitor)." },
    caaRecord: { title: "CAA record", why: "A CAA record controls which certificate authorities may issue a certificate for your domain — an extra lock on your SSL.", fix: "Add a CAA record for the certificate authority you use." },
    mxRecord: { title: "MX record", why: "Without MX your domain cannot receive email. Sometimes intentional, sometimes a forgotten config.", fix: "Set MX records if you want to receive mail on this domain." },
    ipv6: { title: "IPv6 reachability", why: "A growing share of the internet is IPv6. Without an AAAA record those visitors depend on slower intermediaries.", fix: "Add an AAAA record or pick a host that supports IPv6." },
    tlsExpiry: { title: "Certificate expiry", why: "An expired SSL certificate shows visitors a big red warning — instant loss of trust and revenue.", fix: "Enable automatic renewal (Let's Encrypt renews itself)." },
    tlsProtocol: { title: "TLS protocol version", why: "Old TLS versions (1.0/1.1) are broken and rejected by browsers. Only TLS 1.2/1.3 is still safe.", fix: "Configure the server to offer only TLS 1.2 and 1.3." },
    brokenLinks: { title: "Dead links", why: "Links to non-existent pages frustrate visitors and make Google doubt the quality of your whole site.", fix: "Fix the broken links or redirect them (301)." },
    crossPage: { title: "Sub-pages checked", why: "We didn't only look at your homepage: if inner pages miss a title or H1, SEO value leaks across the whole site.", fix: "Give every page a unique title and one clear H1." },
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
        base_pro: { name: "Volwaardige site (Pro)", desc: "Meerdere secties, eigen admin om alles zelf te wijzigen." },
        base_webshop: { name: "Webshop", desc: "Volledige shop (Mollie/Stripe), voorraad, bestellingen-admin." },
        multilingual: { name: "Meertalig", desc: "Zelfde inhoud, nette taalswitch + hreflang voor SEO." },
        forms: { name: "Formulieren + opvolging", desc: "Contact/offerte-formulieren met spamfilter en mailopvolging." },
        booking: { name: "Reservatiemodule", desc: "Afspraken/boekingen met agenda en bevestigingsmails." },
        blog: { name: "Blog / nieuws-CMS", desc: "Eigen redactie-omgeving voor artikels — zonder WordPress." },
        members: { name: "Ledenzone", desc: "Afgeschermd gedeelte met logins en rollen." },
        content: { name: "Contentmigratie", desc: "Bestaande pagina's overgezet, geschaald op de omvang van je site." },
        seoPreserve: { name: "SEO-behoud & redirects", desc: "Volledig 301-plan + sitemap zodat je niet terugvalt in Google." },
        photoshoot: { name: "Fotoshoot / beeldmateriaal", desc: "Geen eigen foto's? Een halve dag professionele shoot van je zaak, producten of team — bewerkt en webklaar." },
      },
      base: "Vertrekpunt",
      addons: "Op maat van wat je hebt",
      total: "Totale richtprijs",
      approx: "indicatief, exacte offerte na een kort gesprek",
      timeline: "Doorlooptijd",
      weeks: (a, b) => `±${a}–${b} weken`,
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
        base_pro: { name: "Site complet (Pro)", desc: "Plusieurs sections, admin pour tout modifier vous-même." },
        base_webshop: { name: "Boutique", desc: "Boutique complète (Mollie/Stripe), stock, admin commandes." },
        multilingual: { name: "Multilingue", desc: "Même contenu, bascule de langue propre + hreflang SEO." },
        forms: { name: "Formulaires + suivi", desc: "Formulaires contact/devis avec anti-spam et suivi mail." },
        booking: { name: "Module de réservation", desc: "Rendez-vous/réservations avec agenda et confirmations." },
        blog: { name: "CMS blog / actus", desc: "Environnement de rédaction propre — sans WordPress." },
        members: { name: "Espace membres", desc: "Zone protégée avec logins et rôles." },
        content: { name: "Migration du contenu", desc: "Pages existantes transférées, dimensionné selon la taille du site." },
        seoPreserve: { name: "Préservation SEO & redirections", desc: "Plan 301 complet + sitemap pour ne pas chuter dans Google." },
        photoshoot: { name: "Shooting photo / visuels", desc: "Pas de photos exploitables ? Une demi-journée de shooting pro de votre activité, produits ou équipe — retouché et prêt pour le web." },
      },
      base: "Point de départ",
      addons: "Sur mesure selon l'existant",
      total: "Estimation totale",
      approx: "indicatif, devis exact après un bref échange",
      timeline: "Délai",
      weeks: (a, b) => `±${a}–${b} semaines`,
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
        base_pro: { name: "Full site (Pro)", desc: "Multiple sections, own admin to edit everything yourself." },
        base_webshop: { name: "Webshop", desc: "Full shop (Mollie/Stripe), stock, orders admin." },
        multilingual: { name: "Multilingual", desc: "Same content, clean language switch + hreflang for SEO." },
        forms: { name: "Forms + follow-up", desc: "Contact/quote forms with spam filter and mail follow-up." },
        booking: { name: "Booking module", desc: "Appointments/bookings with calendar and confirmations." },
        blog: { name: "Blog / news CMS", desc: "Own editorial environment for articles — without WordPress." },
        members: { name: "Member area", desc: "Gated section with logins and roles." },
        content: { name: "Content migration", desc: "Existing pages moved over, scaled to your site's size." },
        seoPreserve: { name: "SEO preservation & redirects", desc: "Full 301 plan + sitemap so you don't drop in Google." },
        photoshoot: { name: "Photo shoot / visuals", desc: "No usable photos? A half-day professional shoot of your business, products or team — edited and web-ready." },
      },
      base: "Starting point",
      addons: "Tailored to what you have",
      total: "Total estimate",
      approx: "indicative, exact quote after a short chat",
      timeline: "Timeline",
      weeks: (a, b) => `±${a}–${b} weeks`,
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

export function SiteScanner({
  monitorEnabled = false,
}: {
  monitorEnabled?: boolean;
}) {
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

    // Plan: herbouw-eerst, afgeleid uit de gedetecteerde inventaris
    const inv = r.inventory;
    const pages = inv.pages;
    const bucket: "small" | "medium" | "large" | "xl" =
      pages == null
        ? "medium"
        : pages <= 8
          ? "small"
          : pages <= 30
            ? "medium"
            : pages <= 80
              ? "large"
              : "xl";
    const contentPrice =
      pages == null
        ? 100
        : pages <= 10
          ? 100
          : pages <= 30
            ? 250
            : pages <= 80
              ? 450
              : 700;
    const baseKey: "base_webshop" | "base_pro" | "base_starter" = inv.shop
      ? "base_webshop"
      : inv.members || bucket === "xl" || (inv.multilingual && bucket === "large")
        ? "base_pro"
        : bucket === "small" && !inv.booking && !inv.members
          ? "base_starter"
          : "base_pro";
    const basePrice =
      baseKey === "base_webshop" ? 3900 : baseKey === "base_pro" ? 1900 : 950;
    const addons: { key: string; price: number }[] = [];
    if (inv.multilingual) addons.push({ key: "multilingual", price: 350 });
    if (inv.forms) addons.push({ key: "forms", price: 200 });
    if (inv.booking) addons.push({ key: "booking", price: 600 });
    if (inv.blog) addons.push({ key: "blog", price: 350 });
    if (inv.members) addons.push({ key: "members", price: 900 });
    addons.push({ key: "content", price: contentPrice });
    addons.push({ key: "seoPreserve", price: 250 });
    const oneOffLow =
      basePrice + addons.reduce((s, a) => s + a.price, 0);
    const oneOffHigh = Math.round((oneOffLow * 1.2) / 50) * 50;
    let wk =
      baseKey === "base_webshop" ? 7 : baseKey === "base_pro" ? 5 : 3;
    if (inv.multilingual) wk += 1;
    if (inv.booking) wk += 1;
    if (inv.members) wk += 2;
    if (bucket === "large" || bucket === "xl") wk += 2;
    const weeksRange: [number, number] = [wk, wk + 2];
    const pl = t.plan;
    const featChips: string[] = [];
    if (pages != null) featChips.push(`~${pages} ${pl.feat.pages}`);
    if (inv.shop) featChips.push(pl.feat.shop);
    if (inv.multilingual) featChips.push(pl.feat.multilingual);
    if (inv.forms) featChips.push(pl.feat.forms);
    if (inv.booking) featChips.push(pl.feat.booking);
    if (inv.blog) featChips.push(pl.feat.blog);
    if (inv.members) featChips.push(pl.feat.members);
    if (inv.mediaHeavy) featChips.push(pl.feat.mediaHeavy);
    if (inv.pageBuilder) featChips.push(pl.feat.pageBuilder);

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

        {/* Core Web Vitals risico */}
        <div className="rounded-2xl border bg-card p-6 print-avoid-break">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <GaugeIcon className="h-4 w-4" strokeWidth={2} />
            {t.cwvTitle}
          </p>
          <div className="mt-5 flex items-center gap-4">
            <span
              className="rounded-full px-3 py-1 text-sm font-semibold"
              style={{
                background:
                  r.cwvRisk === "low"
                    ? "rgba(22,163,74,0.15)"
                    : r.cwvRisk === "medium"
                      ? "rgba(245,158,11,0.15)"
                      : "rgba(239,68,68,0.15)",
                color:
                  r.cwvRisk === "low"
                    ? "#16a34a"
                    : r.cwvRisk === "medium"
                      ? "#b45309"
                      : "#ef4444",
              }}
            >
              {t.cwvLabels[r.cwvRisk]}
            </span>
            <div className="flex flex-1 gap-1.5">
              {(["low", "medium", "high"] as const).map((lvl, i) => {
                const active =
                  (r.cwvRisk === "low" && i === 0) ||
                  (r.cwvRisk === "medium" && i <= 1) ||
                  r.cwvRisk === "high";
                const col = i === 0 ? "#16a34a" : i === 1 ? "#f59e0b" : "#ef4444";
                return (
                  <div
                    key={lvl}
                    className="h-2.5 flex-1 rounded-full"
                    style={{ background: active ? col : "var(--border)" }}
                  />
                );
              })}
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">{t.cwvNote}</p>
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

        {/* Domein, mail & certificaat */}
        {(r.tls || r.dns) && (
          <div className="rounded-2xl border bg-card p-6 print-avoid-break">
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              {t.domain.title}
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {r.tls && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted">
                    {t.domain.cert}
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex justify-between gap-2">
                      <span className="text-muted">{t.domain.issuer}</span>
                      <strong>{r.tls.issuer || t.domain.na}</strong>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span className="text-muted">{t.domain.expires}</span>
                      <strong
                        className={
                          r.tls.daysLeft !== null && r.tls.daysLeft < 21
                            ? "text-red-500"
                            : ""
                        }
                      >
                        {r.tls.daysLeft !== null
                          ? `${r.tls.daysLeft} ${t.domain.days}`
                          : t.domain.na}
                      </strong>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span className="text-muted">{t.domain.protocol}</span>
                      <strong>{r.tls.protocol || t.domain.na}</strong>
                    </li>
                  </ul>
                </div>
              )}
              {r.dns && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted">
                    {t.domain.mail} / DNS
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {(
                      [
                        ["spf", r.dns.spf],
                        ["dmarc", r.dns.dmarc],
                        ["ipv6", r.dns.ipv6],
                      ] as const
                    ).map(([k, v]) => (
                      <li key={k} className="flex justify-between gap-2">
                        <span className="text-muted">{t.domain[k]}</span>
                        <strong
                          className={
                            v
                              ? "text-green-600 dark:text-green-400"
                              : k === "ipv6"
                                ? ""
                                : "text-red-500"
                          }
                        >
                          {v ? t.domain.yes : t.domain.no}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {r.brokenLinks.length > 0 && (
              <div className="mt-5 border-t pt-4">
                <p className="mb-2 text-xs font-semibold text-red-500">
                  {f.brokenLinks.title} ({r.brokenLinks.length})
                </p>
                <ul className="space-y-1 font-mono text-xs text-muted">
                  {r.brokenLinks.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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
          <p className="text-lg font-semibold">{pl.title(r.stack)}</p>
          <p className="mt-3 leading-relaxed">{pl.why(r.stack, r.score)}</p>

          <div className="mt-6 rounded-xl border bg-card p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {pl.haveTitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {featChips.length === 0 ? (
                <span className="text-sm text-muted">{r.stack}</span>
              ) : (
                featChips.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border bg-background px-3 py-1 text-xs"
                  >
                    {c}
                  </span>
                ))
              )}
              {r.technologies.filter((x) => x.type === "plugin").length > 0 && (
                <span className="rounded-full border bg-background px-3 py-1 text-xs">
                  {r.technologies.filter((x) => x.type === "plugin").length}{" "}
                  {pl.feat.plugins}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl border bg-card p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {pl.phasesTitle}
            </p>
            <ol className="mt-4 space-y-3">
              {pl.phases.map((ph, i) => (
                <li key={ph.t} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{ph.t}</p>
                    <p className="mt-0.5 text-xs text-muted">{ph.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-5 rounded-xl border bg-card p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {pl.buildTitle}
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start justify-between gap-3 border-b pb-2">
                <div>
                  <p className="text-sm font-semibold">
                    {pl.base}: {pl.mod[baseKey].name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {pl.mod[baseKey].desc}
                  </p>
                </div>
                <span className="whitespace-nowrap font-mono text-sm font-semibold">
                  {fmt(basePrice, locale)}
                </span>
              </li>
              {addons.map((a) => (
                <li
                  key={a.key}
                  className="flex items-start justify-between gap-3 border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {pl.mod[a.key].name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {pl.mod[a.key].desc}
                    </p>
                  </div>
                  <span className="whitespace-nowrap font-mono text-sm font-semibold">
                    {fmt(a.price, locale)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t pt-4">
              <div>
                <p className="text-sm font-semibold">{pl.total}</p>
                <p className="font-mono text-[11px] text-muted">
                  {pl.approx} · {t.excl}
                </p>
              </div>
              <span className="font-mono text-xl font-bold">
                {fmt(oneOffLow, locale)} – {fmt(oneOffHigh, locale)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
              <span className="font-semibold">{pl.timeline}</span>
              <span className="font-mono">
                {pl.weeks(weeksRange[0], weeksRange[1])}
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-dashed bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{pl.optTitle}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {pl.mod.photoshoot.name} — {pl.mod.photoshoot.desc}
                </p>
              </div>
              <span className="whitespace-nowrap font-mono text-sm font-semibold">
                {fmt(450, locale)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">{pl.optNote}</p>
          </div>

          <div className="mt-3 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{pl.careTitle}</p>
              <span className="whitespace-nowrap font-mono text-sm font-bold">
                {fmt(PRICE.care, locale)}
                <span className="text-xs font-normal text-muted">
                  {" "}
                  / {t.perMonth}
                </span>
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">{pl.careNote}</p>
          </div>

          <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm font-medium text-accent">
            {pl.own}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={localePath(locale, "/#contact")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {pl.cta}
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

        {monitorEnabled && <MonitorSignup url={host} locale={locale} />}

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
