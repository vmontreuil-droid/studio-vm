"use server";

// ─────────────────────────────────────────────────────────────────────────
// Offerteaanvraag voor een 3D-model (machinesturing).
//
// Twee stappen, omdat plannen (DWG, PDF, LandXML) te groot zijn om via een
// server action mee te sturen:
//   1. uploadPlekken(): maakt per bestand een eenmalige upload-link naar de
//      PRIVÉ bucket "plannen" — de browser laadt rechtstreeks op.
//   2. dienAanvraagIn(): bewaart de aanvraag (tabel quotes, source "3d-model",
//      alle 3D-velden in snapshot), zoekt het werfadres op de kaart, stelt
//      het coördinatenstelsel voor en stuurt de twee mails.
//
// Ingelogde klanten dienen een nieuw dossier in via het portaal met
// dienPortaalAanvraagIn(): zelfde verwerking, maar het e-mailadres komt uit
// de sessie (nooit uit het formulier) en de klantgegevens uit het account.
// ─────────────────────────────────────────────────────────────────────────

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isEmail, sendMail } from "@/lib/monitor";
import { supabaseConfigured } from "@/lib/supabase/config";
import { isLand, stelselVoor, type StelselVoorstel } from "@/lib/stelsel";
import { ensurePortalUser } from "@/lib/portal-access";
import { zoekWerf } from "@/lib/geocode";
import { aanvraagProfiel, PROFIEL_META, PROFIEL_VELDEN, type ProfielVeld } from "@/lib/aanvraag-profiel";
import { aanvraagOntvangenMail } from "@/lib/klant-mails";
import { siteLink } from "@/lib/email";

const BUCKET = "plannen";
const MAX_BESTANDEN = 15;
const MAX_GROOTTE = 50 * 1024 * 1024; // 50 MB per bestand (Supabase-standaardlimiet)
const TOEGELATEN = /\.(pdf|dwg|dxf|xml|landxml|zip|7z|rar|png|jpe?g|tif{1,2}|csv|txt|gsi|ttm|tp3|svd|svl|dc|dsz|ifc|kmz|kml|shp)$/i;

export type UploadPlek = { naam: string; pad: string; url: string };

async function zorgVoorBucket() {
  const db = getSupabaseAdmin();
  const { data } = await db.storage.getBucket(BUCKET);
  if (!data) {
    await db.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_GROOTTE });
  }
  return db;
}

function veiligeNaam(naam: string) {
  return naam.normalize("NFKD").replace(/[^\w.\-]+/g, "_").slice(-120);
}

export async function uploadPlekken(
  bestanden: { naam: string; grootte: number }[],
): Promise<{ ok: true; plekken: UploadPlek[]; map: string } | { ok: false; fout: string }> {
  if (!Array.isArray(bestanden) || bestanden.length === 0) return { ok: true, plekken: [], map: "" };
  if (bestanden.length > MAX_BESTANDEN) return { ok: false, fout: "te_veel" };
  for (const b of bestanden) {
    if (b.grootte > MAX_GROOTTE) return { ok: false, fout: "te_groot" };
    if (!TOEGELATEN.test(b.naam)) return { ok: false, fout: "type" };
  }
  const db = await zorgVoorBucket();
  const map = `aanvragen/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}`;
  const plekken: UploadPlek[] = [];
  for (const b of bestanden) {
    const pad = `${map}/${veiligeNaam(b.naam)}`;
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(pad);
    if (error || !data) return { ok: false, fout: "opslag" };
    plekken.push({ naam: b.naam, pad, url: data.signedUrl });
  }
  return { ok: true, plekken, map };
}

// Geen gewenste datum opgegeven: plan volgens de categorie (werkdagen),
// zodat het project meteen in de leverplanning staat. Vroegtijdig = open.
function standaardLeverdatum(categorie: string): string | null {
  const werkdagen = categorie === "last-minute" ? 5 : categorie === "normaal" ? 15 : 0;
  if (!werkdagen) return null;
  const d = new Date();
  let n = 0;
  while (n < werkdagen) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  }
  return d.toISOString().slice(0, 10);
}

export type AanvraagResultaat =
  | { ok: true; projectId?: string }
  | { ok: false; fout: "ongeldig" | "opslag" | "sessie" };

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Wie de aanvraag doet: uit het formulier (publiek) of uit sessie + account (portaal). */
type Afzender = { bedrijf: string; naam: string; email: string; telefoon: string; btw: string };

// Publieke aanvraag (/offerte): alle gegevens komen uit het formulier.
export async function dienAanvraagIn(fd: FormData): Promise<AanvraagResultaat> {
  if (s(fd, "website")) return { ok: true }; // honeypot: stil negeren

  const r = await verwerkAanvraag(
    fd,
    {
      bedrijf: s(fd, "bedrijf"),
      naam: s(fd, "naam"),
      email: s(fd, "email").toLowerCase(),
      telefoon: s(fd, "telefoon"),
      btw: s(fd, "btw"),
    },
    false,
  );
  return r.ok ? { ok: true } : r;
}

// Nieuw dossier vanuit het klantenportaal. Zonder sessie: weigeren. Het
// e-mailadres komt uit de sessie; een meegestuurd "email"-veld wordt genegeerd.
// Bedrijf, naam, telefoon en btw: staat het veld in het formulier (aanvullen
// of "Wijzigen"), dan geldt wat de klant invulde — ook leeg, zo kan een
// btw-nummer weg. Anders de accountgegevens. Wat nieuw of anders is, bewaren
// we na het indienen op het account (de klant mag zijn eigen user_metadata
// sowieso al schrijven; e-mail en rol horen daar niet bij).
export async function dienPortaalAanvraagIn(fd: FormData): Promise<AanvraagResultaat> {
  if (!supabaseConfigured) return { ok: false, fout: "sessie" };
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const profiel = user ? await aanvraagProfiel(user) : null;
  if (!user || !profiel) return { ok: false, fout: "sessie" };

  const gegeven = (veld: ProfielVeld) => (fd.has(veld) ? s(fd, veld).slice(0, 200) : (profiel[veld] ?? ""));
  const afzender: Afzender = {
    email: profiel.email,
    bedrijf: gegeven("bedrijf"),
    naam: gegeven("naam"),
    telefoon: gegeven("telefoon"),
    btw: gegeven("btw"),
  };
  const r = await verwerkAanvraag(fd, afzender, true);
  if (!r.ok) return r;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const wijziging: Record<string, string> = {};
  for (const veld of PROFIEL_VELDEN) {
    const sleutel = PROFIEL_META[veld];
    const huidig = typeof meta[sleutel] === "string" ? (meta[sleutel] as string).trim().slice(0, 200) : null;
    const nieuw = afzender[veld];
    if (nieuw === huidig) continue;
    if (!nieuw && !fd.has(veld)) continue; // niet gevraagd en niets gekend
    // Leeg bewaard = bewust leeg: geen terugval meer op oude aanvragen.
    wijziging[sleutel] = nieuw;
  }
  if (Object.keys(wijziging).length) {
    try {
      await getSupabaseAdmin().auth.admin.updateUserById(user.id, {
        user_metadata: { ...meta, ...wijziging },
      });
    } catch {
      // Niet-kritisch: het dossier staat er al.
    }
  }

  // Projectenlijst, teller in de zijbalk en overzicht meteen bijwerken.
  revalidatePath("/[locale]/portail/dashboard", "layout");
  return r;
}

async function verwerkAanvraag(fd: FormData, a: Afzender, portaal: boolean): Promise<AanvraagResultaat> {
  const locale = ["nl", "fr", "en", "de", "es"].includes(s(fd, "locale")) ? s(fd, "locale") : "nl";
  const v = {
    ...a,
    werfStraat: s(fd, "werf_straat"),
    werfPostcode: s(fd, "werf_postcode"),
    werfGemeente: s(fd, "werf_gemeente"),
    werfLand: s(fd, "werf_land").toUpperCase(),
    eigenStelsel: s(fd, "eigen_stelsel"),
    merken: fd.getAll("merken").map(String).filter(Boolean).slice(0, 10),
    merkAnders: s(fd, "merk_anders"),
    categorie: ["vroegtijdig", "normaal", "last-minute"].includes(s(fd, "categorie")) ? s(fd, "categorie") : "normaal",
    verantwoordelijk: s(fd, "verantwoordelijk") === "ja",
    machines: fd.getAll("machines").map(String).slice(0, 8),
    werk: s(fd, "werk"),
    leverdatum: s(fd, "leverdatum"),
    omschrijving: s(fd, "omschrijving").slice(0, 5000),
  };
  let bestanden: { naam: string; pad: string; grootte: number }[] = [];
  try {
    bestanden = JSON.parse(s(fd, "bestanden") || "[]");
  } catch {
    bestanden = [];
  }
  bestanden = bestanden
    .filter((b) => typeof b?.pad === "string" && b.pad.startsWith("aanvragen/"))
    .slice(0, MAX_BESTANDEN);

  if (
    !v.bedrijf || !v.naam || !isEmail(v.email) || !v.telefoon ||
    !v.werfPostcode || !v.werfGemeente || !isLand(v.werfLand) || v.merken.length === 0 || !v.verantwoordelijk
  ) {
    return { ok: false, fout: "ongeldig" };
  }

  const geo = await zoekWerf(v.werfStraat, v.werfPostcode, v.werfGemeente, v.werfLand);
  const stelsel: StelselVoorstel = stelselVoor(v.werfLand, geo?.lat ?? null, geo?.lon ?? null);
  const werfAdres = [v.werfStraat, `${v.werfPostcode} ${v.werfGemeente}`, v.werfLand].filter(Boolean).join(", ");
  const merken = v.merken.map((m) => (m === "anders" ? (v.merkAnders ? `Ander: ${v.merkAnders}` : "Ander merk") : m));
  const merk = merken.join(", ");
  const CAT = { vroegtijdig: "Vroegtijdig (> 3 weken)", normaal: "Normaal (1–3 weken)", "last-minute": "LAST-MINUTE (≤ 5 werkdagen)" } as const;

  const db = getSupabaseAdmin();
  const ins = await db
    .from("quotes")
    .insert({
      locale,
      name: v.naam,
      email: v.email,
      phone: v.telefoon,
      company: v.bedrijf,
      vat_number: v.btw || null,
      address: werfAdres,
      message: v.omschrijving || null,
      base: "3d-model",
      plan: "project",
      modules: [],
      source: "3d-model",
      snapshot: {
        soort: "3d-model",
        werf: {
          straat: v.werfStraat,
          postcode: v.werfPostcode,
          gemeente: v.werfGemeente,
          land: v.werfLand,
          lat: geo?.lat ?? null,
          lon: geo?.lon ?? null,
          gevonden: geo?.label ?? null,
          nauwkeurigheid: geo?.nauwkeurigheid ?? null,
        },
        stelsel,
        eigenStelsel: v.eigenStelsel || null,
        merk,
        merken,
        categorie: v.categorie,
        verantwoordelijkAkkoord: new Date().toISOString(),
        machines: v.machines,
        werk: v.werk,
        leverdatum: v.leverdatum || null,
        bestanden,
        ...(portaal ? { via: "portaal" } : {}),
      },
    })
    .select("id")
    .maybeSingle();
  if (ins.error) {
    console.error("[offerte-3d] opslaan mislukt:", ins.error.message);
    return { ok: false, fout: "opslag" };
  }

  // Portaaltoegang + project: de klant volgt zijn aanvraag meteen in het portaal.
  // Via het portaal bestaat het account al (de aanvulling gebeurt daar).
  if (!portaal) {
    await ensurePortalUser(v.email, {
      name: v.naam,
      phone: v.telefoon,
      company: v.bedrijf,
      vat_number: v.btw || null,
    });
  }
  const quoteId = (ins.data as { id?: string } | null)?.id ?? null;
  const { data: projRij, error: projFout } = await db.from("projecten").insert({
    client_email: v.email,
    quote_id: quoteId,
    titel: `${v.werk || "3D-model"} — ${v.werfGemeente}`.slice(0, 140),
    categorie: v.categorie,
    merken,
    werf: {
      straat: v.werfStraat,
      postcode: v.werfPostcode,
      gemeente: v.werfGemeente,
      land: v.werfLand,
      lat: geo?.lat ?? null,
      lon: geo?.lon ?? null,
    },
    stelsel,
    plannen: bestanden,
    leverdatum: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v.leverdatum) ? v.leverdatum : standaardLeverdatum(v.categorie),
    opmerking: v.omschrijving || null,
  }).select("id").maybeSingle();
  if (projFout) console.error("[offerte-3d] project aanmaken mislukt:", projFout.message);
  const projectId = (projRij as { id?: string } | null)?.id;

  // Downloadlinks voor de plannen (7 dagen geldig) — voor de mail aan Vincent.
  const links: { naam: string; url: string }[] = [];
  for (const b of bestanden) {
    const { data } = await db.storage.from(BUCKET).createSignedUrl(b.pad, 60 * 60 * 24 * 7);
    if (data?.signedUrl) links.push({ naam: b.naam, url: data.signedUrl });
  }
  const kaart = geo ? `https://www.openstreetmap.org/?mlat=${geo.lat}&mlon=${geo.lon}#map=17/${geo.lat}/${geo.lon}` : null;

  const rij = (k: string, w: string) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#78716c;vertical-align:top">${k}</td><td>${w}</td></tr>`;
  await sendMail("info@studio-vm.be", {
    replyTo: v.email,
    subject: `${v.categorie === "last-minute" ? "⚡ LAST-MINUTE · " : ""}3D-model aanvraag${portaal ? " (portaal)" : ""} — ${v.bedrijf} (${v.werfGemeente}, ${v.werfLand})`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;color:#1c1917;line-height:1.6">
<h2 style="margin:0 0 4px">Nieuwe aanvraag: 3D-model${portaal ? " — via het klantenportaal" : ""}</h2>
<p style="margin:0 0 16px;color:#78716c">${esc(v.bedrijf)} · ${esc(v.naam)} · <a href="mailto:${esc(v.email)}">${esc(v.email)}</a> · ${esc(v.telefoon)}</p>
<table style="border-collapse:collapse;font-size:14px">
${rij("Werf", esc(werfAdres) + (kaart ? ` · <a href="${kaart}" style="color:#b45309">kaart</a>` : " · <em>adres niet gevonden op de kaart</em>"))}
${rij("Stelsel (voorstel)", `<strong>${esc(stelsel.stelsel)}</strong> (${stelsel.epsg}) · hoogte ${esc(stelsel.hoogte)}${stelsel.opmerking ? `<br><span style="color:#78716c">${esc(stelsel.opmerking)}</span>` : ""}`)}
${v.eigenStelsel ? rij("Eigen/lokaal stelsel", esc(v.eigenStelsel)) : ""}
${rij("Categorie", esc(CAT[v.categorie as keyof typeof CAT]))}
${rij("Machinesturing", esc(merk))}
${v.machines.length ? rij("Machines", esc(v.machines.join(", "))) : ""}
${v.werk ? rij("Soort werk", esc(v.werk)) : ""}
${v.leverdatum ? rij("Gewenste levering", esc(v.leverdatum)) : ""}
${v.btw ? rij("Btw", esc(v.btw)) : ""}
</table>
${v.omschrijving ? `<p style="margin-top:14px;white-space:pre-wrap">${esc(v.omschrijving)}</p>` : ""}
<h3 style="margin:20px 0 6px;font-size:15px">Plannen (${links.length})</h3>
${links.length ? `<ul style="padding-left:18px;margin:0">${links.map((l) => `<li><a href="${l.url}" style="color:#b45309">${esc(l.naam)}</a></li>`).join("")}</ul><p style="color:#78716c;font-size:12px">Downloadlinks 7 dagen geldig — daarna via de admin.</p>` : `<p style="color:#78716c">Geen bestanden meegestuurd.</p>`}
<p style="margin-top:18px"><a href="${siteLink("/admin/aanvragen")}" style="color:#b45309">Open in admin →</a></p>
</div>`,
  });

  // Bevestiging aan de klant: in de taal van het formulier, lichte huisstijl,
  // knop rechtstreeks naar het nieuwe project in het portaal. "Ander merk"
  // in de taal van de klant (in de databank staat het Nederlands).
  const ANDER: Record<string, string> = { nl: "Ander merk", fr: "Autre marque", en: "Other brand", de: "Andere Marke", es: "Otra marca" };
  const merkKlant = v.merken.map((m) => (m === "anders" ? v.merkAnders || ANDER[locale] : m)).join(", ");
  await sendMail(
    v.email,
    aanvraagOntvangenMail(locale, {
      naam: v.naam,
      werfAdres,
      stelsel: stelsel.stelsel,
      hoogte: stelsel.hoogte,
      merk: merkKlant,
      aantalPlannen: bestanden.length,
      projectId: projectId ?? null,
    }),
  );

  return { ok: true, projectId };
}
