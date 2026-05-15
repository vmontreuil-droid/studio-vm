export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

function Tile({
  n,
  name,
  desc,
  children,
}: {
  n: number;
  name: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        Optie {n} · {name}
      </p>
      <p className="mt-1 text-sm text-muted">{desc}</p>
      <div className="mt-5 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
        <div className="flex min-h-[150px] items-center justify-center bg-[#fafaf9] p-8 text-[#1c1917]">
          {children}
        </div>
        <div className="flex min-h-[150px] items-center justify-center bg-[#0c0a09] p-8 text-[#fafaf9]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function LogoPreview() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Logo-concepten
      </h1>
      <p className="mt-2 text-sm text-muted">
        Zes richtingen, links op licht, rechts op donker. Laat me weten welk
        nummer — dan zet ik het door in header, menu, footer, favicon en
        social-share.
      </p>

      <div className="mt-10 space-y-6">
        {/* 1 — Wordmark Studio VM */}
        <Tile
          n={1}
          name="Wordmark “Studio VM”"
          desc="Strak, professioneel, leest meteen als een studio."
        >
          <div className="text-center leading-none">
            <span className="block font-mono text-[11px] uppercase tracking-[0.45em] text-[#b45309]">
              Studio
            </span>
            <span className="mt-1 block text-5xl font-extrabold tracking-tight">
              VM
            </span>
          </div>
        </Tile>

        {/* 2 — Monogram-tegel */}
        <Tile
          n={2}
          name="Monogram-tegel"
          desc="Sterk icoon, perfect als app-/favicon. Herkenbaar op klein formaat."
        >
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#b45309] text-2xl font-extrabold text-white">
              VM
            </span>
            <span className="text-3xl font-bold tracking-tight">
              Studio&nbsp;VM
            </span>
          </div>
        </Tile>

        {/* 3 — Dev-tag verfijnd */}
        <Tile
          n={3}
          name="Dev-tag “&lt;vm /&gt;” (groter & vetter)"
          desc="Houdt je developer-identiteit, maar veel duidelijker dan nu."
        >
          <span className="text-4xl font-extrabold tracking-tight">
            <span className="text-[#b45309]">&lt;</span>
            vm
            <span className="text-[#b45309]">&nbsp;/&gt;</span>
          </span>
        </Tile>

        {/* 4 — vm. minimal */}
        <Tile
          n={4}
          name="“vm.” minimaal"
          desc="Modern en vriendelijk. Eén sterke punt in accentkleur."
        >
          <span className="text-6xl font-extrabold lowercase tracking-tighter">
            vm<span className="text-[#b45309]">.</span>
          </span>
        </Tile>

        {/* 5 — Geometrisch VM-merk + wordmark */}
        <Tile
          n={5}
          name="Geometrisch VM-merk"
          desc="Eigen icoon (V/M uit één vorm) naast de naam — meest ‘merk’."
        >
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
              <rect
                x="2"
                y="2"
                width="60"
                height="60"
                rx="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.25"
              />
              <path
                d="M14 18 L26 46 L32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 32 L38 46 L50 18"
                fill="none"
                stroke="#b45309"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-3xl font-bold tracking-tight">
              Studio&nbsp;VM
            </span>
          </div>
        </Tile>

        {/* 6 — Accolades */}
        <Tile
          n={6}
          name="Accolades “{ vm }”"
          desc="Speels-technisch, opvallend, blijft schaalbaar."
        >
          <span className="text-4xl font-extrabold tracking-tight">
            <span className="text-[#b45309]">{"{"}</span>
            &nbsp;vm&nbsp;
            <span className="text-[#b45309]">{"}"}</span>
          </span>
        </Tile>
      </div>
    </main>
  );
}
