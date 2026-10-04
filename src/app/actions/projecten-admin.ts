"use server";

// ─────────────────────────────────────────────────────────────────────────
// Admin-acties rond 3D-projecten: aanmaken, status, uren, plannen,
// leveringen (modelbestanden), klant verwittigen, offerte en factuur.
// Elke actie controleert eerst requireAdmin(). Grote bestanden gaan NIET
// door een server action: de admin krijgt eenmalige upload-links en de
// browser laadt rechtstreeks op naar de privé-buckets.
// ─────────────────────────────────────────────────────────────────────────

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isEmail, sendMail } from "@/lib/monitor";
import { leveringMail, projectFactuurMail, projectOfferteMail, type KlantMail } from "@/lib/klant-mails";
import { ensurePortalUser } from "@/lib/portal-access";
import { bepaalBtw } from "@/lib/facturatie/btw";
import { slaFactuurOp, slaOfferteOp } from "@/lib/facturatie/opslaan";
import { isLand, stelselVoor } from "@/lib/stelsel";
import { UURTARIEF_CENT, MINIMUM_UREN, euro, type Categorie } from "@/lib/tarieven";
import { STAPPEN, type Project, type ProjectStatus } from "@/lib/projecten";
import {
  isTaal,
  modelLijn,
  systemenLijn,
  KORTING_LABEL,
  factuurOmschrijving,
  type Taal,
} from "@/lib/projecten-teksten";
import { authGebruiker, klantGegevens } from "@/lib/projecten-admin";
import { zoekWerf } from "@/lib/geocode";
import { logBewijs } from "@/lib/invordering/bewijslog";
import { betaalLink } from "@/lib/facturatie/online-betalen";

const MODEL_MAX = 200 * 1024 * 1024; // 200 MB per modelbestand
const PLAN_MAX = 50 * 1024 * 1024; // 50 MB per plan (limiet bucket 'plannen')
const MAX_BESTANDEN = 30;
const CATEGORIEEN: Categorie[] = ["vroegtijdig", "normaal", "last-minute"];
const ALLE_STATUSSEN: ProjectStatus[] = [...STAPPEN, "geannuleerd"];

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function uren(v: string): number | null {
  if (!v) return null;
  const n = Math.round(parseFloat(v.replace(",", ".")) * 100) / 100;
  return Number.isFinite(n) && n >= 0 && n <= 9999 ? n : null;
}

function centen(v: string): number {
  const n = Math.round(parseFloat(v.replace(",", ".")) * 100);
  return Number.isFinite(n) ? n : 0;
}

function isDatum(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function veiligeNaam(naam: string) {
  return naam.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(-120) || "bestand";
}

function herlaad(id?: string) {
  revalidatePath("/admin/projecten");
  if (id) revalidatePath(`/admin/projecten/${id}`);
  revalidatePath("/[locale]/portail/dashboard", "layout");
}

async function laadProject(id: string): Promise<Project | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await getSupabaseAdmin().from("projecten").select("*").eq("id", id).maybeSingle();
  return (data as Project | null) ?? null;
}

async function bijwerken(id: string, velden: Record<string, unknown>) {
  return getSupabaseAdmin()
    .from("projecten")
    .update({ ...velden, updated_at: new Date().toISOString() })
    .eq("id", id);
}

/** Klantmail versturen (gebouwd in src/lib/klant-mails.ts). Faalt stil. */
async function mailKlant(email: string, m: KlantMail): Promise<boolean> {
  const ok = await sendMail(email, m).catch(() => false);
  if (!ok) console.info(`[projecten] mail niet verstuurd (geen RESEND_API_KEY?) → ${email}: ${m.subject}`);
  return ok;
}

// ── Project aanmaken ────────────────────────────────────────────────────

export async function maakProject(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const email = s(fd, "email").toLowerCase();
  const taal = isTaal(s(fd, "taal")) ? (s(fd, "taal") as Taal) : "nl";
  const naam = s(fd, "naam").slice(0, 160);
  const bedrijf = s(fd, "bedrijf").slice(0, 160);
  const telefoon = s(fd, "telefoon").slice(0, 40);
  const btw = s(fd, "btw").slice(0, 32);
  const titel = s(fd, "titel").slice(0, 140);
  const categorie = CATEGORIEEN.includes(s(fd, "categorie") as Categorie) ? s(fd, "categorie") : "normaal";
  const anders = s(fd, "merk_anders").slice(0, 80);
  const merken = fd
    .getAll("merken")
    .map(String)
    .filter(Boolean)
    .map((m) => (m === "anders" ? (anders ? `Ander: ${anders}` : "Ander merk") : m.slice(0, 80)))
    .slice(0, 15);
  const straat = s(fd, "werf_straat").slice(0, 160);
  const postcode = s(fd, "werf_postcode").slice(0, 16);
  const gemeente = s(fd, "werf_gemeente").slice(0, 120);
  const land = s(fd, "werf_land").toUpperCase();
  const leverdatum = s(fd, "leverdatum");
  const geschat = uren(s(fd, "geschatte_uren"));
  const opmerking = s(fd, "opmerking").slice(0, 5000);

  if (!isEmail(email)) redirect("/admin/projecten/nieuw?fout=email");
  if (!titel) redirect("/admin/projecten/nieuw?fout=titel");
  if (!gemeente || !isLand(land)) redirect("/admin/projecten/nieuw?fout=werf");

  const geo = await zoekWerf(straat, postcode, gemeente, land, "admin");
  const stelsel = stelselVoor(land as Parameters<typeof stelselVoor>[0], geo?.lat ?? null, geo?.lon ?? null);

  // Portaaltoegang + profiel; de taal bewaren we op het account zodat
  // offertes en mails later in de juiste taal vertrekken.
  await ensurePortalUser(email, { name: naam || null, company: bedrijf || null, phone: telefoon || null, vat_number: btw || null });
  const user = await authGebruiker(email);
  if (user) {
    try {
      await getSupabaseAdmin().auth.admin.updateUserById(user.id, { user_metadata: { ...user.meta, locale: taal } });
    } catch {
      // niet-kritisch
    }
  }

  const { data, error } = await getSupabaseAdmin()
    .from("projecten")
    .insert({
      client_email: email,
      titel,
      categorie,
      merken,
      werf: { straat, postcode, gemeente, land, lat: geo?.lat ?? null, lon: geo?.lon ?? null },
      stelsel,
      plannen: [],
      geschatte_uren: geschat,
      leverdatum: isDatum(leverdatum) ? leverdatum : null,
      opmerking: opmerking || null,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[projecten] aanmaken mislukt:", error?.message);
    redirect("/admin/projecten/nieuw?fout=opslag");
  }
  herlaad();
  redirect(`/admin/projecten/${(data as { id: string }).id}?melding=aangemaakt`);
}

// ── Status, gegevens, uren, notitie ─────────────────────────────────────

export async function zetStatus(id: string, status: ProjectStatus): Promise<void> {
  if (!(await requireAdmin())) return;
  if (!ALLE_STATUSSEN.includes(status)) return;
  await bijwerken(id, { status });
  herlaad(id);
}

export async function bewaarGegevens(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = s(fd, "id");
  const p = await laadProject(id);
  if (!p) return;
  const titel = s(fd, "titel").slice(0, 140);
  const categorie = s(fd, "categorie");
  const leverdatum = s(fd, "leverdatum");
  const merken = fd.getAll("merken").map(String).filter(Boolean).map((m) => m.slice(0, 80)).slice(0, 15);
  const extra = s(fd, "merk_extra").slice(0, 80);
  if (extra && !merken.includes(extra)) merken.push(extra);
  await bijwerken(id, {
    titel: titel || p.titel,
    categorie: CATEGORIEEN.includes(categorie as Categorie) ? categorie : p.categorie,
    leverdatum: isDatum(leverdatum) ? leverdatum : null,
    merken,
  });
  herlaad(id);
}

export async function bewaarWerf(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = s(fd, "id");
  const p = await laadProject(id);
  if (!p) return;
  const werf = {
    straat: s(fd, "werf_straat").slice(0, 160),
    postcode: s(fd, "werf_postcode").slice(0, 16),
    gemeente: s(fd, "werf_gemeente").slice(0, 120),
    land: s(fd, "werf_land").toUpperCase().slice(0, 2),
    lat: p.werf?.lat ?? null,
    lon: p.werf?.lon ?? null,
  };
  const oud = p.werf ?? {};
  const adresGewijzigd =
    werf.straat !== (oud.straat ?? "") ||
    werf.postcode !== (oud.postcode ?? "") ||
    werf.gemeente !== (oud.gemeente ?? "") ||
    werf.land !== (oud.land ?? "");
  if ((adresGewijzigd || werf.lat == null) && werf.gemeente && isLand(werf.land)) {
    const geo = await zoekWerf(werf.straat, werf.postcode, werf.gemeente, werf.land, "admin");
    werf.lat = geo?.lat ?? null;
    werf.lon = geo?.lon ?? null;
  }
  let stelsel = p.stelsel;
  if (s(fd, "stelsel_opnieuw") === "1" && isLand(werf.land)) {
    stelsel = stelselVoor(werf.land, werf.lat ?? null, werf.lon ?? null);
  } else {
    const st = s(fd, "stelsel").slice(0, 120);
    const epsg = s(fd, "epsg").slice(0, 40);
    const hoogte = s(fd, "hoogte").slice(0, 120);
    if (st || epsg || hoogte) {
      stelsel = { stelsel: st, epsg, hoogte, ...(p.stelsel?.opmerking ? { opmerking: p.stelsel.opmerking } : {}) };
    }
  }
  await bijwerken(id, { werf, stelsel });
  herlaad(id);
}

export async function bewaarUren(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = s(fd, "id");
  if (!(await laadProject(id))) return;
  await bijwerken(id, {
    geschatte_uren: uren(s(fd, "geschatte_uren")),
    gewerkte_uren: uren(s(fd, "gewerkte_uren")),
  });
  herlaad(id);
}

export async function telUren(id: string, delta: number): Promise<void> {
  if (!(await requireAdmin())) return;
  if (![0.25, 0.5, 1, -0.25].includes(delta)) return;
  const p = await laadProject(id);
  if (!p) return;
  const nieuw = Math.max(0, Math.round(((Number(p.gewerkte_uren) || 0) + delta) * 100) / 100);
  await bijwerken(id, { gewerkte_uren: nieuw });
  herlaad(id);
}

export async function bewaarNotitie(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = s(fd, "id");
  if (!(await laadProject(id))) return;
  await bijwerken(id, { opmerking: s(fd, "opmerking").slice(0, 5000) || null });
  herlaad(id);
}

// ── Plannen (bucket 'plannen') ──────────────────────────────────────────

export type UploadPlek = { naam: string; pad: string; url: string; grootte: number };
type PlekResultaat = { ok: true; plekken: UploadPlek[] } | { ok: false; fout: string };

export async function planPlekken(projectId: string, bestanden: { naam: string; grootte: number }[]): Promise<PlekResultaat> {
  if (!(await requireAdmin())) return { ok: false, fout: "Niet aangemeld als admin." };
  if (!(await laadProject(projectId))) return { ok: false, fout: "Project niet gevonden." };
  if (!Array.isArray(bestanden) || bestanden.length === 0) return { ok: false, fout: "Geen bestanden gekozen." };
  if (bestanden.length > MAX_BESTANDEN) return { ok: false, fout: `Maximaal ${MAX_BESTANDEN} bestanden tegelijk.` };
  const te = bestanden.find((b) => !(b.grootte > 0) || b.grootte > PLAN_MAX);
  if (te) return { ok: false, fout: `${te.naam}: plannen mogen maximaal 50 MB zijn.` };
  const db = getSupabaseAdmin();
  const stempel = Date.now().toString(36);
  const plekken: UploadPlek[] = [];
  for (const b of bestanden) {
    const pad = `projecten/${projectId}/${stempel}-${veiligeNaam(b.naam)}`;
    const { data, error } = await db.storage.from("plannen").createSignedUploadUrl(pad);
    if (error || !data) return { ok: false, fout: `Upload-link mislukt: ${error?.message ?? "onbekend"}` };
    plekken.push({ naam: b.naam.slice(0, 200), pad, url: data.signedUrl, grootte: b.grootte });
  }
  return { ok: true, plekken };
}

export async function registreerPlannen(
  projectId: string,
  items: { naam: string; pad: string; grootte: number }[],
): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  const p = await laadProject(projectId);
  if (!p) return { ok: false };
  const nieuw = (Array.isArray(items) ? items : [])
    .filter((i) => typeof i?.pad === "string" && i.pad.startsWith(`projecten/${projectId}/`))
    .map((i) => ({ naam: String(i.naam).slice(0, 200), pad: i.pad, grootte: Number(i.grootte) || undefined }));
  const bestaand = (p.plannen ?? []).filter((x) => !nieuw.some((n) => n.pad === x.pad));
  await bijwerken(projectId, { plannen: [...bestaand, ...nieuw] });
  herlaad(projectId);
  return { ok: true };
}

export async function verwijderPlan(projectId: string, pad: string): Promise<void> {
  if (!(await requireAdmin())) return;
  const p = await laadProject(projectId);
  if (!p || !(p.plannen ?? []).some((x) => x.pad === pad)) return;
  // Enkel door de admin opgeladen plannen ook uit de opslag wissen; die van
  // de klant horen ook bij zijn aanvraag (quotes.snapshot) en blijven staan.
  if (pad.startsWith(`projecten/${projectId}/`)) {
    await getSupabaseAdmin().storage.from("plannen").remove([pad]);
  }
  await bijwerken(projectId, { plannen: (p.plannen ?? []).filter((x) => x.pad !== pad) });
  herlaad(projectId);
}

// ── Leveringen (bucket 'modellen') ──────────────────────────────────────

export async function leveringPlekken(
  projectId: string,
  bestanden: { naam: string; grootte: number }[],
  systeem: string,
  versie: number,
): Promise<PlekResultaat> {
  if (!(await requireAdmin())) return { ok: false, fout: "Niet aangemeld als admin." };
  if (!(await laadProject(projectId))) return { ok: false, fout: "Project niet gevonden." };
  const sys = String(systeem ?? "").trim().slice(0, 80);
  const v = Math.floor(Number(versie));
  if (!sys) return { ok: false, fout: "Kies een systeem." };
  if (!(v >= 1 && v <= 999)) return { ok: false, fout: "Ongeldige versie." };
  if (!Array.isArray(bestanden) || bestanden.length === 0) return { ok: false, fout: "Geen bestanden gekozen." };
  if (bestanden.length > MAX_BESTANDEN) return { ok: false, fout: `Maximaal ${MAX_BESTANDEN} bestanden tegelijk.` };
  const te = bestanden.find((b) => !(b.grootte > 0) || b.grootte > MODEL_MAX);
  if (te) return { ok: false, fout: `${te.naam}: maximaal 200 MB per bestand.` };
  const db = getSupabaseAdmin();
  const plekken: UploadPlek[] = [];
  for (const b of bestanden) {
    const pad = `${projectId}/v${v}/${veiligeNaam(sys)}/${veiligeNaam(b.naam)}`;
    // upsert: hetzelfde bestand opnieuw opladen vervangt het.
    const { data, error } = await db.storage.from("modellen").createSignedUploadUrl(pad, { upsert: true });
    if (error || !data) return { ok: false, fout: `Upload-link mislukt: ${error?.message ?? "onbekend"}` };
    plekken.push({ naam: b.naam.slice(0, 200), pad, url: data.signedUrl, grootte: b.grootte });
  }
  return { ok: true, plekken };
}

export async function registreerLeveringen(
  projectId: string,
  items: { naam: string; pad: string; grootte: number }[],
  systeem: string,
  versie: number,
  opmerking: string,
): Promise<{ ok: boolean }> {
  if (!(await requireAdmin())) return { ok: false };
  if (!(await laadProject(projectId))) return { ok: false };
  const sys = String(systeem ?? "").trim().slice(0, 80);
  const v = Math.floor(Number(versie));
  if (!sys || !(v >= 1 && v <= 999)) return { ok: false };
  const rijen = (Array.isArray(items) ? items : [])
    .filter((i) => typeof i?.pad === "string" && i.pad.startsWith(`${projectId}/v${v}/`))
    .map((i) => ({
      project_id: projectId,
      versie: v,
      systeem: sys,
      naam: String(i.naam).slice(0, 200),
      pad: i.pad,
      grootte: Number(i.grootte) || null,
      opmerking: String(opmerking ?? "").trim().slice(0, 500) || null,
    }));
  if (rijen.length === 0) return { ok: false };
  const db = getSupabaseAdmin();
  // Opnieuw opgeladen bestand (zelfde pad) → oude rij vervangen.
  await db.from("leveringen").delete().eq("project_id", projectId).in("pad", rijen.map((r) => r.pad));
  const { error } = await db.from("leveringen").insert(rijen);
  if (error) {
    console.error("[projecten] levering registreren mislukt:", error.message);
    return { ok: false };
  }
  await bijwerken(projectId, {});
  herlaad(projectId);
  return { ok: true };
}

export async function verwijderLevering(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = s(fd, "id");
  const db = getSupabaseAdmin();
  const { data } = await db.from("leveringen").select("id, project_id, pad").eq("id", id).maybeSingle();
  const lev = data as { id: string; project_id: string; pad: string } | null;
  if (!lev) return;
  await db.storage.from("modellen").remove([lev.pad]);
  await db.from("leveringen").delete().eq("id", lev.id);
  herlaad(lev.project_id);
}

// ── Klant verwittigen ───────────────────────────────────────────────────

export async function verwittigKlant(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = s(fd, "id");
  const p = await laadProject(id);
  if (!p) return;
  const db = getSupabaseAdmin();
  const { data } = await db.from("leveringen").select("versie, systeem").eq("project_id", id);
  const lev = (data as { versie: number; systeem: string }[] | null) ?? [];
  if (lev.length === 0) redirect(`/admin/projecten/${id}?melding=geen-leveringen`);
  const versie = Math.max(...lev.map((l) => l.versie));
  const systemen = [...new Set(lev.filter((l) => l.versie === versie).map((l) => l.systeem))];

  let betaald = false;
  if (p.invoice_id) {
    const { data: f } = await db.from("invoices").select("status").eq("id", p.invoice_id).maybeSingle();
    betaald = (f as { status?: string } | null)?.status === "betaald";
  }
  const k = await klantGegevens(p.client_email, p.quote_id);
  await ensurePortalUser(p.client_email);
  const verstuurd = await mailKlant(
    p.client_email,
    leveringMail(k.taal, { naam: k.naam, titel: p.titel, versie, systemen, betaald, projectId: p.id }),
  );
  if (["aanvraag", "offerte", "akkoord", "productie"].includes(p.status)) {
    await bijwerken(id, { status: "geleverd" });
  }
  herlaad(id);
  redirect(`/admin/projecten/${id}?melding=verwittigd${verstuurd ? "" : "&mail=0"}`);
}

// ── Offerte ─────────────────────────────────────────────────────────────

type Lijn = { label: string; desc: string; cents: number; kind?: string };

export async function maakOfferte(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = s(fd, "id");
  const p = await laadProject(id);
  if (!p) return;
  const k = await klantGegevens(p.client_email, p.quote_id);
  const taal = isTaal(s(fd, "taal")) ? (s(fd, "taal") as Taal) : k.taal;
  const categorie = CATEGORIEEN.includes(s(fd, "categorie") as Categorie) ? (s(fd, "categorie") as Categorie) : p.categorie;
  const tarief = UURTARIEF_CENT[categorie];
  const u = Math.max(uren(s(fd, "uren")) ?? 0, MINIMUM_UREN);
  const geldig = s(fd, "geldig") === "30" ? 30 : 14;

  const lijnen: Lijn[] = [{ ...modelLijn(taal, u, tarief, categorie), cents: Math.round(u * tarief), kind: "uren" }];
  if (p.merken.length) lijnen.push({ ...systemenLijn(taal, p.merken), cents: 0, kind: "incl" });
  const labels = fd.getAll("extra_label").map(String);
  const bedragen = fd.getAll("extra_bedrag").map(String);
  labels.forEach((l, i) => {
    const label = l.trim().slice(0, 200);
    const c = centen(bedragen[i] ?? "");
    if (label && c > 0) lijnen.push({ label, desc: "", cents: c });
  });
  const korting = Math.abs(centen(s(fd, "korting")));
  if (korting > 0) lijnen.push({ label: KORTING_LABEL[taal], desc: "", cents: -korting, kind: "korting" });
  const totaal = Math.max(0, lijnen.reduce((t, l) => t + l.cents, 0));

  const btw = s(fd, "vat_number").slice(0, 32);
  const besluit = await bepaalBtw(btw);
  const vatReverse = besluit.nulTarief;

  const validUntil = new Date(Date.now() + geldig * 86400000).toISOString().slice(0, 10);
  const titel = s(fd, "titel").slice(0, 200) || p.titel;
  const naam = s(fd, "client_name").slice(0, 160);
  const opgeslagen = await slaOfferteOp({
      client_email: p.client_email,
      title: titel,
      body: s(fd, "intro").slice(0, 8000) || null,
      items: lijnen,
      amount_cents: totaal,
      valid_days: geldig,
      valid_until: validUntil,
      internal_note: s(fd, "internal_note").slice(0, 4000) || `Project ${p.id}`,
      client_name: naam || null,
      client_company: s(fd, "client_company").slice(0, 160) || null,
      client_address: s(fd, "client_address").slice(0, 400) || null,
      vat_number: btw || null,
      vat_valid: besluit.controle?.geldig ?? null,
      vat_name: besluit.controle?.naam ?? null,
      vat_reverse: vatReverse,
      btw_regime: besluit.regime,
      btw_controle: besluit.controle,
  });
  if (!opgeslagen.ok) redirect(`/admin/projecten/${id}?melding=offerte-fout`);
  const offerNo = opgeslagen.doc.nummer;
  await bijwerken(id, {
    offer_id: opgeslagen.doc.id,
    geschatte_uren: u,
    categorie,
    ...(p.status === "aanvraag" ? { status: "offerte" } : {}),
  });

  await ensurePortalUser(p.client_email);
  const verstuurd = await mailKlant(
    p.client_email,
    projectOfferteMail(taal, {
      naam: naam || k.naam,
      titel,
      offerNo,
      lijnen,
      totaalExclCent: totaal,
      verlegd: vatReverse,
      geldigTot: validUntil,
    }),
  );
  herlaad(id);
  revalidatePath("/admin/offertes");
  redirect(`/admin/projecten/${id}?melding=offerte${verstuurd ? "" : "&mail=0"}`);
}

// ── Factuur ─────────────────────────────────────────────────────────────

export async function maakFactuur(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = s(fd, "id");
  const p = await laadProject(id);
  if (!p) return;
  const db = getSupabaseAdmin();

  // Max. één lopende factuur per project: enkel opnieuw als de vorige vervallen is.
  if (p.invoice_id) {
    const { data: f } = await db.from("invoices").select("status").eq("id", p.invoice_id).maybeSingle();
    const st = (f as { status?: string } | null)?.status;
    if (st && st !== "vervallen") redirect(`/admin/projecten/${id}?melding=factuur-bestaat`);
  }

  type OfferteRef = {
    id: string;
    items: Lijn[] | null;
    vat_reverse: boolean | null;
    client_name: string | null;
    client_company: string | null;
    client_address: string | null;
    vat_number: string | null;
  };
  let offerte: OfferteRef | null = null;
  if (p.offer_id) {
    const { data: o } = await db
      .from("offers")
      .select("id, items, vat_reverse, client_name, client_company, client_address, vat_number")
      .eq("id", p.offer_id)
      .maybeSingle();
    offerte = (o as OfferteRef | null) ?? null;
  }
  const k = await klantGegevens(p.client_email, p.quote_id);
  const taal = k.taal;
  const tarief = UURTARIEF_CENT[p.categorie];
  const u = Math.max(uren(s(fd, "uren")) ?? Number(p.gewerkte_uren ?? p.geschatte_uren ?? 0), MINIMUM_UREN);
  let bedrag = Math.round(u * tarief);
  const extra: string[] = [];
  if (s(fd, "met_extra") === "1") {
    for (const l of offerte?.items ?? []) {
      if (l.kind === "uren" || l.kind === "incl" || l.kind === "sub" || !l.cents) continue;
      bedrag += l.cents;
      extra.push(`${l.cents < 0 ? "−" : "+"} ${l.label} ${euro(Math.abs(l.cents), taal)}`);
    }
  }
  bedrag = Math.max(0, bedrag);
  if (bedrag <= 0) redirect(`/admin/projecten/${id}?melding=factuur-nul`);

  const termijn = s(fd, "termijn") === "30" ? 30 : 14;
  const dueAt = new Date(Date.now() + termijn * 86400000).toISOString().slice(0, 10);
  const omschrijving =
    s(fd, "omschrijving").slice(0, 300) ||
    [factuurOmschrijving(taal, p.titel, u, tarief), ...extra].join(" ").slice(0, 300);
  const klantNaam = offerte?.client_company || offerte?.client_name || k.bedrijf || k.naam || null;
  // Btw opnieuw bepalen op het moment van factureren: de VIES-controle van
  // vandaag is het bewijs dat op de factuur hoort.
  const klantBtw = offerte?.vat_number || k.btw || null;
  const besluit = await bepaalBtw(klantBtw);
  const opgeslagen = await slaFactuurOp({
    client_email: p.client_email,
    description: omschrijving,
    amount_cents: bedrag,
    status: "open",
    due_at: dueAt,
    offer_id: offerte?.id ?? null,
    public_token: randomBytes(18).toString("base64url"),
    client_name: klantNaam,
    client_address: offerte?.client_address || k.adres || null,
    client_vat: klantBtw,
    vat_reverse: besluit.nulTarief,
    btw_regime: besluit.regime,
    btw_controle: besluit.controle,
  });
  if (!opgeslagen.ok) redirect(`/admin/projecten/${id}?melding=factuur-fout`);
  const nummer = opgeslagen.doc.nummer;
  await bijwerken(id, { invoice_id: opgeslagen.doc.id, gewerkte_uren: p.gewerkte_uren ?? u });
  if (offerte?.id) await db.from("offers").update({ invoiced_at: new Date().toISOString() }).eq("id", offerte.id);

  await ensurePortalUser(p.client_email);
  const factuurMail = projectFactuurMail(taal, {
    naam: k.naam,
    nummer,
    titel: p.titel,
    bedragExclCent: bedrag,
    verlegd: besluit.nulTarief,
    dueAt,
    projectId: p.id,
    betaalHref: betaalLink(taal, opgeslagen.doc.token),
  });
  const verstuurd = await mailKlant(p.client_email, factuurMail);
  await logBewijs({
    soort: "factuur_verstuurd",
    invoice_id: opgeslagen.doc.id,
    offer_id: offerte?.id ?? null,
    project_id: p.id,
    client_email: p.client_email,
    details: { verstuurd, aan: p.client_email, onderwerp: factuurMail.subject, html: factuurMail.html },
  });
  herlaad(id);
  revalidatePath("/admin/facturen");
  redirect(`/admin/projecten/${id}?melding=factuur${verstuurd ? "" : "&mail=0"}`);
}

export async function markeerBetaald(projectId: string): Promise<void> {
  if (!(await requireAdmin())) return;
  const p = await laadProject(projectId);
  if (!p?.invoice_id) return;
  await getSupabaseAdmin()
    .from("invoices")
    .update({ status: "betaald", paid_at: new Date().toISOString() })
    .eq("id", p.invoice_id);
  await logBewijs({ soort: "betaling", invoice_id: p.invoice_id, project_id: p.id, client_email: p.client_email, details: { via: "manueel" } });
  herlaad(projectId);
  revalidatePath("/admin/facturen");
}

// ── Annuleren / verwijderen ─────────────────────────────────────────────

export async function verwijderProject(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;
  const id = s(fd, "id");
  const p = await laadProject(id);
  if (!p) return;
  if (s(fd, "bevestig").toLowerCase() !== "verwijder") redirect(`/admin/projecten/${id}?melding=bevestig`);
  const db = getSupabaseAdmin();

  // Alle modelbestanden: de rijen én wat er eventueel los in de map staat.
  const { data: lev } = await db.from("leveringen").select("pad").eq("project_id", id);
  const paden = new Set(((lev as { pad: string }[] | null) ?? []).map((l) => l.pad));
  async function verzamel(map: string, diepte: number) {
    if (diepte > 4) return;
    const { data } = await db.storage.from("modellen").list(map, { limit: 1000 });
    for (const o of data ?? []) {
      const pad = `${map}/${o.name}`;
      if (o.id) paden.add(pad);
      else await verzamel(pad, diepte + 1);
    }
  }
  await verzamel(id, 0);
  const lijst = [...paden];
  for (let i = 0; i < lijst.length; i += 100) await db.storage.from("modellen").remove(lijst.slice(i, i + 100));
  // Door de admin opgeladen plannen gaan altijd mee. Die van de klant horen bij
  // zijn aanvraag — tenzij die aanvraag al verwijderd is, dan mogen ze ook weg.
  let aanvraagBestaat = false;
  if (p.quote_id) {
    const { count } = await db.from("quotes").select("id", { count: "exact", head: true }).eq("id", p.quote_id);
    aanvraagBestaat = (count ?? 0) > 0;
  }
  const plannen = (p.plannen ?? [])
    .map((x) => x.pad)
    .filter((x) => x.startsWith(`projecten/${id}/`) || !aanvraagBestaat);
  if (plannen.length) await db.storage.from("plannen").remove(plannen);

  await db.from("projecten").delete().eq("id", id);
  herlaad();
  redirect("/admin/projecten?melding=verwijderd");
}
