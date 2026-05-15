import { test, expect } from "@playwright/test";

test.describe("Routing & i18n", () => {
  test("/ redirect naar een locale", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/(nl|fr|en)(\/|$|#|\?)/);
  });

  test("home rendert per locale met juiste lang", async ({ page }) => {
    for (const [loc, frag] of [
      ["nl", "Websites die werken"],
      ["fr", "Des sites qui travaillent"],
      ["en", "Websites that work"],
    ] as const) {
      await page.goto(`/${loc}`);
      await expect(page.locator("html")).toHaveAttribute("lang", loc);
      await expect(page.locator("h1")).toContainText(frag);
    }
  });

  test("hoofdnavigatie werkt locale-bewust", async ({ page }) => {
    await page.goto("/nl");
    await page
      .locator("header")
      .getByRole("link", { name: "Pricing", exact: true })
      .click();
    await expect(page).toHaveURL(/\/nl\/pricing/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("404 voor onbestaande pagina", async ({ page }) => {
    const res = await page.goto("/nl/bestaat-echt-niet-xyz");
    expect(res?.status()).toBe(404);
  });
});

test.describe("Tools", () => {
  test("scanner toont een URL-invoer", async ({ page }) => {
    await page.goto("/nl/scan");
    await expect(page.locator('input[name="url"]')).toBeVisible();
  });

  test("offerte-calculator toont een richtprijs", async ({ page }) => {
    await page.goto("/nl/offerte");
    await expect(page.getByText(/Richtprijs/i).first()).toBeVisible();
    await expect(page.locator('input[type="range"]').first()).toBeVisible();
  });

  test("ROI-calculator rekent en toont verlies", async ({ page }) => {
    await page.goto("/en/roi");
    await expect(page.getByText(/What slowness costs you/i)).toBeVisible();
  });

  test("portail valt terug op demo zonder Supabase-env", async ({ page }) => {
    const res = await page.goto("/nl/portail");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(/Demo-portaal|Inloggen/);
  });
});

test.describe("SEO & metadata", () => {
  test("sitemap.xml is geldige XML met locale-URLs", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.ok()).toBeTruthy();
    const body = await r.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/nl");
    expect(body).toContain("/fr");
    expect(body).toContain("/en");
  });

  test("robots.txt verwijst naar sitemap", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.ok()).toBeTruthy();
    expect(await r.text()).toContain("Sitemap:");
  });

  test("changelog RSS is application/rss+xml", async ({ request }) => {
    const r = await request.get("/nl/changelog/rss.xml");
    expect(r.ok()).toBeTruthy();
    expect(r.headers()["content-type"]).toContain("rss+xml");
  });

  test("home bevat Organization + WebSite JSON-LD", async ({ page }) => {
    await page.goto("/nl");
    const html = await page.content();
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"@type":"WebSite"');
  });

  test("security.txt aanwezig (RFC 9116)", async ({ request }) => {
    const r = await request.get("/.well-known/security.txt");
    expect(r.ok()).toBeTruthy();
    expect(await r.text()).toContain("Contact:");
  });
});
