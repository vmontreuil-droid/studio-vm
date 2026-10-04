// Prospects voor Nederland en Duitsland uit Overture Maps Places (open data,
// CDLA-Permissive-2.0) → nl_bedrijven / de_bedrijven (migratie 0054).
//
//   node scripts/overture-import.mjs [release] [--droog]
//     release   bv. 2026-09-23.1 (standaard: de nieuwste op S3)
//     --droog   enkel tellen, niets schrijven
//
// DuckDB staat niet in package.json (te zwaar voor de site-build): zet
// DUCKDB_DIR naar een map waar `npm i @duckdb/node-api` gedraaid is.
//
// De Overture-categorie wordt een Belgische NACE-code (nace_main), zodat de
// outreach dezelfde doelgroepen, filters en mails gebruikt als voor België.
// Enkel open bedrijven met een website (zonder site valt er niets te mailen).
// Bij een nieuwe import blijven email_found en email_scanned_at bewaard.

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const args = process.argv.slice(2);
const DROOG = args.includes("--droog");
let release = args.find((a) => /^\d{4}-\d{2}-\d{2}\.\d+$/.test(a));

for (const l of readFileSync(path.join(REPO, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const repoRequire = createRequire(path.join(REPO, "package.json"));
const duckRequire = createRequire(path.join(process.env.DUCKDB_DIR || REPO, "package.json"));
const { DuckDBInstance } = duckRequire("@duckdb/node-api");
const { createClient } = repoRequire("@supabase/supabase-js");

if (!release) {
  const xml = await (await fetch("https://overturemaps-us-west-2.s3.amazonaws.com/?list-type=2&prefix=release/&delimiter=/")).text();
  release = [...xml.matchAll(/<Prefix>release\/([^/<]+)\/<\/Prefix>/g)].map((m) => m[1]).sort().pop();
}
console.log("Overture-release:", release, DROOG ? "(droog)" : "");

// Trefwoorden in de naam voor de brede categorieën.
const GW = "grondwerk|grondverzet|infra|gww|wegenbouw|weg- en waterbouw|waterbouw|loonbedrijf|loonwerk|graaf|sloop|riolering|bagger|cultuurtechn|tiefbau|erdbau|straßenbau|strassenbau|kanalbau|erdarbeit|abbruch|rückbau|ruckbau";
const ING = "ingenieur|engineering|advies|planungsb|ingenieurb|tiefbau|verkehr|wasserbau|infra|civiel|vermessung|geo";
const LANDMEET = "landmeet|landmeter|vermessung|geodesie|geodät|geodaet";

const db = await (await DuckDBInstance.create(":memory:")).connect();
await db.run("INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';");
const t0 = Date.now();
await db.run(`CREATE TABLE p AS
  SELECT id, names.primary AS naam, taxonomy.primary AS cat, websites[1] AS site, emails[1] AS mail, phones[1] AS tel,
         lower(addresses[1].country) AS land, addresses[1].locality AS plaats, addresses[1].postcode AS postcode,
         addresses[1].freeform AS straat, bbox.xmin AS lon, bbox.ymin AS lat
  FROM read_parquet('s3://overturemaps-us-west-2/release/${release}/theme=places/type=place/*', hive_partitioning=1)
  WHERE bbox.xmin BETWEEN 2.5 AND 15.1 AND bbox.ymin BETWEEN 47.2 AND 55.1
    AND addresses[1].country IN ('NL','DE')
    AND len(websites) > 0
    AND coalesce(operating_status, 'open') = 'open'`);
console.log("ingelezen in", Math.round((Date.now() - t0) / 1000), "s");

// Categorie → NACE (Belgische vorm, 5 cijfers waar het kan).
await db.run(`CREATE TABLE d AS SELECT *, CASE
  WHEN cat = 'excavation_service' THEN '43120'
  WHEN cat IN ('road_contractor', 'paving_contractor') THEN '42110'
  WHEN cat = 'demolition_service' THEN '43110'
  WHEN cat IN ('contractor','building_or_construction_service','building_contractor') AND regexp_matches(lower(naam), '${GW}') THEN
    CASE WHEN regexp_matches(lower(naam), 'sloop|abbruch|rückbau|ruckbau') THEN '43110'
         WHEN regexp_matches(lower(naam), 'wegenbouw|straßenbau|strassenbau') THEN '42110'
         WHEN regexp_matches(lower(naam), 'riolering|kanalbau') THEN '42210'
         WHEN regexp_matches(lower(naam), 'bagger|waterbouw|wasserbau') THEN '42910'
         ELSE '43120' END
  WHEN cat = 'land_surveying' OR regexp_matches(lower(naam), '${LANDMEET}') THEN '71122'
  WHEN cat IN ('civil_engineer','structural_engineer') THEN '71121'
  WHEN cat = 'engineering_service' AND regexp_matches(lower(naam), '${ING}') THEN '71121'
  WHEN cat IN ('architect','architectural_designer') THEN '71111'
  WHEN cat = 'landscape_architect' THEN '71113'
  ELSE NULL END AS nace FROM p`);
const tel = (await db.runAndReadAll(`SELECT land, nace, count(*) n FROM d WHERE nace IS NOT NULL GROUP BY ALL ORDER BY land, nace`)).getRowObjectsJson();
for (const r of tel) console.log(" ", r.land, r.nace, r.n);
if (DROOG) process.exit(0);

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
// Website zonder volg-parameters (y_source, utm_…), e-mail enkel als het op een adres lijkt.
const schoneSite = (u) => {
  try {
    const x = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`);
    for (const k of [...x.searchParams.keys()]) if (/^(y_source|utm_|fbclid|gclid)/i.test(k)) x.searchParams.delete(k);
    return x.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
};
const schoneMail = (m) => (typeof m === "string" && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(m.trim()) ? m.trim().toLowerCase() : null);

for (const land of (process.env.LANDEN || "nl,de").split(",")) {
  const rijen = (await db.runAndReadAll(`SELECT * FROM d WHERE land = '${land}' AND nace IS NOT NULL`)).getRowObjectsJson();
  const tabel = `${land}_bedrijven`;
  let klaar = 0;
  for (let i = 0; i < rijen.length; i += 500) {
    const deel = rijen
      .slice(i, i + 500)
      .map((r) => ({
        id: r.id,
        name: r.naam,
        status: "actief",
        postcode: r.postcode,
        city: r.plaats,
        street: r.straat,
        nace_main: r.nace,
        categorie: r.cat,
        email: schoneMail(r.mail),
        phone: r.tel,
        website: schoneSite(r.site),
        lon: r.lon,
        lat: r.lat,
        bron: `overture ${release}`,
        updated_at: new Date().toISOString(),
      }))
      .filter((r) => r.website && r.name);
    // Tot vier pogingen: een haperende verbinding mag de import niet halverwege stoppen.
    let fout = null;
    for (let poging = 1; poging <= 4; poging++) {
      const { error } = await sb.from(tabel).upsert(deel, { onConflict: "id" });
      fout = error;
      if (!error) break;
      await new Promise((z) => setTimeout(z, 2000 * poging));
    }
    if (fout) {
      console.error(`${tabel}: FOUT bij rij ${i}:`, fout.message);
      process.exit(1);
    }
    klaar += deel.length;
  }
  console.log(`${tabel}: ${klaar} rijen bijgewerkt`);
}
