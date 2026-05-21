#!/usr/bin/env node
// Seed-script: vult builder_templates tabel met ALLE 130 sectoren uit
// builder-presets.ts. Genereert per sector 1 default template + voor
// een set populaire sectoren extra visual-variants → ~150 templates
// totaal, voldoende voor een eerste indrukwekkende gallery-launch.
//
// Idempotent: gebruikt upsert on (slug). Opnieuw runnen = updates
// alleen waar nodig.
//
// Run:
//   node scripts/seed-builder-templates.mjs

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("⚠ Geen Supabase env-vars in .env.local");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// Lees sectoren uit builder-presets.ts via regex (de file is TS,
// geen runtime-import zonder bouw-stap; regex is robuust genoeg).
const src = readFileSync(
  resolve("src/lib/builder-presets.ts"),
  "utf8",
);
const sectorRegex =
  /\{\s*key:\s*"([^"]+)",\s*base:\s*"([^"]+)",\s*nl:\s*"([^"]+)",\s*fr:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\}/g;
const sectors = [];
let m;
while ((m = sectorRegex.exec(src))) {
  sectors.push({
    key: m[1],
    base: m[2],
    nl: m[3],
    fr: m[4],
    en: m[5],
  });
}
console.log(`✓ ${sectors.length} sectoren ingelezen uit builder-presets.ts`);

// 6 visueel onderscheiden style-presets — elk een combinatie van
// accent-kleur, radius en tone. Een sector × style = 1 template.
const STYLES = [
  {
    suffix: "bold",
    label: "Bold",
    accent: "#ef7e22", // studio-vm oranje
    radius: "strak",
    tone: "zakelijk",
    desc: "Donker, krachtig contrast — voor wie indruk wil maken",
  },
  {
    suffix: "warm",
    label: "Warm",
    accent: "#d97706", // warm amber
    radius: "zacht",
    tone: "warm",
    desc: "Aardetinten en zachte hoeken — gastvrij, vertrouwd",
  },
  {
    suffix: "sharp",
    label: "Sharp",
    accent: "#2563eb", // strak blauw
    radius: "strak",
    tone: "zakelijk",
    desc: "Strak, minimalistisch — professional en helder",
  },
  {
    suffix: "soft",
    label: "Soft",
    accent: "#db2777", // pastel-roze
    radius: "rond",
    tone: "warm",
    desc: "Licht, rustig en gerond — vriendelijk en open",
  },
  {
    suffix: "fresh",
    label: "Fresh",
    accent: "#16a34a", // fris groen
    radius: "zacht",
    tone: "speels",
    desc: "Levendig groen, optimistisch en uitnodigend",
  },
  {
    suffix: "elegant",
    label: "Elegant",
    accent: "#7c3aed", // diep paars
    radius: "zacht",
    tone: "zakelijk",
    desc: "Verfijnd paars, premium-uitstraling",
  },
];

// Welke sectoren krijgen meerdere style-variants? (= 'top'-sectoren
// met meeste outreach-potentieel). De rest krijgt enkel 1 default.
const POPULAR = new Set([
  "restaurant",
  "brasserie",
  "cafe",
  "bar",
  "pizzeria",
  "bakkerij",
  "kapper",
  "barbier",
  "schoonheidssalon",
  "spa",
  "kledingwinkel",
  "juwelier",
  "bloemist",
  "interieurwinkel",
  "fitness",
  "tandarts",
  "kinesist",
  "huisarts",
  "advocaat",
  "notaris",
  "boekhouder",
  "architect",
  "fotograaf",
  "garage",
]);

// Default-style-rotatie voor niet-populaire sectoren (1 style per sector,
// op basis van een hash van de key → blijft stabiel over runs).
function defaultStyleFor(sectorKey) {
  let h = 0;
  for (const c of sectorKey) h = (h * 31 + c.charCodeAt(0)) | 0;
  return STYLES[Math.abs(h) % STYLES.length];
}

// Minimal page-structuur per template — de échte sectie-content komt
// uit builder-presets via de bestaande engine. Hier alleen het 'recept':
// welke pagina's en welke sectie-volgorde. De builder hydrateert met
// sector-specifieke teksten zodra klant 'kies dit template' klikt.
function pagesFor(sectorKey, baseSector, locale) {
  const home = {
    id: "p_home",
    name: locale === "fr" ? "Accueil" : locale === "en" ? "Home" : "Home",
    sections: [
      { id: "s_hero", kind: "hero", data: { _sector: sectorKey } },
      { id: "s_features", kind: "features", data: { _sector: sectorKey } },
      { id: "s_about", kind: "about", data: { _sector: sectorKey } },
      { id: "s_offer", kind: "features", data: { _sector: sectorKey, _alt: "offer" } },
      { id: "s_cta", kind: "cta", data: { _sector: sectorKey } },
      { id: "s_contact", kind: "contact", data: { _sector: sectorKey } },
    ],
  };
  const contact = {
    id: "p_contact",
    name:
      locale === "fr" ? "Contact" : locale === "en" ? "Contact" : "Contact",
    sections: [
      { id: "s2_contact", kind: "contact", data: { _sector: sectorKey } },
    ],
  };
  return [home, contact];
}

function headerFor(sectorName, accent) {
  return {
    logo_text: sectorName,
    accent,
    nav: [
      { label: "Home", page: "p_home" },
      { label: "Contact", page: "p_contact" },
    ],
  };
}

const ALL = [];

// Voor elke sector: bepaal welke styles toepassen.
for (const sec of sectors) {
  const styles = POPULAR.has(sec.key) ? STYLES : [defaultStyleFor(sec.key)];
  let sortOffset = 0;
  for (const style of styles) {
    const isDefault = styles.length === 1;
    const slug = isDefault ? sec.key : `${sec.key}-${style.suffix}`;
    const name = isDefault ? sec.nl : `${sec.nl} — ${style.label}`;
    ALL.push({
      slug,
      name,
      sector: sec.key,
      tone: style.tone,
      accent_color: style.accent,
      radius: style.radius,
      preview_url: null,
      description: `${sec.nl} · ${style.desc}`,
      header: headerFor(sec.nl, style.accent),
      pages: pagesFor(sec.key, sec.base, "nl"),
      is_live: false, // pas zichtbaar maken na review
      sort_order: sortOffset++,
    });
  }
}

console.log(`✓ ${ALL.length} templates voorbereid (${sectors.length} sectoren × varianten)`);

// Batch-upsert per 50 om de payload-size te beperken.
const CHUNK = 50;
let inserted = 0;
for (let i = 0; i < ALL.length; i += CHUNK) {
  const batch = ALL.slice(i, i + CHUNK);
  const { error } = await sb
    .from("builder_templates")
    .upsert(batch, { onConflict: "slug" });
  if (error) {
    console.error(`  fout batch ${i}-${i + batch.length}:`, error.message);
    continue;
  }
  inserted += batch.length;
  console.log(`  upserted ${inserted}/${ALL.length}`);
}

console.log(`\n✓ Klaar — ${inserted} templates in de DB (status: draft / niet-live).`);
console.log(`  Activeer via /admin/templates-lab → "Live"-toggle per template.`);
