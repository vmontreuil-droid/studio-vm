// Cookieverklaring: de tekst staat enkel hier. Gebruikt door de publieke
// pagina (/cookies) en door het klantenportaal (/portail/dashboard/cookies).
import type { Locale } from "@/lib/i18n/config";
import type { TocItem } from "@/components/inhoud-toc";

export type CookiesTekst = {
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  updated: string;
  shortTitle: string;
  shortBody: string;
  tableTitle: string;
  cols: { name: string; purpose: string; duration: string; type: string };
  rows: { name: string; purpose: string; duration: string; type: string }[];
  removeTitle: string;
  removeBody: string;
  analyticsTitle: string;
  analyticsBody: string;
};

export const COOKIES: Record<Locale, CookiesTekst> = {
  nl: {
    meta: {
      title: "Cookieverklaring | Studio VM",
      description:
        "Welke cookies en lokale opslag studio-vm.be gebruikt, waarvoor ze dienen, hoelang ze bewaard blijven en hoe u ze zelf verwijdert in uw browser.",
    },
    eyebrow: "Cookies",
    title: "Cookieverklaring",
    updated: "Laatst bijgewerkt",
    shortTitle: "Korte versie",
    shortBody:
      "We gebruiken geen tracking-cookies, geen advertentie-cookies, geen third-party trackers. Wat we wel gebruiken zijn enkele functionele waarden die uw voorkeuren onthouden, zoals uw taal en thema. Meldt u zich aan in het klantenportaal, dan houdt een aanmeldcookie u aangemeld. De localStorage-waarden blijven uitsluitend in uw browser.",
    tableTitle: "Wat staat er opgeslagen?",
    cols: { name: "Naam", purpose: "Doel", duration: "Bewaartijd", type: "Type" },
    rows: [
      { name: "studio-vm-cookie-consent", purpose: "Onthoudt of u de cookiebanner gezien hebt.", duration: "Tot u het wist", type: "Functioneel (localStorage)" },
      { name: "locale", purpose: "Onthoudt uw taalkeuze.", duration: "1 jaar", type: "Functioneel (cookie)" },
      { name: "theme", purpose: "Onthoudt uw licht/donker-voorkeur.", duration: "Tot u ze wist", type: "Functioneel (localStorage)" },
      { name: "vm_portal_rail", purpose: "Onthoudt of de zijbalk van het klantenportaal in- of uitgeklapt is.", duration: "Tot u het wist", type: "Functioneel (localStorage)" },
      { name: "sb-…-auth-token", purpose: "Houdt u aangemeld in het klantenportaal. Wordt enkel gezet wanneer u zich aanmeldt.", duration: "Tot u zich afmeldt, hoogstens 400 dagen na uw laatste bezoek", type: "Strikt noodzakelijk (cookie)" },
    ],
    removeTitle: "Hoe verwijdert u ze?",
    removeBody:
      "Open de instellingen van uw browser → Privacy → Sitegegevens verwijderen voor studio-vm.be. Dat wist alle lokale data.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "We gebruiken privacy-vriendelijke analytics. Geen cookies, geen persoonlijke identificatoren — enkel geanonimiseerde paginabezoeken.",
  },
  fr: {
    meta: {
      title: "Déclaration relative aux cookies | Studio VM",
      description:
        "Quels cookies et quel stockage local studio-vm.be utilise, à quoi ils servent, combien de temps ils sont conservés et comment les supprimer.",
    },
    eyebrow: "Cookies",
    title: "Déclaration relative aux cookies",
    updated: "Dernière mise à jour",
    shortTitle: "Version courte",
    shortBody:
      "Nous n'utilisons aucun cookie de tracking, aucun cookie publicitaire, aucun tracker tiers. Ce que nous utilisons : quelques valeurs fonctionnelles qui retiennent vos préférences, comme votre langue et votre thème. Si vous vous connectez à l'espace client, un cookie de connexion vous garde connecté. Les valeurs localStorage restent uniquement dans votre navigateur.",
    tableTitle: "Qu'est-ce qui est stocké ?",
    cols: { name: "Nom", purpose: "But", duration: "Durée", type: "Type" },
    rows: [
      { name: "studio-vm-cookie-consent", purpose: "Retient si vous avez vu la bannière cookies.", duration: "Jusqu'à effacement", type: "Fonctionnel (localStorage)" },
      { name: "locale", purpose: "Retient votre choix de langue.", duration: "1 an", type: "Fonctionnel (cookie)" },
      { name: "theme", purpose: "Retient votre préférence clair/sombre.", duration: "Jusqu'à effacement", type: "Fonctionnel (localStorage)" },
      { name: "vm_portal_rail", purpose: "Retient si la barre latérale de l'espace client est repliée ou dépliée.", duration: "Jusqu'à effacement", type: "Fonctionnel (localStorage)" },
      { name: "sb-…-auth-token", purpose: "Vous garde connecté à l'espace client. Uniquement placé lorsque vous vous connectez.", duration: "Jusqu'à votre déconnexion, au maximum 400 jours après votre dernière visite", type: "Strictement nécessaire (cookie)" },
    ],
    removeTitle: "Comment les supprimer ?",
    removeBody:
      "Ouvrez les paramètres de votre navigateur → Confidentialité → Supprimer les données du site pour studio-vm.be. Cela efface toutes les données locales.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "Nous utilisons des analytics respectueux de la vie privée. Pas de cookies, pas d'identifiants personnels — uniquement des visites de pages anonymisées.",
  },
  en: {
    meta: {
      title: "Cookie statement | Studio VM",
      description:
        "Which cookies and local storage studio-vm.be uses, what they are for, how long they are kept and how you can remove them in your browser.",
    },
    eyebrow: "Cookies",
    title: "Cookie statement",
    updated: "Last updated",
    shortTitle: "Short version",
    shortBody:
      "We use no tracking cookies, no advertising cookies, no third-party trackers. What we do use are a few functional values that remember your preferences, such as your language and theme. If you sign in to the client portal, a sign-in cookie keeps you signed in. The localStorage values stay only in your browser.",
    tableTitle: "What is stored?",
    cols: { name: "Name", purpose: "Purpose", duration: "Retention", type: "Type" },
    rows: [
      { name: "studio-vm-cookie-consent", purpose: "Remembers whether you have seen the cookie banner.", duration: "Until you clear it", type: "Functional (localStorage)" },
      { name: "locale", purpose: "Remembers your language choice.", duration: "1 year", type: "Functional (cookie)" },
      { name: "theme", purpose: "Remembers your light/dark preference.", duration: "Until you clear it", type: "Functional (localStorage)" },
      { name: "vm_portal_rail", purpose: "Remembers whether the client portal sidebar is collapsed or expanded.", duration: "Until you clear it", type: "Functional (localStorage)" },
      { name: "sb-…-auth-token", purpose: "Keeps you signed in to the client portal. Only set when you sign in.", duration: "Until you sign out, at most 400 days after your last visit", type: "Strictly necessary (cookie)" },
    ],
    removeTitle: "How do I remove them?",
    removeBody:
      "Open your browser settings → Privacy → Clear site data for studio-vm.be. That wipes all local data.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "We use privacy-friendly analytics. No cookies, no personal identifiers — only anonymised page views.",
  },
  de: {
    meta: {
      title: "Cookie-Erklärung | Studio VM",
      description:
        "Welche Cookies und welchen lokalen Speicher studio-vm.be verwendet, wofür, wie lange sie gespeichert bleiben und wie Sie sie im Browser löschen.",
    },
    eyebrow: "Cookies",
    title: "Cookie-Erklärung",
    updated: "Zuletzt aktualisiert",
    shortTitle: "Kurzfassung",
    shortBody:
      "Wir verwenden keine Tracking-Cookies, keine Werbe-Cookies und keine Tracker von Drittanbietern. Was wir verwenden, sind einige funktionale Werte, die Ihre Einstellungen speichern, etwa Sprache und Farbschema. Wenn Sie sich im Kundenportal anmelden, hält ein Anmelde-Cookie Sie angemeldet. Die localStorage-Werte verbleiben ausschließlich in Ihrem Browser.",
    tableTitle: "Was wird gespeichert?",
    cols: { name: "Name", purpose: "Zweck", duration: "Speicherdauer", type: "Typ" },
    rows: [
      { name: "studio-vm-cookie-consent", purpose: "Speichert, ob Sie den Cookie-Hinweis gesehen haben.", duration: "Bis Sie sie löschen", type: "Funktional (localStorage)" },
      { name: "locale", purpose: "Speichert Ihre Sprachwahl.", duration: "1 Jahr", type: "Funktional (Cookie)" },
      { name: "theme", purpose: "Speichert Ihre Hell/Dunkel-Einstellung.", duration: "Bis Sie sie löschen", type: "Funktional (localStorage)" },
      { name: "vm_portal_rail", purpose: "Speichert, ob die Seitenleiste des Kundenportals ein- oder ausgeklappt ist.", duration: "Bis Sie sie löschen", type: "Funktional (localStorage)" },
      { name: "sb-…-auth-token", purpose: "Hält Sie im Kundenportal angemeldet. Wird nur gesetzt, wenn Sie sich anmelden.", duration: "Bis Sie sich abmelden, höchstens 400 Tage nach Ihrem letzten Besuch", type: "Unbedingt erforderlich (Cookie)" },
    ],
    removeTitle: "Wie lösche ich sie?",
    removeBody:
      "Öffnen Sie die Einstellungen Ihres Browsers → Datenschutz → Websitedaten für studio-vm.be löschen. Dadurch werden alle lokalen Daten entfernt.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "Wir verwenden datenschutzfreundliche Analytics. Keine Cookies, keine persönlichen Kennungen — nur anonymisierte Seitenaufrufe.",
  },
  es: {
    meta: {
      title: "Declaración de cookies | Studio VM",
      description:
        "Qué cookies y almacenamiento local utiliza studio-vm.be, para qué sirven, cuánto tiempo se conservan y cómo puede eliminarlos en su navegador.",
    },
    eyebrow: "Cookies",
    title: "Declaración de cookies",
    updated: "Última actualización",
    shortTitle: "Versión breve",
    shortBody:
      "No utilizamos cookies de seguimiento, ni cookies publicitarias, ni rastreadores de terceros. Lo que sí utilizamos son algunos valores funcionales que recuerdan sus preferencias, como el idioma y el tema. Si inicia sesión en el portal de clientes, una cookie de sesión mantiene su sesión abierta. Los valores de localStorage permanecen únicamente en su navegador.",
    tableTitle: "¿Qué se almacena?",
    cols: { name: "Nombre", purpose: "Finalidad", duration: "Conservación", type: "Tipo" },
    rows: [
      { name: "studio-vm-cookie-consent", purpose: "Recuerda si ha visto el aviso de cookies.", duration: "Hasta que lo borre", type: "Funcional (localStorage)" },
      { name: "locale", purpose: "Recuerda su elección de idioma.", duration: "1 año", type: "Funcional (cookie)" },
      { name: "theme", purpose: "Recuerda su preferencia de tema claro/oscuro.", duration: "Hasta que la borre", type: "Funcional (localStorage)" },
      { name: "vm_portal_rail", purpose: "Recuerda si la barra lateral del portal de clientes está plegada o desplegada.", duration: "Hasta que lo borre", type: "Funcional (localStorage)" },
      { name: "sb-…-auth-token", purpose: "Mantiene su sesión abierta en el portal de clientes. Solo se crea cuando usted inicia sesión.", duration: "Hasta que cierre la sesión, como máximo 400 días después de su última visita", type: "Estrictamente necesaria (cookie)" },
    ],
    removeTitle: "¿Cómo las elimino?",
    removeBody:
      "Abra la configuración de su navegador → Privacidad → Borrar los datos del sitio studio-vm.be. Así se eliminan todos los datos locales.",
    analyticsTitle: "Analítica",
    analyticsBody:
      "Utilizamos analítica respetuosa con la privacidad. Sin cookies, sin identificadores personales — solo visitas a páginas anonimizadas.",
  },
};

/** Ankers van de secties, voor de inhoudstafel. */
export function cookiesToc(locale: Locale): TocItem[] {
  const c = COOKIES[locale];
  return [
    { id: "kort", label: c.shortTitle },
    { id: "opslag", label: c.tableTitle },
    { id: "verwijderen", label: c.removeTitle },
    { id: "analytics", label: c.analyticsTitle },
  ];
}

/** De secties, als losse blokken in de kolom van de pagina. */
export function CookiesInhoud({ locale }: { locale: Locale }) {
  const c = COOKIES[locale];
  return (
    <>
      <section id="kort" className="scroll-mt-28">
        <h2 className="text-xl font-semibold tracking-tight">{c.shortTitle}</h2>
        <p className="mt-3 max-w-3xl leading-relaxed">{c.shortBody}</p>
      </section>

      <section id="opslag" className="scroll-mt-28">
        <h2 className="text-xl font-semibold tracking-tight">{c.tableTitle}</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-card">
              <tr>
                {[c.cols.name, c.cols.purpose, c.cols.duration, c.cols.type].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {c.rows.map((r) => (
                <tr key={r.name}>
                  <td className="px-4 py-3 font-mono text-xs">{r.name}</td>
                  <td className="px-4 py-3">{r.purpose}</td>
                  <td className="px-4 py-3 text-muted">{r.duration}</td>
                  <td className="px-4 py-3 text-muted">{r.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="verwijderen" className="scroll-mt-28">
        <h2 className="text-xl font-semibold tracking-tight">{c.removeTitle}</h2>
        <p className="mt-3 max-w-3xl leading-relaxed">{c.removeBody}</p>
      </section>

      <section id="analytics" className="scroll-mt-28">
        <h2 className="text-xl font-semibold tracking-tight">
          {c.analyticsTitle}
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed">{c.analyticsBody}</p>
      </section>
    </>
  );
}
