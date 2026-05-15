"use server";

import { checkAvailability, type DomainCheck } from "@/lib/openprovider";

export async function checkDomain(formData: FormData): Promise<DomainCheck> {
  const q = String(formData.get("domain") ?? "").trim();
  if (!q) return { ok: false, error: "invalid" };
  if (q.length > 100) return { ok: false, error: "invalid" };
  return checkAvailability(q);
}
