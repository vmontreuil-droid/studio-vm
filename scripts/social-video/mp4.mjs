// MP4 schrijven en nalezen, zonder ffmpeg.
//
// muxH264(): zet H.264-stukken (uit WebCodecs, AVCC-vorm) in een gewoon
// MP4-bestand met één videospoor. "faststart": de inhoudstafel (moov) staat
// vóór de beelddata (mdat), zoals Instagram en Facebook het vragen. Geen
// B-frames (de tijdstempels moeten oplopen), dus geen ctts nodig.
//
// leesMp4(): leest de doos-structuur van elk MP4-bestand (ook dat van ffmpeg)
// en geeft duur, afmetingen, codecs, beelden per seconde en de volgorde van
// moov/mdat. Zo controleert het script elke video vóór hij opgeladen wordt.

const VIDEO_TIJDSCHAAL_PER_BEELD = 512; // zoals ffmpeg: 30 fps → 15360

function u8(n) {
  const b = Buffer.alloc(1);
  b.writeUInt8(n);
  return b;
}
function u16(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(n);
  return b;
}
function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}
function nullen(n) {
  return Buffer.alloc(n);
}
function doos(type, ...delen) {
  const inhoud = Buffer.concat(delen);
  return Buffer.concat([u32(8 + inhoud.length), Buffer.from(type, "latin1"), inhoud]);
}
function volleDoos(type, versie, vlaggen, ...delen) {
  return doos(type, u8(versie), Buffer.from([(vlaggen >> 16) & 255, (vlaggen >> 8) & 255, vlaggen & 255]), ...delen);
}
// Eenheidsmatrix (16.16 / 2.30 vast punt).
const MATRIX = Buffer.concat([0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000].map(u32));

// WebCodecs-kleurnamen → codes uit ISO/IEC 23091-2 (voor de colr-doos).
const PRIMAIREN = { bt709: 1, bt470bg: 5, smpte170m: 6, bt2020: 9, smpte432: 12 };
const OVERDRACHT = { bt709: 1, smpte170m: 6, "iec61966-2-1": 13, linear: 8, pq: 16, hlg: 18 };
const MATRIXCODE = { rgb: 0, bt709: 1, bt470bg: 5, smpte170m: 6, "bt2020-ncl": 9 };

/**
 * @param {{ breedte: number, hoogte: number, fps: number, avcC: Uint8Array,
 *           stukken: Array<{ data: Uint8Array, sleutel: boolean }>,
 *           kleur?: { primaries?: string, transfer?: string, matrix?: string, fullRange?: boolean } | null }} v
 * @returns {Buffer}
 */
export function muxH264({ breedte, hoogte, fps, avcC, stukken, kleur }) {
  if (!stukken.length) throw new Error("geen beelden om te schrijven");
  if (!stukken[0].sleutel) throw new Error("het eerste beeld is geen sleutelbeeld");
  const n = stukken.length;
  const tijdschaal = Math.round(fps * VIDEO_TIJDSCHAAL_PER_BEELD);
  const mediaDuur = n * VIDEO_TIJDSCHAAL_PER_BEELD;
  const filmDuur = Math.round((n * 1000) / fps);

  const ftyp = doos("ftyp", Buffer.from("isom", "latin1"), u32(512), Buffer.from("isomiso2avc1mp41", "latin1"));

  const kleurDoos = kleur
    ? doos(
        "colr",
        Buffer.from("nclx", "latin1"),
        u16(PRIMAIREN[kleur.primaries] ?? 2),
        u16(OVERDRACHT[kleur.transfer] ?? 2),
        u16(MATRIXCODE[kleur.matrix] ?? 2),
        u8(kleur.fullRange ? 0x80 : 0),
      )
    : Buffer.alloc(0);

  const avc1 = doos(
    "avc1",
    nullen(6),
    u16(1), // data_reference_index
    nullen(16), // pre_defined + reserved + pre_defined[3]
    u16(breedte),
    u16(hoogte),
    u32(0x00480000), // 72 dpi
    u32(0x00480000),
    u32(0),
    u16(1), // frame_count
    nullen(32), // compressorname
    u16(0x0018), // depth
    Buffer.from([0xff, 0xff]), // pre_defined = -1
    doos("avcC", Buffer.from(avcC)),
    kleurDoos,
    doos("pasp", u32(1), u32(1)),
  );

  const sleutels = [];
  stukken.forEach((s, i) => s.sleutel && sleutels.push(i + 1));

  const bouwMoov = (offset) =>
    doos(
      "moov",
      volleDoos(
        "mvhd",
        0,
        0,
        u32(0),
        u32(0),
        u32(1000),
        u32(filmDuur),
        u32(0x00010000), // rate 1.0
        u16(0x0100), // volume 1.0
        nullen(10),
        MATRIX,
        nullen(24),
        u32(2), // next_track_ID
      ),
      doos(
        "trak",
        volleDoos(
          "tkhd",
          0,
          0x000003, // track_enabled | track_in_movie
          u32(0),
          u32(0),
          u32(1), // track_ID
          u32(0),
          u32(filmDuur),
          nullen(8),
          u16(0), // layer
          u16(0), // alternate_group
          u16(0), // volume (video)
          u16(0),
          MATRIX,
          u32(breedte * 0x10000),
          u32(hoogte * 0x10000),
        ),
        doos(
          "mdia",
          volleDoos("mdhd", 0, 0, u32(0), u32(0), u32(tijdschaal), u32(mediaDuur), u16(0x55c4) /* "und" */, u16(0)),
          volleDoos("hdlr", 0, 0, u32(0), Buffer.from("vide", "latin1"), nullen(12), Buffer.from("VideoHandler\0", "latin1")),
          doos(
            "minf",
            volleDoos("vmhd", 0, 1, u16(0), nullen(6)),
            doos("dinf", volleDoos("dref", 0, 0, u32(1), volleDoos("url ", 0, 1))),
            doos(
              "stbl",
              volleDoos("stsd", 0, 0, u32(1), avc1),
              volleDoos("stts", 0, 0, u32(1), u32(n), u32(VIDEO_TIJDSCHAAL_PER_BEELD)),
              volleDoos("stss", 0, 0, u32(sleutels.length), ...sleutels.map(u32)),
              volleDoos("stsc", 0, 0, u32(1), u32(1), u32(n), u32(1)),
              volleDoos("stsz", 0, 0, u32(0), u32(n), ...stukken.map((s) => u32(s.data.length))),
              volleDoos("stco", 0, 0, u32(1), u32(offset)),
            ),
          ),
        ),
      ),
    );

  // De grootte van moov hangt niet af van de offset: eerst meten, dan invullen.
  const proef = bouwMoov(0);
  const offset = ftyp.length + proef.length + 8;
  const moov = bouwMoov(offset);
  const data = Buffer.concat(stukken.map((s) => Buffer.from(s.data.buffer, s.data.byteOffset, s.data.byteLength)));
  if (8 + data.length > 0xffffffff) throw new Error("video te groot voor één mdat-doos");
  return Buffer.concat([ftyp, moov, u32(8 + data.length), Buffer.from("mdat", "latin1"), data]);
}

// ---------------------------------------------------------------------------
// Nalezen
// ---------------------------------------------------------------------------

function* dozen(buf, van, tot) {
  let o = van;
  while (o + 8 <= tot) {
    let grootte = buf.readUInt32BE(o);
    const type = buf.toString("latin1", o + 4, o + 8);
    let kop = 8;
    if (grootte === 1) {
      grootte = Number(buf.readBigUInt64BE(o + 8));
      kop = 16;
    } else if (grootte === 0) {
      grootte = tot - o;
    }
    if (grootte < kop || o + grootte > tot) throw new Error(`kapotte MP4-doos "${type}" op ${o}`);
    yield { type, begin: o + kop, eind: o + grootte };
    o += grootte;
  }
}

function kind(buf, ouder, type) {
  for (const d of dozen(buf, ouder.begin, ouder.eind)) if (d.type === type) return d;
  return null;
}

function pad(buf, ouder, ...typen) {
  let d = ouder;
  for (const t of typen) {
    d = d && kind(buf, d, t);
    if (!d) return null;
  }
  return d;
}

/** Tijdschaal en duur uit een mvhd- of mdhd-doos (versie 0 of 1). */
function tijd(buf, d) {
  const versie = buf.readUInt8(d.begin);
  if (versie === 1) return { schaal: buf.readUInt32BE(d.begin + 20), duur: Number(buf.readBigUInt64BE(d.begin + 24)) };
  return { schaal: buf.readUInt32BE(d.begin + 12), duur: buf.readUInt32BE(d.begin + 16) };
}

/**
 * Leest de structuur van een MP4.
 * @param {Buffer} buf
 */
export function leesMp4(buf) {
  const top = [...dozen(buf, 0, buf.length)];
  const volgorde = top.map((d) => d.type);
  const moov = top.find((d) => d.type === "moov");
  if (!moov) throw new Error("geen moov-doos: geen geldig MP4-bestand");
  const mvhd = kind(buf, moov, "mvhd");
  const film = mvhd ? tijd(buf, mvhd) : { schaal: 1, duur: 0 };
  const sporen = [];
  for (const d of dozen(buf, moov.begin, moov.eind)) {
    if (d.type !== "trak") continue;
    const tkhd = kind(buf, d, "tkhd");
    const hdlr = pad(buf, d, "mdia", "hdlr");
    const mdhd = pad(buf, d, "mdia", "mdhd");
    const stsd = pad(buf, d, "mdia", "minf", "stbl", "stsd");
    const stsz = pad(buf, d, "mdia", "minf", "stbl", "stsz");
    const versie = tkhd ? buf.readUInt8(tkhd.begin) : 0;
    const bOff = tkhd ? (versie === 1 ? tkhd.begin + 88 : tkhd.begin + 76) : 0;
    const media = mdhd ? tijd(buf, mdhd) : { schaal: 1, duur: 0 };
    const beelden = stsz ? buf.readUInt32BE(stsz.begin + 8) : 0;
    sporen.push({
      soort: hdlr ? buf.toString("latin1", hdlr.begin + 8, hdlr.begin + 12) : "?",
      codec: stsd ? buf.toString("latin1", stsd.begin + 12, stsd.begin + 16) : "?",
      breedte: tkhd ? buf.readUInt32BE(bOff) / 0x10000 : 0,
      hoogte: tkhd ? buf.readUInt32BE(bOff + 4) / 0x10000 : 0,
      duur: media.duur / media.schaal,
      beelden,
    });
  }
  const video = sporen.find((s) => s.soort === "vide") ?? null;
  const audio = sporen.find((s) => s.soort === "soun") ?? null;
  return {
    bytes: buf.length,
    volgorde,
    faststart: volgorde.indexOf("moov") >= 0 && volgorde.indexOf("moov") < volgorde.indexOf("mdat"),
    duur: film.duur / film.schaal,
    video: video && { ...video, fps: video.duur ? video.beelden / video.duur : 0 },
    audio,
  };
}
