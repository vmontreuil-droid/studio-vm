// Merkkaart: het ene beeldsysteem achter elk deelbeeld van Studio VM.
// Linkvoorbeelden (og:image), feedberichten, stories en Google-berichten
// komen allemaal hieruit, in steen + amber met Montserrat ExtraBold.
//
// Opbouw van een kaart, in twee lagen:
//  1. Achtergrond (sharp): een echte 3D-render, schermvullend. De navy
//     achtergrond van de viewer wordt vervangen door steen (#0c0a09) met een
//     zachte gloed, zodat de render naadloos in de kaart opgaat. Luchtfoto's
//     blijven zoals ze zijn. Vier beelden = mozaïek van tegels.
//  2. Tekstlaag (next/og, Satori) op transparant: verloop voor leesbaarheid,
//     het "vm."-woordmerk, label, kop, onderregel en chips.
// sharp legt beide samen en maakt er een JPEG van (Instagram en de Graph-API
// willen geen WebP/PNG-kaarten, WhatsApp laat og-beelden boven ±300 KB vallen).
//
// Vierkant-veilig: alles wat gelezen moet worden staat in het middelste
// vierkant van het beeld, zodat een 1:1-uitsnede (WhatsApp, Messenger,
// Instagram-raster) nooit tekst afsnijdt. Geen browserkader, geen
// platformbadges, geen persoonsnaam.

import { ImageResponse } from "next/og";
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { SOCIAL_FORMATEN, type SocialFormaat } from "./beeld-url";

// Ontwerp gewijzigd? Verhoog MERKKAART_VERSIE in ./paginakaart.ts, dan
// krijgen alle paginabeelden een nieuw ?v= en halen platformen ze opnieuw op.

export type MerkkaartChip = {
  /** De chip zelf, bv. "vanaf € 45/uur" of "€ 45". */
  tekst: string;
  /** Klein onderschrift: maakt van de chip een prijstegel. */
  label?: string;
  /** Amber gevuld (anders donker met amber rand). */
  nadruk?: boolean;
};

export type Merkkaart = {
  /** Kop, kort houden (≤ 50 tekens leest het best). */
  kop: string;
  /** Kleine amber bovenregel. */
  label?: string;
  /** Regel onder de kop. */
  sub?: string;
  chips?: MerkkaartChip[];
  /** Kleine regel onder de chips, bv. "per uur, excl. btw". */
  voet?: string;
  /** Pad onder /3d/ (png, jpg of webp). Vier paden = mozaïek. */
  beeld?: string | string[];
  /** "studio-vm.be" op de kaart: ja voor berichten, nee voor linkvoorbeelden. */
  domein?: boolean;
  /** Achtergrond extra dempen, voor kaarten met veel tekst (tarieven). */
  gedempt?: boolean;
};

// ─── Kleuren (donker thema van de site) ──────────────────────────────────
const STEEN: Rgb = [12, 10, 9]; // --background #0c0a09
const GLOED: Rgb = [41, 37, 36]; // --card-hover #292524
const TEGEL: Rgb = [28, 25, 23]; // --card #1c1917
const WIT = "#fafaf9";
const ZACHT = "#e7e5e4";
const GRIJS = "#a8a29e";
const AMBER = "#f59e0b";
const OP_AMBER = "#1c1917";
const steen = (a: number) => `rgba(12,10,9,${a})`;

type Rgb = [number, number, number];
type Kader = { x: number; y: number; w: number; h: number };

// ─── Opmaak per formaat ──────────────────────────────────────────────────
type Opmaak = {
  midden: boolean;
  /** Binnenmarge: links/rechts, boven (woordmerk), onder (tekstblok). */
  x: number;
  boven: number;
  onder: number;
  /** Maximale breedte van het tekstblok (midden: binnen het vierkant). */
  kolom: number;
  /** Waar het model komt; vul 0 = helemaal zichtbaar, 1 = vlak vullend. */
  zone: Kader;
  vul: number;
  /** Tekstschaal t.o.v. de 1200×630-kaart. */
  s: number;
  kop: [number, number];
  kopRegels: number;
  /** Verloop voor leesbaarheid (boven: woordmerk, onder: tekstblok). */
  verloop: string;
  /** Domein los onderaan (px van de onderrand) i.p.v. naast het woordmerk. */
  domeinOnder?: number;
};

const OPMAAK: Record<SocialFormaat, Opmaak> = {
  // 1200×630: vierkant = x 285–915. Gecentreerd, kolom 600.
  og: {
    midden: true, x: 300, boven: 38, onder: 42, kolom: 600,
    zone: { x: 0, y: 0, w: 1200, h: 470 }, vul: 0.55,
    s: 1, kop: [40, 60], kopRegels: 3,
    verloop: `linear-gradient(180deg, ${steen(0.78)} 0%, ${steen(0)} 23%, ${steen(0)} 34%, ${steen(0.72)} 56%, ${steen(0.95)} 80%, ${steen(0.98)} 100%)`,
  },
  // 1200×900 (Google-bericht, 4:3): vierkant = x 150–1050.
  gbp: {
    midden: true, x: 170, boven: 54, onder: 64, kolom: 860,
    zone: { x: 0, y: 30, w: 1200, h: 610 }, vul: 0.5,
    s: 1.3, kop: [52, 78], kopRegels: 3,
    verloop: `linear-gradient(180deg, ${steen(0.75)} 0%, ${steen(0)} 20%, ${steen(0)} 40%, ${steen(0.75)} 62%, ${steen(0.96)} 82%, ${steen(0.98)} 100%)`,
  },
  // 1080×1080: alles is vierkant. Links uitgelijnd.
  square: {
    midden: false, x: 80, boven: 72, onder: 80, kolom: 920,
    zone: { x: 0, y: 40, w: 1080, h: 640 }, vul: 0.5,
    s: 1.35, kop: [60, 100], kopRegels: 3,
    verloop: `linear-gradient(180deg, ${steen(0.7)} 0%, ${steen(0)} 18%, ${steen(0)} 44%, ${steen(0.8)} 66%, ${steen(0.97)} 86%, ${steen(0.98)} 100%)`,
  },
  // 1080×1350: vierkant = y 135–1215.
  portrait: {
    midden: false, x: 80, boven: 150, onder: 170, kolom: 920,
    zone: { x: 0, y: 70, w: 1080, h: 800 }, vul: 0.5,
    s: 1.4, kop: [62, 106], kopRegels: 3,
    verloop: `linear-gradient(180deg, ${steen(0.55)} 0%, ${steen(0.1)} 18%, ${steen(0)} 26%, ${steen(0)} 46%, ${steen(0.8)} 66%, ${steen(0.97)} 84%, ${steen(1)} 100%)`,
  },
  // 1080×1920: vierkant = y 420–1500; platformknoppen boven/onder 250 px.
  story: {
    midden: false, x: 80, boven: 270, onder: 430, kolom: 920,
    zone: { x: 0, y: 330, w: 1080, h: 800 }, vul: 0.6,
    s: 1.55, kop: [70, 118], kopRegels: 4, domeinOnder: 300,
    verloop: `linear-gradient(180deg, ${steen(0.9)} 0%, ${steen(0.6)} 12%, ${steen(0)} 22%, ${steen(0)} 48%, ${steen(0.85)} 60%, ${steen(0.97)} 72%, ${steen(1)} 100%)`,
  },
};

// ─── Lettertypen ──────────────────────────────────────────────────────────
// Montserrat uit @fontsource (zit in package.json): geen CDN, geen netwerk.
// Vaste paden, zodat de bestandstracering van Next ze meeneemt.
type Lettertype = { name: string; data: ArrayBuffer; weight: 500 | 600 | 800; style: "normal" };
const LETTERGEWICHTEN = 3;
let LETTERS: Promise<Lettertype[]> | null = null;

function lettertypen(): Promise<Lettertype[]> {
  if (LETTERS) return LETTERS;
  const p = (async () => {
    const lees = async (p: string, weight: Lettertype["weight"]): Promise<Lettertype | null> => {
      try {
        const b = await fs.readFile(p);
        const data = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
        return { name: "Montserrat", data, weight, style: "normal" };
      } catch {
        return null;
      }
    };
    const r = await Promise.all([
      lees(path.join(process.cwd(), "node_modules/@fontsource/montserrat/files/montserrat-latin-800-normal.woff"), 800),
      lees(path.join(process.cwd(), "node_modules/@fontsource/montserrat/files/montserrat-latin-600-normal.woff"), 600),
      lees(path.join(process.cwd(), "node_modules/@fontsource/montserrat/files/montserrat-latin-500-normal.woff"), 500),
    ]);
    return r.filter((x): x is Lettertype => x !== null);
  })();
  LETTERS = p;
  // Niet alle gewichten gevonden? Niet onthouden: de kaart is dan onvolledig
  // (kort bewaard) en een volgende aanvraag zoekt opnieuw.
  p.then((r) => {
    if (r.length < LETTERGEWICHTEN && LETTERS === p) LETTERS = null;
  });
  return p;
}

// ─── Bronbeelden ─────────────────────────────────────────────────────────
const PAD_OK = /^\/3d\/[a-z0-9][a-z0-9\-/]*\.(png|jpe?g|webp)$/i;

// Viewer-schermafdrukken met legende of knoppen → dezelfde render zonder.
const ALIAS: Record<string, string> = {
  "/3d/model-parking.jpg": "/3d/h/parking-hellingen-donker.webp",
  "/3d/model-platform-hoogte.jpg": "/3d/r/p-platform-hoogte-donker.webp",
  "/3d/model-platform-helling.jpg": "/3d/r/p-platform-helling-donker.webp",
  "/3d/model-talud-helling.jpg": "/3d/r/p-uitgraving-helling-donker.webp",
  "/3d/model-bedrijfsterrein.jpg": "/3d/r/t088-donker.webp",
  "/3d/trace-luchtfoto.jpg": "/3d/h/trace-luchtfoto-donker.webp",
  "/3d/terrein-spectrum.jpg": "/3d/h/terrein-spectrum-donker.webp",
  "/3d/trace-weg.jpg": "/3d/weg-trace-donker.png",
};

/** Sterke renders voor berichten zonder eigen beeld (zie onderzoek-4). */
export const STERKE_RENDERS = [
  "/3d/relief-bouwput-donker.png",
  "/3d/weg-kruispunt-donker.png",
  "/3d/h/parking-hellingen-donker.webp",
  "/3d/r/t013-donker.webp",
  "/3d/r/t023-donker.webp",
  "/3d/r/t033-donker.webp",
  "/3d/r/t054-donker.webp",
  "/3d/h/terrein-spectrum-donker.webp",
  "/3d/relief-grondwerk-donker.png",
  "/3d/h/plan-hoogtelijnen-donker.webp",
] as const;

/** Geldig /3d/-pad (schermafdrukken → schone render), of null. */
export function beeldPad(pad: unknown): string | null {
  if (typeof pad !== "string") return null;
  const p = Object.hasOwn(ALIAS, pad) ? ALIAS[pad] : pad;
  if (!PAD_OK.test(p) || p.includes("..")) return null;
  return p;
}

// Vaste oorsprong als tweede bron (zelfde adres als SITE in lib/seo.ts; niet
// ingelezen om deze module licht te houden). Een preview-deploy achter
// Vercel-beveiliging geeft op zijn eigen adres 401; de productiesite niet.
const PRODUCTIE = "https://www.studio-vm.be";

// Ruwe bestanden: klein houden, er zijn er maar een dertigtal.
const BESTAND_CACHE = new Map<string, Promise<Buffer | null>>();

async function haal(pad: string, oorsprong: string): Promise<Buffer | null> {
  try {
    const res = await fetch(new URL(pad, oorsprong), { signal: AbortSignal.timeout(8000) });
    if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function leesBestand(pad: string, origin?: string): Promise<Buffer | null> {
  const hit = BESTAND_CACHE.get(pad);
  if (hit) return hit;
  const p = (async () => {
    try {
      return await fs.readFile(path.join(process.cwd(), "public", ...pad.split("/").filter(Boolean)));
    } catch {
      // Op Vercel zit public/ niet in de functie: haal het bij de eigen site,
      // en lukt dat niet (koude start, 401 op een preview, 5xx) bij productie.
      for (const o of new Set([origin, PRODUCTIE].filter((x): x is string => !!x))) {
        const b = await haal(pad, o);
        if (b) return b;
      }
      return null;
    }
  })();
  BESTAND_CACHE.set(pad, p);
  // Mislukt? Niet onthouden, een volgende aanvraag mag opnieuw proberen.
  p.then((b) => {
    if (!b) BESTAND_CACHE.delete(pad);
  });
  if (BESTAND_CACHE.size > 40) BESTAND_CACHE.delete(BESTAND_CACHE.keys().next().value!);
  return p;
}

type Bron = { raw: Buffer; W: number; H: number; model: Kader; dichtheid: number; foto: boolean; rand: Rgb };

// Maatstaf van scripts/renders-maken.mjs, plus: de navy gloed van de grote
// PNG's is iets verzadigder (tot 14,30,53) maar blijft donker (≤ 60).
function isModel(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  return max > 72 || (max > 60 && max - Math.min(r, g, b) > 34);
}

const BRON_CACHE = new Map<string, Promise<Bron | null>>();

function laadBron(pad: string, origin?: string): Promise<Bron | null> {
  const hit = BRON_CACHE.get(pad);
  if (hit) return hit;
  const p = (async (): Promise<Bron | null> => {
    // Lichte variant gevraagd? De donkere past bij de kaart.
    const donker = pad.replace(/-licht\.(png|jpe?g|webp)$/i, "-donker.$1");
    const buf = (donker !== pad ? await leesBestand(donker, origin) : null) ?? (await leesBestand(pad, origin));
    if (!buf) return null;
    try {
      // 8 bit per kanaal, 3 kanalen: ook een 16-bit- of grijswaarden-PNG.
      const { data, info } = await sharp(buf)
        .removeAlpha()
        .toColourspace("srgb")
        .raw({ depth: "uchar" })
        .toBuffer({ resolveWithObject: true });
      if (info.channels !== 3) return null;
      const W = info.width;
      const H = info.height;
      const kol = new Uint32Array(W);
      const rij = new Uint32Array(H);
      let n = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const k = (y * W + x) * 3;
          if (isModel(data[k], data[k + 1], data[k + 2])) {
            kol[x]++;
            rij[y]++;
            n++;
          }
        }
      }
      const drempel = Math.max(8, Math.round(Math.min(W, H) / 220));
      const eerste = (a: Uint32Array) => a.findIndex((v) => v >= drempel);
      const laatste = (a: Uint32Array) => {
        for (let i = a.length - 1; i >= 0; i--) if (a[i] >= drempel) return i;
        return -1;
      };
      const x0 = eerste(kol);
      const y0 = eerste(rij);
      const x1 = laatste(kol);
      const y1 = laatste(rij);
      const model = x0 < 0 || y0 < 0 ? { x: 0, y: 0, w: W, h: H } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      const k0 = (Math.floor(H / 2) * W + 2) * 3;
      return {
        raw: data,
        W,
        H,
        model,
        // Deel van het modelkader dat echt model is: een smal wegtracé ~0,15, een bouwput ~0,6.
        dichtheid: n / Math.max(1, model.w * model.h),
        // Luchtfoto: (bijna) alles heeft kleur, er is geen viewer-achtergrond.
        foto: n / (W * H) > 0.6,
        rand: [data[k0], data[k0 + 1], data[k0 + 2]],
      };
    } catch {
      return null;
    }
  })();
  BRON_CACHE.set(pad, p);
  p.then((b) => {
    if (!b) BRON_CACHE.delete(pad);
  });
  // Ruwe beelden zijn groot (tot 7 MB): weinig tegelijk bewaren.
  if (BRON_CACHE.size > 8) BRON_CACHE.delete(BRON_CACHE.keys().next().value!);
  return p;
}

/**
 * Leg het model van een bron in `zone` van een doek van cw×ch. Geeft ruwe
 * RGB terug op doekformaat; buiten de bron vult de viewerachtergrond aan
 * (die wordt daarna toch vervangen).
 */
async function legModel(b: Bron, cw: number, ch: number, zone: Kader, vul: number): Promise<Buffer> {
  if (b.foto) {
    return sharp(b.raw, { raw: { width: b.W, height: b.H, channels: 3 } })
      .resize(cw, ch, { fit: "cover", position: "centre" })
      .raw()
      .toBuffer();
  }
  const marge = Math.round(Math.max(b.model.w, b.model.h) * 0.04);
  const bw = b.model.w + 2 * marge;
  const bh = b.model.h + 2 * marge;
  const passend = Math.min(zone.w / bw, zone.h / bh);
  const vullend = Math.max(zone.w / bw, zone.h / bh);
  // Smalle modellen (een lang tracé) niet opblazen: vullen kost dan het model zelf.
  const v = vul * Math.min(1, Math.max(0, (b.dichtheid - 0.12) / 0.33));
  const s = Math.min(1.6, passend * Math.pow(vullend / passend, v));
  const mx = b.model.x + b.model.w / 2;
  const my = b.model.y + b.model.h / 2;
  const L = Math.round(mx - (zone.x + zone.w / 2) / s);
  const T = Math.round(my - (zone.y + zone.h / 2) / s);
  const w = Math.max(1, Math.round(cw / s));
  const h = Math.max(1, Math.round(ch / s));
  const ext = {
    left: Math.max(0, -L),
    top: Math.max(0, -T),
    right: Math.max(0, L + w - b.W),
    bottom: Math.max(0, T + h - b.H),
  };
  let raw = b.raw;
  let W = b.W;
  let H = b.H;
  if (ext.left || ext.top || ext.right || ext.bottom) {
    // sharp voert bewerkingen in vaste volgorde uit: eerst los uitbreiden.
    raw = await sharp(b.raw, { raw: { width: b.W, height: b.H, channels: 3 } })
      .extend({ ...ext, background: { r: b.rand[0], g: b.rand[1], b: b.rand[2] } })
      .raw()
      .toBuffer();
    W = b.W + ext.left + ext.right;
    H = b.H + ext.top + ext.bottom;
  }
  return sharp(raw, { raw: { width: W, height: H, channels: 3 } })
    .extract({ left: L + ext.left, top: T + ext.top, width: w, height: h })
    .resize(cw, ch, { fit: "fill", kernel: "lanczos3" })
    .raw()
    .toBuffer();
}

/**
 * Vervang de viewerachtergrond door `vlak` (steen of tegelkleur) met een
 * zachte gloed achter het model. Donkere lijnen BINNEN het model blijven
 * (vervaagd masker vult gaten), losse pikjes in de achtergrond verdwijnen.
 */
async function herkleur(src: Buffer, w: number, h: number, vlak: Rgb, gloed: { x: number; y: number; r: number } | null): Promise<Buffer> {
  const n = w * h;
  const masker = Buffer.alloc(n);
  for (let i = 0, k = 0; i < n; i++, k += 3) masker[i] = isModel(src[k], src[k + 1], src[k + 2]) ? 255 : 0;
  const opts = { raw: { width: w, height: h, channels: 1 as const } };
  // extractChannel: sharp maakt van één kanaal anders drie.
  const [zacht, breed] = await Promise.all([
    sharp(masker, opts).blur(0.7).extractChannel(0).raw().toBuffer(),
    sharp(masker, opts).blur(5).extractChannel(0).raw().toBuffer(),
  ]);
  const uit = Buffer.alloc(n * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const k = i * 3;
      const v = breed[i];
      const a = v > 45 ? Math.max(zacht[i] / 255, Math.min(1, Math.max(0, (v - 170) / 60))) : 0;
      let br = vlak[0];
      let bg = vlak[1];
      let bb = vlak[2];
      if (gloed) {
        const d = Math.hypot(x - gloed.x, y - gloed.y) / gloed.r;
        if (d < 1) {
          const t = (1 - d) * (1 - d) * 0.85;
          br += (GLOED[0] - br) * t;
          bg += (GLOED[1] - bg) * t;
          bb += (GLOED[2] - bb) * t;
        }
      }
      uit[k] = Math.round(src[k] * a + br * (1 - a));
      uit[k + 1] = Math.round(src[k + 1] * a + bg * (1 - a));
      uit[k + 2] = Math.round(src[k + 2] * a + bb * (1 - a));
    }
  }
  return uit;
}

function leegDoek(w: number, h: number, gloed: { x: number; y: number; r: number }): Buffer {
  const uit = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 3;
      const d = Math.hypot(x - gloed.x, y - gloed.y) / gloed.r;
      const t = d < 1 ? (1 - d) * (1 - d) * 0.85 : 0;
      uit[k] = Math.round(STEEN[0] + (GLOED[0] - STEEN[0]) * t);
      uit[k + 1] = Math.round(STEEN[1] + (GLOED[1] - STEEN[1]) * t);
      uit[k + 2] = Math.round(STEEN[2] + (GLOED[2] - STEEN[2]) * t);
    }
  }
  return uit;
}

/** De tegels van een mozaïek (2×2), in doekcoördinaten. */
function tegels(formaat: SocialFormaat, w: number, h: number): Kader[] {
  const o = OPMAAK[formaat];
  // Liggende kaarten: tegels over het hele doek, tekst op een plaat in het
  // midden. Staande: tegels in de beeldzone, tekst eronder.
  const vak = o.midden ? { x: 0, y: 0, w, h } : o.zone;
  const rand = Math.round(Math.min(w, h) * 0.022);
  const tussen = rand;
  const tw = Math.floor((vak.w - 2 * rand - tussen) / 2);
  const th = Math.floor((vak.h - 2 * rand - tussen) / 2);
  return [0, 1, 2, 3].map((i) => ({
    x: vak.x + rand + (i % 2) * (tw + tussen),
    y: vak.y + rand + Math.floor(i / 2) * (th + tussen),
    w: tw,
    h: th,
  }));
}

/**
 * Ruwe RGB-achtergrond op doekformaat. `ontbreekt` = de gevraagde renders
 * die niet geladen raakten (dan staat er een lege tegel of een leeg doek).
 */
async function achtergrond(beelden: string[], formaat: SocialFormaat, origin?: string): Promise<{ raw: Buffer; ontbreekt: string[] }> {
  const { w, h } = SOCIAL_FORMATEN[formaat];
  const o = OPMAAK[formaat];
  const midden = { x: o.zone.x + o.zone.w / 2, y: o.zone.y + o.zone.h / 2, r: Math.max(o.zone.w, o.zone.h) * 0.62 };

  if (beelden.length >= 4) {
    const vakken = tegels(formaat, w, h);
    const gevraagd = beelden.slice(0, 4);
    const bronnen = await Promise.all(gevraagd.map((p) => laadBron(p, origin)));
    const ontbreekt = gevraagd.filter((_, i) => !bronnen[i]);
    const lagen = await Promise.all(
      vakken.map(async (v, i) => {
        const b = bronnen[i];
        const straal = Math.round(Math.min(v.w, v.h) * 0.07);
        const hoek = Buffer.from(
          `<svg width="${v.w}" height="${v.h}"><rect width="${v.w}" height="${v.h}" rx="${straal}" ry="${straal}" fill="#fff"/></svg>`,
        );
        let tegelRaw: Buffer;
        if (b) {
          // Liggend: een smalle tekstplaat ligt in het midden. Elk model
          // schuift maar licht naar buiten: zo blijft het grootste deel naast
          // de plaat zichtbaar, en houdt ook de 1:1-uitsnede (WhatsApp,
          // Messenger) van elke tegel een herkenbaar stuk model.
          // Staand: gewoon gecentreerd in de tegel.
          const naarRechts = i % 2 === 1;
          const naarOnder = i >= 2;
          const binnen = OPMAAK[formaat].midden
            ? { x: v.w * (naarRechts ? 0.12 : 0.04), y: v.h * (naarOnder ? 0.1 : 0.04), w: v.w * 0.84, h: v.h * 0.86 }
            : { x: v.w * 0.06, y: v.h * 0.08, w: v.w * 0.88, h: v.h * 0.84 };
          const gelegd = await legModel(b, v.w, v.h, binnen, OPMAAK[formaat].midden ? 0.35 : 0.2);
          tegelRaw = b.foto ? gelegd : await herkleur(gelegd, v.w, v.h, TEGEL, { x: v.w / 2, y: v.h / 2, r: Math.max(v.w, v.h) * 0.6 });
        } else {
          tegelRaw = Buffer.alloc(v.w * v.h * 3);
          for (let k = 0; k < tegelRaw.length; k += 3) tegelRaw.set(TEGEL, k);
        }
        const png = await sharp(tegelRaw, { raw: { width: v.w, height: v.h, channels: 3 } })
          .ensureAlpha()
          .composite([{ input: hoek, blend: "dest-in" }])
          .png()
          .toBuffer();
        return { input: png, left: v.x, top: v.y };
      }),
    );
    const raw = await sharp(leegDoek(w, h, { x: w / 2, y: h / 2, r: Math.max(w, h) * 0.7 }), { raw: { width: w, height: h, channels: 3 } })
      .composite(lagen)
      .removeAlpha()
      .raw()
      .toBuffer();
    return { raw, ontbreekt };
  }

  const b = beelden[0] ? await laadBron(beelden[0], origin) : null;
  if (!b) return { raw: leegDoek(w, h, midden), ontbreekt: beelden.slice(0, 1) };
  const gelegd = await legModel(b, w, h, o.zone, o.vul);
  return { raw: b.foto ? gelegd : await herkleur(gelegd, w, h, STEEN, midden), ontbreekt: [] };
}

// ─── Tekstlaag ───────────────────────────────────────────────────────────

type Gewicht = 500 | 600 | 800;
/** Breedte in px van een tekst in Montserrat, zoals Satori ze meet. */
type Meter = (tekst: string, gewicht: Gewicht, px: number, spatiering: number) => number;

// Tekens zonder zichtbare vorm, als code (niet als letterlijk teken in de bron).
const NBSP = String.fromCharCode(0xa0);
const SMALLE_SPATIES = new RegExp(`[${String.fromCharCode(0x202f, 0x2007)}]`, "g");
const HARD_KOPPELTEKEN = new RegExp(String.fromCharCode(0x2011), "g");

/**
 * Woorden van een tekst. Elk woord wordt een eigen blok: zo breekt Satori
 * nooit op een koppelteken ("3D-/model") en blijft de tussenruimte vast.
 * Een spatie vóór ? ! : ; » of na « blijft aan het woord vast, net als
 * "3D" aan "model" ervoor of erna ("modèle 3D", "3D model") en "€" aan het bedrag.
 */
function woorden(tekst: string): string[] {
  const ws = tekst
    .normalize("NFC")
    .replace(SMALLE_SPATIES, NBSP)
    .replace(HARD_KOPPELTEKEN, "-")
    .split(/(?<!«) (?![?!:;»])/)
    .filter(Boolean);
  const uit: string[] = [];
  const model = /^\(?mod[eèé]l/i;
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i];
    const vorig = uit[uit.length - 1];
    if (/^\d+D[.,;:!?)…]*$/i.test(w) && vorig && model.test(vorig) && !/[.,;:!?)…]$/.test(vorig)) uit[uit.length - 1] += NBSP + w;
    else if ((/^\d+D$/i.test(w) && model.test(ws[i + 1] ?? "")) || (w === "€" && i + 1 < ws.length)) uit.push(w + NBSP + ws[++i]);
    else uit.push(w);
  }
  return uit;
}

/** Scheidingsteken tussen twee delen ("A · B"): mag een regel beëindigen, en valt daar weg. */
const SCHEIDING = /^[·•|—–]$/;
/** Klein lidwoord of voorzetsel ("du", "en", "aan", "the"): liever niet aan het eind van een regel. */
const KORT_WOORD = /^\p{Ll}{1,3}$/u;

// Letterbreedtes rechtstreeks uit het WOFF-bestand (hmtx + cmap). Satori
// meet ook zonder kerning, dus dit komt exact overeen met zijn opmaak.
type Maten = { upm: number; voorwaarts: (cp: number) => number };

function cmapLezer(c: Buffer): ((cp: number) => number) | null {
  const aantal = c.readUInt16BE(2);
  let sub = -1;
  let formaat = 0;
  for (let i = 0; i < aantal; i++) {
    const platform = c.readUInt16BE(4 + i * 8);
    const codering = c.readUInt16BE(6 + i * 8);
    const off = c.readUInt32BE(8 + i * 8);
    const f = c.readUInt16BE(off);
    if (platform === 0 || (platform === 3 && (codering === 1 || codering === 10))) {
      if (f === 12 || (f === 4 && formaat !== 12)) {
        sub = off;
        formaat = f;
      }
    }
  }
  if (sub < 0) return null;
  if (formaat === 12) {
    const groepen = c.readUInt32BE(sub + 12);
    return (cp) => {
      for (let i = 0; i < groepen; i++) {
        const g = sub + 16 + i * 12;
        const van = c.readUInt32BE(g);
        if (cp >= van && cp <= c.readUInt32BE(g + 4)) return c.readUInt32BE(g + 8) + (cp - van);
      }
      return 0;
    };
  }
  const seg = c.readUInt16BE(sub + 6) / 2;
  const eind = sub + 14;
  const begin = eind + 2 * seg + 2;
  const delta = begin + 2 * seg;
  const bereik = delta + 2 * seg;
  return (cp) => {
    if (cp > 0xffff) return 0;
    for (let i = 0; i < seg; i++) {
      if (cp > c.readUInt16BE(eind + 2 * i)) continue;
      const s = c.readUInt16BE(begin + 2 * i);
      if (cp < s) return 0;
      const d = c.readUInt16BE(delta + 2 * i);
      const ro = c.readUInt16BE(bereik + 2 * i);
      if (ro === 0) return (cp + d) & 0xffff;
      const g = c.readUInt16BE(bereik + 2 * i + ro + 2 * (cp - s));
      return g === 0 ? 0 : (g + d) & 0xffff;
    }
    return 0;
  };
}

function woffMaten(buf: Buffer): Maten | null {
  try {
    if (buf.toString("ascii", 0, 4) !== "wOFF") return null;
    const tabellen = new Map<string, Buffer>();
    for (let i = 0, n = buf.readUInt16BE(12); i < n; i++) {
      const e = 44 + i * 20;
      const tag = buf.toString("ascii", e, e + 4);
      if (tag !== "head" && tag !== "hhea" && tag !== "hmtx" && tag !== "cmap") continue;
      const off = buf.readUInt32BE(e + 4);
      const comp = buf.readUInt32BE(e + 8);
      const ruw = buf.subarray(off, off + comp);
      tabellen.set(tag, comp < buf.readUInt32BE(e + 12) ? inflateSync(ruw) : ruw);
    }
    const head = tabellen.get("head");
    const hhea = tabellen.get("hhea");
    const hmtx = tabellen.get("hmtx");
    const cmap = tabellen.get("cmap");
    if (!head || !hhea || !hmtx || !cmap) return null;
    const glyph = cmapLezer(cmap);
    if (!glyph) return null;
    const metrieken = hhea.readUInt16BE(34);
    return {
      upm: head.readUInt16BE(18),
      voorwaarts: (cp) => hmtx.readUInt16BE(4 * Math.min(glyph(cp), metrieken - 1)),
    };
  } catch {
    return null;
  }
}

/** Meter op basis van de geladen lettertypen; zonder bestand een ruwe schatting. */
function maakMeter(letters: Lettertype[]): Meter {
  const maten = new Map<Gewicht, Maten>();
  for (const l of letters) {
    const m = woffMaten(Buffer.from(l.data));
    if (m) maten.set(l.weight, m);
  }
  return (tekst, gewicht, px, spatiering) => {
    const m = maten.get(gewicht) ?? maten.get(800);
    let b = 0;
    let n = 0;
    for (const c of tekst) {
      n++;
      if (m) b += (m.voorwaarts(c.codePointAt(0)!) / m.upm) * px;
      else b += (/[iljI.,:;'!|ft]/.test(c) ? 0.33 : /[mwMW@]/.test(c) ? 0.92 : /[A-Z0-9]/.test(c) ? 0.7 : 0.6) * px;
    }
    return b + n * spatiering;
  };
}

const TUSSEN: Record<Gewicht, number> = { 500: 0.28, 600: 0.28, 800: 0.26 };

/**
 * Verdeel een tekst over zo weinig mogelijk regels binnen `kolom`, en maak
 * die regels dan zo gelijk mogelijk lang (geen "en" of "aan" alleen op de
 * laatste regel). Bij gelijke regelaantallen kiest hij de breuk die het best
 * leest: liever na een scheidingsteken (dat dan wegvalt) of een komma, niet
 * na een klein woordje ("interlocuteur, du / plan"), nooit vóór een
 * scheidingsteken. null = past niet in `max` regels.
 */
function zetRegels(tekst: string, gewicht: Gewicht, px: number, spatiering: number, kolom: number, max: number, meet: Meter): string[][] | null {
  const ws = woorden(tekst);
  if (!ws.length) return [];
  const b = ws.map((w) => meet(w, gewicht, px, spatiering));
  const tussen = Math.round(px * TUSSEN[gewicht]);
  const langste = Math.max(...b);
  if (langste > kolom) return null;
  const wikkel = (limiet: number) => {
    const r: number[][] = [];
    let x = 0;
    b.forEach((bw, i) => {
      const huidig = r[r.length - 1];
      if (huidig && x + tussen + bw <= limiet) {
        huidig.push(i);
        x += tussen + bw;
      } else {
        r.push([i]);
        x = bw;
      }
    });
    return r;
  };
  const aantal = wikkel(kolom).length;
  if (aantal > max) return null;
  if (aantal === 1) return [ws];
  let lo = langste;
  let hi = kolom;
  for (let k = 0; k < 18; k++) {
    const m = (lo + hi) / 2;
    if (wikkel(m).length <= aantal) hi = m;
    else lo = m;
  }

  // Beste breuken voor precies `aantal` regels (dynamisch programmeren).
  // Kost per regel: afwijking van de evenwichtige breedte `hi`, in het kwadraat.
  const n = ws.length;
  const som = [0];
  for (const bw of b) som.push(som[som.length - 1] + bw);
  const breedte = (i: number, j: number) => som[j] - som[i] + tussen * (j - i - 1);
  const straf = (hi * 0.3) ** 2;
  const best: number[][] = Array.from({ length: aantal + 1 }, () => new Array<number>(n + 1).fill(Infinity));
  const keuze: number[][] = Array.from({ length: aantal + 1 }, () => new Array<number>(n + 1).fill(-1));
  best[0][n] = 0;
  for (let k = 1; k <= aantal; k++) {
    for (let i = n - 1; i >= 0; i--) {
      // Een regel begint nooit met een scheidingsteken.
      if (i > 0 && SCHEIDING.test(ws[i])) continue;
      for (let j = i + 1; j <= n; j++) {
        const laatsteRegel = k === 1;
        const scheidt = !laatsteRegel && j - i > 1 && SCHEIDING.test(ws[j - 1]);
        // Een scheidingsteken aan het regeleinde valt weg: telt niet mee.
        const w = scheidt ? breedte(i, j - 1) : breedte(i, j);
        if (w > kolom) break;
        const rest = best[k - 1][j];
        if (rest === Infinity) continue;
        let c = (w - hi) ** 2;
        if (!laatsteRegel) {
          if (scheidt) c -= straf * 4;
          else if (/[,;:]$/.test(ws[j - 1])) c -= straf * 0.5;
          else if (KORT_WOORD.test(ws[j - 1])) c += straf * 2.5;
        }
        if (c + rest < best[k][i]) {
          best[k][i] = c + rest;
          keuze[k][i] = j;
        }
      }
    }
  }
  if (best[aantal][0] === Infinity) return wikkel(hi).map((r) => r.map((i) => ws[i]));
  const regels: string[][] = [];
  for (let k = aantal, i = 0; k > 0; k--) {
    const j = keuze[k][i];
    const regel = ws.slice(i, j);
    if (k > 1 && regel.length > 1 && SCHEIDING.test(regel[regel.length - 1])) regel.pop();
    regels.push(regel);
    i = j;
  }
  return regels;
}

/** Een regel met enkel een woordje van ≤ 3 tekens oogt als een vergissing. */
const heeftWees = (r: string[][]) => r.length > 1 && r.some((regel) => regel.length === 1 && [...regel[0]].length <= 3);

/** Aantal regels (niet de laatste) dat eindigt op een klein woordje. */
const kortEind = (r: string[][]) => r.slice(0, -1).filter((regel) => KORT_WOORD.test(regel[regel.length - 1])).length;

/**
 * Grootste kopmaat die in `max` regels past, liefst zonder wees en zonder
 * regel die op een klein woordje eindigt ("Vos plans en / …"). Voor dat
 * laatste mag de kop hooguit 18 % kleiner worden; om een wees kwijt te raken
 * zo klein als nodig.
 */
function zetKop(tekst: string, kolom: number, [min, max]: [number, number], regels: number, meet: Meter): { px: number; regels: string[][] | null } {
  let eerste = 0;
  let beste: { px: number; regels: string[][]; fout: number } | null = null;
  for (let px = max; px >= min; px -= 2) {
    const r = zetRegels(tekst, 800, px, -px * 0.022, kolom, regels, meet);
    if (!r) continue;
    eerste ||= px;
    const wees = heeftWees(r);
    const fout = (wees ? 10 : 0) + kortEind(r);
    if (px < eerste * 0.82) {
      if (beste && beste.fout < 10) break;
      if (wees) continue;
    }
    if (!beste || fout < beste.fout) beste = { px, regels: r, fout };
    if (fout === 0) break;
  }
  // Past nergens: kleinste maat; Satori breekt dan zelf.
  return beste ? { px: beste.px, regels: beste.regels } : { px: min, regels: zetRegels(tekst, 800, min, -min * 0.022, kolom, 99, meet) };
}

function Tekstblok({ tekst, regels, px, gewicht, kleur, midden, regelhoogte, spatiering }: {
  tekst: string;
  /** Vooraf verdeelde regels; null = laat Satori zelf afbreken. */
  regels: string[][] | null;
  px: number;
  gewicht: Gewicht;
  kleur: string;
  midden: boolean;
  regelhoogte: number;
  spatiering: number;
}) {
  const tussen = Math.round(px * TUSSEN[gewicht]);
  const stijl = { fontSize: px, fontWeight: gewicht, lineHeight: regelhoogte, letterSpacing: spatiering, color: kleur };
  const woordjes = (ws: string[]) =>
    ws.map((w, i) => (
      <span key={i} style={{ display: "flex" }}>
        {w}
      </span>
    ));
  if (!regels) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: midden ? "center" : "flex-start", columnGap: tussen, ...stijl }}>
        {woordjes(woorden(tekst))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: midden ? "center" : "flex-start", ...stijl }}>
      {regels.map((r, i) => (
        <div key={i} style={{ display: "flex", columnGap: tussen }}>
          {woordjes(r)}
        </div>
      ))}
    </div>
  );
}

function Woordmerk({ px }: { px: number }) {
  return (
    <div style={{ display: "flex", fontSize: px, fontWeight: 800, letterSpacing: -px * 0.05, lineHeight: 1, color: WIT }}>
      <span>vm</span>
      <span style={{ color: AMBER }}>.</span>
    </div>
  );
}

function Chips({ chips, s, midden }: { chips: MerkkaartChip[]; s: number; midden: boolean }) {
  const tegels = chips.some((c) => c.label);
  if (!tegels) {
    return (
      <div style={{ display: "flex", gap: 12 * s, justifyContent: midden ? "center" : "flex-start", flexWrap: "wrap" }}>
        {chips.map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              padding: `${9 * s}px ${22 * s}px`,
              borderRadius: 999,
              fontSize: 26 * s,
              fontWeight: 800,
              letterSpacing: -0.3 * s,
              background: c.nadruk === false ? steen(0.85) : AMBER,
              color: c.nadruk === false ? WIT : OP_AMBER,
              border: c.nadruk === false ? `${2 * s}px solid ${AMBER}` : "none",
            }}
          >
            {c.tekst}
          </div>
        ))}
      </div>
    );
  }
  // Prijstegels: groot bedrag, klein onderschrift.
  return (
    <div style={{ display: "flex", gap: 14 * s, justifyContent: midden ? "center" : "flex-start" }}>
      {chips.map((c, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 184 * s,
            padding: `${12 * s}px 0 ${13 * s}px`,
            borderRadius: 18 * s,
            background: c.nadruk ? AMBER : "rgba(28,25,23,0.94)",
            border: c.nadruk ? `${2 * s}px solid ${AMBER}` : `${2 * s}px solid rgba(245,158,11,0.55)`,
          }}
        >
          <div style={{ display: "flex", fontSize: 46 * s, fontWeight: 800, letterSpacing: -1.2 * s, lineHeight: 1.05, color: c.nadruk ? OP_AMBER : WIT }}>
            {c.tekst}
          </div>
          {c.label && (
            <div
              style={{
                display: "flex",
                marginTop: 4 * s,
                fontSize: 16 * s,
                fontWeight: 600,
                letterSpacing: 1.6 * s,
                textTransform: "uppercase",
                color: c.nadruk ? OP_AMBER : ZACHT,
              }}
            >
              {c.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Tekstlaag({ kaart, formaat, meet }: { kaart: Merkkaart; formaat: SocialFormaat; meet: Meter }) {
  const o = OPMAAK[formaat];
  const { w, h } = SOCIAL_FORMATEN[formaat];
  const s = o.s;
  const mozaiek = Array.isArray(kaart.beeld) && kaart.beeld.length >= 4;
  const plaat = mozaiek && o.midden;
  // Kengetal op de plaat ("32 realisaties"): het getal groot, het woord
  // eronder. Zo blijft de plaat smal en het werk errond zichtbaar, ook in
  // de 1:1-uitsnede.
  const kengetal = plaat ? /^(\d[\d.,]*)\s+(\S+)$/.exec(kaart.kop.trim()) : null;
  const kolom = plaat ? Math.min(o.kolom, (kengetal ? 420 : 540) * s) : o.kolom;
  const kop = zetKop(kaart.kop, kolom, plaat ? [Math.round(o.kop[0] * 1.1), Math.round(o.kop[1] * 1.25)] : o.kop, plaat ? 2 : o.kopRegels, meet);
  const getalPx = Math.round(124 * s);
  const woordPx = kengetal ? Math.min(Math.round(46 * s), Math.floor(kolom / Math.max(0.1, meet(kengetal[2], 800, 1, -0.022)))) : 0;
  const subPx = Math.round(24 * s);
  const subRegels = kaart.sub ? zetRegels(kaart.sub, 500, subPx, 0, kolom, 3, meet) : null;
  const align = o.midden ? "center" : "flex-start";
  const domein = (
    <div style={{ display: "flex", fontSize: 21 * s, fontWeight: 600, letterSpacing: 0.4 * s, color: ZACHT }}>studio-vm.be</div>
  );

  const blok = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, maxWidth: kolom, gap: 14 * s }}>
      {plaat && (
        <div style={{ display: "flex", marginBottom: 4 * s }}>
          <Woordmerk px={(kengetal ? 34 : 40) * s} />
        </div>
      )}
      {kaart.label && (
        <div style={{ display: "flex", fontSize: 19 * s, fontWeight: 600, letterSpacing: 3.2 * s, textTransform: "uppercase", color: AMBER }}>
          {kaart.label}
        </div>
      )}
      {kengetal ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: getalPx, fontWeight: 800, lineHeight: 0.9, letterSpacing: -getalPx * 0.04, color: AMBER }}>
            {kengetal[1]}
          </div>
          <div style={{ display: "flex", fontSize: woordPx, fontWeight: 800, lineHeight: 1.1, letterSpacing: -woordPx * 0.022, color: WIT }}>
            {kengetal[2]}
          </div>
        </div>
      ) : (
        <Tekstblok tekst={kaart.kop} regels={kop.regels} px={kop.px} gewicht={800} kleur={WIT} midden={o.midden} regelhoogte={1.07} spatiering={-kop.px * 0.022} />
      )}
      {kaart.sub && <Tekstblok tekst={kaart.sub} regels={subRegels} px={subPx} gewicht={500} kleur={ZACHT} midden={o.midden} regelhoogte={1.3} spatiering={0} />}
      {kaart.chips && kaart.chips.length > 0 && (
        <div style={{ display: "flex", marginTop: 8 * s }}>
          <Chips chips={kaart.chips} s={s} midden={o.midden} />
        </div>
      )}
      {kaart.voet && (
        <div style={{ display: "flex", fontSize: 18 * s, fontWeight: 500, color: GRIJS, textAlign: o.midden ? "center" : "left" }}>{kaart.voet}</div>
      )}
      {kaart.domein && o.midden && <div style={{ display: "flex", marginTop: 4 * s }}>{domein}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", width: w, height: h, position: "relative", fontFamily: "Montserrat" }}>
      {!plaat && <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: w, height: h, backgroundImage: o.verloop }} />}
      {kaart.gedempt && <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: w, height: h, background: steen(0.42) }} />}
      {plaat ? (
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: w, height: h, alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              padding: kengetal ? `${24 * s}px ${40 * s}px ${28 * s}px` : `${30 * s}px ${44 * s}px ${34 * s}px`,
              borderRadius: 28 * s,
              background: steen(0.92),
              border: "1px solid rgba(250,250,249,0.10)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
            }}
          >
            {blok}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: 0,
            left: 0,
            width: w,
            height: h,
            padding: `${o.boven}px ${o.x}px ${o.onder}px`,
            alignItems: align,
          }}
        >
          <div style={{ display: "flex", width: "100%", justifyContent: o.midden ? "center" : "space-between", alignItems: "center" }}>
            <Woordmerk px={Math.round(50 * s)} />
            {kaart.domein && !o.midden && !o.domeinOnder && domein}
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          {blok}
        </div>
      )}
      {kaart.domein && !o.midden && o.domeinOnder && (
        <div style={{ display: "flex", position: "absolute", left: o.x, bottom: o.domeinOnder, alignItems: "center", gap: 16 * s }}>
          <div style={{ display: "flex", width: 36 * s, height: 4 * s, borderRadius: 4, background: AMBER }} />
          {domein}
        </div>
      )}
    </div>
  );
}

// ─── Samenstellen ────────────────────────────────────────────────────────

export type MerkkaartBeeld = {
  data: Buffer;
  contentType: "image/jpeg" | "image/png";
  /**
   * false = noodbeeld: een render of een lettertype raakte niet geladen, of
   * sharp faalde. Bruikbaar, maar niet lang bewaren (geen immutable).
   */
  volledig: boolean;
};

const KAART_CACHE = new Map<string, Promise<MerkkaartBeeld>>();

/** Beelden van een kaart, als geldige /3d/-paden. */
function beeldenVan(kaart: Merkkaart): string[] {
  const lijst = Array.isArray(kaart.beeld) ? kaart.beeld : kaart.beeld ? [kaart.beeld] : [];
  return lijst.map(beeldPad).filter((p): p is string => p !== null);
}

// Meter per set lettertypen: komen ze later alsnog binnen, dan meet hij opnieuw.
let METER: { fonts: Lettertype[]; meet: Meter } | null = null;

/** Tekstlaag als PNG; `volledig` = alle gewichten van Montserrat geladen. */
async function tekstlaagPng(kaart: Merkkaart, formaat: SocialFormaat, metAchtergrond: boolean): Promise<{ png: Buffer; volledig: boolean }> {
  const { w, h } = SOCIAL_FORMATEN[formaat];
  const fonts = await lettertypen();
  if (METER?.fonts !== fonts) METER = { fonts, meet: maakMeter(fonts) };
  const laag = <Tekstlaag kaart={kaart} formaat={formaat} meet={METER.meet} />;
  const el = metAchtergrond ? (
    <div style={{ display: "flex", width: w, height: h, background: "#0c0a09" }}>{laag}</div>
  ) : (
    laag
  );
  const res = new ImageResponse(el, { width: w, height: h, fonts: fonts.length ? fonts : undefined });
  return { png: Buffer.from(await res.arrayBuffer()), volledig: fonts.length >= LETTERGEWICHTEN };
}

/**
 * Render een merkkaart als JPEG. `origin` = eigen site, om renders op te halen
 * als public/ niet op schijf staat (serverless). Faalt sharp, dan komt er een
 * PNG zonder render: nooit een fout of leeg beeld. Ontbreekt er een render of
 * een lettertype, dan is het beeld `volledig: false` en wordt het niet
 * onthouden: de volgende aanvraag probeert opnieuw.
 */
export function maakMerkkaart(kaart: Merkkaart, formaat: SocialFormaat, opts: { origin?: string } = {}): Promise<MerkkaartBeeld> {
  const sleutel = `${formaat}|${JSON.stringify(kaart)}`;
  const hit = KAART_CACHE.get(sleutel);
  if (hit) return hit;
  const p = (async (): Promise<MerkkaartBeeld> => {
    const { w, h } = SOCIAL_FORMATEN[formaat];
    try {
      const [bg, laag] = await Promise.all([achtergrond(beeldenVan(kaart), formaat, opts.origin), tekstlaagPng(kaart, formaat, false)]);
      if (bg.ontbreekt.length) console.error(`[merkkaart] render niet geladen (${formaat}): ${bg.ontbreekt.join(", ")}`);
      if (!laag.volledig) console.error("[merkkaart] Montserrat niet (volledig) geladen: standaardletter");
      const samen = await sharp(bg.raw, { raw: { width: w, height: h, channels: 3 } })
        .composite([{ input: laag.png }])
        .removeAlpha()
        .raw()
        .toBuffer();
      // og: onder ±300 KB blijven, anders laat WhatsApp het beeld vallen.
      const grens = formaat === "og" ? 280_000 : 900_000;
      let q = formaat === "og" ? 84 : 88;
      let data: Buffer;
      for (;;) {
        data = await sharp(samen, { raw: { width: w, height: h, channels: 3 } })
          .jpeg({ quality: q, mozjpeg: true, chromaSubsampling: "4:2:0" })
          .toBuffer();
        if (data.length <= grens || q <= 52) break;
        q -= 8;
      }
      return { data, contentType: "image/jpeg", volledig: bg.ontbreekt.length === 0 && laag.volledig };
    } catch (e) {
      console.error("[merkkaart] terugval zonder render:", e);
      const { png } = await tekstlaagPng({ ...kaart, beeld: undefined }, formaat, true);
      return { data: png, contentType: "image/png", volledig: false };
    }
  })();
  KAART_CACHE.set(sleutel, p);
  // Noodbeeld of fout niet onthouden: een volgende aanvraag probeert opnieuw.
  p.then(
    (r) => {
      if (!r.volledig && KAART_CACHE.get(sleutel) === p) KAART_CACHE.delete(sleutel);
    },
    () => {
      if (KAART_CACHE.get(sleutel) === p) KAART_CACHE.delete(sleutel);
    },
  );
  if (KAART_CACHE.size > 60) KAART_CACHE.delete(KAART_CACHE.keys().next().value!);
  return p;
}

/** Cache-Control voor een noodbeeld: kort, zodat geen CDN of platform het vastlegt. */
export const NOODBEELD_CACHE = "public, max-age=60, s-maxage=60";

/**
 * Zelfde, als HTTP-antwoord met de gevraagde Cache-Control. Een noodbeeld
 * (render of lettertype ontbrak) krijgt altijd NOODBEELD_CACHE, ook als het
 * adres een ?v= draagt: anders houden Buffer, Meta en de CDN het een jaar vast.
 * De kop x-merkkaart zegt welk van de twee het werd.
 */
export async function merkkaartAntwoord(
  kaart: Merkkaart,
  formaat: SocialFormaat,
  opts: { origin?: string; cacheControl: string },
): Promise<Response> {
  let beeld: MerkkaartBeeld;
  try {
    beeld = await maakMerkkaart(kaart, formaat, { origin: opts.origin });
  } catch (e) {
    // Zelfs de tekstlaag lukt niet (Satori stuk): niets bewaren, later opnieuw.
    console.error("[merkkaart] geen beeld:", e);
    return new Response("Beeld tijdelijk niet beschikbaar", { status: 503, headers: { "cache-control": "no-store", "retry-after": "60" } });
  }
  return new Response(new Uint8Array(beeld.data), {
    headers: {
      "content-type": beeld.contentType,
      "content-length": String(beeld.data.length),
      "cache-control": beeld.volledig ? opts.cacheControl : NOODBEELD_CACHE,
      "x-merkkaart": beeld.volledig ? "volledig" : "noodbeeld",
      "x-content-type-options": "nosniff",
    },
  });
}

// ─── Kaart voor een social-bericht ───────────────────────────────────────

export type SocialPostRij = {
  id?: string | null;
  title?: string | null;
  body?: string | null;
  notes?: string | null;
  attachments_json?: unknown;
  post_kind?: string | null;
  /** Kolom van migratie 0050: { kaart?, beeld?, dias?: { kop, tekst, beeld? }[] }. */
  media?: unknown;
};

/** Kaart zonder bericht: neutraal, nooit "studio-vm · STUDIO-VM". */
export const NEUTRALE_KAART: Merkkaart = {
  kop: "3D-modellen voor machinesturing",
  sub: "Trimble · Topcon · Leica · Unicontrol · CHCNAV",
  beeld: "/3d/relief-bouwput-donker.png",
  domein: true,
};

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu;

// Kanaal- en plaatsnamen in oude titels ("FB groep — …", "IG story · …",
// "… - LinkedIn"): die horen niet als label op het beeld.
const PLATFORM = "fb|facebook|ig|insta|instagram|li|linkedin|x|twitter|google|gbp|gmb|threads|bluesky|bsky|tiktok|pinterest|youtube|yt|meta|whatsapp";
const PLAATS = "story|stories|reel|reels|short|shorts|post|posts|groep|groepen|group|groups|groupe|groupes|page|pagina|bericht|update|feed|carrousel|carousel";
const KANAAL_BRON = `(?:${PLATFORM})(?:\\s*[/+&]\\s*(?:${PLATFORM}))*(?:\\s+(?:${PLAATS}))?|(?:${PLAATS})`;
const KANAAL = new RegExp(`^(?:${KANAAL_BRON})$`, "i");
const KANAAL_ACHTERAAN = new RegExp(`(?:\\s*[·—–|]\\s*|\\s+-\\s+)(?:${KANAAL_BRON})\\s*$`, "i");

// Kale domeinen ("barbotte.vercel.app", "www.voorbeeld.be/pad").
const DOMEIN = /\b(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:vercel\.app|netlify\.app|be|com|nl|fr|eu|de|es|lu|net|org|io|app)\b\S*/gi;

function schoon(s: string): string {
  return s
    .replace(EMOJI, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(DOMEIN, "")
    .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, "$1")
    .replace(/\s+/g, " ")
    .trim()
    // Wat na het wegknippen blijft hangen: "Site die ik maakte:" → zonder ":".
    .replace(/^[\s:·—–|]+|(?:[\s:·—–|]|\s-)+$/gu, "");
}

/**
 * Kop en label uit de berichttitel. "Story · X" en "FB – X" verliezen hun
 * kanaal; "Realisatie — Aftakking" wordt label "Realisatie" + kop "Aftakking".
 */
export function postKop(title: string | null | undefined, body: string | null | undefined): { kop: string; label?: string; sub?: string } {
  let t = schoon(title ?? "");
  let label: string | undefined;
  for (let i = 0; i < 3; i++) {
    const m = t.match(/^([^·—–|:]{2,26}?)\s*[·—–|:]\s+(.+)$/);
    if (!m) break;
    const voor = m[1].trim();
    t = m[2].trim();
    if (!KANAAL.test(voor)) {
      label = voor;
      break;
    }
  }
  t = t.replace(KANAAL_ACHTERAAN, "").trim();

  // Eerst op regels en zinnen splitsen, dan pas opschonen (dat maakt van
  // elke witruimte één spatie). Een zin die de kop herhaalt, telt niet.
  const kopKlein = t.toLowerCase();
  const zinnen = (body ?? "")
    .split(/\n+|(?<=[.!?])\s+/)
    .map(schoon)
    .filter((z) => z.length >= 20 && z.length <= 110 && !(kopKlein && z.toLowerCase().includes(kopKlein)));

  const kort = (z: string) => (z.length <= 90 ? z : `${z.slice(0, 84).replace(/\s+\S*$/, "")}…`);
  if (t.length > 90) return { kop: kort(t), label };
  // Titel bruikbaar als kop (ook een korte projectnaam na een label, zoals
  // "Aftakking"): bij een korte kop komt de eerste zin van de tekst eronder.
  if (t.length >= 12 || (t.length >= 3 && label)) return { kop: t, label, sub: t.length < 28 ? zinnen[0] : undefined };
  // Te kort ("Tip"): dat wordt het label, de eerste zin de kop.
  const zin = zinnen[0];
  if (zin) return { kop: kort(zin), label: label ?? (t || undefined) };
  return t ? { kop: t, label } : { kop: NEUTRALE_KAART.kop, label };
}

/** Kort, stabiel getal uit een tekst (voor een vaste render per bericht). */
function hashGetal(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Kolom `media` (migratie 0050) als object; ontbreekt de kolom, dan {}. */
function mediaVan(post: SocialPostRij): Record<string, unknown> {
  const m = post.media;
  return m && typeof m === "object" && !Array.isArray(m) ? (m as Record<string, unknown>) : {};
}

/**
 * Beeld van een bericht, in volgorde: media.kaart en media.beeld (kolom van
 * migratie 0050, de bron), dan de kaart:- of beeld:-marker in notes (rijen van
 * vóór de migratie), een bijlage, of een vaste sterke render.
 */
export function postBeeld(post: SocialPostRij): string {
  const media = mediaVan(post);
  const notes = post.notes ?? "";
  const marker = (naam: string) => notes.match(new RegExp(`${naam}:(\\/3d\\/[a-z0-9\\-/]+\\.(?:png|jpe?g|webp))`, "i"))?.[1];
  const bijlage = Array.isArray(post.attachments_json)
    ? (post.attachments_json as unknown[])
        .map((a) => (a && typeof a === "object" ? (a as { src?: unknown }).src : null))
        .find((src) => typeof src === "string" && src.startsWith("/3d/"))
    : undefined;
  for (const kandidaat of [media.kaart, media.beeld, marker("kaart"), marker("beeld"), bijlage]) {
    const p = beeldPad(kandidaat);
    if (p) return p;
  }
  return STERKE_RENDERS[hashGetal(post.id ?? post.title ?? "") % STERKE_RENDERS.length];
}

/** Is dit bericht een story (staand formaat)? */
export function postIsStory(post: SocialPostRij | null): boolean {
  return !!post && (post.post_kind === "story" || (post.notes ?? "").includes("format:story"));
}

/** De merkkaart van een social-bericht; zonder bericht de neutrale kaart. */
export function kaartVoorPost(post: SocialPostRij | null): Merkkaart {
  if (!post) return NEUTRALE_KAART;
  const { kop, label, sub } = postKop(post.title, post.body);
  return { kop, label, sub, beeld: postBeeld(post), domein: true };
}

/** Aantal dia's van een carrousel (media.dias); 0 zonder carrousel of kolom. */
export function postDiaAantal(post: SocialPostRij | null): number {
  if (!post) return 0;
  const dias = mediaVan(post).dias;
  return Array.isArray(dias) ? Math.min(dias.length, 10) : 0;
}

/**
 * Dia `n` (vanaf 1) van een carrousel: label "n/N", de kop en tekst van de
 * dia, het eigen beeld van de dia of anders dat van het bericht (zo oogt de
 * reeks als één geheel). null = geen dia met dat nummer.
 */
export function kaartVoorDia(post: SocialPostRij, n: number): Merkkaart | null {
  const aantal = postDiaAantal(post);
  if (!Number.isInteger(n) || n < 1 || n > aantal) return null;
  const d = (mediaVan(post).dias as unknown[])[n - 1];
  if (!d || typeof d !== "object") return null;
  const { kop, tekst, beeld } = d as { kop?: unknown; tekst?: unknown; beeld?: unknown };
  const k = typeof kop === "string" ? schoon(kop) : "";
  if (!k) return null;
  const t = typeof tekst === "string" ? schoon(tekst) : "";
  return {
    label: `${n}/${aantal}`,
    kop: k.length <= 90 ? k : `${k.slice(0, 84).replace(/\s+\S*$/, "")}…`,
    sub: t ? (t.length <= 140 ? t : `${t.slice(0, 134).replace(/\s+\S*$/, "")}…`) : undefined,
    beeld: beeldPad(beeld) ?? postBeeld(post),
    domein: true,
  };
}
