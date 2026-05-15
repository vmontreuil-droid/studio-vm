import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminPassword } from "@/lib/supabase/config";

export const ADMIN_COOKIE = "svm_admin";

export function adminToken(): string {
  return createHash("sha256")
    .update(`studio-vm::${adminPassword}`)
    .digest("hex");
}

export function isValidAdmin(cookieValue: string | undefined): boolean {
  if (!adminPassword || !cookieValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(adminToken());
  return a.length === b.length && timingSafeEqual(a, b);
}

// Server-side guard voor admin server-actions.
export async function requireAdmin(): Promise<boolean> {
  const jar = await cookies();
  return isValidAdmin(jar.get(ADMIN_COOKIE)?.value);
}
