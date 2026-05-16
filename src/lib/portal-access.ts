import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Geeft een e-mailadres toegang tot het klantportaal door (indien nog
// niet bestaand) een Supabase-auth-gebruiker aan te maken. Idempotent:
// bestaat de gebruiker al, dan gebeurt er niets. Wordt aangeroepen bij
// een scan-met-e-mail en bij admin-acties (offerte/factuur/site/abo),
// zodat login zelf invite-only kan blijven.
export async function ensurePortalUser(email: string): Promise<void> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return;
  try {
    await getSupabaseAdmin().auth.admin.createUser({
      email: clean,
      email_confirm: true,
    });
  } catch {
    // Bestaat al of niet-kritisch — login werkt sowieso.
  }
}

// Trekt portaaltoegang in: verwijdert de Supabase-auth-gebruiker.
export async function deletePortalUser(email: string): Promise<void> {
  const clean = email.trim().toLowerCase();
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const u = data?.users?.find(
      (x) => (x.email ?? "").toLowerCase() === clean,
    );
    if (u) await admin.auth.admin.deleteUser(u.id);
  } catch {
    // Niet-kritisch — data wordt sowieso verwijderd.
  }
}
