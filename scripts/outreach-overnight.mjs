#!/usr/bin/env node
// Achtergrond-runner: trekt de outreach-pijplijn de hele nacht door.
//
// Drie stappen, gesloten loop:
//   1) website-discovery        — vindt website-URL voor prospects zonder
//   2) outreach-email-finder    — scrape contact-pages voor email-adres
//   3) outreach-prescan         — site-scan + maak prospect_outreach-row
//
// Na een volledige loop wacht het script TICK_SEC voor de volgende run.
// Faalt-stil: één http-fout stopt de runner niet, alleen die stap wordt
// overgeslagen tot de volgende ronde.
//
// Gebruik:
//   node scripts/outreach-overnight.mjs
//
// Vereist in .env.local:
//   NEXT_PUBLIC_SITE_URL    https://studio-vm.be
//   CRON_SECRET             <secret uit Vercel env>

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const base =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://studio-vm.be";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("⚠ Geen CRON_SECRET in .env.local — script kan niet starten.");
  process.exit(1);
}

const TICK_SEC = Number(process.env.OVERNIGHT_TICK_SEC || 60);
const STEPS = [
  { name: "website-discovery", path: "/api/cron/website-discovery" },
  { name: "email-finder", path: "/api/cron/outreach-email-finder" },
  { name: "prescan", path: "/api/cron/outreach-prescan" },
];

const ts = () =>
  new Date().toLocaleTimeString("nl-BE", { hour12: false });

async function tick(step) {
  const url = `${base}${step.path}`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(305_000),
    });
    const dur = Math.round((Date.now() - started) / 1000);
    if (!res.ok) {
      console.log(`[${ts()}] ${step.name} → HTTP ${res.status} (${dur}s)`);
      return;
    }
    const j = await res.json().catch(() => ({}));
    console.log(`[${ts()}] ${step.name} → ${dur}s  ${JSON.stringify(j)}`);
  } catch (e) {
    const dur = Math.round((Date.now() - started) / 1000);
    console.log(
      `[${ts()}] ${step.name} → ERROR (${dur}s) ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }
}

console.log(
  `▶ outreach-overnight gestart — base=${base}  tick=${TICK_SEC}s  stappen=${STEPS.map(
    (s) => s.name,
  ).join(" → ")}`,
);
console.log(`  Stop met Ctrl+C.\n`);

let round = 0;
while (true) {
  round++;
  console.log(`── ronde ${round} ──`);
  for (const step of STEPS) {
    await tick(step);
  }
  await new Promise((r) => setTimeout(r, TICK_SEC * 1000));
}
