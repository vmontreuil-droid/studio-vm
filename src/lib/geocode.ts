import "server-only";

export type WerfLigging = {
  lat: number;
  lon: number;
  label: string;
  /** "adres" = straat gevonden; "gemeente" = enkel postcode/gemeente (benadering). */
  nauwkeurigheid: "adres" | "gemeente";
} | null;

async function nominatim(params: Record<string, string>, bron: string) {
  const q = new URLSearchParams({ format: "json", limit: "1", ...params });
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, {
      headers: { "User-Agent": `studio-vm.be ${bron} (info@studio-vm.be)` },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { lat: string; lon: string; display_name: string }[];
    return j[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Ligging van een werf via OpenStreetMap Nominatim (laag volume, met
 * verplichte User-Agent). Een nieuwe of onbekende straat geeft geen treffer;
 * dan vallen we terug op postcode + gemeente, zodat het stelsel (UTM-zone,
 * Franse CC-zone…) en de kaart toch kloppen voor de streek.
 */
export async function zoekWerf(
  straat: string,
  postcode: string,
  gemeente: string,
  land: string,
  bron = "offerte",
): Promise<WerfLigging> {
  const basis = { countrycodes: land.toLowerCase() };
  const pogingen: { params: Record<string, string>; nauwkeurigheid: "adres" | "gemeente" }[] = [];
  if (straat) {
    pogingen.push({
      params: { ...basis, street: straat, ...(postcode ? { postalcode: postcode } : {}), ...(gemeente ? { city: gemeente } : {}) },
      nauwkeurigheid: "adres",
    });
  }
  if (postcode || gemeente) {
    pogingen.push({
      params: { ...basis, ...(postcode ? { postalcode: postcode } : {}), ...(gemeente ? { city: gemeente } : {}) },
      nauwkeurigheid: "gemeente",
    });
  }
  if (postcode && gemeente) {
    pogingen.push({ params: { ...basis, city: gemeente }, nauwkeurigheid: "gemeente" });
  }
  for (const p of pogingen) {
    const hit = await nominatim(p.params, bron);
    if (hit) {
      return { lat: Number(hit.lat), lon: Number(hit.lon), label: hit.display_name, nauwkeurigheid: p.nauwkeurigheid };
    }
  }
  return null;
}
