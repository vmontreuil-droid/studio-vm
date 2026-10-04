// Beeldarchief: maakt per project een reeks beelden uit een LandXML-oppervlak (TIN).
// Geen tekst, geen coördinaten, geen namen op de beelden: enkel het model.
//
//   node scripts/archief-beelden.mjs <lijst.json> <doelmap> [code …]
//
// lijst.json: [{ "code": "a01", "bron": "C:/…/oppervlak.xml",
//                "oppervlak"?: "naam", "omgewisseld"?: true, "draai"?: 0,
//                "overdrijving"?: 3, "azimut"?: -28, "hoogte"?: 34, "netZoom"?: 2 }]
//
// Weergaven (WEERGAVEN=3d,helling,… om er enkele te kiezen):
//   3d          3D-blok in hoogtekleuren met schaduw en fijne hoogtelijnen
//   helling     3D-blok in hellingsklassen
//   net         3D-blok met het driehoeksnet (ingezoomd als het net te fijn is)
//   hoogtelijnen  bovenaanzicht: gloeiende hoogtelijnen op donker reliëf
//   luchtfoto   bovenaanzicht: luchtfoto met het model erover
//   luchtfoto3d 3D-blok met de luchtfoto erop gedrapeerd
//
// De luchtfoto komt van de open orthofotodiensten (Digitaal Vlaanderen, SPW Wallonie)
// in Lambert 72; hij wordt per project bewaard in <doelmap>/.luchtfoto/.
// PROEF=1 tekent klein en zonder supersampling (om projecten te kiezen).
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [lijstPad, doel, ...alleen] = process.argv.slice(2);
if (!lijstPad || !doel) {
  console.error("gebruik: node scripts/archief-beelden.mjs <lijst.json> <doelmap> [code …]");
  process.exit(1);
}
const PROEF = process.env.PROEF === "1";
const W = PROEF ? 800 : 1600, H = PROEF ? 500 : 1000, SS = PROEF ? 1 : 2;
const RW = W * SS, RH = H * SS;
const ALLE_WEERGAVEN = (process.env.WEERGAVEN || (PROEF ? "3d" : "3d,helling,net,hoogtelijnen,luchtfoto,luchtfoto3d")).split(",");

const STEEN = [12, 10, 9];
const GLOED = [41, 37, 36];
const AMBER = [245, 158, 11];

// ─── LandXML ─────────────────────────────────────────────────────────────
function leesLandXml(bestand, voorkeur, omgewisseld) {
  const t = fs.readFileSync(bestand, "utf8");
  let best = null;
  for (const b of t.matchAll(/<Surface\b([^>]*)>([\s\S]*?)<\/Surface>/g)) {
    const naam = (b[1].match(/name="([^"]*)"/) || [])[1] || "";
    const n = (b[2].match(/<F\b/g) || []).length;
    if (voorkeur ? naam === voorkeur : !best || n > best.n) best = { naam, n, body: b[2] };
  }
  if (!best) throw new Error("geen oppervlak gevonden");
  const ids = new Map();
  const xs = [], ys = [], zs = [];
  // LandXML: <P>noording oosting hoogte</P>
  for (const m of best.body.matchAll(/<P\b[^>]*\bid="([^"]+)"[^>]*>\s*([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)\s*<\/P>/g)) {
    ids.set(m[1], xs.length);
    const a = +m[2], b = +m[3];
    if (omgewisseld) { xs.push(a); ys.push(b); } else { ys.push(a); xs.push(b); }
    zs.push(+m[4]);
  }
  const f = [];
  for (const m of best.body.matchAll(/<F\b([^>]*)>\s*(\S+)\s+(\S+)\s+(\S+)\s*<\/F>/g)) {
    if (/\bi="1"/.test(m[1])) continue; // onzichtbaar vlak (gat)
    const a = ids.get(m[2]), b = ids.get(m[3]), c = ids.get(m[4]);
    if (a === undefined || b === undefined || c === undefined) continue;
    if (Math.abs(zs[a]) > 9000 || Math.abs(zs[b]) > 9000 || Math.abs(zs[c]) > 9000) continue;
    f.push(a, b, c);
  }
  return { naam: best.naam, x: Float64Array.from(xs), y: Float64Array.from(ys), z: Float64Array.from(zs), f: Uint32Array.from(f) };
}

// ─── Voorbereiding: draaien, overdrijven, normalen, wanden ───────────────
const klem = (v, a, b) => (v < a ? a : v > b ? b : v);
function percentiel(arr, p) {
  const s = Float64Array.from(arr).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))];
}

function bereid(m, opt) {
  const nV = m.x.length, nF = m.f.length / 3;
  const gebruikt = new Uint8Array(nV);
  for (const i of m.f) gebruikt[i] = 1;
  let cx = 0, cy = 0, n = 0;
  const zl = [];
  for (let i = 0; i < nV; i++) if (gebruikt[i]) { cx += m.x[i]; cy += m.y[i]; n++; zl.push(m.z[i]); }
  cx /= n; cy /= n;
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < nV; i++) if (gebruikt[i]) {
    const dx = m.x[i] - cx, dy = m.y[i] - cy;
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
  }
  // Lange as horizontaal; bij een bijna vierkant model blijft het noorden boven.
  let hoek = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const l1 = (sxx + syy) / 2 + Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
  const l2 = (sxx + syy) / 2 - Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
  if (Math.sqrt(l1 / Math.max(l2, 1e-9)) < 1.3) hoek = 0;
  if (typeof opt.draai === "number") hoek = (opt.draai * Math.PI) / 180;
  const cs = Math.cos(hoek), sn = Math.sin(hoek);
  const u = new Float64Array(nV), v = new Float64Array(nV);
  let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity, zmin = Infinity, zmax = -Infinity;
  for (let i = 0; i < nV; i++) {
    const dx = m.x[i] - cx, dy = m.y[i] - cy;
    u[i] = dx * cs + dy * sn;
    v[i] = -dx * sn + dy * cs;
    if (!gebruikt[i]) continue;
    umin = Math.min(umin, u[i]); umax = Math.max(umax, u[i]);
    vmin = Math.min(vmin, v[i]); vmax = Math.max(vmax, v[i]);
    zmin = Math.min(zmin, m.z[i]); zmax = Math.max(zmax, m.z[i]);
  }
  const z1 = percentiel(zl, 0.01), z99 = percentiel(zl, 0.99);
  const ext = Math.max(umax - umin, vmax - vmin);
  const zr = Math.max(z99 - z1, 0.05);
  const ov = opt.overdrijving ?? klem((0.1 * ext) / zr, 1, 5);
  const zmid = (zmin + zmax) / 2;
  const Z = new Float64Array(nV);
  for (let i = 0; i < nV; i++) Z[i] = (m.z[i] - zmid) * ov;

  // Vlaknormalen (overdreven ruimte, voor de schaduw) en echte helling.
  const fn = new Float64Array(nF * 3), opp = new Float64Array(nF), helling = new Float32Array(nF);
  for (let f = 0; f < nF; f++) {
    const a = m.f[3 * f], b = m.f[3 * f + 1], c = m.f[3 * f + 2];
    const e1x = u[b] - u[a], e1y = v[b] - v[a], e2x = u[c] - u[a], e2y = v[c] - v[a];
    let nx = e1y * (Z[c] - Z[a]) - (Z[b] - Z[a]) * e2y;
    let ny = (Z[b] - Z[a]) * e2x - e1x * (Z[c] - Z[a]);
    let nz = e1x * e2y - e1y * e2x;
    if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const l = Math.hypot(nx, ny, nz) || 1;
    fn[3 * f] = nx / l; fn[3 * f + 1] = ny / l; fn[3 * f + 2] = nz / l;
    opp[f] = l / 2;
    // echte helling (zonder overdrijving): tan = |grad z|
    const rx = e1y * (m.z[c] - m.z[a]) - (m.z[b] - m.z[a]) * e2y;
    const ry = (m.z[b] - m.z[a]) * e2x - e1x * (m.z[c] - m.z[a]);
    const rz = Math.abs(e1x * e2y - e1y * e2x) || 1e-9;
    helling[f] = (100 * Math.hypot(rx, ry)) / rz;
  }
  // Hoeknormalen met een knikhoek: zacht over terrein, scherp over een talud-rand.
  const graad = new Uint32Array(nV + 1);
  for (const i of m.f) graad[i + 1]++;
  for (let i = 0; i < nV; i++) graad[i + 1] += graad[i];
  const vul = graad.slice(0, nV), adj = new Uint32Array(m.f.length);
  for (let f = 0; f < nF; f++) for (let j = 0; j < 3; j++) adj[vul[m.f[3 * f + j]]++] = f;
  const KNIK = Math.cos((32 * Math.PI) / 180);
  const hn = new Float32Array(nF * 9);
  for (let f = 0; f < nF; f++)
    for (let j = 0; j < 3; j++) {
      const i = m.f[3 * f + j];
      let sx = 0, sy = 0, sz = 0;
      for (let q = graad[i]; q < graad[i + 1]; q++) {
        const g = adj[q];
        if (fn[3 * f] * fn[3 * g] + fn[3 * f + 1] * fn[3 * g + 1] + fn[3 * f + 2] * fn[3 * g + 2] < KNIK) continue;
        sx += fn[3 * g] * opp[g]; sy += fn[3 * g + 1] * opp[g]; sz += fn[3 * g + 2] * opp[g];
      }
      const l = Math.hypot(sx, sy, sz) || 1;
      hn[9 * f + 3 * j] = sx / l; hn[9 * f + 3 * j + 1] = sy / l; hn[9 * f + 3 * j + 2] = sz / l;
    }

  // Randen (ribben van één driehoek) → wanden van het blok.
  const ribben = new Map();
  for (let f = 0; f < nF; f++) {
    let a = m.f[3 * f], b = m.f[3 * f + 1], c = m.f[3 * f + 2];
    const s = (u[b] - u[a]) * (v[c] - v[a]) - (u[c] - u[a]) * (v[b] - v[a]);
    if (s < 0) [b, c] = [c, b]; // tegenwijzerzin
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      const k = p < q ? p * nV + q : q * nV + p;
      const r = ribben.get(k);
      if (r) r.n++; else ribben.set(k, { p, q, n: 1 });
    }
  }
  const rand = [];
  for (const r of ribben.values()) if (r.n === 1) rand.push(r.p, r.q);
  // Wanddikte: een vleugje van het model, maar nooit dikker dan een lang smal tracé breed is.
  const smal = Math.min(umax - umin, vmax - vmin);
  const zbodem = (zmin - zmid) * ov - Math.min(0.045 * ext, 0.14 * smal);

  return { m, nV, nF, u, v, Z, ov, zmid, zmin, zmax, z1, z99, ext, umin, umax, vmin, vmax, cx, cy, cs, sn, fn, hn, helling, rand, zbodem };
}

// ─── Kleuren ─────────────────────────────────────────────────────────────
const RAMP = [
  [0, [38, 84, 170]], [0.2, [24, 148, 178]], [0.4, [58, 168, 96]],
  [0.6, [206, 196, 72]], [0.8, [236, 138, 42]], [1, [214, 64, 52]],
];
function ramp(t) {
  t = klem(t, 0, 1);
  for (let i = 1; i < RAMP.length; i++)
    if (t <= RAMP[i][0]) {
      const [t0, a] = RAMP[i - 1], [t1, b] = RAMP[i];
      const s = (t - t0) / (t1 - t0);
      return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
    }
  return RAMP[RAMP.length - 1][1];
}
// Hellingsklassen (tan × 100): vlak … talud 3/2 … steil.
const HELLING = [
  [0.5, [37, 99, 235]], [2, [14, 165, 233]], [5, [16, 185, 129]], [10, [234, 179, 8]],
  [25, [249, 115, 22]], [67, [239, 68, 68]], [Infinity, [168, 85, 247]],
];
const hellingKleur = (p) => HELLING.find(([g]) => p < g)[1];
function interval(R) {
  for (const o of [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20]) if (R / o <= 42) return o;
  return 50;
}
// Licht van links-achter-boven (in het gedraaide kader: −u, +v, +z).
const L = (() => { const l = [-0.55, 0.38, 0.74], n = Math.hypot(...l); return l.map((x) => x / n); })();
const licht = (nx, ny, nz) => 0.36 + 0.64 * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);

// ─── Rasteraar ───────────────────────────────────────────────────────────
// Per pixel: driehoek-id (−1 = achtergrond), diepte, wereld-x/y, echte z, normaal.
function nieuwRaster() {
  const n = RW * RH;
  return {
    id: new Int32Array(n).fill(-1), d: new Float32Array(n).fill(Infinity),
    wx: new Float64Array(n), wy: new Float64Array(n), wz: new Float32Array(n),
    nx: new Float32Array(n), ny: new Float32Array(n), nz: new Float32Array(n),
  };
}
// P: schermpunten [x,y,w]×3; A: attributen [wx,wy,wz,nx,ny,nz]×3 (18 getallen).
function driehoek(R, P, id, A) {
  const [x0, y0, w0, x1, y1, w1, x2, y2, w2] = P;
  const opp = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  if (!(Math.abs(opp) > 1e-9) || !(w0 > 0 && w1 > 0 && w2 > 0)) return;
  const minx = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxx = Math.min(RW - 1, Math.ceil(Math.max(x0, x1, x2)));
  const miny = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxy = Math.min(RH - 1, Math.ceil(Math.max(y0, y1, y2)));
  const e = -1e-7;
  for (let py = miny; py <= maxy; py++) {
    const sy = py + 0.5;
    for (let px = minx; px <= maxx; px++) {
      const sx = px + 0.5;
      const l0 = ((x1 - sx) * (y2 - sy) - (x2 - sx) * (y1 - sy)) / opp;
      if (l0 < e) continue;
      const l1 = ((x2 - sx) * (y0 - sy) - (x0 - sx) * (y2 - sy)) / opp;
      if (l1 < e) continue;
      const l2 = 1 - l0 - l1;
      if (l2 < e) continue;
      const q0 = l0 / w0, q1 = l1 / w1, q2 = l2 / w2, s = q0 + q1 + q2, d = 1 / s;
      const k = py * RW + px;
      if (d >= R.d[k]) continue;
      R.d[k] = d; R.id[k] = id;
      const a0 = q0 / s, a1 = q1 / s, a2 = q2 / s;
      R.wx[k] = A[0] * a0 + A[6] * a1 + A[12] * a2;
      R.wy[k] = A[1] * a0 + A[7] * a1 + A[13] * a2;
      R.wz[k] = A[2] * a0 + A[8] * a1 + A[14] * a2;
      let nx = A[3] * a0 + A[9] * a1 + A[15] * a2, ny = A[4] * a0 + A[10] * a1 + A[16] * a2, nz = A[5] * a0 + A[11] * a1 + A[17] * a2;
      const l = Math.hypot(nx, ny, nz) || 1;
      R.nx[k] = nx / l; R.ny[k] = ny / l; R.nz[k] = nz / l;
    }
  }
}

// Camera's. Elke camera geeft proj(u, v, Z) → [x, y, w] in rasterpixels.
function perspectief(g, opt, zoom = 1, zoomMidden = null) {
  const az = ((opt.azimut ?? -28) * Math.PI) / 180, el = ((opt.hoogte ?? 34) * Math.PI) / 180;
  const um = (g.umin + g.umax) / 2, vm = (g.vmin + g.vmax) / 2;
  const R = Math.hypot(g.umax - g.umin, g.vmax - g.vmin) / 2;
  const dist = 2.6 * R;
  const dir = [Math.sin(az) * Math.cos(el), -Math.cos(az) * Math.cos(el), Math.sin(el)];
  const oog = [um + dir[0] * dist, vm + dir[1] * dist, dir[2] * dist];
  const f = [-dir[0], -dir[1], -dir[2]];
  let r = [f[1], -f[0], 0];
  const rl = Math.hypot(...r); r = r.map((x) => x / rl);
  const up = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const ruw = (u, v, z) => {
    const dx = u - oog[0], dy = v - oog[1], dz = z - oog[2];
    const w = dx * f[0] + dy * f[1] + dz * f[2];
    return [(dx * r[0] + dy * r[1] + dz * r[2]) / w, -(dx * up[0] + dy * up[1] + dz * up[2]) / w, w];
  };
  // Inpassen: alle hoekpunten bovenaan en onderaan het blok.
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < g.nV; i++) {
    for (const z of [g.Z[i], g.zbodem]) {
      const [x, y] = ruw(g.u[i], g.v[i], z);
      if (!Number.isFinite(x)) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  const k = Math.min((RW * 0.88) / (x1 - x0), (RH * 0.86) / (y1 - y0));
  let mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  if (zoomMidden) [mx, my] = ruw(...zoomMidden);
  const kz = k * zoom;
  return (u, v, z) => {
    const [x, y, w] = ruw(u, v, z);
    return [(x - mx) * kz + RW / 2, (y - my) * kz + RH / 2, w];
  };
}
// minBreedte (m): een kleine werf toont meer omgeving, anders is de luchtfoto te sterk uitvergroot.
function bovenaanzicht(g, minBreedte = 0) {
  const um = (g.umin + g.umax) / 2, vm = (g.vmin + g.vmax) / 2;
  const k = Math.min((RW * 0.86) / (g.umax - g.umin), (RH * 0.84) / (g.vmax - g.vmin), minBreedte ? RW / minBreedte : Infinity);
  const proj = (u, v, z) => [(u - um) * k + RW / 2, -(v - vm) * k + RH / 2, 1e6 - z];
  // terug van pixel naar wereld (voor de luchtfoto)
  const terug = (px, py) => {
    const u = (px - RW / 2) / k + um, v = -(py - RH / 2) / k + vm;
    return [g.cx + u * g.cs - v * g.sn, g.cy + u * g.sn + v * g.cs];
  };
  return { proj, terug, k };
}

function tekenModel(g, proj, metWanden = true) {
  const R = nieuwRaster();
  const { m } = g;
  const P = new Float64Array(9), A = new Float64Array(18);
  for (let f = 0; f < g.nF; f++) {
    for (let j = 0; j < 3; j++) {
      const i = m.f[3 * f + j];
      const p = proj(g.u[i], g.v[i], g.Z[i]);
      P[3 * j] = p[0]; P[3 * j + 1] = p[1]; P[3 * j + 2] = p[2];
      A[6 * j] = m.x[i]; A[6 * j + 1] = m.y[i]; A[6 * j + 2] = m.z[i];
      A[6 * j + 3] = g.hn[9 * f + 3 * j]; A[6 * j + 4] = g.hn[9 * f + 3 * j + 1]; A[6 * j + 5] = g.hn[9 * f + 3 * j + 2];
    }
    driehoek(R, P, f, A);
  }
  if (metWanden) {
    const zb = g.zbodem / g.ov + g.zmid; // echte hoogte van de bodem
    for (let w = 0; w < g.rand.length; w += 2) {
      const a = g.rand[w], b = g.rand[w + 1];
      const du = g.u[b] - g.u[a], dv = g.v[b] - g.v[a], l = Math.hypot(du, dv) || 1;
      const n = [dv / l, -du / l, 0]; // naar buiten
      const hoeken = [
        [a, g.Z[a], m.z[a]], [b, g.Z[b], m.z[b]], [b, g.zbodem, zb], [a, g.zbodem, zb],
      ];
      const pp = hoeken.map(([i, Z]) => proj(g.u[i], g.v[i], Z));
      const at = hoeken.map(([i, , z]) => [m.x[i], m.y[i], z, ...n]);
      for (const [p, q, r] of [[0, 1, 2], [0, 2, 3]]) {
        driehoek(R, [...pp[p], ...pp[q], ...pp[r]], g.nF + w / 2, [...at[p], ...at[q], ...at[r]]);
      }
    }
  }
  return R;
}

// ─── Luchtfoto (WMS, Lambert 72) ─────────────────────────────────────────
const DIENSTEN = [
  { naam: "vl", url: "https://geo.api.vlaanderen.be/OMWRGBMRVL/wms", laag: "Ortho" },
  { naam: "wa", url: "https://geoservices.wallonie.be/arcgis/services/IMAGERIE/ORTHO_LAST/MapServer/WMSServer", laag: "0" },
];
// Diensten leveren hoogstens 2048 px per kant (Vlaanderen): grotere beelden in tegels.
const TEGEL = 2000;
async function haalTegels(d, box, bw, bh) {
  const [x0, y0, x1, y1] = box;
  const nx = Math.ceil(bw / TEGEL), ny = Math.ceil(bh / TEGEL);
  const lagen = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const px0 = Math.round((i * bw) / nx), px1 = Math.round(((i + 1) * bw) / nx);
      const py0 = Math.round((j * bh) / ny), py1 = Math.round(((j + 1) * bh) / ny);
      const tb = [x0 + ((x1 - x0) * px0) / bw, y1 - ((y1 - y0) * py1) / bh, x0 + ((x1 - x0) * px1) / bw, y1 - ((y1 - y0) * py0) / bh];
      const url = `${d.url}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${d.laag}&STYLES=&CRS=EPSG:31370&BBOX=${tb.map((x) => x.toFixed(3)).join(",")}&WIDTH=${px1 - px0}&HEIGHT=${py1 - py0}&FORMAT=image/jpeg`;
      const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || !ct.startsWith("image/")) throw new Error(`${r.status} ${ct}`);
      lagen.push({ input: Buffer.from(await r.arrayBuffer()), left: px0, top: py0 });
    }
  return sharp({ create: { width: bw, height: bh, channels: 3, background: "#000" } }).composite(lagen).jpeg({ quality: 92 }).toBuffer();
}
async function haalLuchtfoto(code, box) {
  // Buffer buiten public/: deze foto's gaan nooit mee online.
  const map = path.join(path.dirname(path.resolve(lijstPad)), "_luchtfoto");
  fs.mkdirSync(map, { recursive: true });
  const bestand = path.join(map, `${code}.jpg`), meta = path.join(map, `${code}.json`);
  if (fs.existsSync(bestand) && fs.existsSync(meta)) {
    const j = JSON.parse(fs.readFileSync(meta, "utf8"));
    if (j.box.join() === box.join()) return { ...(await laadFoto(bestand)), box };
  }
  const [x0, y0, x1, y1] = box;
  const res = Math.max(0.15, Math.max(x1 - x0, y1 - y0) / 3600);
  const bw = Math.round((x1 - x0) / res), bh = Math.round((y1 - y0) / res);
  for (const d of DIENSTEN) {
    try {
      const buf = await haalTegels(d, box, bw, bh);
      const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      // Buiten het gewest levert een dienst een wit of zwart vlak.
      let leeg = 0;
      for (let i = 0; i < data.length; i += 3 * 7) {
        const s = data[i] + data[i + 1] + data[i + 2];
        if (s > 740 || s < 6) leeg++;
      }
      if (leeg / (data.length / 21) > 0.35) { console.log(`  luchtfoto ${d.naam}: leeg`); continue; }
      fs.writeFileSync(bestand, buf);
      fs.writeFileSync(meta, JSON.stringify({ box, dienst: d.naam }));
      console.log(`  luchtfoto ${d.naam}: ${info.width}×${info.height}`);
      return { data, w: info.width, h: info.height, box };
    } catch (e) {
      console.log(`  luchtfoto ${d.naam}: ${e.message}`);
    }
  }
  return null;
}
async function laadFoto(bestand) {
  const { data, info } = await sharp(bestand).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
function fotoPixel(F, x, y, uit) {
  const [x0, y0, x1, y1] = F.box;
  let fx = ((x - x0) / (x1 - x0)) * F.w - 0.5, fy = ((y1 - y) / (y1 - y0)) * F.h - 0.5;
  fx = klem(fx, 0, F.w - 1.001); fy = klem(fy, 0, F.h - 1.001);
  const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const k00 = (iy * F.w + ix) * 3, k10 = k00 + 3, k01 = k00 + F.w * 3, k11 = k01 + 3;
  for (let c = 0; c < 3; c++) {
    const a = F.data[k00 + c] * (1 - tx) + F.data[k10 + c] * tx;
    const b = F.data[k01 + c] * (1 - tx) + F.data[k11 + c] * tx;
    uit[c] = a * (1 - ty) + b * ty;
  }
  return uit;
}

// ─── Kleuren per pixel ───────────────────────────────────────────────────
function achtergrond(img) {
  for (let py = 0; py < RH; py++)
    for (let px = 0; px < RW; px++) {
      const dx = (px - RW / 2) / (RW * 0.6), dy = (py - RH * 0.48) / (RH * 0.7);
      const t = Math.max(0, 1 - Math.hypot(dx, dy)) ** 1.6 * 0.85;
      const k = (py * RW + px) * 3;
      for (let c = 0; c < 3; c++) img[k + c] = STEEN[c] + (GLOED[c] - STEEN[c]) * t;
    }
}
// Lijnmasker van hoogtelijnen: 1 = gewone lijn, 2 = hoofdlijn (elke vijfde).
function hoogtelijnen(R, nF, iv, dik = 1) {
  const n = RW * RH, lm = new Uint8Array(n);
  const band = (k) => Math.floor(R.wz[k] / iv);
  for (let py = 0; py < RH - 1; py++)
    for (let px = 0; px < RW - 1; px++) {
      const k = py * RW + px;
      if (R.id[k] < 0 || R.id[k] >= nF) continue;
      for (const q of [k + 1, k + RW]) {
        if (R.id[q] < 0 || R.id[q] >= nF) continue;
        const a = band(k), b = band(q);
        if (a === b) continue;
        const hoofd = Math.floor(Math.max(a, b) / 5) !== Math.floor(Math.min(a, b) / 5) || Math.max(a, b) % 5 === 0;
        lm[k] = Math.max(lm[k], hoofd ? 2 : 1);
      }
    }
  if (dik > 1) verdik(lm, 2);
  return lm;
}
function verdik(lm, waarde) {
  const kopie = lm.slice();
  for (let k = RW; k < lm.length - RW; k++)
    if (kopie[k] === waarde) for (const q of [k - 1, k + 1, k - RW, k + RW]) lm[q] = Math.max(lm[q], waarde);
}
function meng(img, k, kleur, a) {
  for (let c = 0; c < 3; c++) img[k + c] = img[k + c] * (1 - a) + kleur[c] * a;
}
// Lichte rand waar het oppervlak ophoudt (naar wand of achtergrond).
function randLicht(img, R, nF, kleur, a) {
  for (let k = RW; k < RW * RH - RW; k++) {
    if (R.id[k] < 0 || R.id[k] >= nF) continue;
    if ([k - 1, k + 1, k - RW, k + RW].some((q) => R.id[q] < 0 || R.id[q] >= nF)) meng(img, k * 3, kleur, a);
  }
}
function wandKleur(R, k, g, uit) {
  const t = klem((R.wz[k] - (g.zbodem / g.ov + g.zmid)) / Math.max(1e-6, g.zmin - (g.zbodem / g.ov + g.zmid)), 0, 1.4);
  const s = 0.62 + 0.38 * Math.max(0, R.nx[k] * L[0] + R.ny[k] * L[1]) + 0.12;
  const strook = Math.floor(t * 5) % 2 ? 0.92 : 1;
  const basis = [70 + 30 * t, 54 + 22 * t, 42 + 14 * t];
  for (let c = 0; c < 3; c++) uit[c] = basis[c] * s * strook;
  return uit;
}

async function bewaar(img, bestand) {
  await sharp(Buffer.from(img), { raw: { width: RW, height: RH, channels: 3 } })
    .resize(W, H, { kernel: "lanczos3" })
    .webp({ quality: 86, effort: 5 })
    .toFile(bestand);
}
function klaarBuffer() {
  const img = new Float32Array(RW * RH * 3);
  achtergrond(img);
  return img;
}
const naarBytes = (img) => Uint8ClampedArray.from(img);

// ─── Weergaven ───────────────────────────────────────────────────────────
async function maak(p) {
  // Per project: enkel de weergaven die iets tonen (een vlak platform heeft geen hellingskaart nodig).
  const WEERGAVEN = ALLE_WEERGAVEN.filter((w) => !p.weergaven || p.weergaven.includes(w));
  const t0 = Date.now();
  const m = leesLandXml(p.bron, p.oppervlak, p.omgewisseld);
  const g = bereid(m, p);
  const iv = p.interval ?? interval(g.z99 - g.z1);
  console.log(`${p.code}: ${g.nF} driehoeken, ${Math.round(g.umax - g.umin)}×${Math.round(g.vmax - g.vmin)} m, z ${g.zmin.toFixed(1)}–${g.zmax.toFixed(1)}, ×${g.ov.toFixed(1)}, lijnen ${iv} m`);
  const uit = (w) => path.join(doel, `${p.code}-${w}.webp`);
  const tz = (z) => (z - g.z1) / Math.max(1e-6, g.z99 - g.z1);
  const kl = [0, 0, 0];

  // Driehoeksnet leesbaar houden: is de mediane ribbe op beeld korter dan 11 px, dan inzoomen.
  if (WEERGAVEN.includes("net") && p.netZoom === undefined) {
    const proj = perspectief(g, p, p.zoom3d ?? 1, p.midden3d ?? null);
    const l = [];
    for (let f = 0; f < g.nF; f += Math.max(1, Math.floor(g.nF / 4000))) {
      const a = g.m.f[3 * f], b = g.m.f[3 * f + 1];
      const pa = proj(g.u[a], g.v[a], g.Z[a]), pb = proj(g.u[b], g.v[b], g.Z[b]);
      l.push(Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) / SS);
    }
    const med = percentiel(l, 0.5) * (PROEF ? 2 : 1);
    const z = klem(11 / Math.max(med, 0.1), 1, 2.2) * (p.zoom3d ?? 1);
    if (z > (p.zoom3d ?? 1) * 1.15) p = { ...p, netZoom: z };
  }

  const nodig3d = WEERGAVEN.some((w) => ["3d", "helling", "luchtfoto3d"].includes(w)) || (WEERGAVEN.includes("net") && !p.netZoom);
  const boven = WEERGAVEN.includes("hoogtelijnen") ? bovenaanzicht(g) : null;
  const bovenFoto = WEERGAVEN.some((w) => w.startsWith("luchtfoto")) ? bovenaanzicht(g, 220) : null;

  // Luchtfoto voor het hele bovenaanzicht (dekt ook het 3D-blok).
  let foto = null;
  if (WEERGAVEN.some((w) => w.startsWith("luchtfoto"))) {
    const bb = bovenFoto;
    const hoeken = [[0, 0], [RW, 0], [0, RH], [RW, RH]].map(([x, y]) => bb.terug(x, y));
    const xs = hoeken.map((h) => h[0]), ys = hoeken.map((h) => h[1]);
    const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map((x) => Math.round(x));
    foto = await haalLuchtfoto(p.code, box);
  }

  if (nodig3d) {
    // Lange tracés: inzoomen op een stuk (zoom3d, midden3d = [u, v, Z] in het gedraaide kader).
    const R = tekenModel(g, perspectief(g, p, p.zoom3d ?? 1, p.midden3d ?? null));
    const lm = hoogtelijnen(R, g.nF, iv);
    for (const w of ["3d", "helling", "luchtfoto3d"]) {
      if (!WEERGAVEN.includes(w) || (w === "luchtfoto3d" && !foto)) continue;
      const img = klaarBuffer();
      for (let k = 0; k < RW * RH; k++) {
        const id = R.id[k];
        if (id < 0) continue;
        const o = k * 3;
        if (id >= g.nF) { wandKleur(R, k, g, kl); img[o] = kl[0]; img[o + 1] = kl[1]; img[o + 2] = kl[2]; continue; }
        const s = licht(R.nx[k], R.ny[k], R.nz[k]);
        let c;
        if (w === "3d") c = ramp(tz(R.wz[k]));
        else if (w === "helling") c = hellingKleur(g.helling[id]);
        else c = fotoPixel(foto, R.wx[k], R.wy[k], kl).slice();
        const sterk = w === "luchtfoto3d" ? 0.55 + 0.5 * s : s;
        for (let j = 0; j < 3; j++) img[o + j] = Math.min(255, c[j] * sterk);
        if (lm[k] && w !== "helling") meng(img, o, w === "luchtfoto3d" ? [255, 255, 255] : [12, 10, 9], lm[k] === 2 ? (w === "3d" ? 0.5 : 0.35) : w === "3d" ? 0.22 : 0);
      }
      randLicht(img, R, g.nF, [250, 250, 249], 0.55);
      await bewaar(naarBytes(img), uit(w));
    }
    if (WEERGAVEN.includes("net") && !p.netZoom) await maakNet(g, R, uit("net"));
  }
  if (WEERGAVEN.includes("net") && p.netZoom) {
    const mid = p.netMidden ?? p.midden3d ?? [(g.umin + g.umax) / 2, (g.vmin + g.vmax) / 2, 0];
    const R = tekenModel(g, perspectief(g, p, p.netZoom, mid));
    await maakNet(g, R, uit("net"));
  }

  if (boven) {
    const R = tekenModel(g, boven.proj, false);
    if (WEERGAVEN.includes("hoogtelijnen")) {
      const lm = hoogtelijnen(R, g.nF, iv, 2);
      const img = klaarBuffer();
      for (let k = 0; k < RW * RH; k++) {
        if (R.id[k] < 0) continue;
        const o = k * 3, s = licht(R.nx[k], R.ny[k], R.nz[k]);
        const c = ramp(tz(R.wz[k]));
        // Licht genoeg dat de kaartenmaker het reliëf als model herkent (helderheid > 72).
        for (let j = 0; j < 3; j++) img[o + j] = 20 + 80 * s * (0.78 + 0.22 * (c[j] / 255));
        if (lm[k] === 1) meng(img, o, c, 0.7);
        if (lm[k] === 2) meng(img, o, c.map((x) => x + (255 - x) * 0.35), 1);
      }
      randLicht(img, R, g.nF, AMBER, 0.6);
      await bewaar(naarBytes(img), uit("hoogtelijnen"));
    }
  }
  if (WEERGAVEN.includes("luchtfoto") && foto) {
    const boven = bovenFoto;
    const R = tekenModel(g, boven.proj, false);
    {
      const lm = hoogtelijnen(R, g.nF, iv, 2);
      const img = new Float32Array(RW * RH * 3);
      for (let py = 0; py < RH; py++)
        for (let px = 0; px < RW; px++) {
          const k = py * RW + px, o = k * 3;
          const [x, y] = boven.terug(px + 0.5, py + 0.5);
          const f = fotoPixel(foto, x, y, kl);
          if (R.id[k] < 0) {
            // Omgeving: gedempt en iets ontkleurd, zodat het model eruit springt.
            const grijs = (f[0] + f[1] + f[2]) / 3;
            for (let j = 0; j < 3; j++) img[o + j] = (f[j] * 0.75 + grijs * 0.25) * 0.58;
            continue;
          }
          const c = ramp(tz(R.wz[k]));
          const s = licht(R.nx[k], R.ny[k], R.nz[k]);
          for (let j = 0; j < 3; j++) img[o + j] = Math.min(255, f[j] * 0.68 * (0.75 + 0.35 * s) + c[j] * 0.3);
          if (lm[k] === 1) meng(img, o, [255, 255, 255], 0.32);
          if (lm[k] === 2) meng(img, o, [255, 255, 255], 0.7);
        }
      randLicht(img, R, g.nF, AMBER, 0.95);
      await bewaar(naarBytes(img), uit("luchtfoto"));
    }
  }
  console.log(`  klaar in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

async function maakNet(g, R, bestand) {
  const img = klaarBuffer();
  const lm = new Uint8Array(RW * RH);
  for (let k = 0; k < RW * RH - RW - 1; k++) {
    const id = R.id[k];
    if (id < 0 || id >= g.nF) continue;
    for (const q of [k + 1, k + RW]) if (R.id[q] !== id && R.id[q] >= 0 && R.id[q] < g.nF) lm[k] = 1;
  }
  if (SS > 1) verdik(lm, 1);
  const kl = [0, 0, 0];
  for (let k = 0; k < RW * RH; k++) {
    const id = R.id[k];
    if (id < 0) continue;
    const o = k * 3;
    if (id >= g.nF) { wandKleur(R, k, g, kl); for (let j = 0; j < 3; j++) img[o + j] = kl[j] * 0.8; continue; }
    const s = licht(R.nx[k], R.ny[k], R.nz[k]);
    const c = ramp((R.wz[k] - g.z1) / Math.max(1e-6, g.z99 - g.z1));
    for (let j = 0; j < 3; j++) img[o + j] = (30 + [0, 6, 16][j] + c[j] * 0.16) * (0.5 + 0.9 * s);
    if (lm[k]) meng(img, o, AMBER, 0.92);
  }
  randLicht(img, R, g.nF, [250, 250, 249], 0.5);
  await bewaar(naarBytes(img), bestand);
}

// ─── Hoofd ───────────────────────────────────────────────────────────────
const lijst = JSON.parse(fs.readFileSync(lijstPad, "utf8")).filter((p) => !alleen.length || alleen.includes(p.code));
fs.mkdirSync(doel, { recursive: true });
for (const p of lijst) {
  try {
    await maak(p);
  } catch (e) {
    console.log(`${p.code}: FOUT ${e.message}`);
  }
}
