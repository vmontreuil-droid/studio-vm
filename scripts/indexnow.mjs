// Meldt alle URL's uit de sitemap bij IndexNow (Bing, Yandex, Seznam,
// Naver, …; Google doet niet mee). Pas draaien NA een productie-deploy.
//
//   node scripts/indexnow.mjs             → echt melden
//   node scripts/indexnow.mjs --dry-run   → enkel tellen, niets versturen
//   SITEMAP_URL=http://localhost:3100/sitemap.xml node scripts/indexnow.mjs --dry-run
//
// De sleutel staat ook in public/<KEY>.txt; IndexNow haalt dat bestand op
// om te controleren dat de melding van de site-eigenaar komt.

const KEY = "a39798f904551c6f12c803fde28433c7";
const HOST = "www.studio-vm.be";
const SITEMAP_URL = process.env.SITEMAP_URL || `https://${HOST}/sitemap.xml`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const DRY_RUN = process.argv.includes("--dry-run");

function xmlTekst(s) {
  return s
    .trim()
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

async function main() {
  const res = await fetch(SITEMAP_URL, { headers: { accept: "application/xml" } });
  if (!res.ok) {
    throw new Error(`Sitemap ophalen mislukt: ${res.status} ${SITEMAP_URL}`);
  }
  const xml = await res.text();
  const alle = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => xmlTekst(m[1]));
  // IndexNow weigert URL's van een andere host dan `host`.
  const urlList = [...new Set(alle)].filter((u) => {
    try {
      return new URL(u).host === HOST;
    } catch {
      return false;
    }
  });

  if (urlList.length === 0) throw new Error("Geen URL's gevonden in de sitemap.");

  if (DRY_RUN) {
    console.log(urlList.length);
    console.log(`URL's uit ${SITEMAP_URL} — dry-run, niets verstuurd.`);
    return;
  }

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  };
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const tekst = await r.text().catch(() => "");
  console.log(`IndexNow: ${r.status} ${r.statusText} — ${urlList.length} URL's gemeld.`);
  if (tekst) console.log(tekst.slice(0, 500));
  if (r.status !== 200 && r.status !== 202) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
