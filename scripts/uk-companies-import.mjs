#!/usr/bin/env node
// UK Companies House — bulk basic data import (~5 M companies).
//
// Gebruik:
//   1) Download van http://download.companieshouse.gov.uk/en_output.html
//      → "BasicCompanyDataAsOneFile-YYYY-MM-DD.zip" (~250 MB)
//   2) Uitpakken → "BasicCompanyDataAsOneFile-YYYY-MM-DD.csv" (~500 MB)
//   3) Run:
//        node --max-old-space-size=4096 scripts/uk-companies-import.mjs \
//             /pad/naar/BasicCompanyDataAsOneFile-YYYY-MM-DD.csv

import fs from "node:fs";
import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const file = process.argv[2];
if (!file) {
  console.error("Pad naar BasicCompanyDataAsOneFile-YYYY-MM-DD.csv vereist.");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Zet NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function upsert(chunk) {
  for (const wait of [1500, 4000, 10_000, 0]) {
    const { error } = await sb
      .from("uk_companies")
      .upsert(chunk, { onConflict: "company_number" });
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

function isoDate(s) {
  if (!s) return null;
  // UK formaat: "DD/MM/YYYY"
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

const BATCH = 1000;
let buf = [];
let upserted = 0;
let failed = 0;

console.log(`> ${file}`);
const rl = readline.createInterface({
  input: fs.createReadStream(file, { encoding: "utf8" }),
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
  if (!row.CompanyNumber) continue;
  // SIC-code zit als "12345 - Description" → eerste 5 cijfers eruit.
  const sicRaw = row["SICCode.SicText_1"] || "";
  const sicMatch = sicRaw.match(/^(\d{4,5})/);
  buf.push({
    company_number: row.CompanyNumber,
    name: row.CompanyName || null,
    status: row.CompanyStatus || null,
    category: row.CompanyCategory || null,
    incorporated_date: isoDate(row.IncorporationDate),
    postcode: row["RegAddress.PostCode"] || null,
    city: row["RegAddress.PostTown"] || null,
    street:
      [
        row["RegAddress.AddressLine1"],
        row["RegAddress.AddressLine2"],
      ]
        .filter(Boolean)
        .join(", ") || null,
    sic_main: sicMatch ? sicMatch[1] : null,
    email: null,
    phone: null,
    website: null,
    updated_at: new Date().toISOString(),
  });
  if (++n % 250_000 === 0) console.log(`  ${n} rijen gelezen`);
  if (buf.length >= BATCH) {
    const ok = await upsert(buf);
    if (ok) upserted += buf.length;
    else failed += buf.length;
    buf = [];
    if (upserted % 100_000 === 0) console.log(`  upserted ${upserted}`);
  }
}
if (buf.length > 0) {
  const ok = await upsert(buf);
  if (ok) upserted += buf.length;
  else failed += buf.length;
}

console.log(`\nKlaar — ${upserted} upserted${failed ? `, ${failed} mislukt` : ""}.`);
