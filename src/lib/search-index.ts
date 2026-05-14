import { projects } from "@/lib/projects";
import { posts } from "@/lib/posts";

export type SearchEntry = {
  title: string;
  href: string;
  kind: "Pagina" | "Werk" | "Journal";
  hint?: string;
};

const pages: SearchEntry[] = [
  { title: "Home", href: "/", kind: "Pagina", hint: "Hero, werk-overzicht, mogelijkheden, contact" },
  { title: "Pricing", href: "/pricing", kind: "Pagina", hint: "Pakketten + abonnementen" },
  { title: "Diensten", href: "/diensten", kind: "Pagina", hint: "Wat ik bouw + werkproces" },
  { title: "FAQ", href: "/faq", kind: "Pagina", hint: "Veelgestelde vragen" },
  { title: "Journal", href: "/journal", kind: "Pagina", hint: "Blog over webdevelopment" },
  { title: "Templates shop", href: "/shop", kind: "Pagina", hint: "Templates en e-books" },
  { title: "Site builder demo", href: "/builder", kind: "Pagina", hint: "Bouw je eigen pagina" },
  { title: "Klantportaal", href: "/portail", kind: "Pagina", hint: "Inloggen voor klanten" },
  { title: "Support tickets", href: "/support", kind: "Pagina", hint: "Open een ticket" },
  { title: "Status", href: "/status", kind: "Pagina", hint: "Uptime + system status" },
  { title: "Wat ik nu doe", href: "/now", kind: "Pagina", hint: "Now-page van Vincent" },
  { title: "Tools die ik gebruik", href: "/uses", kind: "Pagina", hint: "Mijn dagelijkse stack" },
  { title: "Contact", href: "/#contact", kind: "Pagina", hint: "Stuur een bericht" },
  { title: "Privacy", href: "/privacy", kind: "Pagina" },
  { title: "Cookies", href: "/cookies", kind: "Pagina" },
  { title: "Algemene voorwaarden", href: "/voorwaarden", kind: "Pagina" },
];

const workEntries: SearchEntry[] = projects.map((p) => ({
  title: p.name,
  href: `/werk/${p.slug}`,
  kind: "Werk",
  hint: p.tagline,
}));

const journalEntries: SearchEntry[] = posts.map((p) => ({
  title: p.title,
  href: `/journal/${p.slug}`,
  kind: "Journal",
  hint: p.tag,
}));

export const searchIndex: SearchEntry[] = [
  ...pages,
  ...workEntries,
  ...journalEntries,
];

export function search(query: string, limit = 8): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return searchIndex.slice(0, limit);
  return searchIndex
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, q),
    }))
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
  // Loose char-by-char match for typos
  let qi = 0;
  for (const c of title) {
    if (c === q[qi]) qi++;
    if (qi === q.length) return 5;
  }
  return 0;
}
