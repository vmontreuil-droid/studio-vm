import type { NextConfig } from "next";

// CSP bewust permissief op script/style ('unsafe-inline' nodig voor Next
// hydration + dynamische thema-styles), maar sluit alles af wat niet van
// self / Vercel / Supabase komt. Strikter (nonce-based) kan later.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.vercel-insights.com https://va.vercel-scripts.com",
  // realisatie-previews: échte klantsites live in een iframe tonen
  "frame-src 'self' https:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // De builder verstuurt volledige ontwerpen met foto's (base64) via
  // een Server Action — de standaard 1 MB is veel te krap.
  experimental: {
    serverActions: { bodySizeLimit: "16mb" },
    // src/app/global-not-found.tsx: echte 404 voor adressen buiten elke
    // root-layout (/wp-login.php, /.env, …).
    globalNotFound: true,
  },
  // Geoptimaliseerde beelden een week bewaren. Geen AVIF: dat verdubbelt
  // het aantal beeldtransformaties.
  images: {
    minimumCacheTTL: 604800,
  },
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex" }];
    const noindexNofollow = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ];
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Intern: nooit in zoekmachines.
      { source: "/admin/:path*", headers: noindexNofollow },
      { source: "/auth/:path*", headers: noindexNofollow },
      { source: "/api/:path*", headers: noindex },
      // Klant- en hulppagina's: wel ophaalbaar (robots.txt laat ze toe),
      // zodat Google deze noindex ook echt ziet.
      {
        source:
          "/:locale(nl|fr|en|de|es)/:p(portail|factuur|offline|support)/:rest*",
        headers: noindex,
      },
      // 3D-beelden veranderen zelden; hernoemen bij elke wijziging.
      {
        source: "/3d/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async redirects() {
    // Dubbele hosts → de echte site. /api blijft bereikbaar, zodat crons
    // en webhooks op die hosts blijven werken.
    const hosts = ["studio-vm.vercel.app", "favesan.studio-vm.be"].map(
      (host) => ({
        source: "/:path((?!api/).*)",
        has: [{ type: "host" as const, value: host }],
        destination: "https://www.studio-vm.be/:path",
        permanent: true,
      }),
    );

    // Beelden die vroeger een plaats- of klantnaam droegen.
    const beelden = [
      ["libramont", "platform"],
      ["riga", "uitgraving"],
      ["betrix", "lijnwerk"],
    ].map(([oud, nieuw]) => ({
      source: `/3d/r/p-${oud}-:rest`,
      destination: `/3d/r/p-${nieuw}-:rest`,
      permanent: true,
    }));

    // Oude pagina's uit de websitetijd → de passende 3D-pagina (blijvend).
    const naar: [string, string][] = [
      ["pricing", "tarieven"],
      ["zelf-bouwen", "tarieven"],
      ["kosten", "tarieven"],
      ["roi", "tarieven"],
      ["vergelijking", "tarieven"],
      ["diensten", "3d-modellen"],
      ["mogelijkheden", "3d-modellen"],
      ["mogelijkheden/:slug", "3d-modellen"],
      ["aanpak", "3d-modellen"],
      ["werk/:slug", "realisaties"],
      ["shop", "realisaties"],
      ["builder", "offerte"],
      ["scan", "offerte"],
      ["scan/:pad*", "offerte"],
      ["site-health-check", "offerte"],
      ["site-health-check/:pad*", "offerte"],
      ["faq", "kennis/veelgestelde-vragen"],
      ["woordenboek", "kennis"],
      ["journal", "kennis"],
      ["journal/:slug", "kennis"],
      ["now", "over"],
      ["uses", "over"],
      ["pers", "over"],
      ["changelog", "over"],
      ["status", "over"],
      ["preview/:pad*", ""],
      ["contact", ""],
      ["about", "over"],
      ["logos", ""],
      // De publieke support-demo is weg; klanten openen tickets in het portaal.
      ["support", "portail"],
    ];
    const paginas = naar.map(([oud, nieuw]) => ({
      source: `/:locale(nl|fr|en|de|es)/${oud}`,
      destination: `/:locale${nieuw ? `/${nieuw}` : ""}`,
      permanent: true,
    }));

    return [...hosts, ...beelden, ...paginas];
  },
  async rewrites() {
    return [
      { source: "/.well-known/security.txt", destination: "/security-txt" },
    ];
  },
};

export default nextConfig;
