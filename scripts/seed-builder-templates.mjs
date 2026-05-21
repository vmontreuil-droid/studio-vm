#!/usr/bin/env node
// Seed-script v2 — Layout-archetypes × Style-variants.
//
// 10 LAYOUT-ARCHETYPES bepalen WELKE secties in welke volgorde
// een template heeft (de echte visuele identiteit), en 6 STYLE-
// VARIANTS bepalen de look (kleur + radius + tone).
//
//   10 × 6 = 60 templates die écht visueel onderscheidend zijn.
//
// Sector-agnostic: een template heeft (nog) geen sector. Bij Phase 2
// (builder leest ?template=slug) wordt de sector geïnjecteerd door
// de klant-keuze; de sector-content komt dan uit builder-presets.ts.
//
// Idempotent: wist eerst alle bestaande rows en insert opnieuw.
// Vincent hoeft geen TRUNCATE meer manueel te doen.
//
// Run:
//   node scripts/seed-builder-templates.mjs

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("⚠ Geen Supabase env-vars in .env.local");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// ────────────────────────────────────────────────────────────────
// 10 LAYOUT-ARCHETYPES
// Elk archetype = unieke section-volgorde + section-types. Het
// _variant-veld in de data is een hint voor de builder-render om
// een specifieke variatie te kiezen (groot beeld, split, ...).
// ────────────────────────────────────────────────────────────────
const ARCHETYPES = [
  {
    slug: "magazine",
    name: "Magazine",
    description:
      "Groot beeld + magazine-intro + drie features + gesplitste about. Voor verhalende merken.",
    sections: [
      { kind: "hero", data: { _variant: "large-bg" } },
      { kind: "features", data: { _variant: "three-col", _count: 3 } },
      { kind: "about", data: { _variant: "split" } },
      { kind: "gallery", data: { _variant: "masonry", _count: 6 } },
      { kind: "cta", data: { _variant: "wide" } },
      { kind: "contact", data: { _variant: "simple" } },
    ],
  },
  {
    slug: "split-hero",
    name: "Split-hero",
    description:
      "Tekst links, beeld rechts. Stats en CTA. Voor consulting, B2B, services.",
    sections: [
      { kind: "hero", data: { _variant: "split-right" } },
      { kind: "features", data: { _variant: "icon-grid", _count: 6 } },
      { kind: "stats", data: { _count: 4 } },
      { kind: "testimonials", data: { _variant: "compact" } },
      { kind: "cta", data: { _variant: "centered" } },
      { kind: "contact", data: { _variant: "simple" } },
    ],
  },
  {
    slug: "video-hero",
    name: "Video-hero",
    description:
      "Hero met video-achtergrond, timeline-features en testimonials-slider. Voor premium en architect/fitness.",
    sections: [
      { kind: "hero", data: { _variant: "video-bg" } },
      { kind: "features", data: { _variant: "timeline", _count: 4 } },
      { kind: "testimonials", data: { _variant: "slider", _count: 3 } },
      { kind: "logos", data: { _variant: "row" } },
      { kind: "cta", data: { _variant: "dark" } },
      { kind: "contact", data: { _variant: "boxed" } },
    ],
  },
  {
    slug: "grid-portfolio",
    name: "Grid-portfolio",
    description:
      "Compact intro + meteen 9-cells gallery. Voor fotograaf, designer, bouw, ambacht.",
    sections: [
      { kind: "hero", data: { _variant: "compact" } },
      { kind: "gallery", data: { _variant: "grid-9", _count: 9 } },
      { kind: "about", data: { _variant: "compact" } },
      { kind: "cta", data: { _variant: "soft" } },
      { kind: "contact", data: { _variant: "simple" } },
    ],
  },
  {
    slug: "compact-cta",
    name: "Compact-CTA",
    description:
      "Strakke hero + tarieven + 3 stappen. Voor kapper, salon, retail met directe conversie.",
    sections: [
      { kind: "hero", data: { _variant: "compact-cta" } },
      { kind: "pricelist", data: { _variant: "rows", _count: 6 } },
      { kind: "steps", data: { _count: 3 } },
      { kind: "testimonials", data: { _variant: "compact", _count: 2 } },
      { kind: "contact", data: { _variant: "simple" } },
    ],
  },
  {
    slug: "story",
    name: "Story",
    description:
      "Manifest-hero + lang-formaat about + testimonials. Voor ambacht, kunst, slowfood.",
    sections: [
      { kind: "hero", data: { _variant: "manifest" } },
      { kind: "about", data: { _variant: "long-form" } },
      { kind: "gallery", data: { _variant: "two-col", _count: 4 } },
      { kind: "testimonials", data: { _variant: "quote", _count: 2 } },
      { kind: "cta", data: { _variant: "soft" } },
      { kind: "contact", data: { _variant: "simple" } },
    ],
  },
  {
    slug: "booking-first",
    name: "Booking-first",
    description:
      "Hero + reserveerwidget meteen bovenaan. Voor wellness, tandarts, kinesist.",
    sections: [
      { kind: "hero", data: { _variant: "compact-cta" } },
      { kind: "form", data: { _variant: "booking" } },
      { kind: "features", data: { _variant: "three-col", _count: 3 } },
      { kind: "hours", data: {} },
      { kind: "map", data: {} },
      { kind: "contact", data: { _variant: "simple" } },
    ],
  },
  {
    slug: "pricelist-first",
    name: "Pricelist-first",
    description:
      "Compacte hero + tarieven dominant + kleine gallery. Voor coiffeur, garage, schoonheidssalon.",
    sections: [
      { kind: "hero", data: { _variant: "compact" } },
      { kind: "pricelist", data: { _variant: "cards", _count: 8 } },
      { kind: "gallery", data: { _variant: "row", _count: 4 } },
      { kind: "faq", data: { _count: 4 } },
      { kind: "contact", data: { _variant: "simple" } },
    ],
  },
  {
    slug: "hours-prominent",
    name: "Hours-prominent",
    description:
      "Hero + openingsuren groot + kaart. Voor lokale handelszaken met fysieke aanwezigheid.",
    sections: [
      { kind: "hero", data: { _variant: "compact" } },
      { kind: "hours", data: { _variant: "prominent" } },
      { kind: "map", data: { _variant: "prominent" } },
      { kind: "features", data: { _variant: "icon-grid", _count: 4 } },
      { kind: "gallery", data: { _variant: "row", _count: 3 } },
      { kind: "contact", data: { _variant: "boxed" } },
    ],
  },
  {
    slug: "newsletter-led",
    name: "Newsletter-led",
    description:
      "Modern hero + nieuwsbrief-opt-in vooraan. Voor merken die lijst willen opbouwen.",
    sections: [
      { kind: "hero", data: { _variant: "modern" } },
      { kind: "newsletter", data: { _variant: "wide" } },
      { kind: "features", data: { _variant: "three-col", _count: 3 } },
      { kind: "about", data: { _variant: "compact" } },
      { kind: "testimonials", data: { _variant: "quote", _count: 2 } },
      { kind: "contact", data: { _variant: "simple" } },
    ],
  },
];

// ────────────────────────────────────────────────────────────────
// 6 STYLE-VARIANTS — kleur + radius + tone
// ────────────────────────────────────────────────────────────────
const STYLES = [
  {
    suffix: "bold",
    label: "Bold",
    accent: "#ef7e22",
    radius: "strak",
    tone: "zakelijk",
    desc: "Donker contrast, krachtig oranje accent",
  },
  {
    suffix: "warm",
    label: "Warm",
    accent: "#d97706",
    radius: "zacht",
    tone: "warm",
    desc: "Aardetinten, zachte hoeken, gastvrij",
  },
  {
    suffix: "sharp",
    label: "Sharp",
    accent: "#2563eb",
    radius: "strak",
    tone: "zakelijk",
    desc: "Minimalistisch blauw, professional",
  },
  {
    suffix: "soft",
    label: "Soft",
    accent: "#db2777",
    radius: "rond",
    tone: "warm",
    desc: "Pastel-roze, ronde corners, open",
  },
  {
    suffix: "fresh",
    label: "Fresh",
    accent: "#16a34a",
    radius: "zacht",
    tone: "speels",
    desc: "Levendig groen, optimistisch",
  },
  {
    suffix: "elegant",
    label: "Elegant",
    accent: "#7c3aed",
    radius: "zacht",
    tone: "zakelijk",
    desc: "Diep paars, premium-uitstraling",
  },
];

// ────────────────────────────────────────────────────────────────
// Header- en page-bouw per template
// ────────────────────────────────────────────────────────────────
function buildHeader(style) {
  return {
    logo_text: "Studio VM",
    accent: style.accent,
    radius: style.radius,
    nav: [
      { label: "Home", page: "p_home" },
      { label: "Contact", page: "p_contact" },
    ],
  };
}

function buildPages(archetype) {
  const home = {
    id: "p_home",
    name: "Home",
    sections: archetype.sections.map((s, i) => ({
      id: `s_${archetype.slug}_${i}`,
      kind: s.kind,
      data: s.data,
    })),
  };
  // Elk template krijgt ook een eenvoudige contact-pagina.
  const contact = {
    id: "p_contact",
    name: "Contact",
    sections: [
      {
        id: `s_${archetype.slug}_contact`,
        kind: "contact",
        data: { _variant: "boxed" },
      },
    ],
  };
  return [home, contact];
}

// ────────────────────────────────────────────────────────────────
// Bouw alle 60 templates
// ────────────────────────────────────────────────────────────────
const ALL = [];
for (let i = 0; i < ARCHETYPES.length; i++) {
  const arch = ARCHETYPES[i];
  for (let j = 0; j < STYLES.length; j++) {
    const style = STYLES[j];
    ALL.push({
      slug: `${arch.slug}-${style.suffix}`,
      name: `${arch.name} — ${style.label}`,
      sector: null,
      tone: style.tone,
      accent_color: style.accent,
      radius: style.radius,
      preview_url: null,
      description: `${arch.description}\n${style.desc}.`,
      header: buildHeader(style),
      pages: buildPages(arch),
      is_live: false,
      sort_order: i * 10 + j,
    });
  }
}

console.log(
  `✓ ${ARCHETYPES.length} archetypes × ${STYLES.length} styles = ${ALL.length} templates voorbereid`,
);

// ────────────────────────────────────────────────────────────────
// Eerst alles wissen (idempotent reset), dan opnieuw seeden
// ────────────────────────────────────────────────────────────────
console.log("→ huidige builder_templates wissen…");
const { error: delErr } = await sb
  .from("builder_templates")
  .delete()
  .neq("id", "00000000-0000-0000-0000-000000000000"); // match-all hack
if (delErr) {
  console.error("⚠ delete fout:", delErr.message);
  process.exit(1);
}
console.log("  oude rows weg.\n");

// Insert nieuwe batch
const CHUNK = 30;
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

console.log(
  `\n✓ Klaar — ${inserted} archetype-templates in de DB (status: draft).`,
);
console.log(`  Bekijk in /admin/templates-lab en activeer per template.`);
console.log(
  `  Volgende sessie: builder leest ?template=slug + hydrateert met sector-content.`,
);
