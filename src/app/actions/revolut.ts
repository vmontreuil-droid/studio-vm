"use server";

// Beheer → Bank: de Revolut Business-koppeling instellen en bedienen.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { bewaarClientId, haalRevolutOp, ontkoppel, toestemmingsLink } from "@/lib/revolut";

export async function revolutClientId(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = String(fd.get("client_id") ?? "").trim().slice(0, 200);
  if (id && !/^[A-Za-z0-9_-]{8,200}$/.test(id)) redirect("/admin/bank?revolut=client-id-fout");
  await bewaarClientId(id);
  revalidatePath("/admin/bank");
  redirect("/admin/bank?revolut=client-id");
}

export async function revolutToestemming(): Promise<void> {
  if (!(await requireAdmin())) return;
  const link = await toestemmingsLink();
  if (!link) redirect("/admin/bank?revolut=niet-ingesteld");
  redirect(link);
}

export async function revolutOphalen(): Promise<void> {
  if (!(await requireAdmin())) return;
  const r = await haalRevolutOp(30);
  revalidatePath("/admin/bank");
  revalidatePath("/admin/facturen");
  redirect(`/admin/bank?revolut=${!r.actief ? "niet-gekoppeld" : r.ok ? `opgehaald&nieuw=${r.nieuw}&gekoppeld=${r.gekoppeld}` : "fout"}`);
}

export async function revolutOntkoppel(): Promise<void> {
  if (!(await requireAdmin())) return;
  await ontkoppel();
  revalidatePath("/admin/bank");
  redirect("/admin/bank?revolut=ontkoppeld");
}
