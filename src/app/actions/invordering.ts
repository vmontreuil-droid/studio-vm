"use server";

// Beheer van invorderingsdossiers en deurwaarders (enkel admin). Er vertrekt
// nooit iets vanzelf: "Versturen naar deurwaarder" is altijd een klik van
// Studio VM, en enkel zolang de factuur openstaat.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verstuurMail } from "@/lib/monitor";
import { BEDRIJF } from "@/lib/bedrijf";
import { logBewijs } from "@/lib/invordering/bewijslog";
import { isArrondissement } from "@/lib/invordering/arrondissement";
import { deurwaarders, isDeurwaarder, laadDossier, type Deurwaarder } from "@/lib/invordering/dossier";
import { deurwaarderMail, dossierBijlagen } from "@/lib/invordering/documenten";

const UUID = /^[0-9a-f-]{36}$/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const s = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max);

function terug(id: string | null, melding: string): never {
  revalidatePath("/admin/invordering");
  if (id) revalidatePath(`/admin/invordering/${id}`);
  redirect(id ? `/admin/invordering/${id}?melding=${melding}` : `/admin/invordering?melding=${melding}`);
}

type Rij = { id: string; invoice_id: string; status: string; deurwaarder: unknown; arrondissement: string | null };

async function laad(id: string): Promise<Rij | null> {
  if (!UUID.test(id)) return null;
  const { data } = await getSupabaseAdmin()
    .from("invorderingen")
    .select("id, invoice_id, status, deurwaarder, arrondissement")
    .eq("id", id)
    .maybeSingle();
  return (data as Rij | null) ?? null;
}

// ── Deurwaarders per arrondissement ─────────────────────────────────────

export async function bewaarDeurwaarder(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const arr = s(fd, "arrondissement");
  if (!isArrondissement(arr)) redirect("/admin/deurwaarders?melding=fout");
  const naam = s(fd, "naam", 160);
  const email = s(fd, "email", 200).toLowerCase();
  const db = getSupabaseAdmin();
  if (!naam && !email) {
    await db.from("deurwaarders").delete().eq("arrondissement", arr);
    revalidatePath("/admin/deurwaarders");
    redirect(`/admin/deurwaarders?melding=gewist#${arr}`);
  }
  if (!naam || !EMAIL.test(email)) redirect(`/admin/deurwaarders?melding=onvolledig#${arr}`);
  const taal = s(fd, "taal");
  const { error } = await db.from("deurwaarders").upsert({
    arrondissement: arr,
    naam,
    kantoor: s(fd, "kantoor", 160) || null,
    email,
    telefoon: s(fd, "telefoon", 40) || null,
    adres: s(fd, "adres", 300) || null,
    taal: taal === "fr" || taal === "de" ? taal : "nl",
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/admin/deurwaarders");
  redirect(`/admin/deurwaarders?melding=${error ? "fout" : "bewaard"}#${arr}`);
}

// ── Dossier ─────────────────────────────────────────────────────────────

/** Deurwaarder van een dossier kiezen: uit de lijst (arrondissement) of zelf ingevuld. */
export async function kiesDeurwaarder(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const r = await laad(s(fd, "id"));
  if (!r) terug(null, "niet-gevonden");
  if (r.status === "verstuurd" || r.status === "afgesloten") terug(r.id, "al-verstuurd");

  let dw: Deurwaarder | null = null;
  const arr = s(fd, "arrondissement");
  if (arr) {
    if (!isArrondissement(arr)) terug(r.id, "fout");
    dw = (await deurwaarders()).get(arr) ?? null;
    if (!dw) terug(r.id, "geen-deurwaarder");
  } else {
    const taal = s(fd, "taal");
    const kandidaat: Deurwaarder = {
      arrondissement: r.arrondissement,
      naam: s(fd, "naam", 160),
      kantoor: s(fd, "kantoor", 160) || null,
      email: s(fd, "email", 200).toLowerCase(),
      telefoon: s(fd, "telefoon", 40) || null,
      adres: s(fd, "adres", 300) || null,
      taal: taal === "fr" || taal === "de" ? taal : "nl",
    };
    if (!isDeurwaarder(kandidaat)) terug(r.id, "onvolledig");
    dw = kandidaat;
  }
  await getSupabaseAdmin()
    .from("invorderingen")
    .update({ deurwaarder: dw, updated_at: new Date().toISOString() })
    .eq("id", r.id);
  terug(r.id, "deurwaarder");
}

/** Bedragen opnieuw berekenen tot vandaag (interest loopt elke dag op). */
export async function herbereken(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const r = await laad(s(fd, "id"));
  if (!r) terug(null, "niet-gevonden");
  const d = await laadDossier(r.invoice_id);
  if (!d) terug(r.id, "fout");
  await getSupabaseAdmin()
    .from("invorderingen")
    .update({
      hoofdsom_cent: d.vordering.hoofdsomCent,
      interest_cent: d.vordering.interestCent,
      forfait_cent: d.vordering.forfaitCent,
      berekend_op: d.vordering.berekendOp,
      updated_at: new Date().toISOString(),
    })
    .eq("id", r.id);
  terug(r.id, "herberekend");
}

export async function bewaarNotitie(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const r = await laad(s(fd, "id"));
  if (!r) terug(null, "niet-gevonden");
  await getSupabaseAdmin()
    .from("invorderingen")
    .update({ notitie: s(fd, "notitie", 2000) || null, updated_at: new Date().toISOString() })
    .eq("id", r.id);
  terug(r.id, "notitie");
}

/** Pauzeren, hervatten of afsluiten. */
export async function zetInvorderingStatus(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const r = await laad(s(fd, "id"));
  if (!r) terug(null, "niet-gevonden");
  const naar = s(fd, "status");
  const mag: Record<string, string[]> = {
    gepauzeerd: ["klaar"],
    klaar: ["gepauzeerd"],
    afgesloten: ["klaar", "gepauzeerd", "verstuurd"],
  };
  if (!mag[naar]?.includes(r.status)) terug(r.id, "fout");
  const { error } = await getSupabaseAdmin()
    .from("invorderingen")
    .update({ status: naar, updated_at: new Date().toISOString() })
    .eq("id", r.id)
    .eq("status", r.status);
  if (error) terug(r.id, "fout");
  await logBewijs({ soort: "invordering", invoice_id: r.invoice_id, details: { actie: naar, was: r.status } });
  terug(r.id, naar);
}

/**
 * Het dossier naar de deurwaarder sturen: brief, factuur en bewijsdossier als
 * pdf, kopie naar Studio VM. Bedragen worden eerst tot vandaag bijgewerkt.
 * Eerst opeisen (klaar → verstuurd), zodat een dubbelklik niet twee keer
 * verstuurt; mislukt de mail, dan terug naar klaar.
 */
export async function verstuurNaarDeurwaarder(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const r = await laad(s(fd, "id"));
  if (!r) terug(null, "niet-gevonden");
  if (r.status !== "klaar") terug(r.id, r.status === "verstuurd" ? "al-verstuurd" : "niet-klaar");
  if (s(fd, "bevestig") !== "ja") terug(r.id, "bevestig");
  const dw = isDeurwaarder(r.deurwaarder) ? r.deurwaarder : null;
  if (!dw) terug(r.id, "geen-deurwaarder");

  const d = await laadDossier(r.invoice_id);
  if (!d) terug(r.id, "fout");
  if (d.factuur.status === "betaald" || d.waarschuwingen.some((w) => w.blokkeert)) terug(r.id, "geblokkeerd");

  const db = getSupabaseAdmin();
  const { data: geclaimd } = await db
    .from("invorderingen")
    .update({ status: "verstuurd", updated_at: new Date().toISOString() })
    .eq("id", r.id)
    .eq("status", "klaar")
    .select("id");
  if (!(geclaimd as unknown[] | null)?.length) terug(r.id, "al-verstuurd");

  let resultaat: { ok: boolean; id: string | null } = { ok: false, id: null };
  try {
    const bijlagen = await dossierBijlagen(d, dw);
    resultaat = await verstuurMail(dw.email, deurwaarderMail(d, dw), { cc: [BEDRIJF.email], bijlagen });
  } catch (e) {
    console.error("[invordering] versturen mislukt:", e);
  }
  if (!resultaat.ok) {
    await db.from("invorderingen").update({ status: "klaar" }).eq("id", r.id);
    terug(r.id, "mail-fout");
  }

  const nu = new Date().toISOString();
  await db
    .from("invorderingen")
    .update({
      verstuurd_op: nu,
      hoofdsom_cent: d.vordering.hoofdsomCent,
      interest_cent: d.vordering.interestCent,
      forfait_cent: d.vordering.forfaitCent,
      berekend_op: d.vordering.berekendOp,
      updated_at: nu,
    })
    .eq("id", r.id);
  await logBewijs({
    soort: "invordering",
    invoice_id: d.factuur.id,
    client_email: d.klant.email,
    details: { actie: "verstuurd", aan: dw.email, deurwaarder: dw.naam, resend_id: resultaat.id, totaal_cent: d.vordering.totaalCent },
  });
  terug(r.id, "verstuurd-ok");
}

/** Dossier meteen klaarzetten voor een vervallen factuur (zonder de 14 dagen af te wachten). */
export async function maakDossier(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const invoiceId = s(fd, "invoice_id");
  const d = await laadDossier(invoiceId);
  if (!d) terug(null, "niet-gevonden");
  if (d.factuur.status === "betaald") terug(null, "betaald");
  const db = getSupabaseAdmin();
  const { data: al } = await db.from("invorderingen").select("id").eq("invoice_id", d.factuur.id).maybeSingle();
  if (al) terug((al as { id: string }).id, "bestaat");
  const dw = d.arrondissement ? (await deurwaarders()).get(d.arrondissement) ?? null : null;
  const { data, error } = await db
    .from("invorderingen")
    .insert({
      invoice_id: d.factuur.id,
      status: "klaar",
      arrondissement: d.arrondissement,
      deurwaarder: dw,
      hoofdsom_cent: d.vordering.hoofdsomCent,
      interest_cent: d.vordering.interestCent,
      forfait_cent: d.vordering.forfaitCent,
      berekend_op: d.vordering.berekendOp,
    })
    .select("id")
    .single();
  if (error || !data) terug(null, /invorderingen|42P01|PGRST205/i.test(`${error?.code} ${error?.message}`) ? "migratie" : "fout");
  await logBewijs({ soort: "invordering", invoice_id: d.factuur.id, client_email: d.klant.email, details: { actie: "klaargezet", manueel: true } });
  terug((data as { id: string }).id, "klaargezet");
}
