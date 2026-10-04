import { NextResponse, type NextRequest } from "next/server";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { haalRevolutOp, rondKoppelingAf, stateKlopt } from "@/lib/revolut";

export const dynamic = "force-dynamic";

// Terugkeer na "Toestemming geven" in Revolut Business: ?code=…&state=…
// Enkel voor een aangemelde beheerder (de admin-cookie is SameSite=Lax en
// gaat dus mee bij deze doorverwijzing). Daarna meteen een eerste ophaling.
export async function GET(req: NextRequest) {
  const terug = (melding: string) => NextResponse.redirect(new URL(`/admin/bank?revolut=${melding}`, req.url), 303);
  if (!adminConfigured || !(await requireAdmin())) return terug("aanmelden");
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return terug("geweigerd");
  if (!(await stateKlopt(req.nextUrl.searchParams.get("state")))) return terug("fout");
  const r = await rondKoppelingAf(code);
  if (!r.ok) {
    console.error("[revolut] koppelen mislukt:", r.fout);
    return terug("fout");
  }
  await haalRevolutOp(30);
  return terug("gekoppeld");
}
