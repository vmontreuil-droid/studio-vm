// Read-only visuele weergave van een builder-ontwerp, zoals de klant het
// maakte. Server-component (geen hooks/events) — gebruikt in de admin.

type Block = { kind: string; data: Record<string, unknown> };
// Tolereert beide vormen: cfg-shape (pages[].blocks, theme=label,
// colors{}) én het portaal-snapshot (pages[].sections, theme-object).
type SnapPage = { name: string; blocks?: Block[]; sections?: Block[] };
type Snap = {
  businessName?: string;
  colors?: { bg?: string; fg?: string; accent?: string };
  theme?:
    | string
    | { bg?: string; fg?: string; accent?: string }
    | null;
  radius?: string;
  pages?: SnapPage[];
};

// Houd dit in sync met SECT_TONES in de builder.
const TONE_MIX: Record<string, [string, number]> = {
  soft1: ["fg", 4],
  soft2: ["fg", 9],
  soft3: ["fg", 16],
  acc1: ["accent", 6],
  acc2: ["accent", 13],
  acc3: ["accent", 22],
  white: ["white", 100],
};
function toneBg(
  tone: unknown,
  bg: string,
  fg: string,
  accent: string,
): string | undefined {
  const m = TONE_MIX[String(tone ?? "")];
  if (!m) return undefined;
  const [src, pct] = m;
  if (src === "white") return "#ffffff";
  const col = src === "accent" ? accent : fg;
  return `color-mix(in srgb, ${col} ${pct}%, ${bg})`;
}

function patternCss(
  d: Record<string, unknown>,
  fg: string,
): { backgroundImage: string; backgroundSize: string } | null {
  const t = String(d._pat ?? "none");
  if (!t || t === "none") return null;
  const hex = typeof d._patC === "string" && d._patC ? d._patC : fg;
  const op =
    typeof d._patO === "number"
      ? Math.max(0, Math.min(1, d._patO))
      : 0.08;
  const m = hex.replace("#", "");
  const n =
    m.length === 3 ? m.split("").map((x) => x + x).join("") : m.padEnd(6, "0");
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  const c = `rgba(${r}, ${g}, ${b}, ${op})`;
  switch (t) {
    case "dots":
      return {
        backgroundImage: `radial-gradient(${c} 1.5px, transparent 1.6px)`,
        backgroundSize: "18px 18px",
      };
    case "stripes":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${c} 0 2px, transparent 2px 12px)`,
        backgroundSize: "auto",
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      };
    case "diagonal":
      return {
        backgroundImage: `repeating-linear-gradient(-45deg, ${c} 0 1px, transparent 1px 14px)`,
        backgroundSize: "auto",
      };
    case "cross":
      return {
        backgroundImage: `linear-gradient(${c} 1.5px, transparent 1.5px), linear-gradient(90deg, ${c} 1.5px, transparent 1.5px)`,
        backgroundSize: "26px 26px, 26px 26px",
      };
    default:
      return null;
  }
}

function radiusPx(label?: string): string {
  const l = (label ?? "").toLowerCase();
  if (/strak|net|sharp/.test(l)) return "2px";
  if (/rond|round/.test(l)) return "22px";
  return "12px";
}

function s(v: unknown): string {
  return v == null ? "" : String(v);
}
function arr(v: unknown): Record<string, string>[] {
  return Array.isArray(v) ? (v as Record<string, string>[]) : [];
}

export function BuilderRender({ snap }: { snap: Snap }) {
  if (!snap.pages || snap.pages.length === 0) return null;
  const themeObj =
    snap.theme && typeof snap.theme === "object" ? snap.theme : null;
  const bg = snap.colors?.bg || themeObj?.bg || "#ffffff";
  const fg = snap.colors?.fg || themeObj?.fg || "#111111";
  const accent = snap.colors?.accent || themeObj?.accent || "#b45309";
  const rad = radiusPx(snap.radius);
  const soft = `${fg}1a`;
  const businessName = snap.businessName || "Website";
  const blocksOf = (p: SnapPage): Block[] =>
    Array.isArray(p.blocks)
      ? p.blocks
      : Array.isArray(p.sections)
        ? p.sections
        : [];

  return (
    <div className="mt-5 space-y-6">
      {snap.pages.map((page, pi) => (
        <div key={pi}>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            Pagina: {page.name || `#${pi + 1}`}
          </p>
          <div
            className="overflow-hidden border"
            style={{ background: bg, color: fg, borderRadius: rad }}
          >
            {/* nav / menu */}
            <nav
              className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-6 py-3"
              style={{ borderColor: soft }}
            >
              <span className="text-sm font-semibold">{businessName}</span>
              <span className="ml-auto flex flex-wrap gap-x-4 text-xs">
                {snap.pages!.map((pp, j) => (
                  <span
                    key={j}
                    style={{
                      color: pp.name === page.name ? accent : fg,
                      opacity: pp.name === page.name ? 1 : 0.6,
                      fontWeight: pp.name === page.name ? 600 : 400,
                    }}
                  >
                    {pp.name || `#${j + 1}`}
                  </span>
                ))}
              </span>
            </nav>

            {blocksOf(page).map((b, bi) => {
              const bd = (b.data as Record<string, unknown>) || {};
              const ovs = Array.isArray(bd._ov)
                ? (bd._ov as {
                    id?: string;
                    t?: string;
                    x?: number;
                    y?: number;
                    w?: number;
                    src?: string;
                    text?: string;
                    color?: string;
                    size?: number;
                  }[])
                : [];
              return (
                <div
                  key={bi}
                  className="relative overflow-hidden"
                  style={{
                    backgroundColor: toneBg(bd._bg, bg, fg, accent),
                    ...(patternCss(bd, fg) || {}),
                  }}
                >
                  <BlockView
                    block={b}
                    fg={fg}
                    bg={bg}
                    accent={accent}
                    soft={soft}
                  />
                  {ovs.map((ov, oi) => (
                    <div
                      key={ov.id || oi}
                      className="absolute"
                      style={{
                        left: `${ov.x ?? 50}%`,
                        top: `${ov.y ?? 50}%`,
                        width: `${ov.w ?? 30}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {ov.t === "img" && ov.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ov.src}
                          alt=""
                          className="block w-full rounded-lg"
                        />
                      ) : (
                        <div
                          className="whitespace-pre-wrap px-3 py-2"
                          style={{
                            color: ov.color || fg,
                            fontSize: ov.size || 18,
                            lineHeight: 1.35,
                          }}
                        >
                          {ov.text || ""}
                        </div>
                      )}
                    </div>
                  ))}
                  {(() => {
                    const lk = bd._lnk as
                      | { k?: string; v?: string }
                      | undefined;
                    if (!lk || !lk.k || lk.k === "none" || !lk.v)
                      return null;
                    const lbl =
                      lk.k === "page"
                        ? `Pagina: ${lk.v}`
                        : lk.k === "section"
                          ? `Sectie: ${lk.v}`
                          : lk.v;
                    return (
                      <p
                        className="absolute bottom-1 right-2 rounded bg-black/55 px-2 py-0.5 font-mono text-[10px] text-white"
                        title="Gewenste link"
                      >
                        → {lbl}
                      </p>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BlockView({
  block,
  fg,
  bg,
  accent,
  soft,
}: {
  block: Block;
  fg: string;
  bg: string;
  accent: string;
  soft: string;
}) {
  const d = block.data || {};
  const items = arr(d.items);
  const border = { borderColor: soft };
  const H = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-center text-lg font-semibold tracking-tight">
      {children}
    </h3>
  );

  switch (block.kind) {
    case "hero": {
      type HSlide = {
        bg?: string;
        eyebrow?: string;
        heading?: string;
        sub?: string;
        button?: string;
        capTitle?: string;
        capText?: string;
      };
      const rawSl =
        Array.isArray(d.slides) && d.slides.length
          ? (d.slides as HSlide[])
          : null;
      const legacy = Array.isArray(d.bgs)
        ? (d.bgs as unknown[]).map(String).filter(Boolean)
        : s(d.bg)
          ? [s(d.bg)]
          : [];
      const heroSlides: HSlide[] = rawSl
        ? rawSl
        : legacy.length
          ? legacy.map((b) => ({
              bg: b,
              eyebrow: s(d.eyebrow),
              heading: s(d.heading) || s(d.title),
              sub: s(d.sub),
              button: s(d.button),
            }))
          : [
              {
                eyebrow: s(d.eyebrow),
                heading: s(d.heading) || s(d.title),
                sub: s(d.sub),
                button: s(d.button),
              },
            ];
      const multi = heroSlides.length > 1;
      const HH: Record<string, string> = {
        s: "200px",
        m: "340px",
        l: "480px",
        xl: "640px",
        full: "85vh",
      };
      const hHeight =
        typeof d.hH === "string" && HH[String(d.hH)]
          ? HH[String(d.hH)]
          : "340px";
      const hx = typeof d.hx === "number" ? d.hx : 50;
      const hy = typeof d.hy === "number" ? d.hy : 50;
      const hCard = d.hCard === 1 || d.hCard === true;
      const hBlur = typeof d.hBlur === "number" ? d.hBlur : 0;
      const showCard = hCard || hBlur > 0;
      const hCap = d.hCap === 1 || d.hCap === true;
      const hCapPos =
        d.hCapPos === "br" ||
        d.hCapPos === "tl" ||
        d.hCapPos === "tr"
          ? String(d.hCapPos)
          : "bl";
      const capX = typeof d.capX === "number" ? d.capX : null;
      const capY = typeof d.capY === "number" ? d.capY : null;
      const capFree = capX !== null && capY !== null;
      return (
        <div>
          {heroSlides.map((sl, si) => {
            const hb = !!sl.bg;
            const cStyle: React.CSSProperties = showCard
              ? {
                  background: hb ? "rgba(0,0,0,0.34)" : `${fg}0f`,
                  backdropFilter: hBlur > 0 ? `blur(${hBlur}px)` : undefined,
                  WebkitBackdropFilter:
                    hBlur > 0 ? `blur(${hBlur}px)` : undefined,
                  padding: "26px 30px",
                  borderRadius: 18,
                  border: hb
                    ? "1px solid rgba(255,255,255,0.18)"
                    : `1px solid ${fg}1f`,
                }
              : {};
            return (
              <div
                key={si}
                className="relative overflow-hidden border-t text-center first:border-t-0"
                style={{
                  borderColor: soft,
                  minHeight: hHeight,
                  ...(hb
                    ? {
                        backgroundImage: `url(${sl.bg})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        color: "#ffffff",
                      }
                    : {}),
                }}
              >
                {hb && !showCard && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  />
                )}
                <div
                  className="absolute"
                  style={{
                    left: `${hx}%`,
                    top: `${hy}%`,
                    transform: "translate(-50%, -50%)",
                    width: "min(86%, 620px)",
                  }}
                >
                  <div style={cStyle}>
                    {multi && (
                      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest opacity-70">
                        slide {si + 1}/{heroSlides.length}
                      </p>
                    )}
                    <p
                      className="font-mono text-[10px] uppercase tracking-widest"
                      style={hb ? undefined : { color: accent }}
                    >
                      {s(sl.eyebrow)}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      {s(sl.heading)}
                    </h2>
                    <p
                      className={
                        hb
                          ? "mt-2 text-sm opacity-90"
                          : "mt-2 text-sm opacity-70"
                      }
                    >
                      {s(sl.sub)}
                    </p>
                    {s(sl.button) && (
                      <span
                        className="mt-5 inline-block rounded-full px-4 py-1.5 text-xs font-medium"
                        style={{ background: accent, color: bg }}
                      >
                        {s(sl.button)}
                      </span>
                    )}
                  </div>
                </div>
                {hCap && (s(sl.capTitle) || s(sl.capText)) && (
                  <div
                    className="absolute z-[4] max-w-[280px] text-left"
                    style={
                      capFree
                        ? {
                            left: `${capX}%`,
                            top: `${capY}%`,
                            transform: "translate(-50%, -50%)",
                          }
                        : hCapPos === "br"
                          ? { right: 16, bottom: 16 }
                          : hCapPos === "tl"
                            ? { left: 16, top: 16 }
                            : hCapPos === "tr"
                              ? { right: 16, top: 16 }
                              : { left: 16, bottom: 16 }
                    }
                  >
                    <div
                      style={{
                        background: hb
                          ? "rgba(0,0,0,0.42)"
                          : `${fg}14`,
                        backdropFilter:
                          hBlur > 0 ? `blur(${hBlur}px)` : undefined,
                        WebkitBackdropFilter:
                          hBlur > 0 ? `blur(${hBlur}px)` : undefined,
                        borderRadius: 14,
                        border: hb
                          ? "1px solid rgba(255,255,255,0.18)"
                          : `1px solid ${fg}1f`,
                        padding: "12px 16px",
                      }}
                    >
                      <p className="text-xs font-semibold tracking-tight">
                        {s(sl.capTitle)}
                      </p>
                      {s(sl.capText) && (
                        <p className="mt-1 text-[11px] leading-relaxed opacity-80">
                          {s(sl.capText)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    case "features":
    case "steps":
    case "team":
    case "logos":
    case "stats":
    case "testimonials":
    case "pricing":
    case "faq":
    case "pricelist":
    case "hours":
      return (
        <div className="border-t px-6 py-10" style={border}>
          <H>{s(d.title)}</H>
          <div className="mx-auto mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
            {items.map((it, i) => {
              const im = String(
                (it as Record<string, unknown>)._img ?? "",
              );
              const ih =
                Number((it as Record<string, unknown>)._ih) || 120;
              const ib =
                Number((it as Record<string, unknown>)._ib) || 0;
              return (
                <div
                  key={i}
                  className="rounded-lg border p-3 text-xs"
                  style={border}
                >
                  {im && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={im}
                      alt=""
                      className="mb-2 w-full rounded-md object-cover"
                      style={{
                        height: ih,
                        filter: ib ? `blur(${ib}px)` : undefined,
                      }}
                    />
                  )}
                  {(it as Record<string, unknown>)._icon ? (
                    <p className="leading-relaxed">
                      <span className="opacity-50">icoon: </span>
                      {String((it as Record<string, unknown>)._icon)}
                    </p>
                  ) : null}
                  {Object.entries(it).map(([k, v]) =>
                    v && !k.startsWith("_") ? (
                      <p key={k} className="leading-relaxed">
                        <span className="opacity-50">{k}: </span>
                        {String(v)}
                      </p>
                    ) : null,
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    case "about":
      return (
        <div className="border-t px-6 py-10" style={border}>
          <div className="mx-auto grid max-w-2xl gap-5 sm:grid-cols-[1fr_1.4fr]">
            {s(d._img) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s(d._img)}
                alt=""
                className="w-full rounded-lg object-cover"
                style={{
                  height: Number(d._ih) || 160,
                  filter: Number(d._ib)
                    ? `blur(${Number(d._ib)}px)`
                    : undefined,
                }}
              />
            ) : (
              <div
                className="aspect-[4/3] rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${accent}33, ${fg}11)`,
                }}
              />
            )}
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                {s(d.title)}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm opacity-70">
                {s(d.text)}
              </p>
            </div>
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="border-t px-6 py-10" style={border}>
          <H>{s(d.title)}</H>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-md"
                style={{
                  background: `linear-gradient(${i * 45}deg, ${accent}33, ${fg}11)`,
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] opacity-50">
            (foto&apos;s apart aangeleverd)
          </p>
        </div>
      );
    case "map": {
      const mEmb = s(d.embed);
      const mAddr = s(d.address);
      const mOk =
        /^https:\/\//.test(mEmb) &&
        /(\/maps\/embed|output=embed)/.test(mEmb);
      const mSrc = mOk
        ? mEmb
        : mAddr
          ? `https://www.google.com/maps?q=${encodeURIComponent(
              mAddr,
            )}&output=embed`
          : "";
      return (
        <div className="border-t px-6 py-10" style={border}>
          <H>{s(d.title)}</H>
          {mSrc ? (
            <div className="mx-auto mt-5 max-w-xl">
              <div
                className="overflow-hidden rounded-lg border"
                style={border}
              >
                <iframe
                  src={mSrc}
                  title="map"
                  loading="lazy"
                  className="h-64 w-full"
                  style={{ border: 0 }}
                />
              </div>
              {mAddr && (
                <p className="mt-2 text-center text-xs opacity-70">
                  {mAddr}
                </p>
              )}
            </div>
          ) : (
            <div
              className="mx-auto mt-5 max-w-xl rounded-lg border py-10 text-center text-sm font-medium"
              style={{
                ...border,
                background: `linear-gradient(135deg, ${accent}1f, ${fg}0d)`,
              }}
            >
              {mAddr || "—"}
            </div>
          )}
        </div>
      );
    }
    case "cta":
      return (
        <div
          className="border-t px-6 py-12 text-center"
          style={{ ...border, background: `${accent}14` }}
        >
          <h3 className="text-xl font-semibold tracking-tight">
            {s(d.title)}
          </h3>
          <p className="mt-2 text-sm opacity-70">{s(d.text)}</p>
          {s(d.button) && (
            <span
              className="mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-medium"
              style={{ background: accent, color: bg }}
            >
              {s(d.button)}
            </span>
          )}
        </div>
      );
    case "contact":
      return (
        <div className="border-t px-6 py-10 text-center" style={border}>
          <H>{s(d.title)}</H>
          <p className="mt-2 text-xs opacity-70">
            {[s(d.emailAddr), s(d.phone), s(d.address)]
              .filter(Boolean)
              .join("  ·  ") || "—"}
          </p>
        </div>
      );
    case "richtext":
      return (
        <div className="border-t px-6 py-10" style={border}>
          <div className="mx-auto max-w-2xl">
            <h3 className="text-lg font-semibold tracking-tight">
              {s(d.title)}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm opacity-70">
              {s(d.text)}
            </p>
          </div>
        </div>
      );
    case "banner":
      return (
        <div
          className="border-t px-6 py-2.5 text-center text-xs font-medium"
          style={{ background: accent, color: bg }}
        >
          {s(d.text) || "—"}
        </div>
      );
    case "newsletter":
      return (
        <div
          className="border-t px-6 py-10 text-center"
          style={{ ...border, background: `${accent}0d` }}
        >
          <H>{s(d.title)}</H>
          <p className="mt-2 text-sm opacity-70">{s(d.text)}</p>
          {s(d.button) && (
            <span
              className="mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-medium"
              style={{ background: accent, color: bg }}
            >
              {s(d.button)}
            </span>
          )}
        </div>
      );
    case "footer": {
      type FCol = { title?: string; links?: { label?: string }[] };
      const fcols: FCol[] = Array.isArray(d.cols)
        ? (d.cols as FCol[])
        : [];
      const legacyTxt = s(d.text);
      if (!fcols.length && !s(d.about) && !s(d.note) && legacyTxt) {
        return (
          <div
            className="border-t px-6 py-6 text-center text-xs opacity-60"
            style={border}
          >
            {legacyTxt}
          </div>
        );
      }
      return (
        <div className="border-t px-6 py-8" style={border}>
          <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-[1.4fr_repeat(auto-fit,minmax(0,1fr))]">
            <div className="text-xs opacity-70">{s(d.about) || "—"}</div>
            {fcols.map((col, ci) => (
              <div key={ci} className="text-[11px]">
                <p
                  className="mb-1.5 font-mono uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  {s(col.title)}
                </p>
                <ul className="space-y-1 opacity-70">
                  {(col.links ?? []).map((lk, li) => (
                    <li key={li}>{s(lk.label)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {s(d.note) && (
            <div
              className="mx-auto mt-6 max-w-2xl border-t pt-4 text-center text-[10px] opacity-60"
              style={border}
            >
              {s(d.note)}
            </div>
          )}
        </div>
      );
    }
    default:
      return (
        <div className="border-t px-6 py-6 text-xs" style={border}>
          <p className="font-mono opacity-50">{block.kind}</p>
        </div>
      );
  }
}
