// Screenshot-script — neemt 1× per portfolio-site een schermafdruk en
// slaat ze op in public/social/portfolio/{slug}.png.
//
// Run vanuit project-root:
//   node scripts/screenshot-portfolio.mjs
//
// Update wanneer een klant-site visueel wijzigt — duurt ~1 min totaal.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const PORTFOLIO = [
  // Live op echt domein:
  { slug: "celineinterieur", url: "https://celineinterieur.com" },
  { slug: "montreuil", url: "https://montreuil.be" },
  { slug: "mari-lines", url: "https://mari-lines.be" },
  { slug: "favesan", url: "https://favesan.be" },
  { slug: "studio-vm", url: "https://studio-vm.be" },
  // Nog op .vercel.app:
  { slug: "allardphilippe", url: "https://allardphilippe.vercel.app" },
  { slug: "barbotte", url: "https://barbotte.vercel.app" },
  { slug: "cottage-waregem", url: "https://cottage-waregem.vercel.app" },
];

const OUT_DIR = resolve(process.cwd(), "public/social/portfolio");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  for (const { slug, url } of PORTFOLIO) {
    const out = resolve(OUT_DIR, `${slug}.png`);
    try {
      const page = await ctx.newPage();
      console.log(`→ ${url}`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      // Even wachten op fonts/animaties
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: out,
        clip: { x: 0, y: 0, width: 1280, height: 800 },
      });
      await page.close();
      console.log(`   ✓ ${out}`);
    } catch (e) {
      console.error(`   ✗ ${url}: ${e instanceof Error ? e.message : e}`);
    }
  }

  await browser.close();
  console.log("\nKlaar.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

void dirname;
