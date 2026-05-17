import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Slug uit een titel/bedrijfsnaam: kleine letters, koppeltekens,
// alleen a-z 0-9. Wordt het subdomein <slug>.studio-vm.be.
export function slugify(input: string): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export type LiveSite =
  | { ok: true; title: string; snapshot: unknown; clientEmail: string }
  | { ok: false; reason: "notfound" | "unpublished" | "inactive" };

// Publieke render-lookup (service-role, omzeilt RLS). Toont enkel als
// het ontwerp gepubliceerd is én de klant een actief abonnement heeft —
// zo blijft "online blijven" gekoppeld aan betalen.
export async function getLiveSite(slug: string): Promise<LiveSite> {
  const s = slugify(slug);
  if (!s) return { ok: false, reason: "notfound" };
  const admin = getSupabaseAdmin();

  const { data } = await admin
    .from("builder_designs")
    .select("title, snapshot, published, client_email")
    .eq("slug", s)
    .maybeSingle();
  const row = data as {
    title: string;
    snapshot: unknown;
    published: boolean;
    client_email: string;
  } | null;

  if (!row) return { ok: false, reason: "notfound" };
  if (!row.published) return { ok: false, reason: "unpublished" };

  const { data: sub } = await admin
    .from("subscriptions")
    .select("status")
    .eq("client_email", row.client_email)
    .eq("status", "actief")
    .limit(1)
    .maybeSingle();
  if (!sub) return { ok: false, reason: "inactive" };

  return {
    ok: true,
    title: row.title,
    snapshot: row.snapshot,
    clientEmail: row.client_email,
  };
}

// Welke modules heeft deze klant erbij gekocht (capability-vlaggen).
export async function clientCapabilities(
  clientEmail: string,
): Promise<string[]> {
  const { data } = await getSupabaseAdmin()
    .from("subscriptions")
    .select("capabilities")
    .eq("client_email", clientEmail)
    .eq("status", "actief")
    .limit(1)
    .maybeSingle();
  const caps = (data as { capabilities?: string[] } | null)?.capabilities;
  return Array.isArray(caps) ? caps : [];
}
