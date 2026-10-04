// Video's die zichzelf maken: elke week één korte staande video (1080×1920,
// 12–20 s, 30 fps, H.264) voor Reels (Instagram, Facebook), YouTube Shorts en
// TikTok, uit de 3D-renders van de site.
//
// Wat er in beeld komt: 3 à 4 weergaven van één model met een trage zoom en
// pan (Ken Burns) en overvloeiingen, in de huisstijl van de merkkaart (steen,
// amber, Montserrat, "vm."), een korte kop in het Nederlands of het Frans en
// een slotbeeld met "studio-vm.be". Nooit een klant-, werf- of plaatsnaam.
// Welk model en welke taal: zie scripts/social-video/reeksen.mjs (een vaste
// rotatie per week; even ISO-week = NL, oneven = FR, zoals de story/reel-plaats
// van de contentmachine).
//
// GEBRUIK (Node 22.18 of nieuwer; leest src/lib/social/beeld-url.ts rechtstreeks)
//   node scripts/social-video.mjs                 maakt de video van de komende
//                                                 week, enkel lokaal (raakt niets
//                                                 op afstand aan)
//   node scripts/social-video.mjs --publish       + opladen naar de bucket
//                                                 social-media en inplannen
//   Opties:
//     --week=2026-W42     andere week (standaard: de week die volgende maandag begint)
//     --reeks=platform    ander model (zie --lijst)
//     --taal=nl|fr        andere taal
//     --uit=<map>         uitvoermap (standaard: <tijdelijke map>/studio-vm-social-video)
//     --encoder=auto|ffmpeg|browser
//                         auto = ffmpeg (libx264, met een stil AAC-geluidsspoor) als
//                         dat er is, anders H.264 uit de browser (WebCodecs, zonder geluid)
//     --bewaar-weken=26   --publish ruimt eigen video's ouder dan zoveel weken op
//                         (0 = nooit); berichten die nog moeten verschijnen blijven
//     --stil=1,8,15       schrijft ook losse beelden op die seconden (om na te kijken)
//     --lijst             toont de modellen en stopt
//
// MET --publish
//   1. Controleert eerst: SUPABASE_URL (of NEXT_PUBLIC_SUPABASE_URL) en
//      SUPABASE_SERVICE_ROLE_KEY, migratie 0050 (kolommen van social_posts),
//      de publieke bucket "social-media", en of de vrijdagplaats van die week
//      ("<week>-vr", 12:00 Belgische tijd) nog vrij is. Bezet → niets doen
//      (exit 0). Ontbreekt de migratie of de bucket → duidelijke melding,
//      exit 3, er wordt niets gemaakt of opgeladen.
//   2. Maakt de video en de omslag (JPEG) en controleert ze (duur, maat,
//      codec, grootte < 50 MB, moov vooraan).
//   3. Laadt beide op naar social-media/video/<week>-<model>-<taal>-<versie>.mp4/.jpg
//      en maakt ÉÉN rij in social_posts: post_type "video", post_kind "reel",
//      status "goedgekeurd" (video's hoeven geen akkoord, zoals in de
//      contentmachine), slot "<week>-vr", media.video + media.cover.
//      Mislukt een stap, dan worden de opgeladen bestanden weer gewist.
//   De contentmachine (maandag) ziet de plaats als bezet en plant er geen
//   story meer; de publisher zet de video op de kanalen van de rij.
//
// EENMALIG VOOR DE EIGENAAR (GitHub-workflow .github/workflows/social-video.yml)
//   - GitHub → repo → Settings → Secrets and variables → Actions → New
//     repository secret, twee keer:
//       SUPABASE_URL               https://<project-ref>.supabase.co
//       SUPABASE_SERVICE_ROLE_KEY  Supabase → Project Settings → API → service_role
//   - Migratie 0050 draaien (maakt ook de bucket social-media).
//   Daarna draait de workflow elke zondagavond vanzelf; met de hand via
//   Actions → Social-video → Run workflow.
//
// Lokaal met --publish (niet nodig, de workflow doet het):
//   node --env-file=.env.local scripts/social-video.mjs --publish

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { knipModel } from "./social-video/bronnen.mjs";
import { leesMp4, muxH264 } from "./social-video/mp4.mjs";
import { REEKSEN, SLOT, beeldTekst, berichtTekst } from "./social-video/reeksen.mjs";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WORTEL = path.resolve(HIER, "..");
const require = createRequire(import.meta.url);

// ─── Vaste waarden ────────────────────────────────────────────────────────
const W = 1080;
const H = 1920;
const FPS = 30;
/** Waar het model komt: tussen het woordmerk (boven) en het tekstblok (onder). */
const ZONE = { x: 40, y: 360, w: 1000, h: 780 };
const BUCKET = "social-media";
const MAP = "video";
/** Plaats van de contentmachine voor story of reel: vrijdag 12:00 (zie WEEK_SLOTS). */
const PLAATS = { id: "vr", dagNaMaandag: 4, uur: 12 };
/** Zelfde kanalen als STANDAARD_KANALEN.reel in src/lib/admin/social-templates.ts. */
const REEL_KANALEN = ["instagram", "facebook", "youtube", "tiktok"];
const MAX_BYTES = 50_000_000; // bucket: 52 428 800
const DUUR = { min: 12, max: 20 };
const DAG_MS = 86_400_000;

// ─── Opties ───────────────────────────────────────────────────────────────
function leesOpties(argv) {
  const o = { publish: false, lijst: false, encoder: "auto", bewaarWeken: 26 };
  for (const a of argv) {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    const v = rest.join("=");
    if (k === "publish") o.publish = true;
    else if (k === "lijst") o.lijst = true;
    else if (k === "week") o.week = v;
    else if (k === "reeks") o.reeks = v;
    else if (k === "taal") o.taal = v;
    else if (k === "uit") o.uit = v;
    else if (k === "encoder") o.encoder = v;
    else if (k === "bewaar-weken") o.bewaarWeken = Number(v);
    else if (k === "stil") o.stil = v.split(",").filter(Boolean).map(Number);
    else if (k === "help" || k === "h") o.help = true;
    else throw new Gebruik(`onbekende optie: ${a}`);
  }
  if (o.week !== undefined && !parseWeek(o.week)) throw new Gebruik(`week moet de vorm 2026-W42 hebben (kreeg "${o.week}")`);
  if (o.reeks !== undefined && !REEKSEN.some((r) => r.id === o.reeks)) throw new Gebruik(`onbekend model "${o.reeks}" (zie --lijst)`);
  if (o.taal !== undefined && !["nl", "fr"].includes(o.taal)) throw new Gebruik(`taal moet nl of fr zijn`);
  if (!["auto", "ffmpeg", "browser"].includes(o.encoder)) throw new Gebruik(`encoder moet auto, ffmpeg of browser zijn`);
  if (!Number.isInteger(o.bewaarWeken) || o.bewaarWeken < 0) throw new Gebruik(`bewaar-weken moet een geheel getal ≥ 0 zijn`);
  if (o.stil && !o.stil.every((t) => Number.isFinite(t) && t >= 0 && t <= DUUR.max)) throw new Gebruik(`stil verwacht seconden, bv. --stil=1,8,15`);
  return o;
}

class Gebruik extends Error {}
class Voorwaarde extends Error {}

// ─── Tijd: Belgische klok en ISO-weken (zelfde rekenwerk als social-generator.ts) ─
const TZ = "Europe/Brussels";

function brusselsDelen(d) {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const n = (t) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { jaar: n("year"), maand: n("month"), dag: n("day"), uur: n("hour"), minuut: n("minute") };
}

function brusselsNaarUtc(jaar, maand, dag, uur = 0, minuut = 0) {
  const doel = Date.UTC(jaar, maand - 1, dag, uur, minuut);
  let t = doel;
  for (let i = 0; i < 3; i++) {
    const d = brusselsDelen(new Date(t));
    const verschil = doel - Date.UTC(d.jaar, d.maand - 1, d.dag, d.uur, d.minuut);
    if (!verschil) break;
    t += verschil;
  }
  return new Date(t);
}

function isoWeekVan(jaar, maand, dag) {
  const d = new Date(Date.UTC(jaar, maand - 1, dag));
  const wd = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - wd);
  const begin = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { jaar: d.getUTCFullYear(), week: Math.ceil(((d.getTime() - begin) / DAG_MS + 1) / 7) };
}

const weekSleutel = (jaar, week) => `${jaar}-W${String(week).padStart(2, "0")}`;

function parseWeek(s) {
  const m = typeof s === "string" ? s.match(/^(\d{4})-W(\d{2})$/) : null;
  if (!m) return null;
  const jaar = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  if (week === 53 && isoWeekVan(jaar, 12, 28).week !== 53) return null;
  return { jaar, week };
}

function maandagVan(sleutel) {
  const w = parseWeek(sleutel);
  const jan4 = new Date(Date.UTC(w.jaar, 0, 4));
  const wd = jan4.getUTCDay() || 7;
  const ma = new Date(Date.UTC(w.jaar, 0, 4 - (wd - 1)) + (w.week - 1) * 7 * DAG_MS);
  return { jaar: ma.getUTCFullYear(), maand: ma.getUTCMonth() + 1, dag: ma.getUTCDate() };
}

function plusDagen(d, n) {
  const t = new Date(Date.UTC(d.jaar, d.maand - 1, d.dag) + n * DAG_MS);
  return { jaar: t.getUTCFullYear(), maand: t.getUTCMonth() + 1, dag: t.getUTCDate() };
}

/** De week die de eerstvolgende maandag (Belgische tijd) begint. */
function komendeWeek(nu) {
  const d = brusselsDelen(nu);
  const wd = new Date(Date.UTC(d.jaar, d.maand - 1, d.dag)).getUTCDay() || 7;
  const ma = plusDagen(d, 8 - wd);
  const w = isoWeekVan(ma.jaar, ma.maand, ma.dag);
  return weekSleutel(w.jaar, w.week);
}

/** Zelfde taalregel als storyVoorWeek(): even week NL, oneven FR. */
const taalVoorWeek = (week) => (parseWeek(week).week % 2 === 0 ? "nl" : "fr");

/**
 * Vaste rotatie: elke week het volgende model, en per ronde één stap
 * verschoven zodat elk model om beurten in het NL en het FR komt.
 */
function reeksVoorWeek(week) {
  const ma = maandagVan(week);
  const index = Math.round((Date.UTC(ma.jaar, ma.maand - 1, ma.dag) - Date.UTC(2025, 11, 29)) / (7 * DAG_MS));
  const n = REEKSEN.length;
  const i = (((index + Math.floor(index / n)) % n) + n) % n;
  return REEKSEN[i];
}

// ─── Tekstcontrole (zelfde regels als tekstProblemen in social-templates.ts) ─
const VERBODEN = [
  [/landmeter/i, "landmeter (beschermde titel)"],
  [/g[ée]om[èe]tre/i, "géomètre (beschermde titel)"],
  [/land\s?surveyor/i, "land surveyor (beschermde titel)"],
  [/\bmv3d\b/i, "MV3D"],
  [/convertor/i, "Convertor"],
  [/linked\s?in/i, "LinkedIn"],
  [/vincent|montreuil/i, "een persoonsnaam"],
];
const LINK = /(https?:\/\/|www\.|wa\.me|\b[a-z0-9-]+\.(?:be|com|nl|fr|eu|lu|net|org|io|de)\b)/i;

function tekstProblemen(teksten, { linksMogen = false } = {}) {
  const alles = teksten.filter(Boolean).join("\n");
  const uit = [];
  if (!linksMogen && LINK.test(alles)) uit.push("bevat een link of webadres");
  for (const [re, label] of VERBODEN) if (re.test(alles)) uit.push(`bevat ${label}`);
  const tags = new Set(alles.match(/#[\p{L}\p{N}_]+/gu) ?? []);
  if (tags.size > 5) uit.push(`${tags.size} hashtags (hoogstens 5)`);
  return uit;
}

// ─── Tijdlijn en camera ───────────────────────────────────────────────────
function maakTijdlijn(reeks) {
  const N = reeks.soort === "lagen" ? reeks.weergaven.length : 4;
  const S = reeks.soort === "lagen" ? 3.4 : 3.3;
  const slotBegin = N * S;
  const totaal = slotBegin + 3.2;
  return { N, S, F: 0.8, slotBegin, slotFade: 0.7, totaal };
}

/**
 * Sleutelmomenten van de camera. z = zoom t.o.v. "past in de zone",
 * (cx, cy) = punt van de uitsnede (0–1) dat in het midden van de zone staat.
 */
function maakCamera(reeks, knip, tijd) {
  const { breedte: iw, hoogte: ih, schaal, dekking } = knip;
  const fit = Math.min(ZONE.w / iw, ZONE.h / ih);
  // Nooit meer dan ±1,9× de bronpixels opblazen (anders wordt het wazig).
  const zMax = Math.max(1.06, Math.min(1.6, 1.9 / (fit * schaal)));
  const G = dekking.length;
  const vakken = [];
  dekking.forEach((rij, gy) => rij.forEach((c, gx) => vakken.push({ c, x: (gx + 0.5) / G, y: (gy + 0.5) / G })));
  const cMax = Math.max(...vakken.map((v) => v.c));
  // Dichtste vak; bij gelijke stand het meest centrale.
  const A = [...vakken].sort((a, b) => b.c - a.c || Math.hypot(a.x - 0.5, a.y - 0.5) - Math.hypot(b.x - 0.5, b.y - 0.5))[0];
  const binnen = (z, x, y) => {
    const hx = ZONE.w / (fit * z) / iw / 2;
    const hy = ZONE.h / (fit * z) / ih / 2;
    return { z, cx: hx >= 0.5 ? 0.5 : Math.min(1 - hx, Math.max(hx, x)), cy: hy >= 0.5 ? 0.5 : Math.min(1 - hy, Math.max(hy, y)) };
  };

  if (reeks.soort === "lagen") {
    const z1 = Math.min(1.16, zMax);
    const doel = binnen(z1, 0.5 + (A.x - 0.5) * 0.35, 0.5 + (A.y - 0.5) * 0.35);
    return [
      { t: 0, z: 1, cx: 0.5, cy: 0.5 },
      { t: tijd.totaal, ...doel },
    ];
  }

  // Eén render: overzicht → detail A → detail B (zo ver mogelijk van A) → overzicht.
  const kandidaten = vakken.filter((v) => v.c >= cMax * 0.6 && v !== A);
  const B = kandidaten.sort((a, b) => Math.hypot(b.x - A.x, b.y - A.y) - Math.hypot(a.x - A.x, a.y - A.y))[0] ?? A;
  const zd = Math.min(1.5, zMax);
  const views = [binnen(1, 0.5, 0.5), binnen(zd, A.x, A.y), binnen(zd, B.x, B.y), binnen(0.96, 0.5, 0.5)];
  const M = 0.85; // halve verplaatsing tussen twee weergaven
  const k = [];
  views.forEach((v, i) => {
    k.push({ t: i === 0 ? 0 : i * tijd.S + M, ...v });
    const laatste = i === views.length - 1;
    k.push({ t: laatste ? tijd.totaal : (i + 1) * tijd.S - M, ...binnen(v.z * (laatste ? 1.1 : 1.04), v.cx, v.cy) });
  });
  return k;
}

// ─── Renderen ─────────────────────────────────────────────────────────────
async function lettertypen() {
  const map = path.join(path.dirname(require.resolve("@fontsource/montserrat/package.json")), "files");
  const uit = {};
  for (const gewicht of [500, 600, 700, 800]) {
    const b = await fs.readFile(path.join(map, `montserrat-latin-${gewicht}-normal.woff`));
    uit[gewicht] = `data:font/woff;base64,${b.toString("base64")}`;
  }
  return uit;
}

function ffmpegBeschikbaar() {
  const bin = process.env.FFMPEG || "ffmpeg";
  const r = spawnSync(bin, ["-hide_banner", "-encoders"], { encoding: "utf8", timeout: 15_000 });
  if (r.status !== 0 || r.error) return null;
  return /\blibx264\b/.test(r.stdout) && /\baac\b/.test(r.stdout) ? bin : null;
}

async function viaFfmpeg(page, bin, beelden, uitPad) {
  const args = [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "pipe:0",
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-map", "0:v:0", "-map", "1:a:0",
    // JPEG is BT.601 volledig bereik; de video wordt BT.709 beperkt bereik (zoals telefoons).
    "-vf", "scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "10M", "-bufsize", "20M",
    "-profile:v", "high", "-level:v", "4.1", "-g", String(FPS * 2),
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
    "-r", String(FPS),
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
    "-shortest", "-movflags", "+faststart",
    uitPad,
  ];
  const proc = spawn(bin, args, { stdio: ["pipe", "ignore", "pipe"] });
  let log = "";
  proc.stderr.on("data", (d) => (log = (log + d).slice(-4000)));
  const klaar = new Promise((ok, nee) => {
    proc.on("error", nee);
    proc.on("close", (code) => (code === 0 ? ok() : nee(new Error(`ffmpeg stopte met code ${code}: ${log.trim()}`))));
  });
  klaar.catch(() => {}); // de fout komt bij "await klaar" hieronder
  // Stopt ffmpeg onderweg (EPIPE), dan niet blijven wachten op "drain".
  let gestopt = false;
  proc.stdin.on("error", () => (gestopt = true));
  proc.stdin.on("close", () => (gestopt = true));
  const schrijf = (buf) =>
    new Promise((ok) => {
      if (gestopt || proc.stdin.write(buf)) return ok();
      const verder = () => {
        proc.stdin.off("drain", verder);
        proc.stdin.off("close", verder);
        ok();
      };
      proc.stdin.once("drain", verder);
      proc.stdin.once("close", verder);
    });
  const PER = 12;
  for (let i = 0; i < beelden && !gestopt; i += PER) {
    const reeks = await page.evaluate(
      ([van, tot, fps]) => window.socialVideo.beeldenJpeg(window.T, van, tot, fps, 0.95),
      [i, Math.min(beelden, i + PER), FPS],
    );
    for (const b of reeks) if (!gestopt) await schrijf(Buffer.from(b, "base64"));
  }
  proc.stdin.end();
  await klaar;
  return fs.readFile(uitPad);
}

async function viaBrowser(page, beelden) {
  const r = await page.evaluate(
    ([fps, n]) => window.socialVideo.encodeerH264(window.T, { fps, beelden: n, bitrate: 8_000_000, codec: "avc1.640028" }),
    [FPS, beelden],
  );
  const data = Buffer.from(r.data, "base64");
  const stukken = [];
  let o = 0;
  r.maten.forEach((m, i) => {
    stukken.push({ data: data.subarray(o, o + m), sleutel: r.sleutels[i] });
    o += m;
  });
  return muxH264({ breedte: W, hoogte: H, fps: FPS, avcC: Buffer.from(r.avcC, "base64"), stukken, kleur: r.kleur });
}

/** Controleert een gemaakte video tegen de eisen van de platformen. */
function controleer(info, metGeluid) {
  const f = [];
  const v = info.video;
  if (!v) f.push("geen videospoor");
  else {
    if (v.codec !== "avc1") f.push(`codec ${v.codec}, verwacht avc1 (H.264)`);
    if (v.breedte !== W || v.hoogte !== H) f.push(`${v.breedte}×${v.hoogte}, verwacht ${W}×${H}`);
    if (Math.abs(v.fps - FPS) > 0.5) f.push(`${v.fps.toFixed(2)} beelden/s, verwacht ${FPS}`);
  }
  if (info.duur < DUUR.min - 0.1 || info.duur > DUUR.max + 0.1) f.push(`duur ${info.duur.toFixed(2)} s, verwacht ${DUUR.min}–${DUUR.max} s`);
  if (info.bytes >= MAX_BYTES) f.push(`${(info.bytes / 1e6).toFixed(1)} MB, hoogstens ${MAX_BYTES / 1e6} MB`);
  if (!info.faststart) f.push("moov staat niet vooraan (geen faststart)");
  if (metGeluid && info.audio?.codec !== "mp4a") f.push("geen AAC-geluidsspoor");
  return f;
}

export async function maakVideo({ reeks, taal, encoder, uitMap, naam, stil = [] }) {
  const tekst = beeldTekst(reeks, taal);
  const opBeeld = tekstProblemen([tekst.kop, ...tekst.weergaven.flatMap((w) => [w.label, w.sub]), SLOT[taal].tagline, SLOT.systemen]);
  if (opBeeld.length) throw new Error(`tekst op het beeld: ${opBeeld.join("; ")}`);

  const knip = await knipModel(reeks.weergaven.map((w) => ({ bestand: path.join(WORTEL, "public", w.bestand), lijnen: w.lijnen })));
  const tijd = maakTijdlijn(reeks);
  const camera = maakCamera(reeks, knip, tijd);
  const beelden = Math.round(tijd.totaal * FPS);

  const ffmpeg = encoder === "browser" ? null : ffmpegBeschikbaar();
  if (encoder === "ffmpeg" && !ffmpeg) throw new Voorwaarde("ffmpeg met libx264 en aac niet gevonden (zet FFMPEG=<pad> of gebruik --encoder=browser)");
  const gebruikt = ffmpeg ? "ffmpeg" : "browser";

  const cfg = {
    w: W,
    h: H,
    zone: ZONE,
    soort: reeks.soort,
    tijd,
    camera,
    lettertypen: await lettertypen(),
    beelden: knip.lagen.map((png) => ({ src: `data:image/png;base64,${png.toString("base64")}` })),
    tekst,
    slot: { tagline: SLOT[taal].tagline, systemen: SLOT.systemen, domein: SLOT.domein },
  };

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
    // Een https-adres: WebCodecs werkt enkel in een beveiligde context.
    await page.route("https://social-video.test/**", (r) =>
      r.fulfill({ contentType: "text/html; charset=utf-8", body: "<!doctype html><meta charset=utf-8><body style=margin:0;background:#000>" }),
    );
    await page.goto("https://social-video.test/");
    await page.addScriptTag({ path: path.join(HIER, "social-video", "tekenaar.js") });
    const maten = await page.evaluate(async (c) => {
      window.T = await window.socialVideo.maakTekenaar(c);
      return window.T.maten;
    }, cfg);

    const mp4Pad = path.join(uitMap, `${naam}.mp4`);
    const mp4 = ffmpeg ? await viaFfmpeg(page, ffmpeg, beelden, mp4Pad) : await viaBrowser(page, beelden);
    if (!ffmpeg) await fs.writeFile(mp4Pad, mp4);

    const stilstaand = async (t) =>
      sharp(Buffer.from(await page.evaluate((x) => window.socialVideo.beeldPng(window.T, x), t), "base64"))
        .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:2:0" })
        .toBuffer();

    // Omslag: eerste weergave met de kop volledig in beeld.
    const omslag = await stilstaand(reeks.soort === "lagen" ? tijd.S * 0.55 : 1.2);
    const omslagPad = path.join(uitMap, `${naam}.jpg`);
    await fs.writeFile(omslagPad, omslag);
    // Losse beelden om na te kijken (--stil=1,8,15), rechtstreeks uit de tekenaar.
    const stils = [];
    for (const t of stil) {
      const p = path.join(uitMap, `${naam}-stil-${t.toFixed(2)}.jpg`);
      await fs.writeFile(p, await stilstaand(t));
      stils.push(p);
    }

    const info = leesMp4(mp4);
    const fouten = controleer(info, !!ffmpeg);
    return { mp4, mp4Pad, omslag, omslagPad, stils, info, fouten, encoder: gebruikt, tijd, maten };
  } finally {
    await browser.close();
  }
}

// ─── Publiceren ───────────────────────────────────────────────────────────

/**
 * De gedeelde afspraak voor beeldadressen (socialBeeldPad), rechtstreeks uit
 * de TypeScript-bron: Node ≥ 22.18 haalt de types er zelf uit.
 */
async function beeldUrlAfspraak() {
  try {
    return await import("../src/lib/social/beeld-url.ts");
  } catch (e) {
    throw new Voorwaarde(
      `src/lib/social/beeld-url.ts niet te lezen met Node ${process.versions.node} (nodig: 22.18 of nieuwer): ${e instanceof Error ? e.message : e}`,
    );
  }
}

function databank() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sleutel = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !sleutel) throw new Voorwaarde("SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY ontbreken (GitHub → Settings → Secrets → Actions)");
  return createClient(url, sleutel, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Alles wat er moet zijn vóór er iets gemaakt of opgeladen wordt. */
async function voorcontrole(db, slot) {
  const kolommen = "id, post_type, taal, slot, media, kanalen, publicatie, link_post, tekst_kort, goedkeuring_nodig, gekeurd_op";
  const { error: e1 } = await db.from("social_posts").select(kolommen).limit(1);
  if (e1) {
    throw new Voorwaarde(
      /column|does not exist|schema cache/i.test(e1.message)
        ? `migratie 0050 is nog niet gedraaid (${e1.message}). Draai supabase/migrations/0050_social_automatisch.sql en probeer opnieuw.`
        : `databank niet bereikbaar: ${e1.message}`,
    );
  }
  const { data: bucket, error: e2 } = await db.storage.getBucket(BUCKET);
  if (e2 || !bucket) throw new Voorwaarde(`opslagbucket "${BUCKET}" bestaat niet (${e2?.message ?? "onbekend"}): die maakt migratie 0050 (stap 6).`);
  if (!bucket.public) throw new Voorwaarde(`opslagbucket "${BUCKET}" is niet publiek: de platformen kunnen de video dan niet ophalen.`);

  const [a, b] = await Promise.all([
    db.from("social_posts").select("id, status, title").eq("slot", slot).limit(1),
    db.from("social_posts").select("id, status, title").like("notes", `%slot:${slot}%`).limit(1),
  ]);
  if (a.error || b.error) throw new Voorwaarde(`plaats ${slot} niet na te kijken: ${(a.error ?? b.error).message}`);
  return (a.data ?? [])[0] ?? (b.data ?? [])[0] ?? null;
}

async function bereikbaar(url, type) {
  for (const methode of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method: methode, headers: methode === "GET" ? { range: "bytes=0-0" } : {}, signal: AbortSignal.timeout(15_000) });
      if ((res.ok || res.status === 206) && (res.headers.get("content-type") ?? "").startsWith(type)) return true;
    } catch {
      // volgende methode
    }
  }
  return false;
}

async function publiceer(db, { afspraak, week, slot, moment, reeks, taal, video, nu }) {
  const v = nu.getTime().toString(36);
  const naam = `${week}-${reeks.id}-${taal}-${v}`;
  const paden = { mp4: `${MAP}/${naam}.mp4`, jpg: `${MAP}/${naam}.jpg` };
  const opgeladen = [];
  const ruimOpBijFout = async () => {
    if (!opgeladen.length) return;
    const { error } = await db.storage.from(BUCKET).remove(opgeladen);
    if (error) console.error(`  ! Opgeladen bestanden niet gewist (${opgeladen.join(", ")}): ${error.message}`);
    else console.error(`  Opgeladen bestanden weer gewist: ${opgeladen.join(", ")}`);
  };

  try {
    for (const [pad, data, type] of [
      [paden.mp4, video.mp4, "video/mp4"],
      [paden.jpg, video.omslag, "image/jpeg"],
    ]) {
      const { error } = await db.storage.from(BUCKET).upload(pad, data, { contentType: type, cacheControl: "31536000", upsert: false });
      if (error) throw new Error(`opladen van ${pad} mislukt: ${error.message}`);
      opgeladen.push(pad);
    }
    const videoUrl = db.storage.from(BUCKET).getPublicUrl(paden.mp4).data.publicUrl;
    const omslagUrl = db.storage.from(BUCKET).getPublicUrl(paden.jpg).data.publicUrl;
    if (!(await bereikbaar(videoUrl, "video/mp4"))) throw new Error(`video niet publiek bereikbaar: ${videoUrl}`);
    if (!(await bereikbaar(omslagUrl, "image/jpeg"))) throw new Error(`omslag niet publiek bereikbaar: ${omslagUrl}`);

    const t = berichtTekst(reeks, taal);
    const problemen = tekstProblemen([t.titel, t.body, t.kort, t.hashtags]);
    const nodig = problemen.length > 0;
    const id = randomUUID();
    const eerste = reeks.weergaven[0].bestand;
    const { SOCIAL_FORMATEN, socialBeeldPad } = afspraak;
    const beelden = {};
    for (const f of Object.keys(SOCIAL_FORMATEN)) beelden[f] = socialBeeldPad(id, f, v);
    const notes = [
      "auto-engine",
      "template:video-model",
      `slot:${slot}`,
      "type:video",
      `taal:${taal}`,
      "plaats:reel",
      `kaart:${eerste}`,
      `video:${naam}.mp4`,
      `reeks:${reeks.id}`,
      "bron:social-video",
      "format:story",
      nodig ? `controle:${problemen.join("; ")}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const rij = {
      id,
      platform: "instagram",
      post_kind: "reel",
      status: nodig ? "concept" : "goedgekeurd",
      title: t.titel,
      body: t.body,
      hashtags: t.hashtags,
      target_url: `/${taal}/realisaties`,
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: week.toLowerCase(),
      scheduled_for: moment.toISOString(),
      attachments_json: [],
      notes,
      post_type: "video",
      taal,
      goedkeuring_nodig: nodig,
      gekeurd_op: nodig ? null : nu.toISOString(),
      media: { v, beelden, kaart: eerste, video: videoUrl, cover: omslagUrl },
      kanalen: REEL_KANALEN,
      publicatie: {},
      link_post: false,
      tekst_kort: t.kort,
      slot,
    };
    const { error } = await db.from("social_posts").insert(rij);
    if (error) {
      const dubbel = error.code === "23505";
      throw Object.assign(new Error(dubbel ? `plaats ${slot} werd intussen door iets anders gevuld` : `rij niet bewaard: ${error.message}`), { dubbel });
    }
    return { id, naam, videoUrl, omslagUrl, status: rij.status, problemen };
  } catch (e) {
    await ruimOpBijFout();
    throw e;
  }
}

/**
 * Ruimt eigen video's op die ouder zijn dan `weken` en niet meer nodig zijn
 * (geen bericht dat nog moet verschijnen verwijst ernaar). Enkel bestanden
 * met de naamvorm van dit script; enkel waarschuwingen, nooit een fout.
 */
async function ruimOudeOp(db, weken, nu) {
  if (!weken) return;
  try {
    const { data: lijst, error } = await db.storage.from(BUCKET).list(MAP, { limit: 1000, sortBy: { column: "created_at", order: "asc" } });
    if (error || !lijst) return;
    const grens = nu.getTime() - weken * 7 * DAG_MS;
    const vorm = /^(\d{4}-W\d{2}-[a-z0-9-]+-(?:nl|fr)-[a-z0-9]+)\.(mp4|jpg)$/;
    const oud = lijst.filter((f) => vorm.test(f.name) && f.created_at && Date.parse(f.created_at) < grens);
    if (!oud.length) return;
    const { data: wachtend } = await db
      .from("social_posts")
      .select("notes")
      .in("status", ["concept", "goedgekeurd", "gepland"])
      .like("notes", "%video:%")
      .limit(500);
    const nodig = new Set();
    for (const r of wachtend ?? []) {
      const m = r.notes?.match(/video:([^\s·]+)\.mp4/);
      if (m) nodig.add(m[1]);
    }
    const weg = oud.filter((f) => !nodig.has(f.name.match(vorm)[1])).map((f) => `${MAP}/${f.name}`);
    if (!weg.length) return;
    const { error: e2 } = await db.storage.from(BUCKET).remove(weg);
    if (e2) console.warn(`  ! Opruimen mislukt: ${e2.message}`);
    else console.log(`  Opgeruimd: ${weg.length} bestand(en) ouder dan ${weken} weken`);
  } catch (e) {
    console.warn(`  ! Opruimen overgeslagen: ${e instanceof Error ? e.message : e}`);
  }
}

// ─── Hoofdprogramma ───────────────────────────────────────────────────────
const fmt = (d) =>
  new Intl.DateTimeFormat("nl-BE", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(d);

async function main() {
  const o = leesOpties(process.argv.slice(2));
  if (o.help) {
    console.log("Gebruik: node scripts/social-video.mjs [--publish] [--week=2026-W42] [--reeks=<id>] [--taal=nl|fr] [--uit=<map>] [--encoder=auto|ffmpeg|browser] [--bewaar-weken=26] [--lijst]");
    return 0;
  }
  if (o.lijst) {
    for (const r of REEKSEN) console.log(`${r.id.padEnd(12)} ${r.soort.padEnd(7)} ${String(r.weergaven.length).padStart(1)} beeld(en)  ${r.nl.kop} / ${r.fr.kop}`);
    return 0;
  }

  const nu = new Date();
  const week = o.week ?? komendeWeek(nu);
  const taal = o.taal ?? taalVoorWeek(week);
  const reeks = o.reeks ? REEKSEN.find((r) => r.id === o.reeks) : reeksVoorWeek(week);
  const slot = `${week}-${PLAATS.id}`;
  const dag = plusDagen(maandagVan(week), PLAATS.dagNaMaandag);
  const moment = brusselsNaarUtc(dag.jaar, dag.maand, dag.dag, PLAATS.uur, 0);
  console.log(`Week ${week} · ${reeks.id} · ${taal.toUpperCase()} · plaats ${slot} (${fmt(moment)})`);

  let db = null;
  let afspraak = null;
  if (o.publish) {
    if (moment.getTime() < nu.getTime() + 30 * 60_000) throw new Voorwaarde(`het tijdstip van ${slot} is (bijna) voorbij: kies een latere week`);
    afspraak = await beeldUrlAfspraak();
    db = databank();
    const bezet = await voorcontrole(db, slot);
    if (bezet) {
      console.log(`Plaats ${slot} is al bezet (${bezet.status}: "${bezet.title}"). Niets te doen.`);
      return 0;
    }
  }

  const uitMap = path.resolve(o.uit ?? path.join(os.tmpdir(), "studio-vm-social-video"));
  await fs.mkdir(uitMap, { recursive: true });
  const t0 = Date.now();
  const video = await maakVideo({ reeks, taal, encoder: o.encoder, uitMap, naam: `${week}-${reeks.id}-${taal}`, stil: o.stil });
  const { info } = video;
  console.log(
    `Video (${video.encoder}, ${((Date.now() - t0) / 1000).toFixed(1)} s): ${video.mp4Pad}\n` +
      `  ${info.video?.breedte}×${info.video?.hoogte}, ${info.duur.toFixed(2)} s, ${info.video?.fps.toFixed(2)} beelden/s, ` +
      `${(info.bytes / 1e6).toFixed(2)} MB, ${info.video?.codec}${info.audio ? ` + ${info.audio.codec}` : " (zonder geluid)"}, ` +
      `moov ${info.faststart ? "vooraan" : "achteraan"}\n` +
      `Omslag: ${video.omslagPad} (${(video.omslag.length / 1e3).toFixed(0)} kB)` +
      video.stils.map((p) => `\nStil: ${p}`).join(""),
  );
  if (video.fouten.length) throw new Error(`video voldoet niet: ${video.fouten.join("; ")}`);

  if (!o.publish) {
    console.log("Enkel lokaal gemaakt (zonder --publish): niets opgeladen, niets ingepland.");
    return 0;
  }
  if (!info.audio) console.warn("  ! Zonder geluidsspoor: sommige platformen weigeren dat. Liefst met ffmpeg maken.");
  try {
    const r = await publiceer(db, { afspraak, week, slot, moment, reeks, taal, video, nu });
    console.log(`Ingepland: ${r.id} (${r.status}) op ${fmt(moment)}\n  ${r.videoUrl}\n  ${r.omslagUrl}`);
    if (r.problemen.length) console.warn(`  ! Wacht op akkoord: ${r.problemen.join("; ")}`);
  } catch (e) {
    if (e?.dubbel) {
      console.log(`${e.message}. Niets ingepland.`);
      return 0;
    }
    throw e;
  }
  await ruimOudeOp(db, o.bewaarWeken, nu);
  return 0;
}

// Exitcodes: 0 = klaar (of niets te doen), 1 = fout, 2 = verkeerde optie,
// 3 = voorwaarde ontbreekt (sleutels, migratie 0050, bucket, ffmpeg).
// Enkel als het script zelf gestart wordt: een test mag de functies importeren.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      process.exitCode = e instanceof Gebruik ? 2 : e instanceof Voorwaarde ? 3 : 1;
      console.error(`social-video: ${e instanceof Error ? e.message : e}`);
    },
  );
}

export { komendeWeek, maakCamera, maakTijdlijn, publiceer, reeksVoorWeek, ruimOudeOp, taalVoorWeek, tekstProblemen, voorcontrole };
