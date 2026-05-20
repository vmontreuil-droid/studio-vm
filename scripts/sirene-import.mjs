#!/usr/bin/env node
// Sirene-import (INSEE, Frankrijk) — ~25 M etablissementen.
//
// Gebruik:
//   1) Download van data.gouv.fr → "Base Sirene des entreprises et de
//      leurs établissements" → stock-CSV ZIP (~2 GB gezipt, ~10 GB uitgepakt).
//   2) Uitpakken naar één map, je krijgt o.a.:
//        StockUniteLegale_utf8.csv          (~1,5 GB — bedrijven, namen)
//        StockEtablissement_utf8.csv        (~5 GB — vestigingen, adressen)
//   3) Run:
//        node --max-old-space-size=8192 scripts/sirene-import.mjs \
//             /pad/naar/uitgepakte-sirene-folder
//
// .env.local nodig: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const folder = process.argv[2];
if (!folder) {
  console.error("Pad naar de uitgepakte Sirene-folder vereist.");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Zet NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// Tolerant CSV-rij splits (komma-scheiding, dubbele-quote-escape).
function splitCsv(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (c === "," && !q) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

async function readCsv(file, onRow) {
  const full = path.join(folder, file);
  if (!fs.existsSync(full)) {
    console.warn(`! ${file} ontbreekt`);
    return;
  }
  console.log(`> ${file}`);
  const rl = readline.createInterface({
    input: fs.createReadStream(full, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let header = null;
  let n = 0;
  for await (const line of rl) {
    if (!line) continue;
    const cols = splitCsv(line);
    if (!header) {
      header = cols;
      continue;
    }
    const row = {};
    for (let i = 0; i < header.length; i++) row[header[i]] = cols[i];
    // Async callback support — backpressure: leesstroom wacht op
    // flush voor we verder gaan, dus geheugen blijft begrensd.
    await onRow(row);
    if (++n % 250_000 === 0) console.log(`  ${file}: ${n} rijen`);
  }
  console.log(`  ${file}: ${n} totaal`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function upsertWithRetry(table, chunk, conflict) {
  for (const wait of [1500, 4000, 10_000, 0]) {
    const { error } = await sb.from(table).upsert(chunk, {
      onConflict: conflict,
      ignoreDuplicates: false,
    });
    if (!error) return true;
    if (wait === 0) {
      console.error(`    laatste poging: ${error.message}`);
      return false;
    }
    console.warn(`    fout, retry in ${wait}ms (${error.message})`);
    await sleep(wait);
  }
  return false;
}

// 1) UniteLegale → naam + rechtsvorm per SIREN
const legal = new Map();
await readCsv("StockUniteLegale_utf8.csv", (r) => {
  const siren = r.siren;
  if (!siren) return;
  legal.set(siren, {
    name:
      r.denominationUniteLegale ||
      r.denominationUsuelle1UniteLegale ||
      r.nomUniteLegale ||
      null,
    form: r.categorieJuridiqueUniteLegale || null,
  });
});
console.log(`${legal.size} unités légales geladen\n`);

// 2) Etablissement-stream → bouw rijen + bulk-upsert in batches.
const BATCH = 1000;
let buf = [];
let upserted = 0;
let failed = 0;

async function flush() {
  if (buf.length === 0) return;
  const ok = await upsertWithRetry("sirene_enterprises", buf, "siret");
  if (ok) upserted += buf.length;
  else failed += buf.length;
  if (upserted % 100_000 === 0 || failed > 0) {
    console.log(`  upserted ${upserted}${failed ? ` (${failed} mislukt)` : ""}`);
  }
  buf = [];
}

await readCsv("StockEtablissement_utf8.csv", async (r) => {
  const siret = r.siret;
  if (!siret) return;
  const siren = r.siren ?? siret.slice(0, 9);
  const ul = legal.get(siren);
  const street =
    [
      r.numeroVoieEtablissement,
      r.typeVoieEtablissement,
      r.libelleVoieEtablissement,
    ]
      .filter(Boolean)
      .join(" ") || null;
  buf.push({
    siret,
    siren,
    legal_form: ul?.form ?? null,
    status: r.etatAdministratifEtablissement || null,
    start_date:
      r.dateCreationEtablissement &&
      /^\d{4}-\d{2}-\d{2}/.test(r.dateCreationEtablissement)
        ? r.dateCreationEtablissement.slice(0, 10)
        : null,
    name:
      r.denominationUsuelleEtablissement ||
      r.enseigne1Etablissement ||
      ul?.name ||
      null,
    postcode: r.codePostalEtablissement || null,
    city: r.libelleCommuneEtablissement || null,
    street,
    ape_main: r.activitePrincipaleEtablissement || null,
    email: null,
    phone: null,
    website: null,
    updated_at: new Date().toISOString(),
  });
  if (buf.length >= BATCH) {
    await flush();
  }
});
await flush();
console.log(`\nKlaar — ${upserted} upserted${failed ? `, ${failed} mislukt` : ""}.`);
