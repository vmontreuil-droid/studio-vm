import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, siteUrl } from "@/lib/supabase/config";
import { BANK } from "@/lib/bank";

// Bedrijfsinstellingen — single source of truth voor alle documenten
// (offertes, facturen, creditnota's, aankoop, rapporten). Valt terug
// op de gekende constanten zolang migratie 0027 nog niet gedraaid is,
// zodat bestaande schermen nooit breken.
export type CompanySettings = {
  company_name: string;
  legal_name: string | null;
  vat_number: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  iban: string | null;
  bic: string | null;
  bank_holder: string | null;
  invoice_prefix: string;
  invoice_counter: number;
  credit_prefix: string;
  credit_counter: number;
  payment_terms_days: number;
  default_vat_rate: number;
  invoice_footer: string | null;
};

export const DEFAULT_SETTINGS: CompanySettings = {
  company_name: "Studio VM",
  legal_name: null,
  vat_number: null,
  address: null,
  email: "vmontreuil@outlook.be",
  phone: null,
  website: siteUrl,
  iban: BANK.iban,
  bic: BANK.bic,
  bank_holder: BANK.holder,
  invoice_prefix: "F",
  invoice_counter: 0,
  credit_prefix: "CN",
  credit_counter: 0,
  payment_terms_days: 14,
  default_vat_rate: 21,
  invoice_footer: null,
};

export async function getCompanySettings(): Promise<CompanySettings> {
  if (!monitorConfigured) return DEFAULT_SETTINGS;
  try {
    const { data } = await getSupabaseAdmin()
      .from("company_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (!data) return DEFAULT_SETTINGS;
    const r = data as Partial<CompanySettings>;
    // Lege velden vallen terug op de defaults.
    return {
      company_name: r.company_name || DEFAULT_SETTINGS.company_name,
      legal_name: r.legal_name ?? null,
      vat_number: r.vat_number ?? null,
      address: r.address ?? null,
      email: r.email ?? DEFAULT_SETTINGS.email,
      phone: r.phone ?? null,
      website: r.website ?? DEFAULT_SETTINGS.website,
      iban: r.iban || DEFAULT_SETTINGS.iban,
      bic: r.bic || DEFAULT_SETTINGS.bic,
      bank_holder: r.bank_holder || DEFAULT_SETTINGS.bank_holder,
      invoice_prefix: r.invoice_prefix || DEFAULT_SETTINGS.invoice_prefix,
      invoice_counter: r.invoice_counter ?? 0,
      credit_prefix: r.credit_prefix || DEFAULT_SETTINGS.credit_prefix,
      credit_counter: r.credit_counter ?? 0,
      payment_terms_days:
        r.payment_terms_days ?? DEFAULT_SETTINGS.payment_terms_days,
      default_vat_rate:
        r.default_vat_rate ?? DEFAULT_SETTINGS.default_vat_rate,
      invoice_footer: r.invoice_footer ?? null,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
