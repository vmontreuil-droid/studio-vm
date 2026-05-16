// EU VIES BTW-validatie. Geen sleutel nodig; publieke REST-API.
// Geeft { valid, name } terug; bij twijfel/onbereikbaar valid=null.
export type ViesResult = {
  country: string;
  number: string;
  valid: boolean | null;
  name: string | null;
  address: string | null;
};

export async function checkVies(raw: string): Promise<ViesResult | null> {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = clean.match(/^([A-Z]{2})(.+)$/);
  if (!m) return null;
  const country = m[1];
  const number = m[2];
  try {
    const res = await fetch(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: country, vatNumber: number }),
        // VIES kan traag/plat zijn; nooit de offerte-opslag blokkeren.
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok)
      return { country, number, valid: null, name: null, address: null };
    const j = (await res.json()) as {
      isValid?: boolean;
      name?: string;
      address?: string;
    };
    const tidy = (v?: string) =>
      v && v !== "---" ? v.replace(/\s*\n\s*/g, ", ").trim() : null;
    return {
      country,
      number,
      valid: typeof j.isValid === "boolean" ? j.isValid : null,
      name: tidy(j.name),
      address: tidy(j.address),
    };
  } catch {
    return { country, number, valid: null, name: null, address: null };
  }
}
