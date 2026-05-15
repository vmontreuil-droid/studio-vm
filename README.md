# Studio VM — studio-vm.be

Portfolio + lead-engine voor Vincent Montreuil (freelance webdeveloper).
Next.js 16 · React 19 · Tailwind v4 · TypeScript · Vercel. Volledig drietalig
(NL/FR/EN), ~50 routes, PWA, server-side site-scanner, dormante Supabase-auth.

## Dev

```bash
npm install
npm run dev      # http://localhost:3000  → redirect naar /nl
npm run build    # productiebuild (Turbopack) + typecheck
```

## Architectuur

- **i18n via `[locale]` routing.** Alle pagina's leven onder
  `src/app/[locale]/…`. `src/middleware.ts` detecteert taal
  (cookie → `Accept-Language` → `nl`) en redirect `/pad` → `/{locale}/pad`.
  `src/lib/i18n/` bevat `config.ts` (locales, `localePath()`,
  `isValidLocale`) en `messages/{nl,fr,en}.ts` voor de chrome.
  Pagina-specifieke copy staat co-located in de page als `Record<Locale, …>`.
- **Content = data-modules** in `src/lib/`, telkens met een
  `getX(locale)`-API: `projects`, `case-studies`, `capabilities`,
  `pricing`, `posts`, `testimonials`, `changelog`. Eén bron, drie talen.
- **Root layout** (`src/app/layout.tsx`) zet `<html lang>` via cookie,
  fonts, analytics, web-vitals, service worker. **`[locale]/layout.tsx`**
  voegt header/footer/cookie-banner/JSON-LD/shortcuts toe.
- **SEO**: `sitemap.ts` (alle routes × locales), `robots.ts`,
  per-locale + per-content `opengraph-image.tsx`, JSON-LD
  (Organization/WebSite/Service/FAQPage/Article/Breadcrumb) in
  `src/components/json-ld.tsx`.
- **Server actions** in `src/app/actions/`: `contact`, `newsletter`,
  `scan` (SSRF-beveiligd), `portail` (Supabase magic-link).

## Env vars (optioneel — zet in Vercel)

| Var | Effect zonder | Effect mét |
|---|---|---|
| `RESEND_API_KEY` | contact/newsletter loggen + mailto-fallback | echte mailverzending |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `/portail` = demo | echte magic-link login + `/portail/dashboard` leest `projects`-tabel |

Zonder env-vars werkt de hele site normaal — niets crasht.

## Iets toevoegen

- **Nieuw werk-project**: voeg toe aan `src/lib/projects.ts` (kaart/summary,
  3 talen) + optioneel `src/lib/case-studies.ts` (diepe sectie). Slug komt
  automatisch in `/werk/[slug]`, sitemap, zoek, OG-image.
- **Nieuwe mogelijkheid**: `src/lib/capabilities.ts` — hero, whatYouGet,
  howItWorks, examples (verwijzen naar project-slugs), faq, cta × 3 talen.
- **Journal-post**: `src/lib/posts.ts` (markdown-lite body). **Changelog**:
  `src/lib/changelog.ts`.
- **Nieuwe pagina**: maak `src/app/[locale]/<naam>/page.tsx`, accepteer
  `params: Promise<{locale}>`, valideer met `isValidLocale`, gebruik
  `localePath(locale, …)` voor interne links. Voeg toe aan `src/lib/nav.ts`,
  `src/components/site-footer.tsx`, `src/app/sitemap.ts`,
  `src/lib/search-index.ts`.

## Conventies

- Interne links **altijd** via `localePath(locale, "/pad")`.
- Pagina's met auth/per-request gedrag: `export const dynamic = "force-dynamic"`.
- Brand-iconen (GitHub/LinkedIn) zijn inline SVG — lucide 1.x heeft ze niet.
- Tailwind v4: geen opacity-modifier op CSS-var-kleuren (gebruik `color-mix()`,
  zie `.bg-header` in `globals.css`).

Eén ontwikkelaar, één stack, code blijft van de klant.
