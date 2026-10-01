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
// ─────────────────────────────────────────────────────────────────────────

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isEmail, sendMail } from "@/lib/monitor";
import { siteUrl } from "@/lib/supabase/config";
import { isLand, stelselVoor, type StelselVoorstel } from "@/lib/stelsel";

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

type Geo = { lat: number; lon: number; label: string } | null;

async function zoekWerf(straat: string, postcode: string, gemeente: string, land: string): Promise<Geo> {
  // OpenStreetMap Nominatim — laag volume, met verplichte User-Agent.
  const q = new URLSearchParams({
    format: "json",
    limit: "1",
    countrycodes: land.toLowerCase(),
    ...(straat ? { street: straat } : {}),
    postalcode: postcode,
    city: gemeente,
  });
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, {
      headers: { "User-Agent": "studio-vm.be offerte (info@studio-vm.be)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { lat: string; lon: string; display_name: string }[];
    if (!j[0]) return null;
    return { lat: Number(j[0].lat), lon: Number(j[0].lon), label: j[0].display_name };
  } catch {
    return null;
  }
}

export type AanvraagResultaat = { ok: true } | { ok: false; fout: "ongeldig" | "opslag" };

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function dienAanvraagIn(fd: FormData): Promise<AanvraagResultaat> {
  if (s(fd, "website")) return { ok: true }; // honeypot: stil negeren

  const locale = ["nl", "fr", "en"].includes(s(fd, "locale")) ? s(fd, "locale") : "nl";
  const v = {
    bedrijf: s(fd, "bedrijf"),
    naam: s(fd, "naam"),
    email: s(fd, "email").toLowerCase(),
    telefoon: s(fd, "telefoon"),
    btw: s(fd, "btw"),
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
      },
    })
    .select("id")
    .maybeSingle();
  if (ins.error) {
    console.error("[offerte-3d] opslaan mislukt:", ins.error.message);
    return { ok: false, fout: "opslag" };
  }

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
    subject: `${v.categorie === "last-minute" ? "⚡ LAST-MINUTE · " : ""}3D-model aanvraag — ${v.bedrijf} (${v.werfGemeente}, ${v.werfLand})`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;color:#1c1917;line-height:1.6">
<h2 style="margin:0 0 4px">Nieuwe aanvraag: 3D-model</h2>
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
<p style="margin-top:18px"><a href="${siteUrl}/admin/aanvragen" style="color:#b45309">Open in admin →</a></p>
</div>`,
  });

  const B = {
    nl: {
      onderwerp: "We hebben je plannen ontvangen — Studio VM",
      hallo: `Beste ${esc(v.naam)},`,
      tekst: "Bedankt voor je aanvraag. Ik bekijk je plannen en bezorg je zo snel mogelijk een offerte op maat, met prijs en leverdatum.",
      samenvatting: "Wat ik ontving",
      werf: "Werf",
      stelsel: "Voorgesteld stelsel",
      merk: "Machinesturing",
      bestanden: "Bestanden",
      vraag: "Klopt er iets niet, of wil je nog plannen bijsturen? Antwoord gewoon op deze mail.",
      groet: "Met vriendelijke groet,",
    },
    fr: {
      onderwerp: "Nous avons bien reçu vos plans — Studio VM",
      hallo: `Bonjour ${esc(v.naam)},`,
      tekst: "Merci pour votre demande. J'examine vos plans et vous envoie au plus vite un devis sur mesure, avec prix et délai.",
      samenvatting: "Ce que j'ai reçu",
      werf: "Chantier",
      stelsel: "Système proposé",
      merk: "Guidage",
      bestanden: "Fichiers",
      vraag: "Une erreur, ou d'autres plans à envoyer ? Répondez simplement à ce mail.",
      groet: "Bien cordialement,",
    },
    en: {
      onderwerp: "We received your plans — Studio VM",
      hallo: `Dear ${esc(v.naam)},`,
      tekst: "Thank you for your request. I will review your plans and send you a tailored quote with price and delivery date as soon as possible.",
      samenvatting: "What I received",
      werf: "Site",
      stelsel: "Proposed system",
      merk: "Machine control",
      bestanden: "Files",
      vraag: "Anything wrong, or more plans to add? Simply reply to this email.",
      groet: "Kind regards,",
    },
  }[locale as "nl" | "fr" | "en"];

  await sendMail(v.email, {
    replyTo: "info@studio-vm.be",
    subject: B.onderwerp,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#1c1917;line-height:1.6">
<p style="font-size:28px;font-weight:700;margin:0 0 20px;letter-spacing:-1px">vm<span style="color:#b45309">.</span></p>
<p>${B.hallo}</p>
<p>${B.tekst}</p>
<h3 style="margin:20px 0 6px;font-size:15px">${B.samenvatting}</h3>
<table style="border-collapse:collapse;font-size:14px">
${rij(B.werf, esc(werfAdres))}
${rij(B.stelsel, `${esc(stelsel.stelsel)} · ${esc(stelsel.hoogte)}`)}
${rij(B.merk, esc(merk))}
${rij(B.bestanden, String(bestanden.length))}
</table>
<p style="margin-top:16px">${B.vraag}</p>
<p>${B.groet}<br>Vincent Montreuil<br><span style="color:#78716c">Studio VM · +32 477 99 56 51 · studio-vm.be</span></p>
</div>`,
  });

  return { ok: true };
}
