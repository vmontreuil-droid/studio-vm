import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE, isValidLocale } from "@/lib/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;
const LOCALE_PATHS = LOCALES.map((l) => `/${l}`);

function pickLocale(req: NextRequest): string {
  const cookie = req.cookies.get("locale")?.value;
  if (isValidLocale(cookie)) return cookie;

  const accept = req.headers.get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const tag = part.split(";")[0]?.trim().split("-")[0]?.toLowerCase();
    if (isValidLocale(tag)) return tag;
  }
  return DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next internals + assets + metadata routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/site/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/security-txt" ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    pathname === "/opengraph-image" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/studio-vm-logo.svg" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Klant-subdomein (bv. bakkerijjan.studio-vm.be) → render de
  // gepubliceerde site. Apex en www blijven de gewone studio-vm-site.
  const ROOT = "studio-vm.be";
  const host = (req.headers.get("host") ?? "")
    .split(":")[0]
    .toLowerCase();
  if (
    host.endsWith(`.${ROOT}`) &&
    host !== ROOT &&
    host !== `www.${ROOT}`
  ) {
    const label = host.slice(0, host.length - ROOT.length - 1);
    // Enkel één-labels subdomeinen (geen geneste hosts, geen www).
    if (label && label !== "www" && !label.includes(".")) {
      const url = req.nextUrl.clone();
      url.pathname = `/site/${label}`;
      return NextResponse.rewrite(url);
    }
  }

  // Already locale-prefixed → geef de locale door als request-header
  // zodat de root-layout <html lang> correct kan zetten (niet cookie-gedreven).
  const hasLocale = LOCALE_PATHS.some(
    (lp) => pathname === lp || pathname.startsWith(`${lp}/`),
  );
  if (hasLocale) {
    const seg = pathname.split("/")[1];
    const headers = new Headers(req.headers);
    if (isValidLocale(seg)) headers.set("x-locale", seg);
    headers.set("x-pathname", pathname);
    return NextResponse.next({ request: { headers } });
  }

  // No locale → redirect to /{locale}{path}. Deze redirect hangt af
  // van de bezoeker (browsertaal + cookie); nooit gedeeld cachen,
  // anders krijgt bv. een Franse bezoeker de NL-redirect van een
  // eerdere bezoeker/bot te zien.
  const locale = pickLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  res.headers.set("Vary", "Accept-Language, Cookie");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
