// Read-only visuele weergave van een builder-ontwerp, zoals de klant het
// maakte. Server-component (geen hooks/events) — gebruikt in de admin.

type Block = { kind: string; data: Record<string, unknown> };
type SnapPage = { name: string; blocks: Block[] };
type Snap = {
  businessName?: string;
  colors?: { bg?: string; fg?: string; accent?: string };
  radius?: string;
  pages?: SnapPage[];
};

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
  const bg = snap.colors?.bg || "#ffffff";
  const fg = snap.colors?.fg || "#111111";
  const accent = snap.colors?.accent || "#b45309";
  const rad = radiusPx(snap.radius);
  const soft = `${fg}1a`;
  const businessName = snap.businessName || "Website";

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

            {page.blocks.map((b, bi) => (
              <BlockView
                key={bi}
                block={b}
                fg={fg}
                bg={bg}
                accent={accent}
                soft={soft}
              />
            ))}
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
    case "hero":
      return (
        <div className="px-6 py-12 text-center">
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: accent }}
          >
            {s(d.eyebrow)}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {s(d.heading) || s(d.title)}
          </h2>
          <p className="mt-2 text-sm opacity-70">{s(d.sub)}</p>
          {s(d.button) && (
            <span
              className="mt-5 inline-block rounded-full px-4 py-1.5 text-xs font-medium"
              style={{ background: accent, color: bg }}
            >
              {s(d.button)}
            </span>
          )}
        </div>
      );
    case "features":
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
            {items.map((it, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 text-xs"
                style={border}
              >
                {Object.entries(it).map(([k, v]) =>
                  v ? (
                    <p key={k} className="leading-relaxed">
                      <span className="opacity-50">{k}: </span>
                      {String(v)}
                    </p>
                  ) : null,
                )}
              </div>
            ))}
          </div>
        </div>
      );
    case "about":
      return (
        <div className="border-t px-6 py-10" style={border}>
          <div className="mx-auto grid max-w-2xl gap-5 sm:grid-cols-[1fr_1.4fr]">
            <div
              className="aspect-[4/3] rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${accent}33, ${fg}11)`,
              }}
            />
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
    case "map":
      return (
        <div className="border-t px-6 py-10" style={border}>
          <H>{s(d.title)}</H>
          <div
            className="mx-auto mt-5 max-w-xl rounded-lg border py-10 text-center text-sm font-medium"
            style={{
              ...border,
              background: `linear-gradient(135deg, ${accent}1f, ${fg}0d)`,
            }}
          >
            {s(d.address) || "—"}
          </div>
        </div>
      );
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
    default:
      return (
        <div className="border-t px-6 py-6 text-xs" style={border}>
          <p className="font-mono opacity-50">{block.kind}</p>
        </div>
      );
  }
}
