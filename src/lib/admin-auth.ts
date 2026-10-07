import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminPassword } from "@/lib/supabase/config";

// Beheerderssessie. Elke aanmelding krijgt een eigen, ondertekend token met
// vervaldatum: `<vervalt>.<willekeurig>.<handtekening>`. De handtekening
// hangt aan ADMIN_PASSWORD en (als die gezet is) ADMIN_SESSION_SECRET: een
// van beide wijzigen in Vercel meldt dus elke open sessie af.
//
// __Host-: enkel via https, enkel dit domein, pad /. Een subdomein of een
// http-pagina kan de cookie niet zetten of overschrijven.
export const ADMIN_COOKIE = "__Host-svm_admin";
/** Oude cookienamen: enkel nog om op te ruimen. */
export const ADMIN_COOKIE_OUD = ["svm_admin"] as const;
export const ADMIN_SESSIE_SECONDEN = 60 * 60 * 8;
/**
 * Markering "toestel van de beheerder": bij elke aanmelding gezet, een jaar
 * geldig, ook na afmelden. De bezoekersteller (/api/track-pv) slaat zo'n
 * toestel over, ook als de sessie al verlopen is.
 */
export const NIET_TELLEN_COOKIE = "svm_niet_tellen";

const sessieGeheim = process.env.ADMIN_SESSION_SECRET ?? "";

function sleutel(): Buffer {
  return createHash("sha256")
    .update(`studio-vm::admin-sessie::${sessieGeheim}::${adminPassword}`)
    .digest();
}

function handtekening(data: string): string {
  return createHmac("sha256", sleutel()).update(data).digest("base64url");
}

export function nieuweAdminSessie(): string {
  const vervalt = Math.floor(Date.now() / 1000) + ADMIN_SESSIE_SECONDEN;
  const data = `${vervalt}.${randomBytes(18).toString("base64url")}`;
  return `${data}.${handtekening(data)}`;
}

export function isValidAdmin(cookieValue: string | undefined): boolean {
  if (!adminPassword || !cookieValue) return false;
  const delen = cookieValue.split(".");
  if (delen.length !== 3) return false;
  const [vervalt, willekeurig, sig] = delen;
  if (!/^\d{10}$/.test(vervalt) || Number(vervalt) * 1000 <= Date.now()) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(handtekening(`${vervalt}.${willekeurig}`));
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Wachtwoordvergelijking in constante tijd (ook bij verschillende lengte). */
export function wachtwoordKlopt(pw: string): boolean {
  if (!adminPassword) return false;
  const a = createHash("sha256").update(pw).digest();
  const b = createHash("sha256").update(adminPassword).digest();
  return timingSafeEqual(a, b);
}

/** Set-Cookie-regels die de oude cookies wissen (met path=/ én /admin). */
export function wisOudeAdminCookies(headers: Headers): void {
  for (const naam of ADMIN_COOKIE_OUD)
    for (const path of ["/", "/admin"])
      headers.append(
        "Set-Cookie",
        `${naam}=; Path=${path}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`,
      );
}

/** Enkel een pad binnen /admin aanvaarden als bestemming na het aanmelden. */
export function adminBestemming(v: unknown): string {
  const p = typeof v === "string" ? v : "";
  return /^\/admin(\/[\w\-./%]*)?$/.test(p) && !p.includes("//") && !p.includes("..") ? p : "/admin";
}

// Server-side guard voor admin server-actions.
export async function requireAdmin(): Promise<boolean> {
  const jar = await cookies();
  return isValidAdmin(jar.get(ADMIN_COOKIE)?.value);
}
