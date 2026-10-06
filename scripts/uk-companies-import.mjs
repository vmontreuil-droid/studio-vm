// VK: Companies House "BasicCompanyDataAsOneFile" → uk_companies.
//
//   1) Download http://download.companieshouse.gov.uk/en_output.html
//      → BasicCompanyDataAsOneFile-YYYY-MM-DD.zip, en pak uit (CSV, ~2,8 GB).
//   2) node scripts/uk-companies-import.mjs /pad/naar/BasicCompanyDataAsOneFile-….csv [--droog]
//
// DuckDB staat niet in package.json: zet DUCKDB_DIR naar een map waar
// `npm i @duckdb/node-api` gedraaid is (zoals bij overture-import.mjs).
//
// Enkel actieve bedrijven met een SIC-code in de doelgroep (een van de vier
// SIC-velden); sic_main = die doelgroep-code, zodat de NACE-filter ze vindt.
// Website, adressen en scan worden niet aangeraakt (blijven bij een herimport).

import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const args = process.argv.slice(2);
const DROOG = args.includes("--droog");
const CSV = args.find((a) => !a.startsWith("--"))?.replace(/\\/g, "/");
if (!CSV || !existsSync(CSV)) { console.error("Pad naar de uitgepakte CSV vereist."); process.exit(1); }

for (const l of readFileSync(path.join(REPO, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const repoRequire = createRequire(path.join(REPO, "package.json"));
const duckRequire = createRequire(path.join(process.env.DUCKDB_DIR || REPO, "package.json"));
const { DuckDBInstance } = duckRequire("@duckdb/node-api");
const { createClient } = repoRequire("@supabase/supabase-js");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Zelfde codes als NACE_OPTIES in src/lib/admin/aannemers.ts, in SIC-vorm.
const CODES = "^(42|431|4399|4120|8130|0812|711)";
const sic = (i) => `coalesce("SICCode.SicText_${i}", '')`;
const treffer = (i) => `CASE WHEN regexp_matches(${sic(i)}, '${CODES}') THEN regexp_extract(${sic(i)}, '^(\\d{4,5})', 1) END`;

const db = await (await DuckDBInstance.create(":memory:")).connect();
const t0 = Date.now();
await db.run(`CREATE TABLE r AS SELECT * FROM (
  SELECT trim(CompanyNumber) AS company_number,
         nullif(trim(CompanyName), '') AS name,
         CompanyStatus AS status,
         CompanyCategory AS category,
         CAST(try_strptime(IncorporationDate, '%d/%m/%Y') AS DATE)::VARCHAR AS incorporated_date,
         nullif(trim("RegAddress.PostCode"), '') AS postcode,
         nullif(trim("RegAddress.PostTown"), '') AS city,
         nullif(concat_ws(', ', nullif(trim("RegAddress.AddressLine1"), ''), nullif(trim("RegAddress.AddressLine2"), '')), '') AS street,
         coalesce(${treffer(1)}, ${treffer(2)}, ${treffer(3)}, ${treffer(4)}) AS sic_main
  FROM read_csv('${CSV}', header = true, all_varchar = true, quote = '"', escape = '"', ignore_errors = true)
  WHERE CompanyStatus = 'Active'
) WHERE sic_main IS NOT NULL AND name IS NOT NULL`);
const [{ n }] = (await db.runAndReadAll("SELECT count(*)::INT AS n FROM r")).getRowObjectsJson();
console.log(`${n} actieve bedrijven in de doelgroep (${Math.round((Date.now() - t0) / 1000)} s)`);
console.table((await db.runAndReadAll("SELECT sic_main AS sic, count(*)::INT AS n FROM r GROUP BY 1 ORDER BY n DESC")).getRowObjectsJson());
if (DROOG) process.exit(0);

const BATCH = 1000;
let klaar = 0;
for (let van = 0; van < n; van += 20_000) {
  const nu = new Date().toISOString();
  const rijen = (await db.runAndReadAll(`SELECT * FROM r ORDER BY company_number LIMIT 20000 OFFSET ${van}`))
    .getRowObjectsJson()
    .map((r) => ({ ...r, updated_at: nu }));
  const delen = [];
  for (let i = 0; i < rijen.length; i += BATCH) delen.push(rijen.slice(i, i + BATCH));
  // Vier tegelijk; tot vier pogingen per deel, zodat een haperende verbinding de import niet stopt.
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let deel; (deel = delen.shift()); ) {
        let fout = null;
        for (let poging = 1; poging <= 4; poging++) {
          const { error } = await sb.from("uk_companies").upsert(deel, { onConflict: "company_number" });
          fout = error;
          if (!error) break;
          await new Promise((z) => setTimeout(z, 2000 * poging));
        }
        if (fout) { console.error("FOUT:", fout.message); process.exit(1); }
        klaar += deel.length;
      }
    }),
  );
  console.log(`  ${klaar}/${n}`);
}
console.log(`uk_companies: ${klaar} rijen (${Math.round((Date.now() - t0) / 1000)} s)`);
