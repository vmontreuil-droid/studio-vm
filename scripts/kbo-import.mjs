#!/usr/bin/env node
// KBO-import: leest de uitgepakte KBO Open Data-CSV's (FOD Economie),
// joint op ondernemingsnummer en doet bulk-upserts naar Supabase.
//
// Gebruik:
//   1) Account aanmaken op https://kbopub.economie.fgov.be/kbo-open-data
//   2) Maandelijkse "full" dump downloaden en uitpakken — je krijgt:
//        enterprise.csv  denomination.csv  address.csv  activity.csv
//        contact.csv     code.csv          establishment.csv  branch.csv
//   3) In studio-vm:
//        npm i dotenv
//        node --max-old-space-size=4096 scripts/kbo-import.mjs \
//             /pad/naar/uitgepakte-kbo-folder
//
// .env.local moet bevatten:
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // val terug op .env als .env.local er niet is

const folder = process.argv[2];
if (!folder) {
  console.error("Pad naar de uitgepakte KBO-folder vereist.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Zet NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// --- mini-CSV-parser: één regel, dubbele-quote-escaping, komma-scheiding.
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
    console.warn(`! ${file} ontbreekt, sla over`);
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
    onRow(row);
    if (++n % 200_000 === 0) console.log(`  ${file}: ${n} rijen`);
  }
  console.log(`  ${file}: ${n} rijen totaal`);
}

function isoDate(s) {
  if (!s) return null;
  // KBO levert "DD-MM-YYYY"
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

const rows = new Map(); // EnterpriseNumber -> row
const ensure = (n) => {
  let r = rows.get(n);
  if (!r) {
    r = {
      enterprise_number: n,
      nace_codes: new Set(),
    };
    rows.set(n, r);
  }
  return r;
};

// 1) enterprise.csv — basis
await readCsv("enterprise.csv", (r) => {
  const n = r.EnterpriseNumber;
  if (!n) return;
  const e = ensure(n);
  e.type_of_enterprise = r.TypeOfEnterprise || null;
  e.juridical_form = r.JuridicalForm || null;
  e.juridical_status = r.JuridicalSituation || null;
  e.start_date = isoDate(r.StartDate);
});

// 2) denomination.csv — naam (commercieel > sociaal > afkorting),
//    enkel NL (val terug op FR/EN als NL ontbreekt).
const PREF = { "003": 3, "001": 2, "002": 1 };
const nameRank = new Map();
await readCsv("denomination.csv", (r) => {
  const n = r.EntityNumber;
  if (!n || !rows.has(n)) return;
  const t = r.TypeOfDenomination;
  const lang = r.Language;
  const name = (r.Denomination || "").trim();
  if (!name) return;
  // rang = type-prefix * 10 + taalpref (NL=3, FR=2, EN=1, andere=0)
  const langScore =
    lang === "2" ? 3 : lang === "1" ? 2 : lang === "3" ? 1 : 0; // KBO: 0=onbep,1=FR,2=NL,3=DE,4=EN
  const score = (PREF[t] || 0) * 10 + langScore;
  if ((nameRank.get(n) ?? -1) < score) {
    nameRank.set(n, score);
    rows.get(n).name = name;
  }
});

// 3) address.csv — registered office (REGO) heeft voorrang
const addrRank = new Map();
await readCsv("address.csv", (r) => {
  const n = r.EntityNumber;
  if (!n || !rows.has(n)) return;
  const isRego = (r.TypeOfAddress || "").toUpperCase().includes("REGO");
  const score = isRego ? 2 : 1;
  if ((addrRank.get(n) ?? -1) < score) {
    addrRank.set(n, score);
    const e = rows.get(n);
    e.postcode = r.Zipcode || null;
    e.city = r.MunicipalityNL || r.MunicipalityFR || null;
    e.street = r.StreetNL || r.StreetFR || null;
    e.house_number = r.HouseNumber || null;
  }
});

// 4) activity.csv — alleen NACE 2008
await readCsv("activity.csv", (r) => {
  const n = r.EntityNumber;
  if (!n || !rows.has(n)) return;
  if ((r.NaceVersion || "") !== "2008") return;
  const code = (r.NaceCode || "").trim();
  if (!code) return;
  const e = rows.get(n);
  e.nace_codes.add(code);
  if ((r.Classification || "").toUpperCase() === "MAIN" && !e.nace_main) {
    e.nace_main = code;
  }
});

// 5) contact.csv — TEL/EMAIL/WEB
await readCsv("contact.csv", (r) => {
  const n = r.EntityNumber;
  if (!n || !rows.has(n)) return;
  const t = (r.ContactType || "").toUpperCase();
  const v = (r.Value || "").trim();
  if (!v) return;
  const e = rows.get(n);
  if (t === "EMAIL" && !e.email) e.email = v.toLowerCase();
  else if (t === "TEL" && !e.phone) e.phone = v;
  else if (t === "WEB" && !e.website) e.website = v;
});

console.log(`\n${rows.size} ondernemingen samengesteld — start upsert…`);

// 6) Bulk-upsert in batches van 1000.
const all = [...rows.values()].map((r) => ({
  enterprise_number: r.enterprise_number,
  type_of_enterprise: r.type_of_enterprise ?? null,
  juridical_form: r.juridical_form ?? null,
  juridical_status: r.juridical_status ?? null,
  start_date: r.start_date ?? null,
  name: r.name ?? null,
  postcode: r.postcode ?? null,
  city: r.city ?? null,
  street: r.street ?? null,
  house_number: r.house_number ?? null,
  nace_main: r.nace_main ?? null,
  nace_codes: [...r.nace_codes],
  email: r.email ?? null,
  phone: r.phone ?? null,
  website: r.website ?? null,
  updated_at: new Date().toISOString(),
}));
rows.clear();

const BATCH = 500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function upsertWithRetry(table, chunk, conflict) {
  const delays = [1500, 4000, 10_000, 20_000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const { error } = await sb
        .from(table)
        .upsert(chunk, { onConflict: conflict });
      if (!error) return true;
      const msg = error.message || String(error);
      if (attempt === delays.length) {
        console.error(`    laatste poging: ${msg}`);
        return false;
      }
      console.warn(`    poging ${attempt + 1} faalde (${msg}) — wachten ${delays[attempt]}ms`);
      await sleep(delays[attempt]);
    } catch (e) {
      const msg = e?.message ?? String(e);
      if (attempt === delays.length) {
        console.error(`    laatste poging (throw): ${msg}`);
        return false;
      }
      console.warn(`    poging ${attempt + 1} throw (${msg}) — wachten ${delays[attempt]}ms`);
      await sleep(delays[attempt]);
    }
  }
  return false;
}

let inserted = 0;
let failed = 0;
for (let i = 0; i < all.length; i += BATCH) {
  const chunk = all.slice(i, i + BATCH);
  const ok = await upsertWithRetry(
    "kbo_enterprises",
    chunk,
    "enterprise_number",
  );
  if (ok) inserted += chunk.length;
  else failed += chunk.length;
  if (
    (inserted + failed) % 50_000 === 0 ||
    i + BATCH >= all.length
  ) {
    console.log(
      `  upserted ${inserted}/${all.length}${failed ? ` (${failed} gefaald)` : ""}`,
    );
  }
}
if (failed > 0) {
  console.warn(
    `! ${failed} rijen mislukt — re-run het script om enkel die opnieuw te proberen (idempotent).`,
  );
}

// 7) code.csv — vertaaltabel
console.log("\nCode-tabel laden…");
const codes = [];
await readCsv("code.csv", (r) => {
  if (!r.Category || !r.Code || !r.Language) return;
  codes.push({
    category: r.Category,
    code: r.Code,
    language: r.Language,
    description: r.Description ?? null,
  });
});
for (let i = 0; i < codes.length; i += BATCH) {
  const chunk = codes.slice(i, i + BATCH);
  await upsertWithRetry("kbo_codes", chunk, "category,code,language");
}
console.log(`  ${codes.length} code-rijen geüpsert`);

console.log("\nKlaar.");
