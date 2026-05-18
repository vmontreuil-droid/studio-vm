import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = {
  // Stabiel, uniek per grafiek op de pagina (gebruikt voor gradient-id's).
  id: string;
  history: number[];
  projection?: number[];
  labels?: string[];
  height?: number;
  caption?: string;
  trend?: number | null;
  format?: (n: number) => string;
};

const W = 640;

function smoothPath(pts: [number, number][]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const r = (n: number) => Math.round(n * 100) / 100;
  let d = `M${r(pts[0][0])},${r(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${r(c1x)},${r(c1y)} ${r(c2x)},${r(c2y)} ${r(p2[0])},${r(p2[1])}`;
  }
  return d;
}

export function TrendChart({
  id,
  history,
  projection = [],
  labels,
  height = 132,
  caption,
  trend,
  format = (n) => String(Math.round(n)),
}: Props) {
  const all = [...history, ...projection];
  const hasData = history.length > 0 && all.some((v) => v !== 0);

  const H = height;
  const padT = 14;
  const padB = 22;
  const innerH = H - padT - padB;
  const total = all.length;

  let body: React.ReactNode;
  if (!hasData || total < 2) {
    body = (
      <div
        className="flex items-center justify-center text-sm text-muted"
        style={{ height: H }}
      >
        Nog te weinig data voor een trend.
      </div>
    );
  } else {
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    if (lo > 0) lo = 0;
    if (hi === lo) hi = lo + 1;
    hi += (hi - lo) * 0.12;

    const x = (i: number) => (i / (total - 1)) * W;
    const y = (v: number) => padT + innerH - ((v - lo) / (hi - lo)) * innerH;

    const histPts = history.map(
      (v, i) => [x(i), y(v)] as [number, number],
    );
    const joinIdx = history.length - 1;
    const projPts =
      projection.length > 0
        ? ([
            [x(joinIdx), y(history[joinIdx])],
            ...projection.map(
              (v, i) =>
                [x(joinIdx + 1 + i), y(v)] as [number, number],
            ),
          ] as [number, number][])
        : [];

    const histLine = smoothPath(histPts);
    const baseY = padT + innerH;
    const histArea = histLine
      ? `${histLine} L${Math.round(x(joinIdx))},${baseY} L0,${baseY} Z`
      : "";
    const projLine = smoothPath(projPts);

    const last = history[history.length - 1];
    const peak = Math.max(...history);
    const peakI = history.indexOf(peak);

    const tick = (i: number) =>
      labels && labels[i] ? labels[i] : "";
    const xLabels = (() => {
      if (!labels) return [];
      const idxs = new Set<number>([
        0,
        Math.floor((history.length - 1) / 2),
        history.length - 1,
      ]);
      return [...idxs].map((i) => ({ i, t: tick(i) })).filter((o) => o.t);
    })();

    body = (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-[var(--ch)] w-full"
        style={{ ["--ch" as string]: `${H}px` }}
        role="img"
        aria-label={caption ?? "trendgrafiek"}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="currentColor"
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor="currentColor"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1="0"
            x2={W}
            y1={padT + innerH * g}
            y2={padT + innerH * g}
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray="2 5"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {histArea && (
          <path
            d={histArea}
            fill={`url(#${id}-fill)`}
            className="text-accent"
          />
        )}
        {histLine && (
          <path
            d={histLine}
            fill="none"
            className="stroke-accent"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {projLine && (
          <>
            <line
              x1={x(joinIdx)}
              x2={x(joinIdx)}
              y1={padT}
              y2={padT + innerH}
              className="stroke-muted"
              strokeWidth="1"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={projLine}
              fill="none"
              className="stroke-muted"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="5 5"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={x(total - 1)}
              cy={y(all[all.length - 1])}
              r="3.5"
              className="fill-muted"
            />
          </>
        )}

        <circle
          cx={x(joinIdx)}
          cy={y(last)}
          r="3.5"
          className="fill-accent"
        />
        {peakI >= 0 && peak !== last && (
          <circle
            cx={x(peakI)}
            cy={y(peak)}
            r="2.5"
            className="fill-accent/60"
          />
        )}

        {xLabels.map(({ i, t }) => (
          <text
            key={i}
            x={Math.min(Math.max(x(i), 14), W - 14)}
            y={H - 6}
            textAnchor="middle"
            className="fill-muted font-mono text-[18px]"
          >
            {t}
          </text>
        ))}
      </svg>
    );
  }

  return (
    <div className="text-accent">
      {(caption || trend != null) && (
        <div className="flex items-center justify-between gap-3">
          {caption && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {caption}
            </p>
          )}
          {trend != null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
                trend > 0
                  ? "bg-green-500/15 text-green-600 dark:text-green-400"
                  : trend < 0
                    ? "bg-red-500/15 text-red-500"
                    : "bg-muted/15 text-muted"
              }`}
            >
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
              ) : trend < 0 ? (
                <TrendingDown className="h-3 w-3" strokeWidth={2.5} />
              ) : (
                <Minus className="h-3 w-3" strokeWidth={2.5} />
              )}
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          )}
        </div>
      )}
      <div className={caption || trend != null ? "mt-3" : ""}>{body}</div>
      {hasData && projection.length > 0 && (
        <p className="mt-2 font-mono text-[10px] text-muted">
          Doorgetrokken = werkelijk · gestippeld = prognose (
          {format(history[history.length - 1])} →{" "}
          {format(projection[projection.length - 1])})
        </p>
      )}
    </div>
  );
}
