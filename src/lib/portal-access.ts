import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Geeft een e-mailadres toegang tot het klantportaal door (indien nog
// niet bestaand) een Supabase-auth-gebruiker aan te maken. Idempotent:
// bestaat de gebruiker al, dan gebeurt er niets. Wordt aangeroepen bij
// een scan-met-e-mail en bij admin-acties (offerte/factuur/site/abo),
// zodat login zelf invite-only kan blijven.
export type PortalProfile = {
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  vat_number?: string | null;
  address?: string | null;
};

export async function ensurePortalUser(
  email: string,
  profile?: PortalProfile,
): Promise<void> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return;
  const meta = profile
    ? Object.fromEntries(
        Object.entries(profile).filter(([, v]) => v != null && v !== ""),
      )
    : undefined;
  const admin = getSupabaseAdmin();
  try {
    const { error } = await admin.auth.admin.createUser({
      email: clean,
      email_confirm: true,
      user_metadata: meta,
    });
    // Bestaat de gebruiker al? Werk dan de gegevens bij op het account.
    if (error && meta) {
      const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const u = data?.users?.find(
        (x) => (x.email ?? "").toLowerCase() === clean,
      );
      if (u)
        await admin.auth.admin.updateUserById(u.id, {
          user_metadata: { ...(u.user_metadata ?? {}), ...meta },
        });
    }
  } catch {
    // Niet-kritisch — login werkt sowieso.
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
