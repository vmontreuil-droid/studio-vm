// Bronbeelden voor scripts/social-video.mjs: van een 3D-render (navy
// viewerachtergrond) naar een uitgeknipt model met transparante achtergrond.
//
// Zelfde maatstaf als de merkkaart (src/lib/social/merkkaart.tsx, isModel en
// herkleur): wat kleur heeft of helder is, is model; een vervaagd masker vult
// donkere lijnen BINNEN het model op en laat losse pikjes in de achtergrond
// vallen. De video tekent het model daarna op steen (#0c0a09) met een zachte
// gloed, dus zonder de navy rechthoek.
//
// Weergaven van één model (bv. hoogtekleuren, helling, hoogtelijnen) krijgen
// dezelfde uitsnede, zodat ze in de video exact op elkaar overvloeien.

import sharp from "sharp";

/** Model of achtergrond? (zelfde drempels als merkkaart.tsx) */
export function isModel(r, g, b) {
  const max = Math.max(r, g, b);
  return max > 72 || (max > 60 && max - Math.min(r, g, b) > 34);
}

const klem = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

async function leesRaw(bestand) {
  const { data, info } = await sharp(bestand)
    .removeAlpha()
    .toColourspace("srgb")
    .raw({ depth: "uchar" })
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 3) throw new Error(`${bestand}: onverwacht aantal kanalen (${info.channels})`);
  return { data, W: info.width, H: info.height };
}

/** Kader rond het model: rijen/kolommen met genoeg modelpixels (geen losse pikjes). */
function modelKader({ data, W, H }) {
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
  const eerste = (a) => a.findIndex((v) => v >= drempel);
  const laatste = (a) => {
    for (let i = a.length - 1; i >= 0; i--) if (a[i] >= drempel) return i;
    return -1;
  };
  const x0 = eerste(kol);
  const y0 = eerste(rij);
  if (x0 < 0 || y0 < 0) return { x: 0, y: 0, w: W, h: H, aandeel: 0 };
  return { x: x0, y: y0, w: laatste(kol) - x0 + 1, h: laatste(rij) - y0 + 1, aandeel: n / (W * H) };
}

/**
 * Alfakanaal voor een uitsnede. Vlakken: vervaagd masker (zoals herkleur in
 * merkkaart.tsx). Lijnwerk (driehoeksnet): helderheid, want dunne lijnen
 * zouden in het vervaagde masker verdwijnen.
 */
async function alfa(rgb, w, h, lijnen) {
  const n = w * h;
  const uit = Buffer.alloc(n);
  if (lijnen) {
    for (let i = 0, k = 0; i < n; i++, k += 3) {
      const max = Math.max(rgb[k], rgb[k + 1], rgb[k + 2]);
      uit[i] = Math.round(255 * klem((max - 58) / 40));
    }
    return uit;
  }
  const masker = Buffer.alloc(n);
  for (let i = 0, k = 0; i < n; i++, k += 3) masker[i] = isModel(rgb[k], rgb[k + 1], rgb[k + 2]) ? 255 : 0;
  const opts = { raw: { width: w, height: h, channels: 1 } };
  const [zacht, breed] = await Promise.all([
    sharp(masker, opts).blur(0.7).extractChannel(0).raw().toBuffer(),
    sharp(masker, opts).blur(5).extractChannel(0).raw().toBuffer(),
  ]);
  for (let i = 0; i < n; i++) {
    const v = breed[i];
    const a = v > 45 ? Math.max(zacht[i] / 255, klem((v - 170) / 60)) : 0;
    uit[i] = Math.round(255 * a);
  }
  return uit;
}

/**
 * Knipt alle weergaven van één model met dezelfde uitsnede uit.
 *
 * @param {Array<{ bestand: string, lijnen?: boolean }>} weergaven
 * @param {{ maxZijde?: number, raster?: number }} [opts]
 * @returns {Promise<{ breedte: number, hoogte: number, schaal: number,
 *   lagen: Buffer[], dekking: number[][] }>}
 *   lagen = PNG's (RGBA) van gelijke grootte; schaal = verkleining t.o.v. de
 *   bron (≤ 1); dekking = raster × raster aandeel model per vak (eerste laag).
 */
export async function knipModel(weergaven, opts = {}) {
  const maxZijde = opts.maxZijde ?? 1700;
  const raster = opts.raster ?? 6;
  const bronnen = await Promise.all(weergaven.map((w) => leesRaw(w.bestand)));
  const { W, H } = bronnen[0];
  if (bronnen.some((b) => b.W !== W || b.H !== H)) throw new Error("de weergaven van één model moeten even groot zijn");

  // Eén kader voor alle weergaven (unie), met een kleine marge.
  const kaders = bronnen.map((b, i) => (weergaven[i].lijnen ? null : modelKader(b))).filter(Boolean);
  const basis = kaders.length ? kaders : bronnen.map(modelKader);
  if (basis.every((k) => k.aandeel === 0)) throw new Error(`geen model gevonden in ${weergaven[0].bestand}`);
  const x0 = Math.min(...basis.map((k) => k.x));
  const y0 = Math.min(...basis.map((k) => k.y));
  const x1 = Math.max(...basis.map((k) => k.x + k.w));
  const y1 = Math.max(...basis.map((k) => k.y + k.h));
  const marge = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04);
  const left = Math.max(0, x0 - marge);
  const top = Math.max(0, y0 - marge);
  const cw = Math.min(W, x1 + marge) - left;
  const ch = Math.min(H, y1 + marge) - top;
  const schaal = Math.min(1, maxZijde / Math.max(cw, ch));
  const breedte = Math.max(1, Math.round(cw * schaal));
  const hoogte = Math.max(1, Math.round(ch * schaal));

  const lagen = [];
  let eersteAlfa = null;
  for (let i = 0; i < bronnen.length; i++) {
    const rgb = await sharp(bronnen[i].data, { raw: { width: W, height: H, channels: 3 } })
      .extract({ left, top, width: cw, height: ch })
      .raw()
      .toBuffer();
    const a = await alfa(rgb, cw, ch, !!weergaven[i].lijnen);
    const rgba = Buffer.alloc(cw * ch * 4);
    for (let p = 0, k = 0, q = 0; p < cw * ch; p++, k += 3, q += 4) {
      rgba[q] = rgb[k];
      rgba[q + 1] = rgb[k + 1];
      rgba[q + 2] = rgb[k + 2];
      rgba[q + 3] = a[p];
    }
    let beeld = sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } });
    if (schaal < 1) beeld = beeld.resize(breedte, hoogte, { kernel: "lanczos3" });
    lagen.push(await beeld.png({ compressionLevel: 6 }).toBuffer());
    if (i === 0) eersteAlfa = a;
  }

  // Waar zit het meeste model? (voor de cameravoering van één enkele render)
  const dekking = Array.from({ length: raster }, () => new Array(raster).fill(0));
  for (let gy = 0; gy < raster; gy++) {
    for (let gx = 0; gx < raster; gx++) {
      const xa = Math.floor((gx * cw) / raster);
      const xb = Math.floor(((gx + 1) * cw) / raster);
      const ya = Math.floor((gy * ch) / raster);
      const yb = Math.floor(((gy + 1) * ch) / raster);
      let som = 0;
      let tel = 0;
      for (let y = ya; y < yb; y += 2) {
        for (let x = xa; x < xb; x += 2) {
          som += eersteAlfa[y * cw + x];
          tel++;
        }
      }
      dekking[gy][gx] = tel ? som / (255 * tel) : 0;
    }
  }
  return { breedte, hoogte, schaal, lagen, dekking };
}
