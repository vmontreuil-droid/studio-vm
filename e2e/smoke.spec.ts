import { test, expect, type Page } from "@playwright/test";

// Rooktest voor de 3D-site. Draait tegen BASE_URL (bv. een productiebuild op
// een eigen poort), anders tegen de lokale server op :3100.
const BASE = process.env.BASE_URL || "http://localhost:3100";
const SITE = "https://www.studio-vm.be";
const LOCALES = ["nl", "fr", "en", "de", "es"] as const;

test.use({ baseURL: BASE });

async function jsonLd(page: Page, pad: string): Promise<unknown[]> {
  const res = await page.goto(pad);
  expect(res?.status(), `${pad} status`).toBe(200);
  const blokken = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(blokken.length, `${pad}: aantal JSON-LD-blokken`).toBeGreaterThan(0);
  return blokken.map((b) => JSON.parse(b) as unknown);
}

test.describe("Routing & talen", () => {
  test("/ stuurt door naar een taal", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(nl|fr|en|de|es)$/);
  });

  for (const l of LOCALES) {
    test(`/${l} heeft lang="${l}" en een zichtbare h1`, async ({ page }) => {
      const res = await page.goto(`/${l}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", l);
      await expect(page.locator("h1")).toBeVisible();
    });
  }

  for (const pad of ["/nl/bestaat-niet", "/nl/kennis/bestaat-niet", "/wp-login.php"]) {
    test(`${pad} geeft 404`, async ({ request }) => {
      const r = await request.get(pad, { failOnStatusCode: false });
      expect(r.status()).toBe(404);
    });
  }

  test("/es/foo: vertaalde 404 al in de server-HTML (zonder JavaScript)", async ({ request }) => {
    const r = await request.get("/es/foo", { failOnStatusCode: false });
    expect(r.status()).toBe(404);
    const html = await r.text();
    expect(html).toMatch(/<html[^>]*lang="es"/);
    expect(html).toContain("no existe");
    expect(html).toContain("<header");
    expect(html).toContain("<footer");
  });

  for (const l of LOCALES) {
    test(`/${l}/support stuurt blijvend door naar /${l}/portail`, async ({ request }) => {
      const r = await request.get(`/${l}/support`, { maxRedirects: 0, failOnStatusCode: false });
      expect(r.status()).toBe(308);
      expect(new URL(r.headers()["location"], BASE).pathname).toBe(`/${l}/portail`);
    });
  }
});

test.describe("SEO & metadata", () => {
  test("/fr/tarieven: canonical, og:url en hreflang x-default", async ({ page }) => {
    await page.goto("/fr/tarieven");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}/fr/tarieven`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${SITE}/fr/tarieven`,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute("href", `${SITE}/en/tarieven`);
  });

  for (const pad of ["/nl", "/nl/tarieven", "/nl/kennis/veelgestelde-vragen"]) {
    test(`JSON-LD op ${pad} parseert en heeft een @graph`, async ({ page }) => {
      const blokken = await jsonLd(page, pad);
      const tekst = JSON.stringify(blokken);
      expect(tekst).toContain('"@graph"');
      if (pad.endsWith("veelgestelde-vragen")) expect(tekst).toContain('"FAQPage"');
      // Geen persoon als entiteit, geen verzonnen beoordelingen.
      expect(tekst).not.toContain('"Person"');
      expect(tekst).not.toMatch(/AggregateRating|"Review"|"review"|aggregateRating/);
    });
  }

  test("sitemap.xml telt 95 adressen, zonder /support", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.ok()).toBeTruthy();
    const body = await r.text();
    expect(body.match(/<loc>/g)?.length).toBe(95);
    expect(body).not.toContain("/support");
  });

  test("robots.txt verwijst naar de sitemap", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.ok()).toBeTruthy();
    expect(await r.text()).toContain("Sitemap:");
  });

  test("llms.txt is bereikbaar als platte tekst", async ({ request }) => {
    const r = await request.get("/llms.txt");
    expect(r.ok()).toBeTruthy();
    expect(r.headers()["content-type"]).toContain("text/plain");
    expect(await r.text()).toContain("# Studio VM");
  });
});

test.describe("Pagina's", () => {
  test("/nl/offerte toont het offerteformulier", async ({ page }) => {
    await page.goto("/nl/offerte");
    const formulier = page.locator("form").filter({ has: page.locator('textarea[name="omschrijving"]') });
    await expect(formulier).toBeVisible();
    await expect(formulier.locator('select[name="werk"]')).toBeVisible();
    await expect(formulier.locator('button[type="submit"]')).toBeVisible();
  });

  test("/nl/over spreekt als Studio VM, zonder persoonsnaam in de inhoud", async ({ page }) => {
    const res = await page.goto("/nl/over");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("Studio VM");
    const inhoud = await page.locator("#main").innerText();
    expect(inhoud).not.toMatch(/Vincent|Montreuil/);
    expect(inhoud).not.toMatch(/MV3D|Convertor|landmeter/i);
  });

  test("zoekvenster opent met Control+K", async ({ page }) => {
    await page.goto("/nl");
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("Zonder JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("de h1 op /nl is zichtbaar", async ({ page }) => {
    await page.goto("/nl");
    await expect(page.locator("h1")).toBeVisible();
  });
});
