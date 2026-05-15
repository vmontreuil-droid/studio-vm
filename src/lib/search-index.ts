import { getProjects } from "@/lib/projects";
import { getPosts } from "@/lib/posts";
import { getCapabilityDetails } from "@/lib/capabilities";
import { localePath, type Locale } from "@/lib/i18n/config";

export type SearchEntry = {
  title: string;
  href: string;
  kind: "Page" | "Werk" | "Journal" | "Module";
  hint?: string;
};

const pageDefs: Record<
  Locale,
  { title: string; path: string; hint?: string }[]
> = {
  nl: [
    { title: "Home", path: "/", hint: "Hero, werk, mogelijkheden, contact" },
    { title: "Pricing", path: "/pricing", hint: "Pakketten + abonnementen" },
    { title: "Diensten", path: "/diensten", hint: "Wat ik bouw + werkproces" },
    { title: "FAQ", path: "/faq", hint: "Veelgestelde vragen" },
    { title: "Journal", path: "/journal", hint: "Blog over webdevelopment" },
    { title: "Templates shop", path: "/shop", hint: "Templates en e-books" },
    { title: "Site builder demo", path: "/builder", hint: "Bouw je eigen pagina" },
    { title: "Klantportaal", path: "/portail", hint: "Inloggen voor klanten" },
    { title: "Support tickets", path: "/support", hint: "Open een ticket" },
    { title: "Status", path: "/status", hint: "Uptime + system status" },
    { title: "Wat ik nu doe", path: "/now", hint: "Now-page" },
    { title: "Tools die ik gebruik", path: "/uses", hint: "Mijn stack" },
    { title: "Privacy", path: "/privacy" },
    { title: "Cookies", path: "/cookies" },
    { title: "Algemene voorwaarden", path: "/voorwaarden" },
  ],
  fr: [
    { title: "Accueil", path: "/", hint: "Hero, travaux, capacités, contact" },
    { title: "Tarifs", path: "/pricing", hint: "Forfaits + abonnements" },
    { title: "Services", path: "/diensten", hint: "Ce que je construis + processus" },
    { title: "FAQ", path: "/faq", hint: "Questions fréquentes" },
    { title: "Journal", path: "/journal", hint: "Blog sur le développement web" },
    { title: "Boutique templates", path: "/shop", hint: "Templates et e-books" },
    { title: "Démo site builder", path: "/builder", hint: "Construisez votre page" },
    { title: "Espace client", path: "/portail", hint: "Connexion clients" },
    { title: "Tickets support", path: "/support", hint: "Ouvrir un ticket" },
    { title: "Statut", path: "/status", hint: "Uptime + statut système" },
    { title: "Ce que je fais", path: "/now", hint: "Now-page" },
    { title: "Mes outils", path: "/uses", hint: "Ma stack" },
    { title: "Confidentialité", path: "/privacy" },
    { title: "Cookies", path: "/cookies" },
    { title: "Conditions générales", path: "/voorwaarden" },
  ],
  en: [
    { title: "Home", path: "/", hint: "Hero, work, capabilities, contact" },
    { title: "Pricing", path: "/pricing", hint: "Packages + subscriptions" },
    { title: "Services", path: "/diensten", hint: "What I build + process" },
    { title: "FAQ", path: "/faq", hint: "Frequently asked questions" },
    { title: "Journal", path: "/journal", hint: "Blog about web development" },
    { title: "Templates shop", path: "/shop", hint: "Templates and e-books" },
    { title: "Site builder demo", path: "/builder", hint: "Build your own page" },
    { title: "Client portal", path: "/portail", hint: "Client login" },
    { title: "Support tickets", path: "/support", hint: "Open a ticket" },
    { title: "Status", path: "/status", hint: "Uptime + system status" },
    { title: "What I'm doing now", path: "/now", hint: "Now-page" },
    { title: "Tools I use", path: "/uses", hint: "My stack" },
    { title: "Privacy", path: "/privacy" },
    { title: "Cookies", path: "/cookies" },
    { title: "Terms", path: "/voorwaarden" },
  ],
};

export function getSearchIndex(locale: Locale): SearchEntry[] {
  const pages: SearchEntry[] = pageDefs[locale].map((p) => ({
    title: p.title,
    href: localePath(locale, p.path),
    kind: "Page",
    hint: p.hint,
  }));
  const work: SearchEntry[] = getProjects(locale).map((p) => ({
    title: p.name,
    href: localePath(locale, `/werk/${p.slug}`),
    kind: "Werk",
    hint: p.tagline,
  }));
  const journal: SearchEntry[] = getPosts(locale).map((p) => ({
    title: p.title,
    href: localePath(locale, `/journal/${p.slug}`),
    kind: "Journal",
    hint: p.tag,
  }));
  const modules: SearchEntry[] = getCapabilityDetails(locale).map((c) => ({
    title: c.title,
    href: localePath(locale, `/mogelijkheden/${c.slug}`),
    kind: "Module",
    hint: c.short.slice(0, 60),
  }));
  return [...pages, ...work, ...journal, ...modules];
}

export function search(
  query: string,
  locale: Locale,
  limit = 8,
): SearchEntry[] {
  const index = getSearchIndex(locale);
  const q = query.trim().toLowerCase();
  if (!q) return index.slice(0, limit);
  return index
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((m) => m.entry);
}

function scoreEntry(entry: SearchEntry, q: string): number {
  const title = entry.title.toLowerCase();
  const hint = entry.hint?.toLowerCase() ?? "";
  if (title === q) return 100;
  if (title.startsWith(q)) return 50;
  if (title.includes(q)) return 25;
  if (hint.includes(q)) return 10;
  let qi = 0;
  for (const c of title) {
    if (c === q[qi]) qi++;
    if (qi === q.length) return 5;
  }
  return 0;
}
