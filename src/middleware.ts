import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, TAAL_HEADER, isValidLocale } from "@/lib/i18n/config";

// Bewust middleware.ts (edge) en geen proxy.ts: proxy draait verplicht op
// Node in de functieregio; deze taalomleiding hoort aan de rand.

function pickLocale(req: NextRequest): string {
  const cookie = req.cookies.get("locale")?.value;
  if (isValidLocale(cookie)) return cookie;

  const accept = req.headers.get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const tag = part.split(";")[0]?.trim().split("-")[0]?.toLowerCase();
    if (isValidLocale(tag)) return tag;
  }
  // Browser in een taal die we niet aanbieden (pl, it, sv, …) → Engels.
  // Geen Accept-Language (meestal bots) → Nederlands.
  return accept.trim() ? "en" : DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Metadata- en hulproutes zonder punt in het pad (paden mét punt en
  // _next/, api/, admin, auth/ sluit de matcher hieronder al uit).
  if (
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    pathname === "/opengraph-image" ||
    pathname === "/security-txt" ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/studio-vm-logo.svg"
  ) {
    return NextResponse.next();
  }

  const seg = pathname.split("/")[1] ?? "";

  // Al een taal in het adres → niets om te leiden. De taal gaat wel als
  // verzoekheader mee: een onbekend adres (/es/foo) valt buiten elke route
  // en krijgt global-not-found.tsx, die zo de 404 in de juiste taal toont.
  if (isValidLocale(seg)) {
    const headers = new Headers(req.headers);
    headers.set(TAAL_HEADER, seg);
    return NextResponse.next({ request: { headers } });
  }

  // /NL/tarieven → /nl/tarieven (blijvend).
  const klein = seg.toLowerCase();
  if (klein !== seg && isValidLocale(klein)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${klein}${pathname.slice(seg.length + 1)}`;
    return NextResponse.redirect(url, 308);
  }

  // Geen taal → /{taal}{pad}. Deze omleiding hangt af van de bezoeker
  // (browsertaal + cookie); nooit gedeeld cachen, anders krijgt bv. een
  // Franse bezoeker de NL-omleiding van een eerdere bezoeker of bot.
  const locale = pickLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  res.headers.set("Vary", "Accept-Language, Cookie");
  return res;
}

export const config = {
  matcher: ["/((?!_next/|api/|admin|auth/|.*\\.).*)"],
};
