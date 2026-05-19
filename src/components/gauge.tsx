// Zachte radiale gauge (Shiko-stijl). Pure SVG, server-renderbaar.
export function Gauge({
  value,
  label,
  sub,
}: {
  value: number; // 0..100
  label: string;
  sub?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = 70;
  const c = Math.PI * r; // halve cirkel
  const off = c - (v / 100) * c;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 180 100"
        className="w-full max-w-[220px]"
        role="img"
        aria-label={`${label}: ${v}%`}
      >
        <path
          d="M 20 95 A 70 70 0 0 1 160 95"
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          className="text-card-hover"
        />
        <path
          d="M 20 95 A 70 70 0 0 1 160 95"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
        <text
          x="90"
          y="78"
          textAnchor="middle"
          className="fill-foreground text-[26px] font-bold"
        >
          {v}%
        </text>
      </svg>
      <p className="mt-1 text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
