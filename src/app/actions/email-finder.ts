"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { findEmails } from "@/lib/email-finder";

// Eén site tegelijk — bewust geen bulk-/grab-flow. Zie de UI-uitleg
// op /admin/email-finder waarom dat zo blijft.
export async function findEmailsAction(
  _prev:
    | {
        ok: boolean;
        error?: string;
        site?: string;
        emails?: { address: string; source: string }[];
        pagesTried?: number;
      }
    | null,
  fd: FormData,
): Promise<{
  ok: boolean;
  error?: string;
  site?: string;
  emails?: { address: string; source: string }[];
  pagesTried?: number;
}> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  const url = (fd.get("url") as string | null)?.trim();
  if (!url) return { ok: false, error: "Geef een website-URL." };
  return findEmails(url);
}
