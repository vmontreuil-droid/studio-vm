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
  locale?: string;
  pages?: SnapPage[];
};

// Drietalige fallback-teksten voor de publieke render (volgt de taal
// waarin het ontwerp gemaakt is — snap.locale).
function rt(loc: string | undefined) {
  const l = loc === "fr" ? "fr" : loc === "en" ? "en" : "nl";
  const T = {
    nl: {
      page: "Pagina",
      section: "Sectie",
      wantLink: "Gewenste link",
      photosApart: "(foto's apart aangeleverd)",
      name: "Naam",
      email: "E-mail",
      message: "Bericht",
      field: "Veld",
      send: "Verstuur",
      thanks: "Bedankt! We nemen snel contact met je op.",
      contactInfo: "Contactgegevens",
    },
    fr: {
      page: "Page",
      section: "Section",
      wantLink: "Lien souhaité",
      photosApart: "(photos fournies séparément)",
      name: "Nom",
      email: "E-mail",
      message: "Message",
      field: "Champ",
      send: "Envoyer",
      thanks: "Merci ! Nous vous recontactons rapidement.",
      contactInfo: "Coordonnées",
    },
    en: {
      page: "Page",
      section: "Section",
      wantLink: "Desired link",
      photosApart: "(photos supplied separately)",
      name: "Name",
      email: "Email",
      message: "Message",
      field: "Field",
      send: "Send",
      thanks: "Thanks! We'll get back to you soon.",
      contactInfo: "Contact details",
    },
  } as const;
  return T[l];
}

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
  const L = rt(snap.locale);
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
              {L.page}: {page.name || `#${pi + 1}`}
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
                      loc={snap.locale}
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
                        ? `${L.page}: ${lk.v}`
                        : lk.k === "section"
                          ? `${L.section}: ${lk.v}`
                          : lk.v;
                    return (
                      <p
                        className="absolute bottom-1 right-2 rounded bg-black/55 px-2 py-0.5 font-mono text-[10px] text-white"
                        title={L.wantLink}
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

// ────────────────────────────────────────────────────────────────
// HIGH-TECH SECTION-VARIANTS
// Geactiveerd wanneer block.data._variant matcht. Anders valt het
// terug op de klassieke render hieronder. Templates uit
// /admin/templates-lab zetten _variant flags zoals "glass",
// "bento", "gradient-mesh", "split", "video-bg", ... waardoor de
// builder ze automatisch in 2026-stijl rendert.
// ────────────────────────────────────────────────────────────────

export const HIGHTECH_HERO_VARIANTS = new Set([
  "glass",
  "large-bg",
  "manifest",
  "video-bg",
  "modern",
  "compact-cta",
  "split-right",
  "compact",
]);
export const HIGHTECH_FEATURES_VARIANTS = new Set([
  "bento",
  "icon-grid",
  "three-col",
  "timeline",
]);
export const HIGHTECH_CTA_VARIANTS = new Set([
  "wide",
  "dark",
  "soft",
  "centered",
  "gradient-mesh",
]);
export const HIGHTECH_ABOUT_VARIANTS = new Set([
  "split",
  "long-form",
  "compact",
  "parallax-split",
]);

function safeStr(v: unknown): string {
  return v == null ? "" : String(v);
}

// Inline-editable text — wanneer 'onChange' meegegeven wordt, kan de
// gebruiker direct op de tekst klikken en die typen. Anders gewoon
// statisch (publieke render). Bewaart bij onBlur.
type ETTag = "span" | "h1" | "h2" | "h3" | "h4" | "p";
type ETProps = {
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  as?: ETTag;
  placeholder?: string;
};
function ET({
  value,
  onChange,
  className,
  style,
  as = "span",
  placeholder,
}: ETProps) {
  const display = value || placeholder || "";
  if (!onChange) {
    if (as === "h1")
      return (
        <h1 className={className} style={style}>
          {display}
        </h1>
      );
    if (as === "h2")
      return (
        <h2 className={className} style={style}>
          {display}
        </h2>
      );
    if (as === "h3")
      return (
        <h3 className={className} style={style}>
          {display}
        </h3>
      );
    if (as === "h4")
      return (
        <h4 className={className} style={style}>
          {display}
        </h4>
      );
    if (as === "p")
      return (
        <p className={className} style={style}>
          {display}
        </p>
      );
    return (
      <span className={className} style={style}>
        {display}
      </span>
    );
  }
  // Edit-mode: contentEditable handlers
  const editClass = `${className ?? ""} outline-none focus:ring-2 focus:ring-white/20 rounded`;
  const onBlur = (e: React.FocusEvent<HTMLElement>) => {
    const next = (e.currentTarget.textContent || "").trim();
    if (next !== value) onChange(next);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && as !== "p") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
  };
  const common = {
    className: editClass,
    style,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onBlur,
    onKeyDown,
  } as const;
  if (as === "h1") return <h1 {...common}>{display}</h1>;
  if (as === "h2") return <h2 {...common}>{display}</h2>;
  if (as === "h3") return <h3 {...common}>{display}</h3>;
  if (as === "h4") return <h4 {...common}>{display}</h4>;
  if (as === "p") return <p {...common}>{display}</p>;
  return <span {...common}>{display}</span>;
}

// HeroHighTech v2 — luxury edition met optionele inline-edit. Wanneer
// 'edit' meegegeven wordt (= editor-mode), worden titel/eyebrow/sub/
// button direct klikbaar-bewerkbaar via contentEditable. Anders pure
// statische render (publieke site).
export function HeroHighTech({
  d,
  accent,
  variant,
  edit,
}: {
  d: Record<string, unknown>;
  accent: string;
  variant: string;
  edit?: (patch: Record<string, unknown>) => void;
}) {
  const eyebrow = safeStr(d.eyebrow) || "Studio · 2026";
  const heading = safeStr(d.heading) || safeStr(d.title) || "Verfijn jouw merk";
  const sub =
    safeStr(d.sub) ||
    "Premium digitale aanwezigheid voor merken die opvallen. Strak ontworpen, krachtig opgebouwd, klaar om te schalen.";
  const button = safeStr(d.button) || "Ontdek mijn werk";

  // Foto-ondersteuning:
  // 1) d.bg / d.slides[0].bg → full-bleed achtergrond
  // 2) d._ov array → floating overlays (uit '+Foto'-knop, gepositioneerd
  //    op x/y/w in % zoals klassieke editor het opslaat).
  const bg = (() => {
    const direct = safeStr(d.bg);
    if (direct) return direct;
    const slides = Array.isArray(d.slides) ? (d.slides as Record<string, unknown>[]) : [];
    return safeStr(slides[0]?.bg);
  })();
  const bgRight = safeStr(d.bgRight) || bg;
  type Ov = { id?: string; t?: string; x?: number; y?: number; w?: number; src?: string };
  const overlays = Array.isArray(d._ov) ? (d._ov as Ov[]) : [];
  const renderOverlays = () =>
    overlays.length > 0 ? (
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {overlays.map((ov, i) =>
          ov && ov.t === "img" && ov.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={ov.id ?? i}
              src={ov.src}
              alt=""
              className="absolute rounded-2xl shadow-2xl"
              style={{
                left: `${ov.x ?? 50}%`,
                top: `${ov.y ?? 50}%`,
                width: `${ov.w ?? 34}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ) : null,
        )}
      </div>
    ) : null;

  const isSplit = variant === "split-right";
  const isCompact = variant === "compact" || variant === "compact-cta";
  const minH = isCompact ? "min-h-[60vh]" : "min-h-[90vh]";

  const sharedKeyframes = (
    <style>{`
      @keyframes svm-mesh{0%{transform:translate(0,0) scale(1)}33%{transform:translate(2%,-2%) scale(1.08)}66%{transform:translate(-2%,2%) scale(0.96)}100%{transform:translate(0,0) scale(1)}}
      @keyframes svm-orb{0%,100%{transform:translate(0,0) scale(1);opacity:.5}50%{transform:translate(20px,-15px) scale(1.15);opacity:.75}}
      @keyframes svm-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      @keyframes svm-rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
      .svm-rise{animation:svm-rise .9s cubic-bezier(.22,.7,.2,1) both}
      .svm-rise-1{animation-delay:.05s}.svm-rise-2{animation-delay:.18s}.svm-rise-3{animation-delay:.32s}.svm-rise-4{animation-delay:.48s}
    `}</style>
  );

  if (isSplit) {
    return (
      <section
        className={`relative overflow-hidden ${minH}`}
        style={{
          background: `linear-gradient(135deg, #050507 0%, #0a0a0e 50%, #0f0f14 100%)`,
        }}
      >
        {/* Foto als achtergrond met donker overlay — alleen wanneer
            gebruiker een bg-foto heeft toegevoegd via +Foto. */}
        {bg && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bg})` }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, rgba(5,5,7,0.85) 0%, rgba(10,10,14,0.65) 50%, rgba(15,15,20,0.55) 100%)`,
              }}
            />
          </>
        )}
        {sharedKeyframes}
        {/* Animerende mesh-orbs */}
        <div
          className="pointer-events-none absolute right-0 top-1/4 h-[28rem] w-[28rem] rounded-full opacity-50 blur-[100px]"
          style={{
            background: accent,
            animation: "svm-orb 14s ease-in-out infinite",
          }}
        />
        <div
          className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 rounded-full opacity-30 blur-[80px]"
          style={{
            background: accent,
            animation: "svm-orb 18s ease-in-out infinite reverse",
          }}
        />
        {/* Subtiele grain-texture voor diepte */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-6 py-28 md:grid-cols-2 md:py-40">
          <div>
            {/* Eyebrow met gradient-lijn */}
            <div className="svm-rise svm-rise-1 flex items-center gap-3">
              <span
                className="h-px w-10"
                style={{
                  background: `linear-gradient(90deg, ${accent} 0%, transparent 100%)`,
                }}
              />
              <ET
                as="p"
                value={eyebrow}
                onChange={edit ? (v) => edit({ eyebrow: v }) : undefined}
                className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/70"
                placeholder="Eyebrow"
              />
            </div>
            <ET
              as="h1"
              value={heading}
              onChange={edit ? (v) => edit({ heading: v }) : undefined}
              className="svm-rise svm-rise-2 mt-6 block text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
              style={{
                backgroundImage: `linear-gradient(180deg, #ffffff 0%, #ffffff 55%, ${accent}cc 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
              placeholder="Hoofdtitel"
            />
            <ET
              as="p"
              value={sub}
              onChange={edit ? (v) => edit({ sub: v }) : undefined}
              className="svm-rise svm-rise-3 mt-7 max-w-md text-lg leading-relaxed text-white/65"
              placeholder="Korte ondertitel"
            />
            <div className="svm-rise svm-rise-4 mt-10 flex flex-wrap items-center gap-4">
              <span
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-medium text-white transition hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)`,
                  boxShadow: `0 16px 48px ${accent}66, 0 0 0 1px ${accent}33 inset`,
                }}
              >
                <ET
                  as="span"
                  value={button}
                  onChange={edit ? (v) => edit({ button: v }) : undefined}
                  className="relative z-10"
                  placeholder="Knop-tekst"
                />
                <span
                  aria-hidden
                  className="relative z-10 transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                · Premium · 2026
              </p>
            </div>
          </div>
          <div className="svm-rise svm-rise-3 relative">
            {/* Glass card met diepe shadow + reflectie */}
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/[0.08] backdrop-blur-xl"
              style={{
                background: bgRight
                  ? `url(${bgRight}) center/cover, linear-gradient(135deg, ${accent}33 0%, ${accent}0a 60%, rgba(255,255,255,0.02) 100%)`
                  : `linear-gradient(135deg, ${accent}33 0%, ${accent}0a 60%, rgba(255,255,255,0.02) 100%)`,
                boxShadow: `0 60px 120px -20px ${accent}33, 0 0 0 1px rgba(255,255,255,0.05) inset`,
              }}
            >
              {!bgRight && (
                <>
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-white/0 via-white/[0.04] to-white/[0.08]" />
                  <div className="absolute inset-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-white/0 backdrop-blur-sm" />
                </>
              )}
              {bgRight && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              )}
              {/* Mini stats overlay */}
              <div className="absolute bottom-8 left-8 right-8 grid grid-cols-3 gap-3">
                {[
                  { n: "12+", l: "jaar" },
                  { n: "200", l: "merken" },
                  { n: "4.9", l: "score" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-md"
                  >
                    <p
                      className="text-xl font-semibold"
                      style={{ color: accent }}
                    >
                      {s.n}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-white/50">
                      {s.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating decoratieve orb */}
            <div
              className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-60 blur-2xl"
              style={{
                background: accent,
                animation: "svm-orb 8s ease-in-out infinite",
              }}
            />
          </div>
        </div>
        {renderOverlays()}
      </section>
    );
  }

  return (
    <section
      className={`relative overflow-hidden ${minH}`}
      style={{
        background: `linear-gradient(180deg, #030305 0%, #0a0a0f 60%, #0f0f15 100%)`,
      }}
    >
      {sharedKeyframes}
      {/* Foto-achtergrond (alleen als +Foto toegevoegd is) */}
      {bg && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bg})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(3,3,5,0.78) 0%, rgba(10,10,15,0.72) 60%, rgba(15,15,21,0.85) 100%)`,
            }}
          />
        </>
      )}
      {/* Animerende gradient-mesh achterin */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 18% 22%, ${accent}55 0%, transparent 45%),
            radial-gradient(ellipse at 84% 76%, ${accent}77 0%, transparent 45%),
            radial-gradient(ellipse at 50% 50%, ${accent}22 0%, transparent 60%)
          `,
          animation: "svm-mesh 20s ease-in-out infinite",
        }}
      />
      {/* Pulsing orbs */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full opacity-40 blur-[120px]"
        style={{
          background: accent,
          animation: "svm-orb 16s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-25 blur-[100px]"
        style={{
          background: accent,
          animation: "svm-orb 22s ease-in-out infinite reverse",
        }}
      />
      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center px-6 py-32 text-center md:py-40">
        {/* Eyebrow met gradient-lijntjes */}
        <div className="svm-rise svm-rise-1 flex items-center gap-3">
          <span
            className="h-px w-10"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${accent} 100%)`,
            }}
          />
          <ET
            as="p"
            value={eyebrow}
            onChange={edit ? (v) => edit({ eyebrow: v }) : undefined}
            className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/70"
            placeholder="Eyebrow"
          />
          <span
            className="h-px w-10"
            style={{
              background: `linear-gradient(90deg, ${accent} 0%, transparent 100%)`,
            }}
          />
        </div>
        <ET
          as="h1"
          value={heading}
          onChange={edit ? (v) => edit({ heading: v }) : undefined}
          className="svm-rise svm-rise-2 mt-7 block text-balance text-6xl font-semibold leading-[1.02] tracking-tight sm:text-7xl md:text-8xl"
          style={{
            backgroundImage: `linear-gradient(180deg, #ffffff 0%, #ffffff 50%, ${accent}cc 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 4px 24px ${accent}55)`,
          }}
          placeholder="Jouw hoofdtitel hier"
        />
        <ET
          as="p"
          value={sub}
          onChange={edit ? (v) => edit({ sub: v }) : undefined}
          className="svm-rise svm-rise-3 mt-8 max-w-2xl text-balance text-lg leading-relaxed text-white/65 md:text-xl"
          placeholder="Korte ondertitel die de hoofdboodschap aanvult"
        />
        <div className="svm-rise svm-rise-4 mt-12 flex flex-wrap items-center justify-center gap-4">
          <span
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 text-base font-medium text-white transition hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)`,
              boxShadow: `0 20px 60px ${accent}77, 0 0 0 1px ${accent}55 inset`,
            }}
          >
            <ET
              as="span"
              value={button}
              onChange={edit ? (v) => edit({ button: v }) : undefined}
              className="relative z-10"
              placeholder="Knop-tekst"
            />
            <span
              aria-hidden
              className="relative z-10 transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/[0.08] hover:text-white"
          >
            Meer info
          </button>
        </div>
        {/* Subtle trust-indicators */}
        <div className="svm-rise svm-rise-4 mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
          <span>✦ Premium design</span>
          <span>✦ Volledig responsive</span>
          <span>✦ SEO-ready</span>
        </div>
      </div>
      {renderOverlays()}
    </section>
  );
}

// FeaturesHighTech v2 — luxury bento op donkere achtergrond met
// genummerde indicatoren, gradient-tiles, hover-tilt en gloeiende accent-
// orbs. Featured-cell krijgt eigen mini-illustratie via gradient.
export function FeaturesHighTech({
  d,
  accent,
  fg,
  edit,
}: {
  d: Record<string, unknown>;
  accent: string;
  fg: string;
  edit?: (patch: Record<string, unknown>) => void;
}) {
  void fg;
  const eyebrow = safeStr(d.eyebrow) || "Wat ons onderscheidt";
  const title = safeStr(d.title) || "Gemaakt om indruk te maken";
  const sub =
    safeStr(d.sub) ||
    "Elk merk verdient een digitale aanwezigheid die net zo verfijnd is als het verhaal erachter.";
  const rawItems = Array.isArray(d.items)
    ? (d.items as Record<string, unknown>[])
    : [];
  const items =
    rawItems.length > 0
      ? rawItems
      : [
          {
            title: "Maatwerk zonder grenzen",
            desc: "Elke pixel exact zoals het hoort. Geen template-klem, alleen jouw merk.",
          },
          { title: "Razend snel", desc: "Top-3% laadprestaties wereldwijd." },
          { title: "SEO-first", desc: "Bovenaan in Google, niet erna." },
          { title: "Toekomstvast", desc: "Schaalt mee met jouw groei." },
          { title: "Persoonlijk", desc: "Eén aanspreekpunt, geen ticket." },
        ];
  const slice = items.slice(0, 5);

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{
        background: `linear-gradient(180deg, #050507 0%, #0a0a0e 60%, #060608 100%)`,
      }}
    >
      <style>{`
        @keyframes svm-tilt{0%,100%{transform:rotate(0deg)}50%{transform:rotate(0.5deg)}}
      `}</style>
      {/* Decoratieve achtergrond-orbs */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-[80%] -translate-x-1/2 opacity-20 blur-[120px]"
        style={{ background: accent }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-3">
            <span
              className="h-px w-10"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent})`,
              }}
            />
            <ET
              as="p"
              value={eyebrow}
              onChange={edit ? (v) => edit({ eyebrow: v }) : undefined}
              className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/60"
              placeholder="Sectie-label"
            />
            <span
              className="h-px w-10"
              style={{
                background: `linear-gradient(90deg, ${accent}, transparent)`,
              }}
            />
          </div>
          <ET
            as="h2"
            value={title}
            onChange={edit ? (v) => edit({ title: v }) : undefined}
            className="mt-6 block text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl"
            style={{
              backgroundImage: `linear-gradient(180deg, #ffffff 0%, #ffffff 55%, ${accent}cc 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
            placeholder="Sectie-titel"
          />
          <ET
            as="p"
            value={sub}
            onChange={edit ? (v) => edit({ sub: v }) : undefined}
            className="mt-5 text-balance text-base leading-relaxed text-white/55 md:text-lg"
            placeholder="Korte ondertitel"
          />
        </div>
        <div className="mt-16 grid auto-rows-[minmax(200px,auto)] grid-cols-1 gap-5 md:grid-cols-3">
          <FBCell
            featured
            accent={accent}
            index={1}
            title={safeStr(slice[0]?.title)}
            desc={safeStr(slice[0]?.desc)}
            onChange={
              edit
                ? (patch) => {
                    const next = [...items];
                    next[0] = { ...(next[0] ?? {}), ...patch };
                    edit({ items: next });
                  }
                : undefined
            }
          />
          {slice.slice(1, 5).map((it, i) => (
            <FBCell
              key={i}
              accent={accent}
              index={i + 2}
              title={safeStr(it?.title)}
              desc={safeStr(it?.desc)}
              onChange={
                edit
                  ? (patch) => {
                      const next = [...items];
                      const idx = i + 1;
                      next[idx] = { ...(next[idx] ?? {}), ...patch };
                      edit({ items: next });
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FBCell({
  title,
  desc,
  accent,
  featured,
  index,
  onChange,
}: {
  title: string;
  desc: string;
  accent: string;
  featured?: boolean;
  index?: number;
  onChange?: (patch: { title?: string; desc?: string }) => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-white/15 md:p-9 ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
      style={{
        background: featured
          ? `linear-gradient(135deg, ${accent}1a 0%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0) 100%)`
          : `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
        boxShadow: featured
          ? `0 30px 80px -20px ${accent}33, 0 0 0 1px rgba(255,255,255,0.05) inset`
          : `0 8px 32px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset`,
        backdropFilter: "blur(20px)",
      }}
    >
      {featured && (
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
          style={{ background: accent }}
        />
      )}
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-3">
          <div
            className={`grid place-items-center rounded-xl text-white ${
              featured ? "h-12 w-12" : "h-10 w-10"
            }`}
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
              boxShadow: `0 8px 24px ${accent}55`,
            }}
          >
            <span className={featured ? "text-xl" : "text-base"}>✦</span>
          </div>
          {index !== undefined && (
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
              0{index} ·
            </span>
          )}
        </div>
        <ET
          as="h3"
          value={title}
          onChange={onChange ? (v) => onChange({ title: v }) : undefined}
          className={`mt-5 block font-semibold tracking-tight text-white ${
            featured ? "text-2xl sm:text-3xl md:text-4xl" : "text-lg"
          }`}
          placeholder="Eigenschap"
        />
        <ET
          as="p"
          value={desc}
          onChange={onChange ? (v) => onChange({ desc: v }) : undefined}
          className={`mt-3 leading-relaxed text-white/55 ${
            featured ? "text-base md:text-lg" : "text-sm"
          }`}
          placeholder="Korte uitleg waarom dit belangrijk is voor jouw klanten."
        />
        {featured && (
          <div className="mt-auto pt-6">
            <span
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] transition-transform group-hover:translate-x-1"
              style={{ color: accent }}
            >
              Ontdek meer →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// CtaHighTech v2 — luxury edition met conic-rotating gradient, glass-
// frame, dual-button (primary + ghost), gloeiende decoratie en eyebrow.
export function CtaHighTech({
  d,
  accent,
  edit,
}: {
  d: Record<string, unknown>;
  accent: string;
  edit?: (patch: Record<string, unknown>) => void;
}) {
  const eyebrow = safeStr(d.eyebrow) || "Volgende stap";
  const title = safeStr(d.title) || "Laten we iets moois bouwen";
  const text =
    safeStr(d.text) ||
    safeStr(d.sub) ||
    "Eén gesprek van 30 minuten en we weten of het klikt. Geen verkoop, geen druk — wel duidelijkheid.";
  const button = safeStr(d.button) || safeStr(d.ctaBtn) || "Plan een gesprek";

  return (
    <section className="relative overflow-hidden py-28 md:py-40">
      <style>{`
        @keyframes svm-conic{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
      {/* Animerende conic-gradient achterin */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #050507 0%, #0a0a0e 50%, #050507 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 opacity-25"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${accent} 90deg, transparent 180deg, ${accent}55 270deg, transparent 360deg)`,
          animation: "svm-conic 30s linear infinite",
          filter: "blur(80px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 18% 35%, ${accent}77 0%, transparent 50%),
            radial-gradient(circle at 82% 65%, ${accent}aa 0%, transparent 50%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Glass-frame met inhoud */}
        <div
          className="relative rounded-[2.5rem] border border-white/[0.08] px-8 py-16 backdrop-blur-2xl md:px-16 md:py-24"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
            boxShadow: `0 50px 100px -20px ${accent}44, 0 0 0 1px rgba(255,255,255,0.04) inset`,
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <span
              className="h-px w-10"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent})`,
              }}
            />
            <ET
              as="p"
              value={eyebrow}
              onChange={edit ? (v) => edit({ eyebrow: v }) : undefined}
              className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/70"
              placeholder="Volgende stap"
            />
            <span
              className="h-px w-10"
              style={{
                background: `linear-gradient(90deg, ${accent}, transparent)`,
              }}
            />
          </div>
          <ET
            as="h2"
            value={title}
            onChange={edit ? (v) => edit({ title: v }) : undefined}
            className="mt-7 block text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
            style={{
              backgroundImage: `linear-gradient(180deg, #ffffff 0%, #ffffff 50%, ${accent}cc 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: `drop-shadow(0 4px 24px ${accent}55)`,
            }}
            placeholder="Call-to-action titel"
          />
          <ET
            as="p"
            value={text}
            onChange={edit ? (v) => edit({ text: v }) : undefined}
            className="mx-auto mt-7 max-w-xl text-balance text-lg leading-relaxed text-white/65 md:text-xl"
            placeholder="Korte toelichting"
          />
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <span
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-9 py-4 text-base font-medium text-white transition hover:scale-[1.03]"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}dd 100%)`,
                boxShadow: `0 24px 64px ${accent}88, 0 0 0 1px ${accent}55 inset`,
              }}
            >
              <ET
                as="span"
                value={button}
                onChange={edit ? (v) => edit({ button: v }) : undefined}
                className="relative z-10"
                placeholder="Knop-tekst"
              />
              <span
                aria-hidden
                className="relative z-10 transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/[0.08] hover:text-white"
            >
              Bekijk portfolio
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// AboutHighTech v2 — luxe split met glass-image-frame, eyebrow met
// gradient-lijn, gradient-text titel, mini-stats blok onder de tekst.
export function AboutHighTech({
  d,
  accent,
  fg,
  variant,
  edit,
}: {
  d: Record<string, unknown>;
  accent: string;
  fg: string;
  variant: string;
  edit?: (patch: Record<string, unknown>) => void;
}) {
  void fg;
  const eyebrow = safeStr(d.eyebrow) || "Het verhaal";
  const title = safeStr(d.title) || "Waarom mensen voor ons kiezen";
  const text =
    safeStr(d.text) ||
    safeStr(d.aboutText) ||
    "We bouwen niet zomaar websites. We vertellen verhalen die blijven hangen, met design dat ademt en techniek die naadloos werkt. Geen template-aanpak, geen compromis.";
  const isLong = variant === "long-form";

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{
        background: `linear-gradient(180deg, #060608 0%, #0a0a0e 50%, #060608 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute right-0 top-1/4 h-96 w-96 rounded-full opacity-20 blur-[100px]"
        style={{ background: accent }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2 md:gap-20">
        <div className="order-2 md:order-1">
          <div className="flex items-center gap-3">
            <span
              className="h-px w-10"
              style={{
                background: `linear-gradient(90deg, ${accent}, transparent)`,
              }}
            />
            <ET
              as="p"
              value={eyebrow}
              onChange={edit ? (v) => edit({ eyebrow: v }) : undefined}
              className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/70"
              placeholder="Sectie-label"
            />
          </div>
          <ET
            as="h2"
            value={title}
            onChange={edit ? (v) => edit({ title: v }) : undefined}
            className="mt-6 block text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl"
            style={{
              backgroundImage: `linear-gradient(180deg, #ffffff 0%, #ffffff 60%, ${accent}cc 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
            placeholder="Sectie-titel"
          />
          <ET
            as="p"
            value={text}
            onChange={edit ? (v) => edit({ text: v }) : undefined}
            className={`mt-7 text-balance leading-relaxed text-white/65 ${
              isLong ? "text-base md:text-lg" : "text-lg md:text-xl"
            }`}
            placeholder="Vertel hier kort jullie verhaal."
          />
          {isLong && (
            <p className="mt-5 text-balance text-base leading-relaxed text-white/55">
              Klein team, persoonlijke aanpak. Elk project krijgt onze
              volledige aandacht. Eén aanspreekpunt van eerste schets tot
              live-gaan en daarna. Geen lange Slack-threads of ticket-
              systemen — gewoon een korte mail en het is geregeld.
            </p>
          )}
          {/* Mini stats-row */}
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/[0.08] pt-8">
            {[
              { n: "12+", l: "jaar ervaring" },
              { n: "200+", l: "merken geholpen" },
              { n: "4.9", l: "tevredenheidsscore" },
            ].map((s) => (
              <div key={s.l}>
                <p
                  className="text-2xl font-semibold tracking-tight md:text-3xl"
                  style={{ color: accent }}
                >
                  {s.n}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-white/45">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="relative">
            {/* Hoofd-image-frame: glass + gradient + diepe shadow */}
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/[0.08] backdrop-blur-xl"
              style={{
                background: `linear-gradient(135deg, ${accent}33 0%, ${accent}0a 60%, rgba(255,255,255,0.02) 100%)`,
                boxShadow: `0 50px 100px -20px ${accent}44, 0 0 0 1px rgba(255,255,255,0.05) inset`,
              }}
            >
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08]" />
              <div className="absolute inset-8 rounded-3xl border border-white/[0.08]" />
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-3xl"
                style={{ background: accent }}
              />
            </div>
            {/* Floating badge linksboven het frame */}
            <div
              className="absolute -left-4 -top-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl"
              style={{ boxShadow: `0 16px 48px rgba(0,0,0,0.5)` }}
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                Sinds 2014
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                Verfijnd vakmanschap
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlockView({
  block,
  fg,
  bg,
  accent,
  soft,
  loc,
}: {
  block: Block;
  fg: string;
  bg: string;
  accent: string;
  soft: string;
  loc?: string;
}) {
  const d = block.data || {};
  const L = rt(loc);
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
      // High-tech variant? Korte route naar de moderne render.
      const _v = typeof d._variant === "string" ? (d._variant as string) : "";
      if (HIGHTECH_HERO_VARIANTS.has(_v)) {
        return <HeroHighTech d={d} accent={accent} variant={_v} />;
      }
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
    case "hours": {
      // Alleen "features" mag high-tech. De andere blijven klassiek.
      if (block.kind === "features") {
        const _v =
          typeof d._variant === "string" ? (d._variant as string) : "";
        if (HIGHTECH_FEATURES_VARIANTS.has(_v)) {
          return <FeaturesHighTech d={d} accent={accent} fg={fg} />;
        }
      }
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
    }
    case "about": {
      const _v = typeof d._variant === "string" ? (d._variant as string) : "";
      if (HIGHTECH_ABOUT_VARIANTS.has(_v)) {
        return <AboutHighTech d={d} accent={accent} fg={fg} variant={_v} />;
      }
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
    }
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
            {L.photosApart}
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
    case "cta": {
      const _vCta =
        typeof d._variant === "string" ? (d._variant as string) : "";
      if (HIGHTECH_CTA_VARIANTS.has(_vCta)) {
        return <CtaHighTech d={d} accent={accent} />;
      }
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
    }
    case "contact": {
      const cf = arr(d.items);
      const crows: Record<string, string>[] =
        cf.length > 0
          ? cf
          : [
              { label: L.name, type: "text", req: "1" },
              { label: L.email, type: "email", req: "1" },
              { label: L.message, type: "textarea", req: "1" },
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
              const lbl = String(fl.label || `${L.field} ${i + 1}`);
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
              {s(d.button) || L.send}
            </span>
            <p
              className="mt-1 rounded px-3 py-1.5 text-[11px]"
              style={{ background: `${okC}1f`, color: okC }}
            >
              {s(d._okText) || L.thanks}
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
                  {s(d._cardTitle) || L.contactInfo}
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
                  {String(fl.label || `${L.field} ${i + 1}`)}
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
              {s(d.button) || L.send}
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
