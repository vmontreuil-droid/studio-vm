// OpenProvider-integratie — env-gated. Zonder credentials blijft alles dormant
// en verandert de live site niet (zelfde patroon als de monitoring/portail).
//
// Activatie (Vercel env):
//   OPENPROVIDER_USERNAME   reseller-login
//   OPENPROVIDER_PASSWORD   reseller-wachtwoord
//   (+ server-IP whitelisten in het OpenProvider-paneel)
//
// API: https://docs.openprovider.com — REST, bearer-token via /v1beta/auth/login.

const OP_USER = process.env.OPENPROVIDER_USERNAME ?? "";
const OP_PASS = process.env.OPENPROVIDER_PASSWORD ?? "";
export const openproviderConfigured = Boolean(OP_USER && OP_PASS);

const BASE = "https://api.openprovider.eu";

let tokenCache: { token: string; exp: number } | null = null;

async function login(): Promise<string | null> {
  if (tokenCache && tokenCache.exp > Date.now()) return tokenCache.token;
  try {
    const r = await fetch(`${BASE}/v1beta/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: OP_USER, password: OP_PASS }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { data?: { token?: string } };
    const token = j.data?.token;
    if (!token) return null;
    // Token ~ uur geldig; we cachen voorzichtig 30 min.
    tokenCache = { token, exp: Date.now() + 30 * 60_000 };
    return token;
  } catch {
    return null;
  }
}

function splitDomain(input: string): { name: string; ext: string } | null {
  const clean = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  const m = clean.match(/^([a-z0-9-]+)\.([a-z.]{2,})$/);
  if (!m) return null;
  return { name: m[1], ext: m[2] };
}

export type DomainCheck =
  | { ok: true; domain: string; available: boolean; premium: boolean }
  | { ok: false; error: string };

export async function checkAvailability(
  input: string,
): Promise<DomainCheck> {
  if (!openproviderConfigured)
    return { ok: false, error: "not_configured" };
  const d = splitDomain(input);
  if (!d) return { ok: false, error: "invalid" };

  const token = await login();
  if (!token) return { ok: false, error: "auth" };

  try {
    const r = await fetch(`${BASE}/v1beta/domains/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        domains: [{ name: d.name, extension: d.ext }],
        with_price: false,
      }),
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) return { ok: false, error: "upstream" };
    const j = (await r.json()) as {
      data?: { results?: { status?: string; premium?: boolean }[] };
    };
    const res = j.data?.results?.[0];
    if (!res?.status) return { ok: false, error: "upstream" };
    return {
      ok: true,
      domain: `${d.name}.${d.ext}`,
      available: res.status === "free",
      premium: Boolean(res.premium),
    };
  } catch {
    return { ok: false, error: "upstream" };
  }
}

// --- Geld/onomkeerbaar: enkel server-side vanuit een geauthenticeerde flow ---
// (bewust NIET aan een anonieme publieke trigger gekoppeld).

export async function registerDomain(args: {
  name: string;
  ext: string;
  ownerHandle: string;
  nameservers: string[];
}): Promise<{ ok: boolean; id?: number; error?: string }> {
  if (!openproviderConfigured) return { ok: false, error: "not_configured" };
  const token = await login();
  if (!token) return { ok: false, error: "auth" };
  try {
    const r = await fetch(`${BASE}/v1beta/domains`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        domain: { name: args.name, extension: args.ext },
        period: 1,
        owner_handle: args.ownerHandle,
        admin_handle: args.ownerHandle,
        tech_handle: args.ownerHandle,
        billing_handle: args.ownerHandle,
        name_servers: args.nameservers.map((ns) => ({ name: ns })),
        autorenew: "default",
      }),
      signal: AbortSignal.timeout(15000),
    });
    const j = (await r.json()) as { data?: { id?: number }; desc?: string };
    if (!r.ok) return { ok: false, error: j.desc || "upstream" };
    return { ok: true, id: j.data?.id };
  } catch {
    return { ok: false, error: "upstream" };
  }
}

export async function transferDomain(args: {
  name: string;
  ext: string;
  authCode: string;
  ownerHandle: string;
  nameservers: string[];
}): Promise<{ ok: boolean; id?: number; error?: string }> {
  if (!openproviderConfigured) return { ok: false, error: "not_configured" };
  const token = await login();
  if (!token) return { ok: false, error: "auth" };
  try {
    const r = await fetch(`${BASE}/v1beta/domains/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        domain: { name: args.name, extension: args.ext },
        authcode: args.authCode,
        period: 1,
        owner_handle: args.ownerHandle,
        admin_handle: args.ownerHandle,
        tech_handle: args.ownerHandle,
        billing_handle: args.ownerHandle,
        name_servers: args.nameservers.map((ns) => ({ name: ns })),
      }),
      signal: AbortSignal.timeout(15000),
    });
    const j = (await r.json()) as { data?: { id?: number }; desc?: string };
    if (!r.ok) return { ok: false, error: j.desc || "upstream" };
    return { ok: true, id: j.data?.id };
  } catch {
    return { ok: false, error: "upstream" };
  }
}
