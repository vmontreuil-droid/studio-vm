import type { Locale } from "@/lib/i18n/config";

export type ChangeKind = "launch" | "feature" | "improve" | "fix";

export type ChangeEntry = {
  date: string;
  version: string;
  kind: ChangeKind;
  title: string;
  detail: string;
};

// Eerlijk, gedateerd logboek van wat er aan deze site zelf gebouwd is.
// Transparantie: een klant ziet exact dat ik onderhoud wat ik bouw.
const base: { date: string; version: string; kind: ChangeKind; i18n: Record<Locale, { title: string; detail: string }> }[] = [
  {
    date: "2026-05-14",
    version: "0.1",
    kind: "launch",
    i18n: {
      nl: { title: "Lancering", detail: "studio-vm.be live op Vercel — Next.js 16, Tailwind v4. Domein verlegd van one.com, SSL via Let's Encrypt." },
      fr: { title: "Lancement", detail: "studio-vm.be en ligne sur Vercel — Next.js 16, Tailwind v4. Domaine basculé depuis one.com, SSL via Let's Encrypt." },
      en: { title: "Launch", detail: "studio-vm.be live on Vercel — Next.js 16, Tailwind v4. Domain moved from one.com, SSL via Let's Encrypt." },
    },
  },
  {
    date: "2026-05-14",
    version: "0.2",
    kind: "feature",
    i18n: {
      nl: { title: "Case studies + pricing + demo's", detail: "Werk-detailpagina's, pricing, en interactieve demo's: shop met cart, support-tickets, page-builder." },
      fr: { title: "Études de cas + tarifs + démos", detail: "Pages détail des travaux, tarifs, et démos interactives : boutique avec panier, tickets support, page-builder." },
      en: { title: "Case studies + pricing + demos", detail: "Work detail pages, pricing, and interactive demos: shop with cart, support tickets, page builder." },
    },
  },
  {
    date: "2026-05-14",
    version: "0.3",
    kind: "feature",
    i18n: {
      nl: { title: "Eigen logo + SEO + PWA", detail: "Het <vm/> woordmerk, dynamische OG-images, sitemap, JSON-LD, manifest en service worker." },
      fr: { title: "Logo propre + SEO + PWA", detail: "Le logotype <vm/>, images OG dynamiques, sitemap, JSON-LD, manifest et service worker." },
      en: { title: "Own logo + SEO + PWA", detail: "The <vm/> wordmark, dynamic OG images, sitemap, JSON-LD, manifest and service worker." },
    },
  },
  {
    date: "2026-05-15",
    version: "1.0",
    kind: "feature",
    i18n: {
      nl: { title: "Volledig drietalig (NL/FR/EN)", detail: "Elke pagina, elk datablok en alle metadata vertaald. Middleware-taaldetectie + /[locale] routing + hreflang." },
      fr: { title: "Entièrement trilingue (NL/FR/EN)", detail: "Chaque page, chaque bloc de données et toutes les metadata traduits. Détection middleware + routing /[locale] + hreflang." },
      en: { title: "Fully trilingual (NL/FR/EN)", detail: "Every page, data block and all metadata translated. Middleware language detection + /[locale] routing + hreflang." },
    },
  },
  {
    date: "2026-05-15",
    version: "1.1",
    kind: "feature",
    i18n: {
      nl: { title: "Diepe case studies + 12 mogelijkheid-pagina's", detail: "Voor/na-cijfers, beslissingen, tijdlijn, eerlijke reflectie per project. Volledige verkooppagina per module." },
      fr: { title: "Études de cas approfondies + 12 pages capacités", detail: "Chiffres avant/après, décisions, calendrier, réflexion honnête par projet. Page de vente complète par module." },
      en: { title: "Deep case studies + 12 capability pages", detail: "Before/after figures, decisions, timeline, honest reflection per project. Full sales page per module." },
    },
  },
  {
    date: "2026-05-15",
    version: "1.2",
    kind: "feature",
    i18n: {
      nl: { title: "Live site-scanner", detail: "Werkende diagnose-tool met SSRF-beveiliging: detecteert stack, meet snelheid, scoort SEO-basis + benchmark vs Studio VM." },
      fr: { title: "Scanner de site en direct", detail: "Outil de diagnostic fonctionnel avec protection SSRF : détecte la stack, mesure la vitesse, note la base SEO + benchmark vs Studio VM." },
      en: { title: "Live site scanner", detail: "Working diagnostic tool with SSRF protection: detects stack, measures speed, scores SEO basics + benchmark vs Studio VM." },
    },
  },
  {
    date: "2026-05-15",
    version: "1.3",
    kind: "feature",
    i18n: {
      nl: { title: "Echte Supabase-auth + brand kit + analytics", detail: "Wachtwoordloze magic-link klantportaal (env-gated), /pers brand kit, conversie-events + Web Vitals, command palette." },
      fr: { title: "Auth Supabase réelle + brand kit + analytics", detail: "Espace client magic-link sans mot de passe (env-gated), brand kit /pers, events de conversion + Web Vitals, command palette." },
      en: { title: "Real Supabase auth + brand kit + analytics", detail: "Passwordless magic-link client portal (env-gated), /pers brand kit, conversion events + Web Vitals, command palette." },
    },
  },
  {
    date: "2026-05-15",
    version: "1.4",
    kind: "feature",
    i18n: {
      nl: { title: "Gadgets: ROI-calculator, laad-race, stack-diagram", detail: "Cost-of-slowness calculator, visuele WordPress-vs-Studio-VM laadrace, klikbaar architectuur-diagram, sneltoets-overlay." },
      fr: { title: "Gadgets : calculateur ROI, course de chargement, diagramme stack", detail: "Calculateur du coût de la lenteur, course de chargement WordPress vs Studio VM, diagramme d'architecture cliquable, overlay raccourcis." },
      en: { title: "Gadgets: ROI calculator, loading race, stack diagram", detail: "Cost-of-slowness calculator, visual WordPress-vs-Studio-VM loading race, clickable architecture diagram, shortcuts overlay." },
    },
  },
  {
    date: "2026-05-15",
    version: "1.5",
    kind: "improve",
    i18n: {
      nl: { title: "Transparantie-laag", detail: "Dit changelog, een before/after-slider op de migratie-pagina, 90-dagen uptime-heatmap en scroll-reveals." },
      fr: { title: "Couche de transparence", detail: "Ce changelog, un slider avant/après sur la page migration, une heatmap uptime 90 jours et des révélations au scroll." },
      en: { title: "Transparency layer", detail: "This changelog, a before/after slider on the migration page, a 90-day uptime heatmap and scroll reveals." },
    },
  },
];

export function getChangelog(locale: Locale): ChangeEntry[] {
  return base
    .map((e) => ({
      date: e.date,
      version: e.version,
      kind: e.kind,
      ...e.i18n[locale],
    }))
    .sort((a, b) =>
      a.date === b.date
        ? b.version.localeCompare(a.version, undefined, { numeric: true })
        : b.date.localeCompare(a.date),
    );
}
