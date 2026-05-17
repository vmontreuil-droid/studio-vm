"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import { submitBuild } from "@/app/actions/build-lead";
import { slugify } from "@/lib/publish";
import { vercelAddDomain } from "@/lib/vercel";

// De builder bewaart pagina's met `sections` ({ kind, data }). We
// houden de snapshot bewust los getypeerd: hij rondreist enkel; enkel
// bij 'versturen' interpreteren we 'm.
type BuilderSection = { kind?: string; data?: Record<string, unknown> };
type BuilderPageShape = { name?: string; sections?: BuilderSection[] };
type Snapshot = {
  businessName?: string;
  theme?: { name?: string } | string;
  font?: string;
  radius?: string;
  locale?: string;
  pages?: BuilderPageShape[];
};

async function authed() {
  if (!supabaseConfigured) return null;
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user?.email ? user.email.toLowerCase() : null;
}

export async function createDesign(formData: FormData): Promise<void> {
  const email = await authed();
  if (!email) return;
  const locale = String(formData.get("locale") ?? "nl");
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const sb = await getSupabaseServer();
  let id: string | undefined;
  try {
    const { data, error } = await sb
      .from("builder_designs")
      .insert({
        client_email: email,
        title: title || "Mijn ontwerp",
        snapshot: {},
      })
      .select("id")
      .maybeSingle();
    if (!error) id = (data as { id?: string } | null)?.id;
  } catch {
    /* tabel ontbreekt of RLS — netjes afhandelen i.p.v. hangen */
  }
  revalidatePath(`/${locale}/portail/dashboard/builder`, "page");
  // Altijd navigeren zodat de knop nooit blijft hangen.
  redirect(
    id
      ? `/${locale}/portail/dashboard/builder/editor?d=${id}`
      : `/${locale}/portail/dashboard/builder?fout=db`,
  );
}

export async function saveDesign(
  id: string,
  snapshot: unknown,
  title?: string,
): Promise<{ ok: boolean }> {
  const email = await authed();
  if (!email || !id) return { ok: false };
  const sb = await getSupabaseServer();
  const patch: Record<string, unknown> = {
    snapshot,
    updated_at: new Date().toISOString(),
  };
  if (title && title.trim()) patch.title = title.trim().slice(0, 80);
  const { error } = await sb
    .from("builder_designs")
    .update(patch)
    .eq("id", id)
    .eq("client_email", email);
  return { ok: !error };
}

export async function renameDesign(formData: FormData): Promise<void> {
  const email = await authed();
  if (!email) return;
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const locale = String(formData.get("locale") ?? "nl");
  if (!id || !title) return;
  const sb = await getSupabaseServer();
  await sb
    .from("builder_designs")
    .update({ title })
    .eq("id", id)
    .eq("client_email", email);
  revalidatePath(`/${locale}/portail/dashboard/builder`, "page");
}

export async function deleteDesign(formData: FormData): Promise<void> {
  const email = await authed();
  if (!email) return;
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "nl");
  if (!id) return;
  const sb = await getSupabaseServer();
  await sb
    .from("builder_designs")
    .delete()
    .eq("id", id)
    .eq("client_email", email);
  revalidatePath(`/${locale}/portail/dashboard/builder`, "page");
}

export async function sendDesign(formData: FormData): Promise<void> {
  const email = await authed();
  if (!email) return;
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "nl");
  if (!id) return;
  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("builder_designs")
    .select("snapshot, title")
    .eq("id", id)
    .eq("client_email", email)
    .maybeSingle();
  const row = data as { snapshot: Snapshot; title: string } | null;
  if (!row) return;
  const s = (row.snapshot ?? {}) as Snapshot;
  const themeName =
    typeof s.theme === "string"
      ? s.theme
      : (s.theme?.name ?? "licht");
  const pages = (s.pages ?? []).map((p) => ({
    name: p.name || "Pagina",
    blocks: (p.sections ?? []).map((b) => ({
      kind: b.kind || "blok",
      data: (b.data ?? {}) as Record<string, unknown>,
    })),
  }));
  const sections = pages.flatMap((p) => p.blocks.map((b) => b.kind));
  await submitBuild({
    businessName: s.businessName || row.title || "Naamloos",
    email,
    locale: s.locale || locale,
    theme: themeName,
    font: s.font || "sans",
    radius: s.radius || "zacht",
    sections,
    pages,
    imageCount: 0,
  });
  await sb
    .from("builder_designs")
    .update({ status: "verstuurd", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_email", email);
  revalidatePath(`/${locale}/portail/dashboard/builder`, "page");
}

// Vrije, unieke slug op basis van een gewenste naam. Botst die met een
// ander ontwerp, dan -2, -3, ... (eigen ontwerp mag z'n slug houden).
async function freeSlug(base: string, selfId: string): Promise<string> {
  const admin = getSupabaseAdmin();
  const root = slugify(base) || "site";
  for (let i = 0; i < 30; i++) {
    const cand = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await admin
      .from("builder_designs")
      .select("id")
      .eq("slug", cand)
      .maybeSingle();
    const taken = data as { id?: string } | null;
    if (!taken || taken.id === selfId) return cand;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function publishDesign(formData: FormData): Promise<void> {
  const email = await authed();
  if (!email) return;
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "nl");
  const back = `/${locale}/portail/dashboard/builder`;
  if (!id) redirect(back);

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("builder_designs")
    .select("snapshot, title, slug")
    .eq("id", id)
    .eq("client_email", email)
    .maybeSingle();
  const row = data as {
    snapshot: Snapshot;
    title: string;
    slug: string | null;
  } | null;
  if (!row) redirect(back);

  // Poort: publiceren mag enkel met een actief abonnement.
  const { data: sub } = await getSupabaseAdmin()
    .from("subscriptions")
    .select("status")
    .eq("client_email", email)
    .eq("status", "actief")
    .limit(1)
    .maybeSingle();
  if (!sub) redirect(`${back}?fout=abo`);

  // Eén gepubliceerde site per abonnement. Staat er al een andere
  // online, dan eerst die offline halen (of een extra abonnement).
  const { data: other } = await getSupabaseAdmin()
    .from("builder_designs")
    .select("id")
    .eq("client_email", email)
    .eq("published", true)
    .neq("id", id)
    .limit(1)
    .maybeSingle();
  if (other) redirect(`${back}?fout=onesite`);

  const slug =
    row!.slug ||
    (await freeSlug(
      row!.snapshot?.businessName || row!.title || "site",
      id,
    ));

  await sb
    .from("builder_designs")
    .update({
      slug,
      published: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("client_email", email);

  // Subdomein koppelen aan Vercel (best-effort; zonder env-vars stil
  // overgeslagen — DNS-wildcard wijst sowieso al naar Vercel).
  await vercelAddDomain(`${slug}.studio-vm.be`);

  revalidatePath(back, "page");
  redirect(`${back}?ok=live`);
}

export async function unpublishDesign(formData: FormData): Promise<void> {
  const email = await authed();
  if (!email) return;
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "nl");
  if (!id) return;
  const sb = await getSupabaseServer();
  await sb
    .from("builder_designs")
    .update({ published: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_email", email);
  revalidatePath(`/${locale}/portail/dashboard/builder`, "page");
}
