// Genereert 10 verschillende FB-omslagfoto-varianten (1640×624) zodat de
// gebruiker kan kiezen. Output: public/covers/cover-01.png ... cover-10.png
// + kopieën in public/ root (cover-01.png ... cover-10.png).

import { chromium } from "playwright";
import { mkdir, copyFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const OUT_DIR = resolve(process.cwd(), "public/covers");
const ROOT_DIR = resolve(process.cwd(), "public");
const PORTFOLIO_DIR = resolve(process.cwd(), "public/social/portfolio");

const FONT_CSS = `@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap");`;

// Helper — converteer lokale PNG naar data-URL voor inline embedding
async function dataUrl(filename) {
  try {
    const buf = await readFile(resolve(PORTFOLIO_DIR, filename));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

const LOGO = `<span style="font-family:Montserrat;font-weight:800;letter-spacing:-0.05em;line-height:1;color:#fff;">vm<span style="color:#f59e0b">.</span></span>`;
const LOGO_DARK = `<span style="font-family:Montserrat;font-weight:800;letter-spacing:-0.05em;line-height:1;color:#0a0a0a;">vm<span style="color:#f59e0b">.</span></span>`;

const BASE_HTML = (innerStyle, content) => `<!DOCTYPE html>
<html><head><style>
  ${FONT_CSS}
  html,body { margin:0; padding:0; width:1640px; height:624px; overflow:hidden; }
  body { ${innerStyle} font-family:Montserrat, system-ui, sans-serif; color:#fff; position:relative; }
  .row { display:flex; }
  .col { display:flex; flex-direction:column; }
</style></head><body>${content}</body></html>`;

// ============================================================================
// 10 COVER-DESIGNS
// ============================================================================
async function buildCovers() {
  const shots = {
    celine: await dataUrl("celineinterieur.png"),
    jp: await dataUrl("montreuil.png"),
    allard: await dataUrl("allardphilippe.png"),
    mari: await dataUrl("mari-lines.png"),
    barbotte: await dataUrl("barbotte.png"),
    cottage: await dataUrl("cottage-waregem.png"),
  };

  return [
    // === 01. Tagline-eerst + studio-gradient ===
    BASE_HTML(
      `background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 35%,#6d28d9 75%,#be185d 100%);`,
      `
      <div style="position:absolute;top:0;right:0;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,#f59e0b40 0%,transparent 70%);"></div>
      <div style="position:absolute;bottom:-100px;left:-50px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,#a855f750 0%,transparent 70%);"></div>
      <div style="padding:80px 100px;height:100%;display:flex;flex-direction:column;justify-content:space-between;position:relative;">
        <div style="display:inline-flex;align-items:center;gap:10px;padding:10px 22px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:9999px;width:fit-content;font-size:14px;letter-spacing:4px;text-transform:uppercase;font-weight:600;">
          <span style="width:10px;height:10px;border-radius:50%;background:#22c55e;"></span>
          studio-vm · waregem
        </div>
        <div>
          <div style="font-size:72px;font-weight:800;line-height:1.05;letter-spacing:-2px;max-width:1200px;">
            Snelle websites voor<br>KMO's en zelfstandigen<br>in Vlaanderen.
          </div>
          <div style="margin-top:24px;font-size:20px;font-family:ui-monospace,Menlo,monospace;letter-spacing:3px;text-transform:uppercase;opacity:0.7;">
            vaste prijs · eigen admin · geen wordpress
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:90px;font-weight:800;letter-spacing:-4px;line-height:1;">
            ${LOGO}
          </div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:16px;letter-spacing:3px;text-transform:uppercase;opacity:0.6;">
            studio-vm.be
          </div>
        </div>
      </div>`,
    ),

    // === 02. Portfolio-mosaic (6 sites) ===
    BASE_HTML(
      `background:#0a0a0a;`,
      `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;width:100%;height:80%;gap:4px;">
        ${[shots.celine, shots.jp, shots.allard, shots.mari, shots.barbotte, shots.cottage]
          .map(
            (s) => `<div style="overflow:hidden;display:flex;">
              ${s ? `<img src="${s}" style="width:100%;height:100%;object-fit:cover;object-position:top center;">` : '<div style="width:100%;height:100%;background:#1e293b;"></div>'}
            </div>`,
          )
          .join("")}
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:20%;background:linear-gradient(180deg,transparent 0%,#0a0a0a 100%);display:flex;align-items:center;padding:0 80px;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:24px;">
          <div style="font-size:60px;font-weight:800;letter-spacing:-3px;">${LOGO}</div>
          <div>
            <div style="font-size:24px;font-weight:700;letter-spacing:-0.5px;">8 sites en groeiend</div>
            <div style="font-size:14px;opacity:0.6;font-family:ui-monospace,Menlo,monospace;letter-spacing:3px;text-transform:uppercase;">solo bureau · waregem · vlaanderen</div>
          </div>
        </div>
        <div style="font-family:ui-monospace,Menlo,monospace;font-size:16px;letter-spacing:3px;text-transform:uppercase;opacity:0.7;">
          studio-vm.be
        </div>
      </div>`,
    ),

    // === 03. Big numbers (stats-cards) ===
    BASE_HTML(
      `background:radial-gradient(ellipse at top left,#1e3a8a 0%,#0f172a 50%,#000 100%);`,
      `
      <div style="padding:80px 100px;height:100%;display:flex;flex-direction:column;justify-content:space-between;">
        <div style="font-size:18px;letter-spacing:5px;text-transform:uppercase;opacity:0.6;font-family:ui-monospace,Menlo,monospace;">
          STUDIO-VM · CIJFERS DIE ERTOE DOEN
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px;">
          ${[
            { big: "&lt;1s", small: "Laadtijd op mobiel" },
            { big: "100/100", small: "PageSpeed Score" },
            { big: "€99", small: "Health Check audit" },
          ]
            .map(
              (s) => `<div>
            <div style="font-size:96px;font-weight:800;letter-spacing:-4px;line-height:1;background:linear-gradient(135deg,#f59e0b,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${s.big}</div>
            <div style="margin-top:12px;font-size:18px;font-family:ui-monospace,Menlo,monospace;letter-spacing:2px;text-transform:uppercase;opacity:0.7;">${s.small}</div>
          </div>`,
            )
            .join("")}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:64px;font-weight:800;letter-spacing:-3px;">${LOGO}</div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:3px;text-transform:uppercase;opacity:0.6;">
            studio-vm.be · waregem
          </div>
        </div>
      </div>`,
    ),

    // === 04. Pull-quote bold ===
    BASE_HTML(
      `background:linear-gradient(135deg,#000 0%,#1f2937 100%);`,
      `
      <div style="position:absolute;top:60px;left:80px;font-size:240px;font-weight:900;line-height:0.6;color:#f59e0b;opacity:0.15;">"</div>
      <div style="padding:90px 100px;height:100%;display:flex;flex-direction:column;justify-content:space-between;">
        <div style="font-size:14px;letter-spacing:5px;text-transform:uppercase;opacity:0.6;font-family:ui-monospace,Menlo,monospace;">
          studio-vm
        </div>
        <div style="font-size:76px;font-weight:800;line-height:1.1;letter-spacing:-2px;max-width:1300px;">
          Geen WordPress.<br>Geen plugins.<br>Geen <span style="color:#f59e0b;">verrassingen.</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:64px;font-weight:800;letter-spacing:-3px;">${LOGO}</div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:3px;text-transform:uppercase;opacity:0.6;">
            studio-vm.be
          </div>
        </div>
      </div>`,
    ),

    // === 05. Logo-centric minimalist ===
    BASE_HTML(
      `background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);`,
      `
      <div style="position:absolute;inset:0;background:radial-gradient(circle at center,rgba(245,158,11,0.08) 0%,transparent 50%);"></div>
      <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;">
        <div style="font-size:280px;font-weight:800;letter-spacing:-15px;line-height:1;">
          ${LOGO}
        </div>
        <div style="display:flex;align-items:center;gap:24px;">
          <div style="width:60px;height:1px;background:rgba(255,255,255,0.4);"></div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:22px;letter-spacing:8px;text-transform:uppercase;opacity:0.8;">
            studio-vm.be
          </div>
          <div style="width:60px;height:1px;background:rgba(255,255,255,0.4);"></div>
        </div>
        <div style="font-size:16px;letter-spacing:2px;text-transform:uppercase;opacity:0.5;font-family:ui-monospace,Menlo,monospace;">
          websites · waregem · sinds 2024
        </div>
      </div>`,
    ),

    // === 06. Case-spotlight (montreuil.be screenshot prominent) ===
    BASE_HTML(
      `background:linear-gradient(135deg,#0f172a 0%,#075985 70%,#0ea5e9 100%);`,
      `
      <div style="padding:60px 80px;height:100%;display:flex;gap:60px;align-items:center;">
        <div style="flex:1;display:flex;flex-direction:column;gap:18px;">
          <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5);border-radius:9999px;width:fit-content;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;color:#fbbf24;">
            ✨ Recent gebouwd
          </div>
          <div style="font-size:60px;font-weight:800;line-height:1.05;letter-spacing:-2px;">
            montreuil.be
          </div>
          <div style="font-size:20px;opacity:0.8;max-width:480px;line-height:1.5;">
            Wildlife-galerie + boekverkoop voor m'n vader Jean-Paul. Laadt in 0.7s op mobiel.
          </div>
          <div style="margin-top:16px;font-size:48px;font-weight:800;letter-spacing:-3px;">${LOGO}</div>
        </div>
        <div style="flex:1;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.15);box-shadow:0 30px 80px rgba(0,0,0,0.6);">
          ${shots.jp ? `<img src="${shots.jp}" style="width:100%;height:480px;object-fit:cover;object-position:top center;display:block;">` : ""}
        </div>
      </div>`,
    ),

    // === 07. Service-grid (3 services) ===
    BASE_HTML(
      `background:#0a0a0a;`,
      `
      <div style="padding:50px 80px;height:100%;display:flex;flex-direction:column;justify-content:space-between;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:54px;font-weight:800;letter-spacing:-3px;">${LOGO}</div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:3px;text-transform:uppercase;opacity:0.6;">
            wat wij doen
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">
          ${[
            { tag: "AUDIT", big: "Health Check", sub: "€99 — scan + rapport + 3 fixes", color: "#0ea5e9" },
            { tag: "BUILD", big: "Custom website", sub: "Vaste prijs, vanaf de Starter-formule", color: "#a855f7" },
            { tag: "MIGRATIE", big: "Van WordPress af", sub: "Moderne stack — geen onderhoud-abonnement", color: "#f59e0b" },
          ]
            .map(
              (s) => `<div style="padding:24px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;">
            <div style="display:inline-block;padding:4px 10px;background:${s.color}30;border:1px solid ${s.color};border-radius:6px;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:3px;color:${s.color};margin-bottom:14px;">${s.tag}</div>
            <div style="font-size:30px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;">${s.big}</div>
            <div style="margin-top:8px;font-size:14px;opacity:0.7;line-height:1.4;">${s.sub}</div>
          </div>`,
            )
            .join("")}
        </div>
        <div style="text-align:center;font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:3px;text-transform:uppercase;opacity:0.5;">
          studio-vm.be · waregem
        </div>
      </div>`,
    ),

    // === 08. Founder-card (persoonlijk) ===
    BASE_HTML(
      `background:linear-gradient(135deg,#0a0a0a 0%,#1e1b4b 50%,#0a0a0a 100%);`,
      `
      <div style="padding:80px 100px;height:100%;display:flex;flex-direction:column;justify-content:space-between;">
        <div style="display:inline-flex;align-items:center;gap:10px;padding:8px 18px;background:rgba(245,158,11,0.15);border:1px solid #f59e0b80;border-radius:9999px;width:fit-content;font-size:13px;letter-spacing:4px;text-transform:uppercase;font-weight:600;color:#fbbf24;">
          🟠 solo bureau
        </div>
        <div>
          <div style="font-size:24px;opacity:0.5;font-family:ui-monospace,Menlo,monospace;letter-spacing:3px;text-transform:uppercase;">Gerund door</div>
          <div style="font-size:88px;font-weight:800;letter-spacing:-3px;line-height:1;margin-top:8px;">Vincent Montreuil</div>
          <div style="margin-top:20px;font-size:24px;opacity:0.7;max-width:1100px;line-height:1.4;">
            Bouwer, ontwerper, ondernemer. Eén persoon achter studio-vm.<br>
            Bouwt websites voor zelfstandigen en KMO's vanuit Waregem sinds 2024.
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:70px;font-weight:800;letter-spacing:-3px;">${LOGO}</div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:3px;text-transform:uppercase;opacity:0.6;">
            studio-vm.be
          </div>
        </div>
      </div>`,
    ),

    // === 09. Voor/na vergelijking ===
    BASE_HTML(
      `background:#0a0a0a;`,
      `
      <div style="display:grid;grid-template-columns:1fr 1fr;height:100%;">
        <div style="background:linear-gradient(135deg,#3f1d1d 0%,#7f1d1d 100%);padding:60px;display:flex;flex-direction:column;justify-content:center;gap:24px;">
          <div style="display:inline-block;padding:4px 12px;background:rgba(239,68,68,0.3);border:1px solid #ef4444;border-radius:6px;font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:3px;color:#fca5a5;width:fit-content;">VOOR</div>
          <div style="font-size:44px;font-weight:800;line-height:1.1;letter-spacing:-1.5px;">Gemiddelde KMO-site</div>
          <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;font-size:18px;opacity:0.85;">
            <li>❌ 4-6s laadtijd</li>
            <li>❌ WordPress + 23 plugins</li>
            <li>❌ €100+/maand onderhoud</li>
            <li>❌ Bouwer bellen voor spelfout</li>
          </ul>
        </div>
        <div style="background:linear-gradient(135deg,#064e3b 0%,#10b981 100%);padding:60px;display:flex;flex-direction:column;justify-content:center;gap:24px;">
          <div style="display:inline-block;padding:4px 12px;background:rgba(34,197,94,0.3);border:1px solid #22c55e;border-radius:6px;font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:3px;color:#86efac;width:fit-content;">NA STUDIO-VM</div>
          <div style="font-size:44px;font-weight:800;line-height:1.1;letter-spacing:-1.5px;">Wat ik bouw</div>
          <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;font-size:18px;opacity:0.95;">
            <li>✓ &lt;1s laadtijd op mobiel</li>
            <li>✓ Custom code, geen plugins</li>
            <li>✓ Hosting &lt;€10/maand</li>
            <li>✓ Eigen admin — zelf alles aanpassen</li>
          </ul>
        </div>
      </div>
      <div style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:20px;padding:14px 28px;background:#0a0a0a;border:1px solid rgba(255,255,255,0.15);border-radius:9999px;">
        <div style="font-size:32px;font-weight:800;letter-spacing:-1.5px;">${LOGO}</div>
        <div style="font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:3px;text-transform:uppercase;opacity:0.7;">studio-vm.be</div>
      </div>`,
    ),

    // === 10. Manifesto-text only (sterk) ===
    BASE_HTML(
      `background:linear-gradient(135deg,#581c87 0%,#0f172a 50%,#1e3a8a 100%);`,
      `
      <div style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px);background-size:30px 30px;opacity:0.5;"></div>
      <div style="padding:90px 100px;height:100%;display:flex;flex-direction:column;justify-content:space-between;position:relative;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:5px;text-transform:uppercase;opacity:0.6;">
            ✦ studio-vm manifest
          </div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:3px;text-transform:uppercase;opacity:0.6;">
            est. 2024 · waregem
          </div>
        </div>
        <div style="font-size:64px;font-weight:800;line-height:1.15;letter-spacing:-1.5px;max-width:1300px;">
          Websites die werken<br><span style="color:#f59e0b;">voor</span> je,<br>niet <span style="text-decoration:line-through;text-decoration-color:#ef4444;opacity:0.85;">tegen</span> je.
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:64px;font-weight:800;letter-spacing:-3px;">${LOGO}</div>
          <div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;letter-spacing:3px;text-transform:uppercase;opacity:0.6;">
            studio-vm.be
          </div>
        </div>
      </div>`,
    ),
  ];
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1640, height: 624 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const covers = await buildCovers();
  let i = 1;
  for (const html of covers) {
    const n = String(i).padStart(2, "0");
    const out = resolve(OUT_DIR, `cover-${n}.png`);
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(800); // wait for fonts
    await page.screenshot({
      path: out,
      type: "png",
      clip: { x: 0, y: 0, width: 1640, height: 624 },
    });
    // ook in /public root
    await copyFile(out, resolve(ROOT_DIR, `cover-${n}.png`));
    console.log(`✓ cover-${n}.png (${i}/10)`);
    i++;
  }

  await browser.close();
  console.log("\nKlaar — 10 covers in public/covers/ én public/ root");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
