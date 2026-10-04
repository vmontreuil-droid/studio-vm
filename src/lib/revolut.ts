import "server-only";
import { createSign, randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { MAIL_SITE, portalEmailHtml } from "@/lib/email";
import { sendMail } from "@/lib/monitor";
import { BEDRIJF } from "@/lib/bedrijf";
import { koppelBetalingen } from "@/lib/bank-match";

// Revolut Business: inkomende betalingen automatisch ophalen (Business API,
// enkel lezen). Dagelijks vóór de herinneringen (cron) en op vraag in
// Beheer → Bank; elke betaling met de gestructureerde mededeling van een
// factuur zet die factuur op betaald.
//
// Eenmalige opzet:
//   1. Sleutelpaar: de privésleutel staat in Vercel (REVOLUT_PRIVATE_KEY),
//      het publieke certificaat gaat in Revolut Business → Instellingen →
//      API's → Business API → certificaat toevoegen, met als
//      OAuth-doorverwijzing REDIRECT_URI hieronder.
//   2. De Client ID die Revolut dan toont, bewaar je in Beheer → Bank.
//   3. "Toestemming geven" → Revolut vraagt bevestiging → terug op
//      /api/revolut/callback: de site krijgt een vernieuwingssleutel
//      (in app_settings, enkel de server leest die).

const API = "https://b2b.revolut.com/api/1.0";
export const REDIRECT_URI = `${MAIL_SITE}/api/revolut/callback`;
const ISSUER = new URL(MAIL_SITE).host;

const K = {
  clientId: "revolut_client_id",
  refresh: "revolut_refresh_token",
  access: "revolut_access_token",
  state: "revolut_state",
  status: "revolut_status",
  alarm: "revolut_alarm",
  // Publiek certificaat (niet geheim): getoond in Beheer → Bank om te plakken in Revolut.
  cert: "revolut_publiek_cert",
} as const;

async function lees(key: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin().from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data as { value: string | null } | null)?.value ?? null;
}

async function zet(key: string, value: string | null): Promise<void> {
  const db = getSupabaseAdmin();
  if (value == null) await db.from("app_settings").delete().eq("key", key);
  else await db.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

function privesleutel(): string | null {
  const k = process.env.REVOLUT_PRIVATE_KEY ?? "";
  return k.includes("PRIVATE KEY") ? k.replace(/\\n/g, "\n") : null;
}

export type RevolutStatus = {
  laatsteOphaling: string | null;
  nieuw: number;
  gekoppeld: number;
  fout: string | null;
  foutOp: string | null;
};

export type RevolutStaat = {
  sleutel: boolean;
  clientId: string | null;
  gekoppeld: boolean;
  status: RevolutStatus | null;
  publiekCert: string | null;
};

export async function revolutStaat(): Promise<RevolutStaat> {
  const [clientId, refresh, status, publiekCert] = await Promise.all([lees(K.clientId), lees(K.refresh), lees(K.status), lees(K.cert)]);
  let s: RevolutStatus | null = null;
  try {
    s = status ? (JSON.parse(status) as RevolutStatus) : null;
  } catch {}
  return { sleutel: !!privesleutel(), clientId, gekoppeld: !!refresh, status: s, publiekCert };
}

export async function bewaarClientId(id: string): Promise<void> {
  const schoon = id.trim();
  await zet(K.clientId, schoon || null);
}

/** JWT (RS256) waarmee de site zich bij Revolut aanmeldt. */
function clientAssertion(clientId: string, sleutel: string): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const nu = Math.floor(Date.now() / 1000);
  const kop = b64({ alg: "RS256", typ: "JWT" });
  const inhoud = b64({ iss: ISSUER, sub: clientId, aud: "https://revolut.com", exp: nu + 300 });
  const handtekening = createSign("RSA-SHA256").update(`${kop}.${inhoud}`).sign(sleutel).toString("base64url");
  return `${kop}.${inhoud}.${handtekening}`;
}

type TokenAntwoord = { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };

async function tokenAanvraag(velden: Record<string, string>): Promise<TokenAntwoord> {
  const clientId = await lees(K.clientId);
  const sleutel = privesleutel();
  if (!clientId || !sleutel) return { error: "niet_ingesteld" };
  const body = new URLSearchParams({
    ...velden,
    client_id: clientId,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion(clientId, sleutel),
  });
  const r = await fetch(`${API}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = (await r.json().catch(() => ({}))) as TokenAntwoord;
  if (!r.ok && !j.error) j.error = `http_${r.status}`;
  return j;
}

/** Link om toestemming te geven in Revolut Business (enkel lezen). */
export async function toestemmingsLink(): Promise<string | null> {
  const clientId = await lees(K.clientId);
  if (!clientId || !privesleutel()) return null;
  const state = randomBytes(16).toString("base64url");
  await zet(K.state, JSON.stringify({ state, tot: Date.now() + 30 * 60_000 }));
  const q = new URLSearchParams({ client_id: clientId, redirect_uri: REDIRECT_URI, response_type: "code", scope: "READ", state });
  return `https://business.revolut.com/app-confirm?${q}`;
}

/** Klopt de state van de terugkeer (of is er geen: toestemming gestart in Revolut zelf)? */
export async function stateKlopt(state: string | null): Promise<boolean> {
  if (!state) return true;
  try {
    const s = JSON.parse((await lees(K.state)) ?? "null") as { state: string; tot: number } | null;
    return !!s && s.state === state && s.tot > Date.now();
  } catch {
    return false;
  }
}

/** Terugkeer van Revolut: code inruilen voor een vernieuwingssleutel. */
export async function rondKoppelingAf(code: string): Promise<{ ok: boolean; fout?: string }> {
  const j = await tokenAanvraag({ grant_type: "authorization_code", code });
  if (!j.access_token || !j.refresh_token) return { ok: false, fout: j.error_description || j.error || "onbekend" };
  await zet(K.refresh, j.refresh_token);
  await zet(K.access, JSON.stringify({ token: j.access_token, tot: Date.now() + ((j.expires_in ?? 2400) - 120) * 1000 }));
  await zet(K.state, null);
  return { ok: true };
}

export async function ontkoppel(): Promise<void> {
  await Promise.all([zet(K.refresh, null), zet(K.access, null), zet(K.state, null)]);
}

async function toegang(): Promise<string | null> {
  try {
    const a = JSON.parse((await lees(K.access)) ?? "null") as { token: string; tot: number } | null;
    if (a && a.tot > Date.now()) return a.token;
  } catch {}
  const refresh = await lees(K.refresh);
  if (!refresh) return null;
  const j = await tokenAanvraag({ grant_type: "refresh_token", refresh_token: refresh });
  if (!j.access_token) throw new Error(`Aanmelden bij Revolut mislukt (${j.error_description || j.error || "onbekend"}). Geef opnieuw toestemming in Beheer → Bank.`);
  await zet(K.access, JSON.stringify({ token: j.access_token, tot: Date.now() + ((j.expires_in ?? 2400) - 120) * 1000 }));
  if (j.refresh_token) await zet(K.refresh, j.refresh_token);
  return j.access_token;
}

type RevolutLeg = { amount?: number; currency?: string; description?: string };
type RevolutTx = {
  id: string;
  type?: string;
  state?: string;
  created_at?: string;
  completed_at?: string;
  reference?: string;
  legs?: RevolutLeg[];
};

/** "Money added from JAN PEETERS" → "JAN PEETERS". */
function betaler(omschrijving: string | undefined): string | null {
  const m = String(omschrijving ?? "").match(/(?:from|van|de|von)\s+(.+)$/i);
  return m ? m[1].trim().slice(0, 200) : null;
}

const dagBrussel = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });

export type OphaalResultaat = { ok: boolean; actief: boolean; nieuw: number; gekoppeld: number; fout?: string };

/**
 * Inkomende, voltooide EUR-betalingen van de laatste `dagen` dagen ophalen,
 * in bank_transactions zetten (dubbels genegeerd op het Revolut-id) en aan
 * facturen koppelen. Stil overgeslagen zolang de koppeling niet af is.
 */
export async function haalRevolutOp(dagen = 14): Promise<OphaalResultaat> {
  const leeg = { nieuw: 0, gekoppeld: 0 };
  if (!privesleutel() || !(await lees(K.clientId)) || !(await lees(K.refresh))) return { ok: true, actief: false, ...leeg };
  try {
    const token = await toegang();
    if (!token) return { ok: true, actief: false, ...leeg };
    const van = new Date(Date.now() - dagen * 86_400_000).toISOString();
    const r = await fetch(`${API}/transactions?${new URLSearchParams({ from: van, count: "1000" })}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error(`Revolut gaf ${r.status} bij het ophalen van de transacties.`);
    const txs = ((await r.json()) as RevolutTx[]) ?? [];
    const rijen = txs
      .filter((t) => t.state === "completed")
      .map((t) => ({ t, leg: t.legs?.[0] }))
      .filter(({ leg }) => !!leg && (leg.amount ?? 0) > 0 && (leg.currency ?? "EUR") === "EUR")
      .map(({ t, leg }) => ({
        booked_at: dagBrussel(t.completed_at || t.created_at || new Date().toISOString()),
        amount_cents: Math.round((leg!.amount ?? 0) * 100),
        counterparty: betaler(leg!.description),
        communication: [t.reference, leg!.description].filter(Boolean).join(" · ") || null,
        fingerprint: `revolut:${t.id}`,
      }));
    let nieuw = 0;
    if (rijen.length) {
      const { data, error } = await getSupabaseAdmin()
        .from("bank_transactions")
        .upsert(rijen, { onConflict: "fingerprint", ignoreDuplicates: true })
        .select("id");
      if (error) throw new Error(`Opslaan mislukt: ${error.message}`);
      nieuw = (data as unknown[] | null)?.length ?? 0;
    }
    const gekoppeld = await koppelBetalingen();
    await zet(K.status, JSON.stringify({ laatsteOphaling: new Date().toISOString(), nieuw, gekoppeld, fout: null, foutOp: null } satisfies RevolutStatus));
    return { ok: true, actief: true, nieuw, gekoppeld };
  } catch (e) {
    const fout = e instanceof Error ? e.message : String(e);
    console.error("[revolut]", fout);
    let vorig: RevolutStatus | null = null;
    try {
      vorig = JSON.parse((await lees(K.status)) ?? "null") as RevolutStatus | null;
    } catch {}
    await zet(K.status, JSON.stringify({ ...(vorig ?? { laatsteOphaling: null, nieuw: 0, gekoppeld: 0 }), fout, foutOp: new Date().toISOString() }));
    await alarm(fout);
    return { ok: false, actief: true, ...leeg, fout };
  }
}

/** Mail naar Studio VM als het ophalen mislukt — hooguit één per dag. */
async function alarm(fout: string): Promise<void> {
  try {
    const vorige = Number(await lees(K.alarm)) || 0;
    if (Date.now() - vorige < 24 * 3_600_000) return;
    await zet(K.alarm, String(Date.now()));
    await sendMail(BEDRIJF.email, {
      subject: "Revolut: betalingen konden niet opgehaald worden",
      html: portalEmailHtml({
        eyebrow: "Bank",
        title: "Betalingen ophalen bij Revolut mislukte",
        bodyLines: [
          fout.replace(/[<>&]/g, ""),
          "Zolang dit niet opgelost is, worden overschrijvingen niet vanzelf herkend. Herinneringen kunnen dan ook vertrekken naar klanten die al betaald hebben.",
        ],
        ctaLabel: "Naar Beheer → Bank",
        ctaHref: `${MAIL_SITE}/admin/bank`,
      }),
    });
  } catch {}
}
