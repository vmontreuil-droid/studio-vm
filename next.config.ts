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
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // Oude pagina's uit de websitetijd → de passende 3D-pagina (blijvend).
  async redirects() {
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
    ];
    return naar.map(([oud, nieuw]) => ({
      source: `/:locale(nl|fr|en|de|es)/${oud}`,
      destination: `/:locale${nieuw ? `/${nieuw}` : ""}`,
      permanent: true,
    }));
  },
  async rewrites() {
    return [
      { source: "/.well-known/security.txt", destination: "/security-txt" },
    ];
  },
};

export default nextConfig;
