import { getPosts } from "@/lib/posts";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const meta: Record<Locale, { title: string; desc: string }> = {
  nl: {
    title: "Studio VM — Journal",
    desc: "Notities over webdevelopment en lokale ondernemers.",
  },
  fr: {
    title: "Studio VM — Journal",
    desc: "Notes sur le développement web et les entrepreneurs locaux.",
  },
  en: {
    title: "Studio VM — Journal",
    desc: "Notes on web development and local entrepreneurs.",
  },
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    return new Response("Not found", { status: 404 });
  }

  const base = `https://studio-vm.be/${locale}`;
  const posts = getPosts(locale);
  const m = meta[locale];

  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${base}/journal/${p.slug}</link>
      <guid isPermaLink="true">${base}/journal/${p.slug}</guid>
      <description>${escapeXml(p.excerpt)}</description>
      <category>${escapeXml(p.tag)}</category>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(m.title)}</title>
    <link>${base}/journal</link>
    <description>${escapeXml(m.desc)}</description>
    <language>${locale}</language>
    <atom:link href="${base}/journal/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
