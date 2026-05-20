import { NextResponse, type NextRequest } from "next/server";
import { checkVies } from "@/lib/vies";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

// Parseert het VIES-adres ("Straat 12, 9000 Gent") naar componenten.
// VIES levert het meestal komma-gescheiden; sommige landen op één regel.
function parseAddress(addr: string): {
  street: string;
  postal_code: string;
  city: string;
} {
  if (!addr) return { street: "", postal_code: "", city: "" };
  const parts = addr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return { street: addr, postal_code: "", city: "" };
  // Laatste stuk: typisch "<postcode> <stad>" (BE/NL/FR/LU/DE).
  const last = parts[parts.length - 1];
  const m = last.match(/^(\d{4,5})\s+(.+)$/);
  if (!m) return { street: addr, postal_code: "", city: "" };
  return {
    street: parts.slice(0, -1).join(", "),
    postal_code: m[1],
    city: m[2],
  };
}

export async function GET(req: NextRequest) {
  const vat = (req.nextUrl.searchParams.get("vat") || "").trim();
  if (!vat || vat.replace(/[^A-Z0-9]/gi, "").length < 6) {
    return NextResponse.json({ ok: false, reason: "te kort" });
  }
  const res = await checkVies(vat);
  if (!res) {
    return NextResponse.json({ ok: false, reason: "vies onbereikbaar" });
  }
  if (res.valid === false) {
    return NextResponse.json({
      ok: false,
      valid: false,
      reason: "ongeldig btw-nummer",
    });
  }
  if (!res.name) {
    return NextResponse.json({
      ok: false,
      valid: res.valid,
      reason: "geen gegevens beschikbaar",
    });
  }
  const addr = parseAddress(res.address || "");
  return NextResponse.json({
    ok: true,
    valid: true,
    country: res.country,
    name: res.name,
    ...addr,
  });
}
