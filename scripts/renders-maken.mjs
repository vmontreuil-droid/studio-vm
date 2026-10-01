// Maakt van donkere 3D-renders (navy achtergrond) een bijgesneden DONKERE én
// LICHTE versie voor de site. Gebruik:
//   node scripts/renders-maken.mjs <bronmap> <doelmap> naam=bron.jpg [naam=bron.jpg …]
// Uitvoer: <doelmap>/<naam>-donker.webp en <naam>-licht.webp (1600 px breed, 16:10).
//
// Hoe:
//  1. Inhoudsmasker: pixels met kleur (verzadiging) of helder lijnwerk zijn "model".
//  2. Losse pixels negeren (rij/kolom moet ≥ N treffers hebben) → bijsnijden met marge.
//  3. Licht: masker vervagen = binnenkant van het model (ook donkere hoogtelijnen
//     IN het oppervlak blijven), daarbuiten de achtergrond vervangen door een licht verloop.
import sharp from "sharp";
import path from "node:path";

const [bron, doel, ...paren] = process.argv.slice(2);
const BREED = 1600, VERH = 16 / 10;

function isModel(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  // achtergrond (gemeten): helderheid ≤ 46, verzadiging ≤ 21
  return max - min > 34 || max > 72;
}

// Zelfde stappen (uitbreiden → uitsnijden → verkleinen) voor beeld én masker:
// beide als 3-kanaals raw, elke stap gematerialiseerd met bekende afmetingen.
async function bewerk(raw, W, H, ext, uitsnede, breed, hoog, achtergrond) {
  const W2 = W + ext.left + ext.right, H2 = H + ext.top + ext.bottom;
  const groot = await sharp(raw, { raw: { width: W, height: H, channels: 3 } })
    .extend({ ...ext, background: achtergrond }).raw().toBuffer();
  const stuk = await sharp(groot, { raw: { width: W2, height: H2, channels: 3 } })
    .extract(uitsnede).raw().toBuffer();
  return sharp(stuk, { raw: { width: uitsnede.width, height: uitsnede.height, channels: 3 } })
    .resize(breed, hoog, { kernel: "lanczos3" }).raw().toBuffer();
}

for (const paar of paren) {
  const [naam, bestand] = paar.split("=");
  const src = path.join(bron, bestand);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;

  // Onderste strook (kleurenlegende + bedieningstekst van de viewer) wegschilderen
  // met de achtergrondkleur van dezelfde rij.
  const strook = Math.floor(H * 0.9);
  for (let y = strook; y < H; y++) {
    const k0 = (y * W + 2) * 3;
    for (let x = 0; x < W; x++) { const k = (y * W + x) * 3; data[k] = data[k0]; data[k + 1] = data[k0 + 1]; data[k + 2] = data[k0 + 2]; }
  }

  const masker = Buffer.alloc(W * H * 3);
  const kol = new Uint32Array(W), rij = new Uint32Array(H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 3;
      if (isModel(data[k], data[k + 1], data[k + 2])) {
        masker[k] = masker[k + 1] = masker[k + 2] = 255;
        kol[x]++; rij[y]++;
      }
    }
  const drempel = Math.max(8, Math.round(Math.min(W, H) / 220));
  const eerste = (a) => a.findIndex((v) => v >= drempel);
  const laatste = (a) => a.length - 1 - [...a].reverse().findIndex((v) => v >= drempel);
  const x0 = eerste(kol), x1 = laatste(kol), y0 = eerste(rij), y1 = laatste(rij);
  if (x0 < 0 || y0 < 0) { console.log(naam, "geen inhoud gevonden"); continue; }
  const mx = Math.round((x1 - x0) * 0.08) + 12, my = Math.round((y1 - y0) * 0.08) + 12;
  let L = x0 - mx, T = y0 - my, w = x1 - x0 + 2 * mx, h = y1 - y0 + 2 * my;
  if (w / h > VERH) { const nh = Math.round(w / VERH); T -= Math.round((nh - h) / 2); h = nh; }
  else { const nw = Math.round(h * VERH); L -= Math.round((nw - w) / 2); w = nw; }
  const ext = { top: Math.max(0, -T), left: Math.max(0, -L), bottom: Math.max(0, T + h - H), right: Math.max(0, L + w - W) };
  const uitsnede = { left: L + ext.left, top: T + ext.top, width: w, height: h };
  const hoog = Math.round(BREED / VERH);
  const rand = { r: data[(Math.floor(H / 2) * W + 2) * 3], g: data[(Math.floor(H / 2) * W + 2) * 3 + 1], b: data[(Math.floor(H / 2) * W + 2) * 3 + 2] };

  const donker = await bewerk(data, W, H, ext, uitsnede, BREED, hoog, rand);
  // Draadmodellen zijn in de bron erg flauw: lijnen helderder maken (enkel waar model).
  if (naam.includes("draad")) {
    const m0 = await bewerk(masker, W, H, ext, uitsnede, BREED, hoog, { r: 0, g: 0, b: 0 });
    for (let k = 0; k < donker.length; k += 3) {
      if (m0[k] < 40) continue;
      for (let c = 0; c < 3; c++) donker[k + c] = Math.min(255, Math.round(donker[k + c] * 2.6 + 20));
    }
  }
  await sharp(donker, { raw: { width: BREED, height: hoog, channels: 3 } }).webp({ quality: 86 }).toFile(path.join(doel, `${naam}-donker.webp`));

  const mBuf = await bewerk(masker, W, H, ext, uitsnede, BREED, hoog, { r: 0, g: 0, b: 0 });
  const vaag = await sharp(mBuf, { raw: { width: BREED, height: hoog, channels: 3 } }).blur(5).raw().toBuffer();
  const uit = Buffer.alloc(BREED * hoog * 3);
  for (let y = 0; y < hoog; y++) {
    const t = y / hoog;
    const bg = [240 - 10 * t, 243 - 8 * t, 248 - 5 * t]; // licht verloop
    for (let x = 0; x < BREED; x++) {
      const k = (y * BREED + x) * 3;
      // Scherpe buitenrand: het masker zelf. De vervaging vult alleen gaten BINNEN het
      // model (waar bijna alle buren model zijn), niet de rand naar buiten.
      const vul = Math.min(1, Math.max(0, (vaag[k] - 170) / 60));
      // losse pixels (geen modelburen) tellen niet: weg met stipjes in de achtergrond
      const eigen = vaag[k] > 45 ? mBuf[k] / 255 : 0;
      const binnen = Math.max(eigen, vul);
      uit[k] = Math.round(donker[k] * binnen + bg[0] * (1 - binnen));
      uit[k + 1] = Math.round(donker[k + 1] * binnen + bg[1] * (1 - binnen));
      uit[k + 2] = Math.round(donker[k + 2] * binnen + bg[2] * (1 - binnen));
    }
  }
  await sharp(uit, { raw: { width: BREED, height: hoog, channels: 3 } }).webp({ quality: 86 }).toFile(path.join(doel, `${naam}-licht.webp`));
  console.log(naam, `bron ${W}x${H} → model ${x1 - x0}x${y1 - y0} → uitsnede ${w}x${h}`);
}
