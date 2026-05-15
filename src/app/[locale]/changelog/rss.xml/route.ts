import { getChangelog } from "@/lib/changelog";
import { dbChangelog } from "@/lib/changelog-db";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const meta: Record<Locale, { title: string; desc: string }> = {
  nl: { title: "Studio VM — Changelog", desc: "Wat ik aan studio-vm.be bouw." },
  fr: { title: "Studio VM — Changelog", desc: "Ce que je construis sur studio-vm.be." },
  en: { title: "Studio VM — Changelog", desc: "What I build on studio-vm.be." },
};

function esc(s: string): string {
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
  if (!isValidLocale(locale)) return new Response("Not found", { status: 404 });

  const base = `https://studio-vm.be/${locale}`;
  const m = meta[locale];
  const entries = (await dbChangelog(locale)) ?? getChangelog(locale);
  const items = entries
    .map(
      (e) => `    <item>
      <title>${esc(`v${e.version} — ${e.title}`)}</title>
      <link>${base}/changelog</link>
      <guid isPermaLink="false">studio-vm-${e.date}-${e.version}</guid>
      <description>${esc(e.detail)}</description>
      <pubDate>${new Date(e.date).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(m.title)}</title>
    <link>${base}/changelog</link>
    <description>${esc(m.desc)}</description>
    <language>${locale}</language>
    <atom:link href="${base}/changelog/rss.xml" rel="self" type="application/rss+xml" />
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
