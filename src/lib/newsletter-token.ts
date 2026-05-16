import { createHmac, timingSafeEqual } from "node:crypto";
import { supabaseServiceKey, siteUrl } from "@/lib/supabase/config";

// Ondertekende uitschrijflink zonder extra DB-kolom: HMAC van het e-mail
// met de (server-only) service-role-sleutel als geheim. Niet te raden,
// niet te enumereren.
export function unsubSig(email: string): string {
  return createHmac("sha256", supabaseServiceKey || "svm")
    .update(email.trim().toLowerCase())
    .digest("base64url")
    .slice(0, 32);
}

export function unsubVerify(email: string, sig: string): boolean {
  const expected = unsubSig(email);
  if (!sig || sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function unsubLink(email: string): string {
  const e = encodeURIComponent(email.trim().toLowerCase());
  return `${siteUrl}/api/newsletter/unsubscribe?e=${e}&s=${unsubSig(email)}`;
}
