import { NextResponse, after, userAgent, type NextRequest } from "next/server";
import { adminConfigured } from "@/lib/supabase/config";
import {
  ADMIN_COOKIE,
  ADMIN_SESSIE_SECONDEN,
  adminBestemming,
  nieuweAdminSessie,
  wachtwoordKlopt,
  wisOudeAdminCookies,
} from "@/lib/admin-auth";
import {
  TWEESTAPS_NOODREM,
  bezoeker,
  blokkadeOver,
  controleerCode,
  logGeslaagd,
  mailAanmelding,
  mailBlokkade,
  registreerFout,
  ruimOp,
  tweestapsStaat,
  wisFouten,
} from "@/lib/admin-beveiliging";

export const dynamic = "force-dynamic";

// Foutcodes voor het aanmeldscherm (?e=):
// 1 = wachtwoord of code klopt niet, 2 = tijdelijk geblokkeerd (&m=minuten),
// 3 = code ontbreekt, 4 = databank niet bereikbaar.
export async function POST(req: NextRequest) {
  const base = req.nextUrl.origin;
  const form = await req.formData();
  // Na het aanmelden terug naar de pagina waar je was (enkel binnen /admin).
  const bestemming = adminBestemming(form.get("terug"));
  const terug = (q: string) => NextResponse.redirect(`${base}${bestemming}?${q}`, 303);
  if (!adminConfigured) return terug("e=1");
  // Enkel het eigen aanmeldformulier: geen POST vanaf een andere site.
  const herkomst = req.headers.get("origin");
  if (herkomst && herkomst !== base) return terug("e=1");

  const ua = userAgent(req);
  const toestel =
    [ua.browser.name, ua.os.name, ua.device.type === "mobile" ? "gsm" : ua.device.type === "tablet" ? "tablet" : ""]
      .filter(Boolean)
      .join(" · ") || "onbekend";
  const wie = bezoeker(req.headers, toestel);

  const blok = await blokkadeOver(wie);
  if (blok > 0) return terug(`e=2&m=${Math.ceil(blok / 60_000)}`);

  const pw = String(form.get("password") ?? "");
  const code = String(form.get("code") ?? "").trim();

  const staat = await tweestapsStaat();
  if (staat.aan === null && !TWEESTAPS_NOODREM) return terug("e=4");
  const tweestaps = staat.aan === true && !TWEESTAPS_NOODREM;

  const pwOk = wachtwoordKlopt(pw);
  let via = TWEESTAPS_NOODREM && staat.aan ? "noodrem" : "wachtwoord";
  let herstelOver: number | undefined;
  let ok = pwOk;
  let reden = pwOk ? "" : "wachtwoord";

  // De code pas nakijken als het wachtwoord klopt: zo verbruikt een
  // aanvaller zonder wachtwoord geen herstelcodes of tijdstappen.
  if (pwOk && tweestaps) {
    if (!code) {
      ok = false;
      reden = "geen code";
    } else {
      const r = await controleerCode(code).catch(() => ({ ok: false as const }));
      ok = r.ok;
      if (r.ok) {
        via = r.via;
        if (r.via === "herstel") herstelOver = r.over;
      } else reden = "code";
    }
  }

  if (!ok) {
    // Elke foute poging kost tijd; samen met de blokkade maakt dat raden zinloos.
    await new Promise((r) => setTimeout(r, 700));
    const f = await registreerFout(wie, reden);
    if (f.nieuw) after(() => mailBlokkade(wie, f.blokMs));
    if (f.blokMs) return terug(`e=2&m=${Math.ceil(f.blokMs / 60_000)}`);
    return terug(reden === "geen code" ? "e=3" : "e=1");
  }

  await wisFouten(wie);
  const res = NextResponse.redirect(`${base}${bestemming}`, 303);
  res.cookies.set(ADMIN_COOKIE, nieuweAdminSessie(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSIE_SECONDEN,
  });
  wisOudeAdminCookies(res.headers);
  after(async () => {
    await logGeslaagd(wie, via);
    await mailAanmelding(wie, via, herstelOver);
    await ruimOp();
  });
  return res;
}
