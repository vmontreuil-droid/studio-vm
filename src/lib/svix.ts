import { createHmac, timingSafeEqual } from "node:crypto";

// Verificatie van Svix-gesigneerde webhooks (o.a. Resend).
//   inhoud   `${id}.${timestamp}.${ruwe body}`
//   sleutel  base64-gedeelte van het geheim na "whsec_"
//   handtek. HMAC-SHA256, base64; de header bevat "v1,<sig>" — een
//            spatie-gescheiden lijst (bij sleutelrotatie meerdere)
//   tijd     timestamp mag hoogstens `toleranceS` afwijken (replay)

export function verifySvix(
  secret: string,
  id: string | null,
  timestamp: string | null,
  signatureHeader: string | null,
  body: string,
  opts: { nowS?: number; toleranceS?: number } = {},
): boolean {
  if (!secret || !id || !timestamp || !signatureHeader) return false;
  const nowS = opts.nowS ?? Math.floor(Date.now() / 1000);
  const tolerance = opts.toleranceS ?? 5 * 60;
  if (!/^\d+$/.test(timestamp)) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowS - ts) > tolerance) return false;

  const key = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice(6) : secret,
    "base64",
  );
  if (key.length === 0) return false;

  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest();

  for (const part of signatureHeader.trim().split(/\s+/)) {
    const comma = part.indexOf(",");
    if (comma < 0) continue;
    const version = part.slice(0, comma);
    const sig = part.slice(comma + 1);
    if (version !== "v1" || !sig) continue;
    const given = Buffer.from(sig, "base64");
    if (given.length === expected.length && timingSafeEqual(given, expected)) {
      return true;
    }
  }
  return false;
}
