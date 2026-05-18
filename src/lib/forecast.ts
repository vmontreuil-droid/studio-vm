// Lichtgewicht prognoses zonder dependencies. Lineaire kleinste-kwadraten
// over een reeks (index = tijdstap) → projectie van de volgende stappen.

export type Fit = { slope: number; intercept: number };

export function linearFit(values: number[]): Fit {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += values[i];
    sxx += i * i;
    sxy += i * values[i];
  }
  const d = n * sxx - sx * sx;
  if (d === 0) return { slope: 0, intercept: sy / n };
  const slope = (n * sxy - sx * sy) / d;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

// Projecteer `periods` stappen vooruit. Negatieve uitkomsten worden op 0
// geklemd (tellingen/geld kunnen niet onder nul). `damp` < 1 dempt de
// trend zodat een steile lijn niet onrealistisch doorschiet.
export function forecast(
  values: number[],
  periods: number,
  opts: { clampZero?: boolean; damp?: number } = {},
): number[] {
  const { clampZero = true, damp = 0.85 } = opts;
  if (values.length === 0) return Array(periods).fill(0);
  const { slope, intercept } = linearFit(values);
  const n = values.length;
  const out: number[] = [];
  for (let k = 1; k <= periods; k++) {
    const d = Math.pow(damp, k - 1);
    let v = intercept + slope * (n - 1 + k * d);
    if (clampZero && v < 0) v = 0;
    out.push(v);
  }
  return out;
}

// Verschil tussen de eerstvolgende prognose en de laatste waarde, als
// percentage. Handig voor een "↗ +12%"-label.
export function trendPct(values: number[]): number | null {
  if (values.length < 2) return null;
  const last = values[values.length - 1];
  const next = forecast(values, 1)[0];
  if (last === 0) return next === 0 ? 0 : null;
  return Math.round(((next - last) / Math.abs(last)) * 100);
}
