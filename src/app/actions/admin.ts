"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";

const STATUSES = [
  "nieuw",
  "in behandeling",
  "gewonnen",
  "verloren",
  "archief",
] as const;

async function guard(): Promise<boolean> {
  return adminConfigured && (await requireAdmin());
}

export async function setStatus(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status as (typeof STATUSES)[number])) return;
  await getSupabaseAdmin().from("quotes").update({ status }).eq("id", id);
  revalidatePath("/admin"); revalidatePath("/admin/aanvragen"); revalidatePath("/admin/monitors");
}

export async function setNote(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 4000);
  if (!id) return;
  await getSupabaseAdmin().from("quotes").update({ notes }).eq("id", id);
  revalidatePath("/admin"); revalidatePath("/admin/aanvragen"); revalidatePath("/admin/monitors");
}

export async function deleteQuote(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("quotes").delete().eq("id", id);
  revalidatePath("/admin"); revalidatePath("/admin/aanvragen"); revalidatePath("/admin/monitors");
}

export async function setMonitorActive(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  if (!id) return;
  await getSupabaseAdmin()
    .from("monitors")
    .update({
      active,
      unsubscribed_at: active ? null : new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin"); revalidatePath("/admin/aanvragen"); revalidatePath("/admin/monitors");
}

export async function deleteMonitor(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("monitors").delete().eq("id", id);
  revalidatePath("/admin"); revalidatePath("/admin/aanvragen"); revalidatePath("/admin/monitors");
}

export async function setSubscriberActive(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  if (!id) return;
  await getSupabaseAdmin()
    .from("newsletter_subscribers")
    .update({
      active,
      unsubscribed_at: active ? null : new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin"); revalidatePath("/admin/newsletter");
}

export async function deleteSubscriber(formData: FormData): Promise<void> {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getSupabaseAdmin().from("newsletter_subscribers").delete().eq("id", id);
  revalidatePath("/admin"); revalidatePath("/admin/newsletter");
}
