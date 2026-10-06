// Frankrijk: Sirene-stock (parquet, data.gouv.fr) → sirene_compact (migratie 0055).
//
//   node scripts/sirene-compact-import.mjs [map] [--droog]
//     map       waar de twee parquet-bestanden staan (standaard: ~/Downloads)
//               stock-stocketablissement-parquet.parquet
//               stock-stockunitelegale-parquet.parquet
//     --droog   enkel tellen, niets schrijven
//
// DuckDB staat niet in package.json: zet DUCKDB_DIR naar een map waar
// `npm i @duckdb/node-api` gedraaid is (zoals bij overture-import.mjs).
//
// Enkel actieve vestigingen in de doelgroep-codes (NAF rev. 2) die niet
// tegen prospectie gekant zijn (statutDiffusion 'O'; 'P' = diffusion
// partielle, wettelijk uitgesloten). Wat de outreach al vond in
// sirene_enterprises (website, adressen, scan) gaat mee naar de nieuwe rij.

import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const args = process.argv.slice(2);
const DROOG = args.includes("--droog");
const MAP = args.find((a) => !a.startsWith("--")) ?? path.join(os.homedir(), "Downloads");
const ETAB = path.join(MAP, "stock-stocketablissement-parquet.parquet").replace(/\\/g, "/");
const UL = path.join(MAP, "stock-stockunitelegale-parquet.parquet").replace(/\\/g, "/");
for (const f of [ETAB, UL]) if (!existsSync(f)) { console.error("Ontbreekt:", f); process.exit(1); }

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

// Zelfde codes als NACE_OPTIES in src/lib/admin/aannemers.ts, in NAF-vorm.
const CODES = "^(42\\.|43\\.1|43\\.99|41\\.20|81\\.30|08\\.12|71\\.1)";

const db = await (await DuckDBInstance.create(":memory:")).connect();
const t0 = Date.now();
await db.run(`CREATE TABLE r AS
  SELECT e.siret, e.siren,
         CAST(u.categorieJuridiqueUniteLegale AS VARCHAR) AS legal_form,
         e.etatAdministratifEtablissement AS status,
         CAST(e.dateCreationEtablissement AS VARCHAR) AS start_date,
         coalesce(nullif(trim(e.denominationUsuelleEtablissement), ''),
                  nullif(trim(e.enseigne1Etablissement), ''),
                  nullif(trim(u.denominationUniteLegale), ''),
                  nullif(trim(u.denominationUsuelle1UniteLegale), ''),
                  nullif(trim(concat_ws(' ', coalesce(u.prenomUsuelUniteLegale, u.prenom1UniteLegale),
                                        coalesce(u.nomUsageUniteLegale, u.nomUniteLegale))), '')) AS name,
         e.codePostalEtablissement AS postcode,
         e.libelleCommuneEtablissement AS city,
         nullif(concat_ws(' ', e.numeroVoieEtablissement, e.indiceRepetitionEtablissement,
                          e.typeVoieEtablissement, e.libelleVoieEtablissement), '') AS street,
         e.activitePrincipaleEtablissement AS ape_main
  FROM read_parquet('${ETAB}') e
  LEFT JOIN read_parquet('${UL}') u USING (siren)
  WHERE e.etatAdministratifEtablissement = 'A'
    AND e.statutDiffusionEtablissement = 'O'
    AND coalesce(u.statutDiffusionUniteLegale, 'O') = 'O'
    AND regexp_matches(e.activitePrincipaleEtablissement, '${CODES}')`);
const [{ n }] = (await db.runAndReadAll("SELECT count(*)::INT AS n FROM r")).getRowObjectsJson();
console.log(`${n} actieve vestigingen in de doelgroep (${Math.round((Date.now() - t0) / 1000)} s)`);
console.table((await db.runAndReadAll("SELECT left(ape_main, 5) AS code, count(*)::INT AS n FROM r GROUP BY 1 ORDER BY n DESC")).getRowObjectsJson());
if (DROOG) process.exit(0);

// Wat de outreach al vond: website, adressen, scanmoment.
const ERF = ["website", "email", "phone", "email_found", "email_scanned_at"];
const erf = new Map();
for (const filter of [
  (q) => q.not("email_scanned_at", "is", null).order("email_scanned_at"),
  (q) => q.not("website", "is", null).is("email_scanned_at", null).order("siret"),
]) {
  for (let van = 0; ; van += 1000) {
    const { data, error } = await filter(sb.from("sirene_enterprises").select(`siret, ${ERF.join(", ")}`)).range(van, van + 999);
    if (error) { console.error("Oude tabel lezen mislukt:", error.message); process.exit(1); }
    for (const r of data) erf.set(r.siret, r);
    if (data.length < 1000) break;
  }
}
console.log(`${erf.size} rijen met eerdere vondsten in de oude tabel`);

const BATCH = 1000;
let klaar = 0, geerfd = 0;
for (let van = 0; van < n; van += 20_000) {
  const blok = (await db.runAndReadAll(`SELECT * FROM r ORDER BY siret LIMIT 20000 OFFSET ${van}`)).getRowObjectsJson();
  const nu = new Date().toISOString();
  const rijen = blok.map((r) => {
    const oud = erf.get(r.siret);
    if (oud) geerfd++;
    return { ...r, ...(oud ? Object.fromEntries(ERF.map((k) => [k, oud[k]])) : {}), updated_at: nu };
  });
  const delen = [];
  for (let i = 0; i < rijen.length; i += BATCH) delen.push(rijen.slice(i, i + BATCH));
  // Vier tegelijk; tot vier pogingen per deel, zodat een haperende verbinding de import niet stopt.
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let deel; (deel = delen.shift()); ) {
        let fout = null;
        for (let poging = 1; poging <= 4; poging++) {
          const { error } = await sb.from("sirene_compact").upsert(deel, { onConflict: "siret" });
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
console.log(`sirene_compact: ${klaar} rijen, waarvan ${geerfd} met eerdere vondsten (${Math.round((Date.now() - t0) / 1000)} s)`);
