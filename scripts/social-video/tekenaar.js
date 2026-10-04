/* global FontFace, VideoEncoder, VideoFrame */
// Tekenaar voor scripts/social-video.mjs. Draait IN de browser (Playwright),
// niet in Node: tekent elk beeld van de video op een canvas van 1080×1920.
//
// Huisstijl zoals de merkkaart (src/lib/social/merkkaart.tsx, formaat
// "story"): steen #0c0a09 met een zachte gloed achter het model, Montserrat
// ExtraBold, amber #f59e0b, het woordmerk "vm." met een amber punt.
//
// Veilige zones voor Reels, Shorts en TikTok: niets leesbaars in de bovenste
// ±260 px (knoppen) en de onderste ±400 px (bijschrift), en de tekst blijft
// links van de knoppenrij rechts (kolom x 80–900).
//
// Elk beeld hangt enkel af van zijn tijdstip t (geen klok): dezelfde invoer
// geeft altijd dezelfde video, beeld per beeld.

(() => {
  const STEEN = "#0c0a09";
  const WIT = "#fafaf9";
  const ZACHT = "#e7e5e4";
  const GRIJS = "#a8a29e";
  const AMBER = "#f59e0b";
  const steen = (a) => `rgba(12,10,9,${a})`;

  // Montserrat (hhea): stijghoogte 968, daalhoogte 251 per 1000.
  const STIJG = 0.968;
  const DAAL = 0.251;

  const klem = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const glad = (x) => {
    const t = klem(x);
    return t * t * (3 - 2 * t);
  };
  const golf = (x) => 0.5 - 0.5 * Math.cos(Math.PI * klem(x));
  const lerp = (a, b, u) => a + (b - a) * u;

  /** Basislijn van een tekstregel in een regelvak (zoals CSS line-height). */
  const basislijn = (vakBoven, px, regelhoogte) => vakBoven + (px * regelhoogte - px * (STIJG + DAAL)) / 2 + STIJG * px;

  function laadBeeld(src) {
    return new Promise((ok, nee) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => nee(new Error("bronbeeld niet geladen"));
      i.src = src;
    });
  }

  async function maakTekenaar(cfg) {
    const { w: W, h: H, zone } = cfg;
    for (const [gewicht, url] of Object.entries(cfg.lettertypen)) {
      const f = new FontFace("Montserrat", `url(${url})`, { weight: gewicht, style: "normal" });
      await f.load();
      document.fonts.add(f);
    }
    await document.fonts.ready;
    const beelden = await Promise.all(cfg.beelden.map((b) => laadBeeld(b.src)));

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    document.body.appendChild(canvas);
    const g = canvas.getContext("2d", { alpha: false });
    const hulp = document.createElement("canvas");
    hulp.width = W;
    hulp.height = H;
    const gh = hulp.getContext("2d", { alpha: false });

    // ── Vaste lagen: achtergrond met gloed, verloop voor leesbaarheid ─────
    const achter = document.createElement("canvas");
    achter.width = W;
    achter.height = H;
    {
      const a = achter.getContext("2d");
      a.fillStyle = STEEN;
      a.fillRect(0, 0, W, H);
      const cx = zone.x + zone.w / 2;
      const cy = zone.y + zone.h / 2;
      const r = Math.max(zone.w, zone.h) * 0.66;
      const gl = a.createRadialGradient(cx, cy, 0, cx, cy, r);
      // (1 − d)² · 0,85 van steen naar #292524, zoals de merkkaart.
      for (const d of [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]) {
        const t = (1 - d) * (1 - d) * 0.85;
        gl.addColorStop(d, `rgb(${Math.round(12 + 29 * t)},${Math.round(10 + 27 * t)},${Math.round(9 + 27 * t)})`);
      }
      a.fillStyle = gl;
      a.fillRect(0, 0, W, H);
    }
    const verloop = document.createElement("canvas");
    verloop.width = W;
    verloop.height = H;
    {
      const v = verloop.getContext("2d");
      const l = v.createLinearGradient(0, 0, 0, H);
      l.addColorStop(0, steen(0.88));
      l.addColorStop(0.11, steen(0.5));
      l.addColorStop(0.2, steen(0));
      l.addColorStop(0.56, steen(0));
      l.addColorStop(0.64, steen(0.78));
      l.addColorStop(0.72, steen(0.95));
      l.addColorStop(1, steen(1));
      v.fillStyle = l;
      v.fillRect(0, 0, W, H);
    }

    // ── Tekst zetten ──────────────────────────────────────────────────────
    const font = (gewicht, px) => `${gewicht} ${px}px Montserrat`;
    const meet = (ctx, tekst, gewicht, px, spatiering) => {
      ctx.font = font(gewicht, px);
      ctx.letterSpacing = `${spatiering}px`;
      return ctx.measureText(tekst).width;
    };
    /** Regels binnen `kolom`, zo gelijk mogelijk lang. null = past niet in `max` regels. */
    const zet = (tekst, gewicht, px, spatiering, kolom, max) => {
      // Vaste spatie vóór ? ! : ; » en na «, en tussen "modèle(s)" en "3D":
      // die mogen nooit alleen op een nieuwe regel belanden.
      const ws = tekst
        .replace(/ ([?!:;»])/g, " $1")
        .replace(/« /g, "« ")
        .replace(/ (3D)\b/g, " $1")
        .split(" ")
        .filter(Boolean);
      const b = ws.map((x) => meet(g, x, gewicht, px, spatiering));
      const spatie = meet(g, " ", gewicht, px, spatiering);
      if (Math.max(...b) > kolom) return null;
      const wikkel = (limiet) => {
        const r = [];
        let x = 0;
        b.forEach((bw, i) => {
          const huidig = r[r.length - 1];
          if (huidig && x + spatie + bw <= limiet) {
            huidig.push(i);
            x += spatie + bw;
          } else {
            r.push([i]);
            x = bw;
          }
        });
        return r;
      };
      const aantal = wikkel(kolom).length;
      if (aantal > max) return null;
      let lo = Math.max(...b);
      let hi = kolom;
      for (let k = 0; k < 16; k++) {
        const m = (lo + hi) / 2;
        if (wikkel(m).length <= aantal) hi = m;
        else lo = m;
      }
      return wikkel(hi).map((r) => r.map((i) => ws[i]).join(" "));
    };
    /** Grootste lettermaat die past: eerst in 2 regels, anders in 3. */
    const kies = (tekst, kolom, [min, max], gewicht = 800) => {
      for (const regels of [2, 3]) {
        for (let px = max; px >= min; px -= 2) {
          const r = zet(tekst, gewicht, px, -px * 0.022, kolom, regels);
          if (r) return { px, regels: r };
        }
      }
      return { px: min, regels: zet(tekst, gewicht, min, -min * 0.022, kolom, 9) ?? [tekst] };
    };

    const X = 80;
    const KOLOM = 820;
    const ONDER = 1500;
    const t = cfg.tekst;
    const kop = kies(t.kop, KOLOM, [76, 116]);
    const kopLH = 1.07;
    const LABEL_PX = 30;
    const SUB_PX = 38;
    const SUB_LH = 1.3;
    const subs = t.weergaven.map((x) => (x.sub ? zet(x.sub, 500, SUB_PX, 0, KOLOM, 3) ?? [x.sub] : []));
    const subMax = Math.max(0, ...subs.map((s) => s.length));
    const blokHoogte = LABEL_PX * 1.25 + 22 + kop.regels.length * kop.px * kopLH + (subMax ? 20 + subMax * SUB_PX * SUB_LH : 0);
    const blokBoven = ONDER - blokHoogte;
    const kopBoven = blokBoven + LABEL_PX * 1.25 + 22;
    const subBoven = kopBoven + kop.regels.length * kop.px * kopLH + 20;

    // Slotbeeld: woordmerk groot, slogan, systemen, domein.
    const slot = cfg.slot;
    const SLOT_VM = 250;
    const slogan = kies(slot.tagline, KOLOM, [68, 104]);
    let sysPx = 36;
    while (sysPx > 24 && meet(g, slot.systemen, 500, sysPx, 0) > KOLOM) sysPx -= 1;
    const DOMEIN_PX = 64;
    const slotDelen = [
      { h: SLOT_VM * 0.82, na: 46 },
      { h: slogan.regels.length * slogan.px * 1.07, na: 30 },
      { h: sysPx * 1.3, na: 70 },
      { h: DOMEIN_PX * 1.2, na: 0 },
    ];
    const slotHoogte = slotDelen.reduce((s, d) => s + d.h + d.na, 0);
    const slotBoven = 930 - slotHoogte / 2;
    const slotY = [];
    slotDelen.reduce((y, d) => {
      slotY.push(y);
      return y + d.h + d.na;
    }, slotBoven);

    // ── Tijdlijn ──────────────────────────────────────────────────────────
    const { S, F, N, slotBegin, slotFade, totaal } = cfg.tijd;
    const lagen = cfg.soort === "lagen";

    const camera = (tt) => {
      const k = cfg.camera;
      if (tt <= k[0].t) return k[0];
      for (let i = 0; i < k.length - 1; i++) {
        if (tt <= k[i + 1].t) {
          const u = golf((tt - k[i].t) / (k[i + 1].t - k[i].t));
          return { z: k[i].z * Math.pow(k[i + 1].z / k[i].z, u), cx: lerp(k[i].cx, k[i + 1].cx, u), cy: lerp(k[i].cy, k[i + 1].cy, u) };
        }
      }
      return k[k.length - 1];
    };

    /** Welke weergave(n) nu te zien zijn: basis volledig, de volgende vloeit erover. */
    const weergave = (tt) => {
      let basis = 0;
      for (let k = 1; k < N; k++) if (tt >= k * S + F / 2) basis = k;
      const volgende = basis + 1;
      const a = volgende < N ? glad((tt - (volgende * S - F / 2)) / F) : 0;
      return { basis, volgende, a };
    };

    const tekenModel = (ctx, laag, cam, dekking) => {
      ctx.drawImage(achter, 0, 0);
      const img = beelden[laag];
      const fit = Math.min(zone.w / img.naturalWidth, zone.h / img.naturalHeight);
      const s = fit * cam.z;
      const bw = img.naturalWidth * s;
      const bh = img.naturalHeight * s;
      const x = zone.x + zone.w / 2 - cam.cx * bw;
      const y = zone.y + zone.h / 2 - cam.cy * bh;
      ctx.globalAlpha = dekking;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, x, y, bw, bh);
      ctx.globalAlpha = 1;
    };

    const tekst = (tx, x, y, gewicht, px, kleur, spatiering = 0) => {
      g.font = font(gewicht, px);
      g.letterSpacing = `${spatiering}px`;
      g.fillStyle = kleur;
      g.fillText(tx, x, y);
      return g.measureText(tx).width;
    };

    const woordmerk = (x, vakBoven, px, alfa) => {
      if (alfa <= 0) return;
      g.globalAlpha = alfa;
      const y = basislijn(vakBoven, px, 1);
      const b = tekst("vm", x, y, 800, px, WIT, -px * 0.05);
      tekst(".", x + b, y, 800, px, AMBER, -px * 0.05);
      g.globalAlpha = 1;
    };

    /** Label + teller en onderregel van weergave i, met dekking en lichte verschuiving. */
    const weergaveTekst = (i, alfa, dy) => {
      if (alfa <= 0) return;
      const w = t.weergaven[i];
      g.globalAlpha = alfa;
      const ly = basislijn(blokBoven + dy, LABEL_PX, 1.25);
      const lb = tekst(w.label.toUpperCase(), X, ly, 600, LABEL_PX, AMBER, LABEL_PX * 0.17);
      if (t.teller) tekst(`${i + 1}/${N}`, X + lb + 22, ly, 600, LABEL_PX, GRIJS, LABEL_PX * 0.08);
      subs[i].forEach((regel, k) => tekst(regel, X, basislijn(subBoven + dy + k * SUB_PX * SUB_LH, SUB_PX, SUB_LH), 500, SUB_PX, ZACHT));
      g.globalAlpha = 1;
    };

    function teken(tt) {
      const cam = camera(tt);
      const slotIn = glad((tt - slotBegin) / slotFade);
      const modelDekking = 1 - slotIn * 0.88;

      // 1. Model(len) op steen. Overgang tussen weergaven: lineair mengen van
      //    twee volledige beelden (ook lijnwerk over een vlak blijft zuiver).
      if (lagen) {
        const v = weergave(tt);
        tekenModel(g, v.basis, cam, modelDekking);
        if (v.a > 0) {
          tekenModel(gh, v.volgende, cam, modelDekking);
          g.globalAlpha = v.a;
          g.drawImage(hulp, 0, 0);
          g.globalAlpha = 1;
        }
      } else {
        tekenModel(g, 0, cam, modelDekking);
      }
      g.drawImage(verloop, 0, 0);

      // 2. Woordmerk boven, label, kop en onderregel onder.
      const tekstUit = 1 - glad((tt - slotBegin) / (slotFade * 0.7));
      const op = (1 - tekstUit) * -30;
      woordmerk(X, 270, 78, tekstUit);
      if (tekstUit > 0) {
        if (lagen) {
          // Label en onderregel wisselen rond het midden van de overvloeiing:
          // de oude gaat net vóór de grens weg, de nieuwe komt erna op.
          for (let i = 0; i < N; i++) {
            const inA = i === 0 ? 1 : glad((tt - i * S) / 0.35);
            const uitA = i === N - 1 ? 1 : 1 - glad((tt - ((i + 1) * S - 0.35)) / 0.35);
            const a = Math.min(inA, uitA) * tekstUit;
            if (a > 0) weergaveTekst(i, a, (1 - inA) * 14 + op);
          }
        } else {
          weergaveTekst(0, tekstUit, op);
        }
        g.globalAlpha = tekstUit;
        kop.regels.forEach((regel, k) => {
          tekst(regel, X, basislijn(kopBoven + op + k * kop.px * kopLH, kop.px, kopLH), 800, kop.px, WIT, -kop.px * 0.022);
        });
        g.globalAlpha = 1;
      }

      // 3. Slotbeeld: elk deel schuift kort na het vorige binnen.
      if (slotIn > 0) {
        const deel = (k) => glad((tt - slotBegin - 0.15 - k * 0.14) / 0.5);
        const verschuif = (a) => (1 - a) * 26;
        let a = deel(0);
        woordmerk(X - SLOT_VM * 0.02, slotY[0] + verschuif(a) - SLOT_VM * 0.18, SLOT_VM, a);
        a = deel(1);
        g.globalAlpha = a;
        slogan.regels.forEach((regel, k) => {
          tekst(regel, X, basislijn(slotY[1] + verschuif(a) + k * slogan.px * 1.07, slogan.px, 1.07), 800, slogan.px, WIT, -slogan.px * 0.022);
        });
        a = deel(2);
        g.globalAlpha = a;
        tekst(slot.systemen, X, basislijn(slotY[2] + verschuif(a), sysPx, 1.3), 500, sysPx, ZACHT);
        a = deel(3);
        g.globalAlpha = a;
        const dy = basislijn(slotY[3] + verschuif(a), DOMEIN_PX, 1.2);
        g.fillStyle = AMBER;
        g.beginPath();
        g.roundRect(X, dy - DOMEIN_PX * 0.36, 56, 8, 4);
        g.fill();
        tekst(slot.domein, X + 84, dy, 700, DOMEIN_PX, WIT, DOMEIN_PX * 0.005);
        g.globalAlpha = 1;
      }
    }

    return {
      canvas,
      teken,
      totaal,
      maten: { kop: kop.px, kopRegels: kop.regels, slogan: slogan.px, sysPx, blokBoven, slotBoven },
    };
  }

  // ── Uitvoer ────────────────────────────────────────────────────────────

  async function naarBase64(delen) {
    const blob = new Blob(delen);
    return new Promise((ok, nee) => {
      const fr = new FileReader();
      fr.onload = () => ok(String(fr.result).split(",")[1] ?? "");
      fr.onerror = () => nee(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  /** Beelden [van, tot) als JPEG (base64), voor ffmpeg. */
  async function beeldenJpeg(T, van, tot, fps, kwaliteit) {
    const uit = [];
    for (let i = van; i < tot; i++) {
      T.teken(i / fps);
      uit.push(T.canvas.toDataURL("image/jpeg", kwaliteit).split(",")[1]);
    }
    return uit;
  }

  /** Eén beeld als PNG (base64): omslag en controlebeelden. */
  function beeldPng(T, tt) {
    T.teken(tt);
    return T.canvas.toDataURL("image/png").split(",")[1];
  }

  /**
   * Hele video als H.264 via WebCodecs (zonder ffmpeg). Geeft de stukken in
   * AVCC-vorm terug, met de avcC-configuratie en de kleurruimte, als base64.
   */
  async function encodeerH264(T, { fps, beelden, bitrate, codec }) {
    const config = {
      codec,
      width: T.canvas.width,
      height: T.canvas.height,
      bitrate,
      bitrateMode: "variable",
      framerate: fps,
      latencyMode: "quality",
      avc: { format: "avc" },
    };
    const steun = await VideoEncoder.isConfigSupported(config);
    if (!steun.supported) throw new Error(`H.264 (${codec}) niet beschikbaar in deze browser`);
    const stukken = [];
    let avcC = null;
    let kleur = null;
    let fout = null;
    const enc = new VideoEncoder({
      output(stuk, meta) {
        const dc = meta && meta.decoderConfig;
        if (dc && dc.description) {
          const d = dc.description;
          avcC = d instanceof ArrayBuffer ? new Uint8Array(d.slice(0)) : new Uint8Array(d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength));
        }
        if (dc && dc.colorSpace) kleur = { ...dc.colorSpace };
        const data = new Uint8Array(stuk.byteLength);
        stuk.copyTo(data);
        stukken.push({ data, sleutel: stuk.type === "key", ts: stuk.timestamp });
      },
      error(e) {
        fout = e;
      },
    });
    enc.configure(config);
    for (let i = 0; i < beelden; i++) {
      if (fout) throw fout;
      T.teken(i / fps);
      // Eerst een momentopname: een VideoFrame rechtstreeks van het canvas
      // krijgt in een headless browser telkens het eerste beeld.
      const bm = await createImageBitmap(T.canvas);
      const vf = new VideoFrame(bm, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      bm.close();
      enc.encode(vf, { keyFrame: i % (fps * 2) === 0 });
      vf.close();
      while (enc.encodeQueueSize > 2) await new Promise((ok) => setTimeout(ok, 0));
    }
    await enc.flush();
    enc.close();
    if (fout) throw fout;
    if (!avcC) throw new Error("de encoder gaf geen avcC-configuratie");
    for (let i = 1; i < stukken.length; i++) {
      if (stukken[i].ts <= stukken[i - 1].ts) throw new Error("beelden niet in volgorde (B-frames): niet ondersteund");
    }
    return {
      avcC: await naarBase64([avcC]),
      kleur,
      maten: stukken.map((s) => s.data.byteLength),
      sleutels: stukken.map((s) => s.sleutel),
      data: await naarBase64(stukken.map((s) => s.data)),
    };
  }

  window.socialVideo = { maakTekenaar, beeldenJpeg, beeldPng, encodeerH264 };
})();
