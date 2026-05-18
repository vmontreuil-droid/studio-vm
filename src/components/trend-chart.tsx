// Vloeiende vlak-/lijngrafiek in pure SVG (server-safe, geen library,
// geen client-JS). Catmull-Rom → Bézier voor een zachte curve, met
// verloop-vulling, eindpunt-stip en x-labels.
type Pt = { label: string; value: number };

export function TrendChart({
  points,
  color = "var(--accent)",
  id,
  height = 132,
  unit = "",
}: {
  points: Pt[];
  color?: string;
  id: string;
  height?: number;
  unit?: string;
}) {
  const W = 640;
  const H = height;
  const padX = 8;
  const padT = 18;
  const padB = 22;
  const n = points.length;
  const max = Math.max(1, ...points.map((p) => p.value));
  const innerW = W - padX * 2;
  const innerH = H - padT - padB;

  const xy = points.map((p, i) => {
    const x = padX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padT + innerH - (p.value / max) * innerH;
    return [x, y] as const;
  });

  // Catmull-Rom → cubische Bézier voor een vloeiende curve.
  const line = (() => {
    if (xy.length === 0) return "";
    if (xy.length === 1) return `M ${xy[0][0]} ${xy[0][1]}`;
    let d = `M ${xy[0][0]} ${xy[0][1]}`;
    for (let i = 0; i < xy.length - 1; i++) {
      const p0 = xy[i - 1] ?? xy[i];
      const p1 = xy[i];
      const p2 = xy[i + 1];
      const p3 = xy[i + 2] ?? p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(
        2,
      )} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
    }
    return d;
  })();

  const area =
    xy.length > 0
      ? `${line} L ${xy[xy.length - 1][0]} ${padT + innerH} L ${
          xy[0][0]
        } ${padT + innerH} Z`
      : "";

  const last = xy[xy.length - 1];
  const gid = `tg-${id}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-4 w-full"
      style={{ height: H }}
      preserveAspectRatio="none"
      role="img"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* subtiele baseline */}
      <line
        x1={padX}
        x2={W - padX}
        y1={padT + innerH}
        y2={padT + innerH}
        stroke="currentColor"
        strokeOpacity="0.12"
      />

      {area && <path d={area} fill={`url(#${gid})`} />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* eindpunt */}
      {last && (
        <>
          <circle
            cx={last[0]}
            cy={last[1]}
            r={6}
            fill={color}
            fillOpacity="0.18"
          />
          <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
        </>
      )}

      {/* waarde-labels boven elk punt */}
      {xy.map(([x, y], i) => (
        <text
          key={`v${i}`}
          x={x}
          y={y - 8}
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
          fillOpacity="0.55"
          fontFamily="ui-monospace, monospace"
        >
          {points[i].value}
          {unit}
        </text>
      ))}

      {/* x-as labels */}
      {xy.map(([x], i) => (
        <text
          key={`x${i}`}
          x={x}
          y={H - 6}
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          fillOpacity="0.45"
          fontFamily="ui-monospace, monospace"
        >
          {points[i].label}
        </text>
      ))}
    </svg>
  );
}
