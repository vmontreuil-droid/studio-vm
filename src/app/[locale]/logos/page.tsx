import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logo picker — Studio VM",
  description: "Tijdelijke pagina om een logo te kiezen.",
  robots: { index: false, follow: false },
};

const ACCENT = "#f59e0b";

type LogoProps = { fg: string; bg: string };

const logos: { n: number; label: string; Render: (p: LogoProps) => React.ReactNode }[] = [
  {
    n: 1,
    label: "Wordmark",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        studio-vm
      </span>
    ),
  },
  {
    n: 2,
    label: "Caps + dot",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-2xl font-bold tracking-[0.25em]"
      >
        STUDIO·VM
      </span>
    ),
  },
  {
    n: 3,
    label: "Em-dash",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        studio—vm
      </span>
    ),
  },
  {
    n: 4,
    label: "Slash",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        studio<span style={{ color: ACCENT }}>/</span>vm
      </span>
    ),
  },
  {
    n: 5,
    label: "Period",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        studio<span style={{ color: ACCENT }}>.</span>vm
      </span>
    ),
  },
  {
    n: 6,
    label: "Reverse",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        vm<span style={{ color: ACCENT }}>·</span>studio
      </span>
    ),
  },
  {
    n: 7,
    label: "Closing tag",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        vm<span style={{ color: ACCENT }}>/</span>
      </span>
    ),
  },
  {
    n: 8,
    label: "JSX tag",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        <span style={{ color: ACCENT }}>&lt;</span>vm
        <span style={{ color: ACCENT }}>/&gt;</span>
      </span>
    ),
  },
  {
    n: 9,
    label: "Function call",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        vm<span style={{ color: ACCENT }}>()</span>
      </span>
    ),
  },
  {
    n: 10,
    label: "Code block",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        <span style={{ color: ACCENT }}>{"{"}</span>vm
        <span style={{ color: ACCENT }}>{"}"}</span>
      </span>
    ),
  },
  {
    n: 11,
    label: "Square solid",
    Render: ({ fg, bg }) => (
      <span
        className="inline-flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: fg }}
      >
        <span
          style={{ color: bg }}
          className="font-sans text-xl font-bold tracking-tighter"
        >
          VM
        </span>
      </span>
    ),
  },
  {
    n: 12,
    label: "Square outline",
    Render: ({ fg }) => (
      <span
        className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2"
        style={{ borderColor: fg, color: fg }}
      >
        <span className="font-sans text-xl font-bold tracking-tighter">VM</span>
      </span>
    ),
  },
  {
    n: 13,
    label: "Square accent",
    Render: ({ bg }) => (
      <span
        className="inline-flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: ACCENT }}
      >
        <span
          style={{ color: bg }}
          className="font-sans text-xl font-bold tracking-tighter"
        >
          VM
        </span>
      </span>
    ),
  },
  {
    n: 14,
    label: "Circle solid",
    Render: ({ fg, bg }) => (
      <span
        className="inline-flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: fg }}
      >
        <span
          style={{ color: bg }}
          className="font-sans text-xl font-bold tracking-tighter"
        >
          VM
        </span>
      </span>
    ),
  },
  {
    n: 15,
    label: "Bracket monogram",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-4xl font-semibold tracking-tight"
      >
        <span style={{ color: ACCENT }}>[</span>VM
        <span style={{ color: ACCENT }}>]</span>
      </span>
    ),
  },
  {
    n: 16,
    label: "Dot monogram",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-4xl font-semibold tracking-tighter"
      >
        V<span style={{ color: ACCENT }}>·</span>M
      </span>
    ),
  },
  {
    n: 17,
    label: "Block + wordmark",
    Render: ({ fg }) => (
      <span className="inline-flex items-center gap-3" style={{ color: fg }}>
        <span
          aria-hidden
          className="h-5 w-5 rounded-md"
          style={{ background: ACCENT }}
        />
        <span className="font-mono text-2xl font-semibold tracking-tight">
          studio-vm
        </span>
      </span>
    ),
  },
  {
    n: 18,
    label: "Wordmark + period",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        studio-vm<span style={{ color: ACCENT }}>.</span>
      </span>
    ),
  },
  {
    n: 19,
    label: "Terminal prompt",
    Render: ({ fg }) => (
      <span
        style={{ color: fg }}
        className="font-mono text-3xl font-semibold tracking-tight"
      >
        <span style={{ color: ACCENT }}>›</span>{" "}
        <span>studio-vm</span>
        <span
          className="ml-0.5 inline-block w-2 align-baseline"
          style={{ background: fg, height: 28 }}
          aria-hidden
        />
      </span>
    ),
  },
  {
    n: 20,
    label: "Stamp monogram",
    Render: ({ fg, bg }) => (
      <span
        className="relative inline-flex h-16 w-16 items-center justify-center rounded-xl"
        style={{ background: fg }}
      >
        <span
          style={{ color: bg }}
          className="font-mono text-lg font-bold leading-none"
        >
          VM
        </span>
        <span
          className="absolute inset-x-3 bottom-2 h-0.5"
          style={{ background: ACCENT }}
          aria-hidden
        />
      </span>
    ),
  },
];

export default function LogosPage() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Logo picker
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Kies een logo voor Studio VM
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            20 voorstellen, elk in licht- en donker-variant. Stuur me het nummer dat je
            leuk vindt — ik werk 'm dan door in header, favicon, OG-image en social.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {logos.map((logo) => (
              <article
                key={logo.n}
                className="overflow-hidden rounded-2xl border bg-card"
              >
                <div className="flex min-h-[140px] items-center justify-center px-6 py-10" style={{ background: "#fafaf9" }}>
                  <logo.Render fg="#1c1917" bg="#fafaf9" />
                </div>
                <div className="flex min-h-[140px] items-center justify-center px-6 py-10" style={{ background: "#0c0a09" }}>
                  <logo.Render fg="#fafaf9" bg="#0c0a09" />
                </div>
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <span className="font-mono text-xs text-muted">{logo.label}</span>
                  <span className="rounded-full bg-background px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
                    #{String(logo.n).padStart(2, "0")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Welke wordt het?
          </h2>
          <p className="mt-4 text-muted">
            Geef me 't nummer in chat (bv. "logo 11"). Ik ververs dan header, favicon,
            apple-icon, OG-image en de social cards.
          </p>
        </div>
      </section>
    </main>
  );
}
