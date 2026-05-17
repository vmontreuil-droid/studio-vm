// Read-only visuele weergave van een builder-ontwerp, zoals de klant het
// maakte. Server-component (geen hooks/events) — gebruikt in de admin.

import {
  Star, Heart, Check, Zap, Shield, Award, Clock, MapPin, Phone, Mail,
  Users, Briefcase, Camera, Coffee, Scissors, Wrench, Truck, Home, Leaf,
  Sun, Sparkles, Gift, Target, ThumbsUp, Smile, Music, Globe, Lock,
  Rocket, Calendar, MessageCircle, CreditCard, Package, Settings, Tag,
  Compass, Flame, Crown, Gem, HandHeart,
} from "lucide-react";

type Block = { kind: string; data: Record<string, unknown> };
// Tolereert beide vormen: cfg-shape (pages[].blocks, theme=label,
// colors{}) én het portaal-snapshot (pages[].sections, theme-object).
type SnapPage = {
  name: string;
  blocks?: Block[];
  sections?: Block[];
  seoTitle?: string;
  seoDesc?: string;
  icon?: string;
};
type Snap = {
  businessName?: string;
  colors?: { bg?: string; fg?: string; accent?: string };
  theme?:
    | string
    | { bg?: string; fg?: string; accent?: string }
    | null;
  radius?: string;
  logo?: string;
  header?: Record<string, unknown>;
  pages?: SnapPage[];
};

const RICONS: Record<
  string,
  React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    style?: React.CSSProperties;
  }>
> = {
  star: Star, heart: Heart, check: Check, zap: Zap, shield: Shield,
  award: Award, clock: Clock, pin: MapPin, phone: Phone, mail: Mail,
  users: Users, briefcase: Briefcase, camera: Camera, coffee: Coffee,
  scissors: Scissors, wrench: Wrench, truck: Truck, home: Home,
  leaf: Leaf, sun: Sun, sparkles: Sparkles, gift: Gift, target: Target,
  thumb: ThumbsUp, smile: Smile, music: Music, globe: Globe, lock: Lock,
  rocket: Rocket, calendar: Calendar, chat: MessageCircle,
  card: CreditCard, package: Package, settings: Settings, tag: Tag,
  compass: Compass, flame: Flame, crown: Crown, gem: Gem,
  handheart: HandHeart,
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

// Mobiel-onafhankelijke stijl-overrides voor de publieke render: enkel
// als een blok een "<sleutel>M" heeft, zetten we die via @media (max
// 640px) met !important over de inline desktop-stijl. Zo blijven desktop
// en mobiel volledig los van elkaar.
function mobBlockDecl(
  bd: Record<string, unknown>,
  bg: string,
  fg: string,
  accent: string,
): string {
  const d: string[] = [];
  if (bd._bgM !== undefined) {
    const tb = toneBg(bd._bgM, bg, fg, accent);
    d.push(`background-color:${tb ?? bg}!important`);
  }
  if (bd._tcolM !== undefined)
    d.push(
      `color:${
        typeof bd._tcolM === "string" && bd._tcolM ? bd._tcolM : fg
      }!important`,
    );
  if (bd._bgimgM !== undefined) {
    if (typeof bd._bgimgM === "string" && bd._bgimgM)
      d.push(
        `background-image:url(${bd._bgimgM})!important;background-size:cover!important;background-position:center!important`,
      );
    else d.push(`background-image:none!important`);
  }
  if (
    bd._patM !== undefined ||
    bd._patCM !== undefined ||
    bd._patOM !== undefined
  ) {
    const pc = patternCss(
      {
        _pat: bd._patM ?? bd._pat,
        _patC: bd._patCM ?? bd._patC,
        _patO: bd._patOM ?? bd._patO,
      },
      fg,
    );
    if (pc)
      d.push(
        `background-image:${pc.backgroundImage}!important;background-size:${pc.backgroundSize}!important`,
      );
  }
  return d.join(";");
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

export function BuilderRender({
  snap,
  live,
  pageIndex,
}: {
  snap: Snap;
  // live = echte gepubliceerde site: geen "Pagina:"-debuglabels, geen
  // SEO-debugkader, geen kaderrand — één pagina schoon, edge-to-edge.
  live?: boolean;
  pageIndex?: number;
}) {
  if (!snap.pages || snap.pages.length === 0) return null;
  const liveIdx = Math.min(
    Math.max(pageIndex ?? 0, 0),
    snap.pages.length - 1,
  );
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

  const renderPages = live
    ? [{ page: snap.pages[liveIdx], pi: liveIdx }]
    : snap.pages.map((page, pi) => ({ page, pi }));

  return (
    <div className={live ? "bldr-ro" : "bldr-ro mt-5 space-y-6"}>
      <style>{`@keyframes svmIn{from{opacity:0}to{opacity:1}}@keyframes svmInUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}@keyframes svmInZoom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}.bldr-ro [data-anim="fade"]{animation:svmIn .7s ease both}.bldr-ro [data-anim="up"]{animation:svmInUp .7s cubic-bezier(.2,.7,.2,1) both}.bldr-ro [data-anim="zoom"]{animation:svmInZoom .6s cubic-bezier(.2,.7,.2,1) both}.bldr-ro [data-hover="1"] [class*="rounded-lg"]:hover,.bldr-ro [data-hover="1"] [class*="rounded-2xl"]:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(0,0,0,.12);transition:all .25s ease}.bldr-ro [data-hidem="1"]{outline:1px dashed currentColor;outline-offset:-4px}.bldr-ro [data-talign="left"] :is(h1,h2,h3,h4,p,li){text-align:left}.bldr-ro [data-talign="center"] :is(h1,h2,h3,h4,p,li){text-align:center}.bldr-ro [data-talign="right"] :is(h1,h2,h3,h4,p,li){text-align:right}.bldr-ro [data-tsc="s"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:.86em}.bldr-ro [data-tsc="l"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:1.15em}.bldr-ro [data-tsc="xl"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:1.32em}.bldr-ro [data-fw="1"] [class*="max-w-"]{max-width:100%!important}.bldr-ro [data-fw="1"] [class*="px-8"]{padding-left:1.25rem!important;padding-right:1.25rem!important}@media (max-width:640px){.bldr-ro [data-anim-m="none"]{animation:none!important}.bldr-ro [data-anim-m="fade"]{animation:svmIn .7s ease both!important}.bldr-ro [data-anim-m="up"]{animation:svmInUp .7s cubic-bezier(.2,.7,.2,1) both!important}.bldr-ro [data-anim-m="zoom"]{animation:svmInZoom .6s cubic-bezier(.2,.7,.2,1) both!important}.bldr-ro [data-tsc-m="s"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:.86em}.bldr-ro [data-tsc-m="l"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:1.15em}.bldr-ro [data-tsc-m="xl"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:1.32em}.bldr-ro [data-tsc-m="norm"] :is(h1,h2,h3,h4,p,li,blockquote){font-size:1em}.bldr-ro [data-talign-m="left"] :is(h1,h2,h3,h4,p,li){text-align:left}.bldr-ro [data-talign-m="center"] :is(h1,h2,h3,h4,p,li){text-align:center}.bldr-ro [data-talign-m="right"] :is(h1,h2,h3,h4,p,li){text-align:right}.bldr-ro [data-talign-m="auto"] :is(h1,h2,h3,h4,p,li){text-align:start}.bldr-ro [data-hhm="s"]{min-height:200px!important}.bldr-ro [data-hhm="m"]{min-height:340px!important}.bldr-ro [data-hhm="l"]{min-height:480px!important}.bldr-ro [data-hhm="xl"]{min-height:640px!important}.bldr-ro [data-hhm="full"]{min-height:85vh!important}}`}</style>
      {renderPages.map(({ page, pi }) => (
        <div key={pi}>
          {!live && (
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              Pagina: {page.name || `#${pi + 1}`}
            </p>
          )}
          {!live && (page.seoTitle || page.seoDesc) && (
            <p className="mb-2 rounded-lg bg-card p-2 text-[11px] text-muted">
              <span className="opacity-60">SEO:</span>{" "}
              <strong>{page.seoTitle || page.name}</strong>
              {page.seoDesc ? ` — ${page.seoDesc}` : ""}
            </p>
          )}
          <div
            className={live ? "" : "overflow-hidden border"}
            style={{
              background: bg,
              color: fg,
              ...(live ? {} : { borderRadius: rad }),
            }}
          >
            {/* nav / menu */}
            {(() => {
              const H = (snap.header || {}) as Record<string, unknown>;
              const hStr = (k: string) =>
                typeof H[k] === "string" ? (H[k] as string) : "";
              const hOn = (k: string, def = false) =>
                H[k] === undefined ? def : H[k] === 1 || H[k] === true;
              const hFg = hStr("fg") || fg;
              const pad =
                hStr("pad") === "compact"
                  ? "8px 24px"
                  : hStr("pad") === "ruim"
                    ? "22px 24px"
                    : "14px 24px";
              const logoH =
                typeof H.logoSz === "number" ? (H.logoSz as number) : 32;
              const upper = hOn("upper");
              const ctaTxt = hStr("ctaText");
              return (
                <nav
                  className="flex flex-wrap items-center gap-x-5 gap-y-2"
                  style={{
                    padding: pad,
                    color: hFg,
                    // Sticky werkt enkel op de échte gepubliceerde site
                    // (in de admin-preview zit de nav in een kader).
                    ...(live && hOn("sticky")
                      ? {
                          position: "sticky",
                          top: 0,
                          zIndex: 50,
                        }
                      : {}),
                    background:
                      hStr("bg") ||
                      (live && hOn("sticky") ? bg : undefined),
                    backdropFilter: hOn("blur")
                      ? "blur(8px)"
                      : undefined,
                    borderBottom: hOn("border", true)
                      ? `1px solid ${soft}`
                      : undefined,
                    boxShadow: hOn("shadow")
                      ? "0 6px 20px rgba(0,0,0,.10)"
                      : undefined,
                  }}
                >
                  <span className="flex shrink-0 items-center text-sm font-semibold">
                    {snap.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={snap.logo}
                        alt={businessName}
                        style={{ height: logoH, width: "auto" }}
                        className="object-contain"
                      />
                    ) : (
                      businessName
                    )}
                  </span>
                  <span className="ml-auto flex flex-wrap items-center gap-x-4 text-xs">
                    {snap.pages!.map((pp, j) => {
                      const PI =
                        pp.icon && RICONS[pp.icon] ? RICONS[pp.icon] : null;
                      const cur = pp.name === page.name;
                      const inner = (
                        <>
                          {PI && (
                            <PI
                              strokeWidth={2}
                              {...{ style: { width: 13, height: 13 } }}
                            />
                          )}
                          {pp.name || `#${j + 1}`}
                        </>
                      );
                      const st = {
                        color: cur ? accent : hFg,
                        opacity: cur ? 1 : 0.6,
                        fontWeight: cur ? 600 : 400,
                        textTransform: upper
                          ? ("uppercase" as const)
                          : undefined,
                        letterSpacing: upper ? "0.06em" : undefined,
                      };
                      return live ? (
                        <a
                          key={j}
                          href={j === 0 ? "?" : `?p=${j}`}
                          className="inline-flex items-center gap-1 no-underline"
                          style={st}
                        >
                          {inner}
                        </a>
                      ) : (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1"
                          style={st}
                        >
                          {inner}
                        </span>
                      );
                    })}
                    {ctaTxt && (
                      <span
                        style={{
                          background: hStr("ctaColor") || accent,
                          color: hStr("ctaTxtColor") || bg,
                          borderRadius:
                            hStr("ctaShape") === "recht"
                              ? 2
                              : hStr("ctaShape") === "zacht"
                                ? 12
                                : 9999,
                          padding: "6px 14px",
                          fontWeight: 500,
                        }}
                      >
                        {ctaTxt}
                      </span>
                    )}
                  </span>
                </nav>
              );
            })()}

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
              const bcls = `bmb-${pi}-${bi}`;
              const mDecl = mobBlockDecl(bd, bg, fg, accent);
              return (
                <div
                  key={bi}
                  className={`relative overflow-hidden ${bcls}`}
                  data-anim={String(bd._anim ?? "")}
                  data-hover={bd._hover ? "1" : ""}
                  data-hidem={bd._hideM ? "1" : ""}
                  data-talign={String(bd._talign ?? "")}
                  data-tsc={String(bd._tsc ?? "")}
                  data-anim-m={
                    bd._animM !== undefined
                      ? String(bd._animM ?? "") || "none"
                      : ""
                  }
                  data-hover-m={
                    bd._hoverM !== undefined ? (bd._hoverM ? "1" : "0") : ""
                  }
                  data-talign-m={
                    bd._talignM !== undefined
                      ? String(bd._talignM ?? "") || "auto"
                      : ""
                  }
                  data-tsc-m={
                    bd._tscM !== undefined
                      ? String(bd._tscM ?? "") || "norm"
                      : ""
                  }
                  data-fw={bd._full ? "1" : ""}
                  style={{
                    backgroundColor: toneBg(bd._bg, bg, fg, accent),
                    ...(patternCss(bd, fg) || {}),
                    ...(typeof bd._tcol === "string" && bd._tcol
                      ? { color: bd._tcol }
                      : {}),
                    ...(typeof bd._bgimg === "string" && bd._bgimg
                      ? {
                          backgroundImage: `url(${bd._bgimg})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {}),
                    ...(bd._shadow
                      ? {
                          boxShadow: `0 ${
                            (typeof bd._shadowStr === "number"
                              ? bd._shadowStr
                              : 18) / 2
                          }px ${
                            typeof bd._shadowStr === "number"
                              ? bd._shadowStr * 1.6
                              : 30
                          }px rgba(0,0,0,.18)`,
                        }
                      : {}),
                  }}
                >
                  {mDecl && (
                    <style>{`@media (max-width:640px){.bldr-ro .${bcls}{${mDecl}}}`}</style>
                  )}
                  {typeof bd._bgimg === "string" && bd._bgimg && (
                    <div
                      className="pointer-events-none absolute inset-0 z-0"
                      style={{
                        background: `rgba(0,0,0,${
                          (typeof bd._bgdim === "number"
                            ? bd._bgdim
                            : 35) / 100
                        })`,
                      }}
                    />
                  )}
                  <div className="relative z-[1]">
                    <BlockView
                      block={b}
                      fg={fg}
                      bg={bg}
                      accent={accent}
                      soft={soft}
                    />
                  </div>
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
  const hN = (k: string, dv: number) =>
    typeof d[k] === "number" ? (d[k] as number) : dv;
  const headSub = typeof d._sub === "string" ? (d._sub as string) : "";
  const headDiv = d._div === 1 || d._div === true;
  const headDIcon =
    typeof d._divIcon === "string" ? (d._divIcon as string) : "";
  const HDI = headDIcon && RICONS[headDIcon] ? RICONS[headDIcon] : null;
  const headDSz = hN("_divIconSz", 14);
  const H = ({ children }: { children: React.ReactNode }) => (
    <div
      className="text-center"
      style={{
        paddingTop: hN("_hPadT", 0),
        marginBottom: hN("_hBelow", 0),
      }}
    >
      <h3 className="text-lg font-semibold tracking-tight">{children}</h3>
      {headSub && (
        <p
          className="mx-auto max-w-2xl text-sm opacity-70"
          style={{ marginTop: hN("_hGap", 8) }}
        >
          {headSub}
        </p>
      )}
      {headDiv && (
        <div
          className="flex items-center justify-center gap-3"
          style={{
            marginTop: hN("_hDivGap", 16),
            marginBottom: hN("_hDivGap", 16),
          }}
        >
          <span
            className="h-px w-full max-w-[120px]"
            style={{ background: `${fg}33` }}
          />
          {HDI ? (
            <span
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{
                width: Math.max(28, headDSz + 14),
                height: Math.max(28, headDSz + 14),
                background: `${accent}1a`,
                color: accent,
              }}
            >
              <HDI
                strokeWidth={2}
                {...{ style: { width: headDSz, height: headDSz } }}
              />
            </span>
          ) : (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: accent }}
            />
          )}
          <span
            className="h-px w-full max-w-[120px]"
            style={{ background: `${fg}33` }}
          />
        </div>
      )}
    </div>
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
      const hHM =
        typeof d.hHM === "string" && HH[String(d.hHM)]
          ? String(d.hHM)
          : "";
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
                data-hhm={hHM}
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
                  className="relative rounded-lg border p-3 text-xs"
                  style={{
                    ...border,
                    ...((it as Record<string, unknown>)._bg
                      ? {
                          background: String(
                            (it as Record<string, unknown>)._bg,
                          ),
                        }
                      : {}),
                    ...((it as Record<string, unknown>)._tc
                      ? {
                          color: String(
                            (it as Record<string, unknown>)._tc,
                          ),
                        }
                      : {}),
                    ...((it as Record<string, unknown>)._hi
                      ? {
                          borderColor: accent,
                          boxShadow: `0 0 0 2px ${accent}`,
                        }
                      : {}),
                  }}
                >
                  {(it as Record<string, unknown>)._hi ? (
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase"
                      style={{ background: accent, color: bg }}
                    >
                      ★
                    </span>
                  ) : null}
                  {im && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={im}
                      alt={String(
                        (it as Record<string, unknown>)._alt ?? "",
                      )}
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
          <div
            className={`mx-auto flex max-w-2xl flex-col gap-5 sm:[&>*]:flex-1 ${
              s(d._var) === "right" ? "sm:flex-row-reverse" : "sm:flex-row"
            }`}
          >
            {s(d._img) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s(d._img)}
                alt={s(d._alt)}
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
              {headSub && (
                <p className="mt-1.5 text-sm opacity-70">{headSub}</p>
              )}
              {headDiv && (
                <div className="mt-3 flex items-center gap-3">
                  <span
                    className="h-px w-full max-w-[120px]"
                    style={{ background: `${fg}33` }}
                  />
                  {HDI && (
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${accent}1a`, color: accent }}
                    >
                      <HDI strokeWidth={2} />
                    </span>
                  )}
                </div>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm opacity-70">
                {s(d.text)}
              </p>
              {arr(d.items).length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {arr(d.items).map((b, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 opacity-80"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0"
                        strokeWidth={2.5}
                        {...{ style: { color: accent } }}
                      />
                      <span>{String(b.text || "")}</span>
                    </li>
                  ))}
                </ul>
              )}
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
    case "contact": {
      const cf = arr(d.items);
      const crows =
        cf.length > 0
          ? cf
          : [
              { label: "Naam", type: "text", req: "1" },
              { label: "E-mail", type: "email", req: "1" },
              { label: "Bericht", type: "textarea", req: "1" },
            ];
      const cBtnR =
        s(d._btnShape) === "recht"
          ? 2
          : s(d._btnShape) === "zacht"
            ? 12
            : 9999;
      const cFldR =
        s(d._fldShape) === "recht"
          ? 2
          : s(d._fldShape) === "rond"
            ? 9999
            : 8;
      const cCard = d._card === 1 || d._card === true;
      const okC = s(d._okColor) || "#16a34a";
      const formCol = (
        <div className={cCard ? "" : "mx-auto max-w-sm"}>
          <div className="space-y-2 text-xs">
            {crows.map((fl, i) => {
              const lbl = String(fl.label || `Veld ${i + 1}`);
              const req = fl.req === "1" || fl.req === "true";
              const fst = {
                ...border,
                borderRadius: cFldR,
                ...(fl.bg ? { background: String(fl.bg) } : {}),
              };
              return (
                <div key={i}>
                  <span className="mb-1 block opacity-70">
                    {lbl}
                    {req && <span style={{ color: accent }}> *</span>}
                  </span>
                  {fl.type === "textarea" ? (
                    <div
                      className="h-16 w-full border"
                      style={fst}
                    />
                  ) : (
                    <div
                      className="h-8 w-full border"
                      style={fst}
                    />
                  )}
                </div>
              );
            })}
            <span
              className="mt-1 inline-block px-4 py-2 text-xs font-medium"
              style={{
                background: s(d._btnColor) || accent,
                color: s(d._btnTxt) || bg,
                borderRadius: cBtnR,
              }}
            >
              {s(d.button) || "Verstuur"}
            </span>
            <p
              className="mt-1 rounded px-3 py-1.5 text-[11px]"
              style={{ background: `${okC}1f`, color: okC }}
            >
              {s(d._okText) || "Bedankt! We nemen snel contact met je op."}
            </p>
          </div>
        </div>
      );
      return (
        <div className="border-t px-6 py-10" style={border}>
          <H>{s(d.title)}</H>
          <p className="mt-2 text-center text-xs opacity-70">
            {[s(d.emailAddr), s(d.phone), s(d.address)]
              .filter(Boolean)
              .join("  ·  ") || "—"}
          </p>
          <div
            className={
              cCard
                ? "mx-auto mt-6 grid max-w-2xl gap-5 md:grid-cols-2"
                : "mt-6"
            }
          >
            {formCol}
            {cCard && (
              <div
                className="rounded-xl border p-4 text-xs"
                style={{
                  ...border,
                  background: s(d._cardBg) || `${fg}08`,
                }}
              >
                <p className="mb-2 text-sm font-semibold">
                  {s(d._cardTitle) || "Contactgegevens"}
                </p>
                <p className="whitespace-pre-line opacity-80">
                  {s(d._cardText)}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    case "form": {
      const ff = arr(d.items);
      return (
        <div className="border-t px-6 py-10" style={border}>
          <H>{s(d.title)}</H>
          <div className="mx-auto mt-4 max-w-md space-y-2 text-xs">
            {ff.map((fl, i) => (
              <div key={i}>
                <span className="opacity-60">
                  {String(fl.label || `Veld ${i + 1}`)}
                </span>
                <span className="ml-1 opacity-40">
                  ({String(fl.type || "text")})
                </span>
              </div>
            ))}
            <span
              className="mt-2 inline-block rounded-full px-4 py-1.5 text-xs font-medium"
              style={{ background: accent, color: bg }}
            >
              {s(d.button) || "Versturen"}
            </span>
          </div>
        </div>
      );
    }
    case "richtext": {
      const rw =
        s(d._w) === "smal"
          ? "max-w-xl"
          : s(d._w) === "breed"
            ? "max-w-4xl"
            : s(d._w) === "vol"
              ? "max-w-none"
              : "max-w-2xl";
      const rta = (s(d._txtAlign) ||
        "left") as React.CSSProperties["textAlign"];
      const rTwo = s(d._cols) === "2";
      const rBtn = s(d.button);
      const rBR =
        s(d._btnShape) === "recht"
          ? 2
          : s(d._btnShape) === "zacht"
            ? 12
            : 9999;
      return (
        <div className="border-t px-6 py-10" style={border}>
          <div className={`mx-auto ${rw}`}>
            {(s(d.title) || headSub || headDiv) && <H>{s(d.title)}</H>}
            <p
              className="mt-2 whitespace-pre-wrap text-sm opacity-80"
              style={{
                textAlign: rta,
                columnCount: rTwo ? 2 : undefined,
                columnGap: rTwo ? "2rem" : undefined,
              }}
            >
              {s(d.text)}
            </p>
            {rBtn && (
              <div className="mt-4" style={{ textAlign: rta }}>
                <span
                  className="inline-block px-5 py-2 text-xs font-medium"
                  style={{
                    background: s(d._btnColor) || accent,
                    color: s(d._btnTxt) || bg,
                    borderRadius: rBR,
                  }}
                >
                  {rBtn}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
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
