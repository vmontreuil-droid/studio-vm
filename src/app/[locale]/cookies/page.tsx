import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { InhoudToc } from "@/components/inhoud-toc";

type Copy = {
  metaTitle: string;
  eyebrow: string;
  title: string;
  updated: string;
  localeCode: string;
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

const copy: Record<Locale, Copy> = {
  nl: {
    metaTitle: "Cookies — Studio VM",
    eyebrow: "Cookies",
    title: "Cookieverklaring",
    updated: "Laatst bijgewerkt",
    localeCode: "nl-BE",
    shortTitle: "Korte versie",
    shortBody:
      "We gebruiken geen tracking-cookies, geen advertentie-cookies, geen third-party trackers. Wat we wel gebruiken zijn een paar localStorage-waarden om de demo-functies (shop, support tickets) te laten werken — die blijven uitsluitend in jouw browser.",
    tableTitle: "Wat staat er opgeslagen?",
    cols: { name: "Naam", purpose: "Doel", duration: "Bewaartijd", type: "Type" },
    rows: [
      { name: "studio-vm-cart", purpose: "Onthoudt je demo-winkelmand op /shop.", duration: "Tot je 'm leegmaakt", type: "Functioneel (localStorage)" },
      { name: "studio-vm-tickets", purpose: "Bewaart de tickets die je aanmaakt op de support-demo.", duration: "Tot je reset", type: "Functioneel (localStorage)" },
      { name: "studio-vm-cookie-consent", purpose: "Onthoudt of je de cookie-banner gezien hebt.", duration: "1 jaar", type: "Functioneel (localStorage)" },
      { name: "locale", purpose: "Onthoudt je taalkeuze.", duration: "1 jaar", type: "Functioneel (cookie)" },
      { name: "theme", purpose: "Onthoudt je licht/donker-voorkeur.", duration: "Tot je 'm wist", type: "Functioneel (localStorage)" },
    ],
    removeTitle: "Hoe verwijder ik ze?",
    removeBody:
      "Open je browser-instellingen → Privacy → Site-data verwijderen voor studio-vm.be. Dat wist alle lokale data.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "We gebruiken privacy-vriendelijke analytics. Geen cookies, geen persoonlijke identificatoren — enkel geanonimiseerde paginabezoeken.",
  },
  fr: {
    metaTitle: "Cookies — Studio VM",
    eyebrow: "Cookies",
    title: "Déclaration cookies",
    updated: "Dernière mise à jour",
    localeCode: "fr-BE",
    shortTitle: "Version courte",
    shortBody:
      "Nous n'utilisons aucun cookie de tracking, aucun cookie publicitaire, aucun tracker tiers. Ce que nous utilisons : quelques valeurs localStorage pour faire fonctionner les démos (boutique, tickets support) — elles restent uniquement dans votre navigateur.",
    tableTitle: "Qu'est-ce qui est stocké ?",
    cols: { name: "Nom", purpose: "But", duration: "Durée", type: "Type" },
    rows: [
      { name: "studio-vm-cart", purpose: "Retient votre panier démo sur /shop.", duration: "Jusqu'à ce que vous le vidiez", type: "Fonctionnel (localStorage)" },
      { name: "studio-vm-tickets", purpose: "Conserve les tickets créés dans la démo support.", duration: "Jusqu'au reset", type: "Fonctionnel (localStorage)" },
      { name: "studio-vm-cookie-consent", purpose: "Retient si vous avez vu la bannière cookies.", duration: "1 an", type: "Fonctionnel (localStorage)" },
      { name: "locale", purpose: "Retient votre choix de langue.", duration: "1 an", type: "Fonctionnel (cookie)" },
      { name: "theme", purpose: "Retient votre préférence clair/sombre.", duration: "Jusqu'à effacement", type: "Fonctionnel (localStorage)" },
    ],
    removeTitle: "Comment les supprimer ?",
    removeBody:
      "Ouvrez les paramètres du navigateur → Confidentialité → Supprimer les données du site pour studio-vm.be. Cela efface toutes les données locales.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "Nous utilisons des analytics respectueux de la vie privée. Pas de cookies, pas d'identifiants personnels — uniquement des visites de pages anonymisées.",
  },
  en: {
    metaTitle: "Cookies — Studio VM",
    eyebrow: "Cookies",
    title: "Cookie statement",
    updated: "Last updated",
    localeCode: "en-GB",
    shortTitle: "Short version",
    shortBody:
      "We use no tracking cookies, no advertising cookies, no third-party trackers. What we do use are a few localStorage values to make the demo features (shop, support tickets) work — they stay only in your browser.",
    tableTitle: "What is stored?",
    cols: { name: "Name", purpose: "Purpose", duration: "Retention", type: "Type" },
    rows: [
      { name: "studio-vm-cart", purpose: "Remembers your demo cart on /shop.", duration: "Until you empty it", type: "Functional (localStorage)" },
      { name: "studio-vm-tickets", purpose: "Stores the tickets you create in the support demo.", duration: "Until you reset", type: "Functional (localStorage)" },
      { name: "studio-vm-cookie-consent", purpose: "Remembers whether you've seen the cookie banner.", duration: "1 year", type: "Functional (localStorage)" },
      { name: "locale", purpose: "Remembers your language choice.", duration: "1 year", type: "Functional (cookie)" },
      { name: "theme", purpose: "Remembers your light/dark preference.", duration: "Until you clear it", type: "Functional (localStorage)" },
    ],
    removeTitle: "How do I remove them?",
    removeBody:
      "Open your browser settings → Privacy → Clear site data for studio-vm.be. That wipes all local data.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "We use privacy-friendly analytics. No cookies, no personal identifiers — only anonymized page views.",
  },
  de: {
    metaTitle: "Cookies — Studio VM",
    eyebrow: "Cookies",
    title: "Cookie-Erklärung",
    updated: "Zuletzt aktualisiert",
    localeCode: "de-DE",
    shortTitle: "Kurzfassung",
    shortBody:
      "Wir verwenden keine Tracking-Cookies, keine Werbe-Cookies und keine Tracker von Drittanbietern. Was wir verwenden, sind einige localStorage-Werte, damit die Demo-Funktionen (Shop, Support-Tickets) funktionieren — diese verbleiben ausschließlich in Ihrem Browser.",
    tableTitle: "Was wird gespeichert?",
    cols: { name: "Name", purpose: "Zweck", duration: "Speicherdauer", type: "Typ" },
    rows: [
      { name: "studio-vm-cart", purpose: "Speichert Ihren Demo-Warenkorb auf /shop.", duration: "Bis Sie ihn leeren", type: "Funktional (localStorage)" },
      { name: "studio-vm-tickets", purpose: "Speichert die Tickets, die Sie in der Support-Demo erstellen.", duration: "Bis Sie zurücksetzen", type: "Funktional (localStorage)" },
      { name: "studio-vm-cookie-consent", purpose: "Speichert, ob Sie den Cookie-Hinweis gesehen haben.", duration: "1 Jahr", type: "Funktional (localStorage)" },
      { name: "locale", purpose: "Speichert Ihre Sprachwahl.", duration: "1 Jahr", type: "Funktional (Cookie)" },
      { name: "theme", purpose: "Speichert Ihre Hell/Dunkel-Einstellung.", duration: "Bis Sie sie löschen", type: "Funktional (localStorage)" },
    ],
    removeTitle: "Wie lösche ich sie?",
    removeBody:
      "Öffnen Sie die Einstellungen Ihres Browsers → Datenschutz → Websitedaten für studio-vm.be löschen. Dadurch werden alle lokalen Daten entfernt.",
    analyticsTitle: "Analytics",
    analyticsBody:
      "Wir verwenden datenschutzfreundliche Analytics. Keine Cookies, keine persönlichen Kennungen — nur anonymisierte Seitenaufrufe.",
  },
  es: {
    metaTitle: "Cookies — Studio VM",
    eyebrow: "Cookies",
    title: "Declaración de cookies",
    updated: "Última actualización",
    localeCode: "es-ES",
    shortTitle: "Versión breve",
    shortBody:
      "No utilizamos cookies de seguimiento, ni cookies publicitarias, ni rastreadores de terceros. Lo que sí utilizamos son algunos valores de localStorage para que funcionen las demos (tienda, tickets de soporte) — permanecen únicamente en su navegador.",
    tableTitle: "¿Qué se almacena?",
    cols: { name: "Nombre", purpose: "Finalidad", duration: "Conservación", type: "Tipo" },
    rows: [
      { name: "studio-vm-cart", purpose: "Recuerda su carrito de demostración en /shop.", duration: "Hasta que lo vacíe", type: "Funcional (localStorage)" },
      { name: "studio-vm-tickets", purpose: "Conserva los tickets que crea en la demo de soporte.", duration: "Hasta que lo restablezca", type: "Funcional (localStorage)" },
      { name: "studio-vm-cookie-consent", purpose: "Recuerda si ha visto el aviso de cookies.", duration: "1 año", type: "Funcional (localStorage)" },
      { name: "locale", purpose: "Recuerda su elección de idioma.", duration: "1 año", type: "Funcional (cookie)" },
      { name: "theme", purpose: "Recuerda su preferencia de tema claro/oscuro.", duration: "Hasta que la borre", type: "Funcional (localStorage)" },
    ],
    removeTitle: "¿Cómo las elimino?",
    removeBody:
      "Abra la configuración de su navegador → Privacidad → Borrar los datos del sitio studio-vm.be. Así se eliminan todos los datos locales.",
    analyticsTitle: "Analítica",
    analyticsBody:
      "Utilizamos analítica respetuosa con la privacidad. Sin cookies, sin identificadores personales — solo visitas a páginas anonimizadas.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: copy[locale].metaTitle };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];

  return (
    <main>
      <article>
        <header className="border-b">
          <div className="wrap py-16 sm:py-20">
            <div className="mx-auto max-w-3xl lg:max-w-[72rem]">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                {c.eyebrow}
              </p>
              <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl 2xl:text-6xl">
                {c.title}
              </h1>
              <p className="mt-4 text-sm text-muted">
                {c.updated}:{" "}
                {new Date().toLocaleDateString(c.localeCode, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </header>
        <div className="wrap py-16">
          <div className="mx-auto grid max-w-3xl gap-12 lg:max-w-[72rem] lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-20">
            <aside className="hidden lg:block lg:sticky lg:top-28 lg:self-start">
              <InhoudToc
                kop={c.eyebrow}
                items={[
                  { id: "kort", label: c.shortTitle },
                  { id: "opslag", label: c.tableTitle },
                  { id: "verwijderen", label: c.removeTitle },
                  { id: "analytics", label: c.analyticsTitle },
                ]}
              />
            </aside>
            <div className="min-w-0 max-w-3xl space-y-10 xl:max-w-4xl">
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
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
