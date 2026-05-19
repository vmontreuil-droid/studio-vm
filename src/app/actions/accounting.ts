"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

// Boekhoud-suite — gedeelde server actions. Groeit mee met de modules.

function str(fd: FormData, k: string): string | null {
  const v = (fd.get(k) as string | null)?.trim();
  return v ? v : null;
}
function int(fd: FormData, k: string, fallback: number): number {
  const n = Number((fd.get(k) as string | null)?.trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function num(fd: FormData, k: string, fallback: number): number {
  const n = Number((fd.get(k) as string | null)?.trim());
  return Number.isFinite(n) ? n : fallback;
}

// Module 1 — bedrijfsinstellingen opslaan.
export async function saveCompanySettings(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Geen toegang." };
  try {
    const { error } = await getSupabaseAdmin()
      .from("company_settings")
      .upsert(
        {
          id: "default",
          company_name: str(fd, "company_name") || "Studio VM",
          legal_name: str(fd, "legal_name"),
          vat_number: str(fd, "vat_number"),
          address: str(fd, "address"),
          email: str(fd, "email"),
          phone: str(fd, "phone"),
          website: str(fd, "website"),
          iban: str(fd, "iban"),
          bic: str(fd, "bic"),
          bank_holder: str(fd, "bank_holder"),
          invoice_prefix: str(fd, "invoice_prefix") || "F",
          invoice_counter: int(fd, "invoice_counter", 0),
          credit_prefix: str(fd, "credit_prefix") || "CN",
          credit_counter: int(fd, "credit_counter", 0),
          payment_terms_days: int(fd, "payment_terms_days", 14),
          default_vat_rate: num(fd, "default_vat_rate", 21),
          invoice_footer: str(fd, "invoice_footer"),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/instellingen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fout." };
  }
}

// useActionState-wrapper (React 19) zodat het formulier feedback toont.
export async function saveCompanySettingsAction(
  _prev: { ok: boolean; error?: string } | null,
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  return saveCompanySettings(fd);
}
