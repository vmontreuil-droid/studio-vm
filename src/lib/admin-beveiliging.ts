import "server-only";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";
import { BEDRIJF } from "@/lib/bedrijf";

// Beveiliging van het beheer: tweestapsverificatie (authenticator-app),
// herstelcodes, blokkeren na foute pogingen en een logboek met mail bij
// elke aanmelding. Alles staat in app_settings (enkel service-role), dus
// er is geen migratie nodig.
//
// Noodrem: ADMIN_2FA_UIT=1 in Vercel schakelt de code bij het aanmelden
// tijdelijk uit (telefoon kwijt én herstelcodes kwijt).

const K = {
  geheim: "admin_2fa_geheim",
  voorlopig: "admin_2fa_voorlopig",
  herstel: "admin_2fa_herstel",
  laatsteStap: "admin_2fa_laatste_stap",
  geslaagd: "admin_login_geslaagd",
  mislukt: "admin_login_mislukt",
  alarm: "admin_login_alarm",
  ip: "admin_login_ip:",
} as const;

export const TWEESTAPS_NOODREM = ["1", "true", "on"].includes(
  (process.env.ADMIN_2FA_UIT ?? "").trim().toLowerCase(),
);

const UITGEVER = "Studio VM";
const STAP = 30;

/* ---------------- app_settings ---------------- */

type Rij = { key: string; value: string | null; updated_at?: string };

async function lees(key: string): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data as { value: string | null } | null)?.value ?? null;
}

async function zet(key: string, value: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

async function wis(...keys: string[]): Promise<void> {
  const { error } = await getSupabaseAdmin().from("app_settings").delete().in("key", keys);
  if (error) throw error;
}

function json<T>(v: string | null, standaard: T): T {
  if (!v) return standaard;
  try {
    return JSON.parse(v) as T;
  } catch {
    return standaard;
  }
}

/* ---------------- TOTP (RFC 6238) ---------------- */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32(buf: Buffer): string {
  let bits = 0;
  let waarde = 0;
  let uit = "";
  for (const byte of buf) {
    waarde = (waarde << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      uit += B32[(waarde >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) uit += B32[(waarde << (5 - bits)) & 31];
  return uit;
}

function uitBase32(s: string): Buffer {
  const schoon = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let waarde = 0;
  const bytes: number[] = [];
  for (const c of schoon) {
    waarde = (waarde << 5) | B32.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      bytes.push((waarde >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(geheim: Buffer, teller: number): string {
  const t = Buffer.alloc(8);
  t.writeBigUInt64BE(BigInt(teller));
  const h = createHmac("sha1", geheim).update(t).digest();
  const o = h[h.length - 1] & 15;
  const n = (h.readUInt32BE(o) & 0x7fffffff) % 1_000_000;
  return String(n).padStart(6, "0");
}

/** Geeft de tijdstap terug waarop de code klopt (±1 stap speling), anders null. */
function totpStap(geheimB32: string, code: string, nu = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const geheim = uitBase32(geheimB32);
  const huidig = Math.floor(nu / 1000 / STAP);
  for (const stap of [huidig, huidig - 1, huidig + 1]) {
    const a = Buffer.from(hotp(geheim, stap));
    if (timingSafeEqual(a, Buffer.from(code))) return stap;
  }
  return null;
}

export function otpauthUri(geheimB32: string): string {
  const label = encodeURIComponent(`${UITGEVER}:beheer`);
  return `otpauth://totp/${label}?secret=${geheimB32}&issuer=${encodeURIComponent(UITGEVER)}&algorithm=SHA1&digits=6&period=${STAP}`;
}

/* ---------------- herstelcodes ---------------- */

// Zonder tekens die op elkaar lijken (0/o, 1/l/i).
const HERSTEL_TEKENS = "abcdefghjkmnpqrstuvwxyz23456789";

function herstelHash(code: string): string {
  return createHash("sha256")
    .update(`studio-vm::herstel::${code.toLowerCase().replace(/[^a-z0-9]/g, "")}`)
    .digest("hex");
}

function nieuweHerstelcodes(aantal = 8): string[] {
  return Array.from({ length: aantal }, () => {
    const s = Array.from({ length: 8 }, () => HERSTEL_TEKENS[randomInt(HERSTEL_TEKENS.length)]).join("");
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

/* ---------------- toestand tweestaps ---------------- */

export type TweestapsStaat = {
  /** null = databank niet bereikbaar (dan niet aanmelden zonder noodrem). */
  aan: boolean | null;
  herstelOver: number;
  noodrem: boolean;
};

export async function tweestapsStaat(): Promise<TweestapsStaat> {
  try {
    const [geheim, herstel] = await Promise.all([lees(K.geheim), lees(K.herstel)]);
    return {
      aan: Boolean(geheim),
      herstelOver: json<string[]>(herstel, []).length,
      noodrem: TWEESTAPS_NOODREM,
    };
  } catch {
    return { aan: null, herstelOver: 0, noodrem: TWEESTAPS_NOODREM };
  }
}

export type CodeUitslag =
  | { ok: true; via: "app" }
  | { ok: true; via: "herstel"; over: number }
  | { ok: false };

/**
 * Controleert een code uit de app (6 cijfers) of een herstelcode. Een
 * app-code werkt maar één keer; een herstelcode wordt na gebruik geschrapt.
 */
export async function controleerCode(invoer: string): Promise<CodeUitslag> {
  const geheim = await lees(K.geheim);
  if (!geheim) return { ok: false };
  const code = invoer.replace(/\s/g, "");

  if (/^\d{6}$/.test(code)) {
    const stap = totpStap(geheim, code);
    if (stap === null) return { ok: false };
    const laatste = Number(await lees(K.laatsteStap)) || 0;
    if (stap <= laatste) return { ok: false };
    await zet(K.laatsteStap, String(stap));
    return { ok: true, via: "app" };
  }

  const lijst = json<string[]>(await lees(K.herstel), []);
  const h = herstelHash(code);
  const i = lijst.findIndex((x) => x.length === h.length && timingSafeEqual(Buffer.from(x), Buffer.from(h)));
  if (i < 0) return { ok: false };
  lijst.splice(i, 1);
  await zet(K.herstel, JSON.stringify(lijst));
  return { ok: true, via: "herstel", over: lijst.length };
}

/** Stap 1 van inschakelen: een nieuw geheim, nog niet actief. */
export async function startTweestaps(): Promise<{ geheim: string; uri: string }> {
  const geheim = base32(randomBytes(20));
  await zet(K.voorlopig, geheim);
  return { geheim, uri: otpauthUri(geheim) };
}

/** Stap 2: klopt de code bij het voorlopige geheim, dan wordt het actief. */
export async function bevestigTweestaps(code: string): Promise<string[] | null> {
  const voorlopig = await lees(K.voorlopig);
  if (!voorlopig) return null;
  const stap = totpStap(voorlopig, code.replace(/\s/g, ""));
  if (stap === null) return null;
  const codes = nieuweHerstelcodes();
  await zet(K.geheim, voorlopig);
  await zet(K.laatsteStap, String(stap));
  await zet(K.herstel, JSON.stringify(codes.map(herstelHash)));
  await wis(K.voorlopig);
  return codes;
}

export async function vernieuwHerstelcodes(): Promise<string[]> {
  const codes = nieuweHerstelcodes();
  await zet(K.herstel, JSON.stringify(codes.map(herstelHash)));
  return codes;
}

export async function zetTweestapsUit(): Promise<void> {
  await wis(K.geheim, K.herstel, K.laatsteStap, K.voorlopig);
}

/* ---------------- wie meldt zich aan ---------------- */

export type Bezoeker = {
  ip: string;
  sleutel: string;
  plaats: string;
  toestel: string;
};

export function bezoeker(h: Headers, toestel: string): Bezoeker {
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "onbekend";
  let stad = h.get("x-vercel-ip-city") ?? "";
  try {
    stad = decodeURIComponent(stad);
  } catch {}
  const land = h.get("x-vercel-ip-country") ?? "";
  return {
    ip,
    sleutel: createHash("sha256").update(`studio-vm::ip::${ip}`).digest("hex").slice(0, 24),
    plaats: [stad, land].filter(Boolean).join(", ") || "onbekend",
    toestel,
  };
}

/* ---------------- blokkeren na foute pogingen ---------------- */

// Per IP: 5 fouten binnen 15 minuten → 15 min geblokkeerd; elke volgende
// blokkade duurt dubbel zo lang (max. 24 u). Na een dag zonder fouten
// begint de teller opnieuw.
const MAX_FOUTEN = 5;
const VENSTER = 15 * 60_000;
const BASISBLOK = 15 * 60_000;
const MAXBLOK = 24 * 60 * 60_000;
const VERGEET = 24 * 60 * 60_000;

type IpStaat = { n: number; eerste: number; laatste: number; blokken: number; blokTot: number };

/** Hoeveel ms dit IP nog geblokkeerd is (0 = vrij). Fouten in de databank: niet blokkeren. */
export async function blokkadeOver(b: Bezoeker): Promise<number> {
  try {
    const s = json<IpStaat | null>(await lees(K.ip + b.sleutel), null);
    return s ? Math.max(0, s.blokTot - Date.now()) : 0;
  } catch {
    return 0;
  }
}

export async function registreerFout(b: Bezoeker, reden: string): Promise<{ blokMs: number; nieuw: boolean }> {
  const nu = Date.now();
  let uit = { blokMs: 0, nieuw: false };
  try {
    const s = json<IpStaat>(await lees(K.ip + b.sleutel), { n: 0, eerste: nu, laatste: 0, blokken: 0, blokTot: 0 });
    if (nu - s.laatste > VERGEET) s.blokken = 0;
    if (nu - s.eerste > VENSTER) {
      s.n = 0;
      s.eerste = nu;
    }
    s.n += 1;
    s.laatste = nu;
    if (s.n >= MAX_FOUTEN) {
      s.blokken += 1;
      const duur = Math.min(BASISBLOK * 2 ** (s.blokken - 1), MAXBLOK);
      s.blokTot = nu + duur;
      s.n = 0;
      s.eerste = nu;
      uit = { blokMs: duur, nieuw: true };
    }
    await zet(K.ip + b.sleutel, JSON.stringify({ ...s, ip: b.ip, plaats: b.plaats }));
  } catch {}
  await voegToe(K.mislukt, { t: nu, ip: b.ip, plaats: b.plaats, toestel: b.toestel, reden, blok: uit.nieuw }, 40);
  return uit;
}

export async function wisFouten(b: Bezoeker): Promise<void> {
  try {
    await wis(K.ip + b.sleutel);
  } catch {}
}

export type Blokkade = { sleutel: string; ip: string; plaats: string; tot: number };

export async function actieveBlokkades(): Promise<Blokkade[]> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("app_settings")
      .select("key, value")
      .like("key", `${K.ip}%`)
      .limit(500);
    const nu = Date.now();
    return ((data as Rij[] | null) ?? [])
      .map((r) => {
        const s = json<(IpStaat & { ip?: string; plaats?: string }) | null>(r.value, null);
        return s && s.blokTot > nu
          ? { sleutel: r.key.slice(K.ip.length), ip: s.ip ?? "?", plaats: s.plaats ?? "", tot: s.blokTot }
          : null;
      })
      .filter((x): x is Blokkade => x !== null)
      .sort((a, b) => b.tot - a.tot);
  } catch {
    return [];
  }
}

export async function geefVrij(sleutel: string): Promise<void> {
  if (!/^[0-9a-f]{24}$/.test(sleutel)) return;
  await wis(K.ip + sleutel);
}

/** Oude IP-tellers opruimen (na een geslaagde aanmelding). */
export async function ruimOp(): Promise<void> {
  try {
    const grens = new Date(Date.now() - 2 * VERGEET).toISOString();
    await getSupabaseAdmin().from("app_settings").delete().like("key", `${K.ip}%`).lt("updated_at", grens);
  } catch {}
}

/* ---------------- logboek ---------------- */

export type LogRegel = {
  t: number;
  ip: string;
  plaats: string;
  toestel: string;
  reden?: string;
  via?: string;
  blok?: boolean;
};

async function voegToe(key: string, regel: LogRegel, max: number): Promise<void> {
  try {
    const lijst = json<LogRegel[]>(await lees(key), []);
    lijst.unshift(regel);
    await zet(key, JSON.stringify(lijst.slice(0, max)));
  } catch {}
}

export async function logGeslaagd(b: Bezoeker, via: string): Promise<void> {
  await voegToe(K.geslaagd, { t: Date.now(), ip: b.ip, plaats: b.plaats, toestel: b.toestel, via }, 20);
}

export async function logboek(): Promise<{ geslaagd: LogRegel[]; mislukt: LogRegel[] }> {
  try {
    const [g, m] = await Promise.all([lees(K.geslaagd), lees(K.mislukt)]);
    return { geslaagd: json<LogRegel[]>(g, []), mislukt: json<LogRegel[]>(m, []) };
  } catch {
    return { geslaagd: [], mislukt: [] };
  }
}

/* ---------------- meldingen ---------------- */

export function tijdstip(t: number): string {
  return new Date(t).toLocaleString("nl-BE", {
    timeZone: "Europe/Brussels",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function details(b: Bezoeker): string {
  return `<b>Wanneer:</b> ${tijdstip(Date.now())}<br><b>Waar:</b> ${esc(b.plaats)} (IP ${esc(b.ip)})<br><b>Toestel:</b> ${esc(b.toestel)}`;
}

const BEVEILIGING_URL = `${siteUrl.replace(/\/$/, "")}/admin/beveiliging`;
const NIET_JIJ =
  "Was jij dit niet? Wijzig dan meteen ADMIN_PASSWORD in Vercel en herdeploy: dat meldt elke open sessie af.";

export async function mailAanmelding(b: Bezoeker, via: string, herstelOver?: number): Promise<void> {
  const lijnen = [details(b)];
  if (via === "herstel")
    lijnen.push(
      `Er werd een <b>herstelcode</b> gebruikt. Nog ${herstelOver ?? 0} over — maak nieuwe aan als dat er weinig zijn.`,
    );
  if (via === "noodrem")
    lijnen.push("Aangemeld <b>zonder code</b>: de noodrem ADMIN_2FA_UIT staat aan. Zet die weer uit zodra het kan.");
  await sendMail(BEDRIJF.email, {
    subject: via === "wachtwoord" ? "Aanmelding op het beheer" : `Aanmelding op het beheer (${via === "app" ? "met code" : via})`,
    html: portalEmailHtml({
      eyebrow: "Beveiliging",
      title: "Nieuwe aanmelding op het beheer",
      bodyLines: lijnen,
      ctaLabel: "Aanmeldingen bekijken",
      ctaHref: BEVEILIGING_URL,
      footnote: NIET_JIJ,
    }),
  });
}

/** Mail bij een nieuwe blokkade — hooguit één per uur. */
export async function mailBlokkade(b: Bezoeker, blokMs: number): Promise<void> {
  try {
    const vorige = Number(await lees(K.alarm)) || 0;
    if (Date.now() - vorige < 60 * 60_000) return;
    await zet(K.alarm, String(Date.now()));
  } catch {}
  await sendMail(BEDRIJF.email, {
    subject: "Aanmelden op het beheer geblokkeerd",
    html: portalEmailHtml({
      eyebrow: "Beveiliging",
      title: `${MAX_FOUTEN} foute pogingen — ${Math.round(blokMs / 60_000)} minuten geblokkeerd`,
      bodyLines: [
        details(b),
        "Iemand probeerde zich aan te melden met een verkeerd wachtwoord of een verkeerde code. Dat adres kan het voorlopig niet meer proberen.",
      ],
      ctaLabel: "Beveiliging bekijken",
      ctaHref: BEVEILIGING_URL,
      footnote: "Was jij het zelf? Dan kun je het adres vrijgeven op de beveiligingspagina, of wachten tot de blokkade afloopt.",
    }),
  });
}

export async function mailTweestaps(aan: boolean): Promise<void> {
  await sendMail(BEDRIJF.email, {
    subject: aan ? "Tweestapsverificatie ingeschakeld" : "Tweestapsverificatie uitgeschakeld",
    html: portalEmailHtml({
      eyebrow: "Beveiliging",
      title: aan ? "Tweestapsverificatie staat aan" : "Tweestapsverificatie staat uit",
      bodyLines: [
        aan
          ? "Vanaf nu vraagt het beheer bij elke aanmelding ook de code uit je authenticator-app."
          : "Het beheer vraagt bij het aanmelden geen code meer, enkel nog het wachtwoord.",
        `<b>Wanneer:</b> ${tijdstip(Date.now())}`,
      ],
      ctaLabel: "Beveiliging bekijken",
      ctaHref: BEVEILIGING_URL,
      footnote: NIET_JIJ,
    }),
  });
}
