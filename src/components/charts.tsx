// Lichtgewicht grafiek-primitieven (pure SVG/CSS, server-safe, geen
// library, geen client-JS). Naast TrendChart + Gauge.

type Seg = { label: string; value: number; color: string };

// Donut met legende — voor verdelingen (status, categorie, …).
export function Donut({
  segments,
  centerTop,
  centerSub,
  size = 150,
}: {
  segments: Seg[];
  centerTop?: string;
  centerSub?: string;
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 60;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg
        viewBox="0 0 160 160"
        style={{ width: size, height: size }}
        role="img"
      >
        <g transform="rotate(-90 80 80)">
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.10"
            strokeWidth="18"
          />
          {total > 0 &&
            segments.map((s, i) => {
              if (s.value <= 0) return null;
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={i}
                  cx="80"
                  cy="80"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="18"
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-acc}
                  strokeLinecap="butt"
                />
              );
              acc += len;
              return el;
            })}
        </g>
        {centerTop && (
          <text
            x="80"
            y="76"
            textAnchor="middle"
            className="fill-foreground"
            fontSize="20"
            fontWeight="700"
          >
            {centerTop}
          </text>
        )}
        {centerSub && (
          <text
            x="80"
            y="95"
            textAnchor="middle"
            className="fill-muted"
            fontSize="10"
            fontFamily="ui-monospace, monospace"
          >
            {centerSub}
          </text>
        )}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-muted">{s.label}</span>
            <span className="ml-auto pl-4 font-mono text-xs">
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Horizontale gelabelde balken — voor toplijsten / verdelingen.
export function BarList({
  items,
  format,
  color = "var(--accent)",
}: {
  items: { label: string; value: number }[];
  format?: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-muted">Geen gegevens.</p>
      )}
      {items.map((i) => (
        <div key={i.label}>
          <div className="flex justify-between font-mono text-[11px] text-muted">
            <span className="truncate pr-2">{i.label}</span>
            <span className="shrink-0">
              {format ? format(i.value) : i.value}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-card-hover">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, (i.value / max) * 100)}%`,
                background: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Compacte sectie-titel boven een grafiek (Shiko-stijl).
export function ChartCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {title}
        </p>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
