// Configuratie voor de prospect-bron per land. Eén structuur per
// land zodat de prospects-pagina, de batch-finder en de API
// allemaal vanuit dezelfde definitie werken.

export type Land = "be" | "fr" | "uk";

export type ProspectSource = {
  land: Land;
  flag: string;
  label: string;
  table: string;
  /** Naam van de primaire ID-kolom (verschilt per dataset). */
  idCol: string;
  /** Hoofdactiviteit-code (NACE/APE/SIC). */
  codeCol: string;
  /** Code-label voor de UI. */
  codeLabel: string;
  /** Rechtsvorm-kolom. */
  formCol: string;
  /** Status-kolom + waarde voor "actief". */
  statusCol: string;
  activeValue: string;
  /** RPC-functie voor atomic claim. */
  claimRpc: string;
  /** Voor placeholder-tekstjes. */
  postcodeExample: string;
  codeExample: string;
};

export const SOURCES: Record<Land, ProspectSource> = {
  be: {
    land: "be",
    flag: "🇧🇪",
    label: "België — KBO",
    table: "kbo_enterprises",
    idCol: "enterprise_number",
    codeCol: "nace_main",
    codeLabel: "NACE-code",
    formCol: "juridical_form",
    statusCol: "juridical_status",
    activeValue: "000",
    claimRpc: "claim_kbo_for_scan",
    postcodeExample: "bv. 9 (Oost-Vlaanderen)",
    codeExample: "bv. 4312 (grondwerken)",
  },
  fr: {
    land: "fr",
    flag: "🇫🇷",
    label: "Frankrijk — Sirene",
    table: "sirene_enterprises",
    idCol: "siret",
    codeCol: "ape_main",
    codeLabel: "APE/NAF-code",
    formCol: "legal_form",
    statusCol: "status",
    activeValue: "A",
    claimRpc: "claim_sirene_for_scan",
    postcodeExample: "bv. 75 (Parijs)",
    codeExample: "bv. 43.12 (terrassement)",
  },
  uk: {
    land: "uk",
    flag: "🇬🇧",
    label: "UK — Companies House",
    table: "uk_companies",
    idCol: "company_number",
    codeCol: "sic_main",
    codeLabel: "SIC-code",
    formCol: "category",
    statusCol: "status",
    activeValue: "Active",
    claimRpc: "claim_uk_for_scan",
    postcodeExample: "bv. SW1 (London)",
    codeExample: "bv. 43120 (site preparation)",
  },
};

export function sourceFromLand(raw?: string | null): ProspectSource {
  const k = (raw ?? "be").toLowerCase();
  if (k === "fr" || k === "uk" || k === "be") return SOURCES[k];
  return SOURCES.be;
}
