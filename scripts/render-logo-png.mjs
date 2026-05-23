// Rendert het studio-vm logo naar hoogresolutie PNG-bestanden voor gebruik
// op Facebook (profielfoto), LinkedIn (avatar), favicon en e-mails.
//
// Output (in public/social/):
//   logo-square-dark.png     — 1024×1024, donkere achtergrond, vm. logo  (FB profielfoto)
//   logo-square-light.png    — 1024×1024, witte achtergrond, vm. logo    (witte sites)
//   logo-transparent.png     — 1024×1024, transparante achtergrond       (overlay)
//   logo-wide-dark.png       — 1640×624, donkere bg, brand-cover         (FB coverfoto)

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const OUT_DIR = resolve(process.cwd(), "public/social");

// Studio-vm logo HTML — exact zoals in src/components/logo.tsx:
//   font-extrabold lowercase tracking-tighter, "vm" wit, "." amber
const HTML = (opts) => `<!DOCTYPE html>
<html><head><style>
  @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@800&display=swap");
  html,body { margin:0; padding:0; width:100%; height:100%; }
  body {
    background: ${opts.bg};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Montserrat", system-ui, sans-serif;
  }
  .logo {
    font-weight: 800;
    text-transform: lowercase;
    letter-spacing: -0.05em;
    font-size: ${opts.fontSize}px;
    line-height: 1;
    color: #ffffff;
    display: flex;
    align-items: baseline;
  }
  .logo .dot { color: #f59e0b; }
  ${opts.subtitle ? `
  .col { display: flex; flex-direction: column; align-items: center; gap: 24px; }
  .sub {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: ${opts.subtitleSize ?? 28}px;
    color: rgba(255,255,255,0.7);
    letter-spacing: 5px;
    text-transform: uppercase;
  }
  ` : ""}
</style></head><body>
  ${opts.subtitle ? `<div class="col">` : ""}
  <div class="logo">vm<span class="dot">.</span></div>
  ${opts.subtitle ? `<div class="sub">${opts.subtitle}</div></div>` : ""}
</body></html>`;

async function render(page, html, out, viewport, transparent = false) {
  await page.setViewportSize(viewport);
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(500); // Montserrat-load wait
  await page.screenshot({
    path: out,
    type: "png",
    omitBackground: transparent,
    clip: { x: 0, y: 0, ...viewport },
  });
  console.log(`✓ ${out}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  // 1) Vierkant op donker (FB-profielfoto)
  await render(
    page,
    HTML({ bg: "#0a0a0a", fontSize: 560 }),
    resolve(OUT_DIR, "logo-square-dark.png"),
    { width: 1024, height: 1024 },
  );

  // 2) Vierkant op licht
  await render(
    page,
    HTML({
      bg: "#ffffff",
      fontSize: 560,
    }).replace("color: #ffffff", "color: #111111"),
    resolve(OUT_DIR, "logo-square-light.png"),
    { width: 1024, height: 1024 },
  );

  // 3) Transparant (witte versie — voor donkere overlays)
  await render(
    page,
    HTML({ bg: "transparent", fontSize: 560 }),
    resolve(OUT_DIR, "logo-transparent.png"),
    { width: 1024, height: 1024 },
    true,
  );

  // 4) Wide cover-foto (FB cover = 1640×624)
  await render(
    page,
    HTML({
      bg: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 35%, #6d28d9 100%)",
      fontSize: 380,
      subtitle: "websites voor KMO's in Vlaanderen",
      subtitleSize: 38,
    }),
    resolve(OUT_DIR, "logo-cover-fb.png"),
    { width: 1640, height: 624 },
  );

  await browser.close();
  console.log("\nKlaar — alle PNG's in public/social/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
