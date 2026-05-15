// Supabase is optioneel. Zonder env-vars blijft /portail de demo —
// de live site verandert dus niet tot je deze keys in Vercel zet:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Site-monitoring (terugkerende scans + alerts) is óók optioneel en gebruikt
// een service-role key die enkel server-side draait (cron + opt-in routes).
// Zonder deze keys blijft de "volg deze site"-functie onzichtbaar:
//   SUPABASE_SERVICE_ROLE_KEY   (Supabase → Project Settings → API)
//   RESEND_API_KEY              (optioneel; zonder e-mail wordt enkel gelogd)
//   CRON_SECRET                 (Vercel cron auth)
export const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const monitorConfigured = Boolean(supabaseUrl && supabaseServiceKey);
export const resendApiKey = process.env.RESEND_API_KEY ?? "";
export const cronSecret = process.env.CRON_SECRET ?? "";
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-vm.be";

// Admin voor offerte-aanvragen: opslag via service-role (monitorConfigured),
// afscherming met één wachtwoord. Zonder ADMIN_PASSWORD blijft /admin dicht
// en valt de offerte-knop terug op een mailto (niets verandert live).
export const adminPassword = process.env.ADMIN_PASSWORD ?? "";
export const leadsConfigured = monitorConfigured;
export const adminConfigured = Boolean(monitorConfigured && adminPassword);
