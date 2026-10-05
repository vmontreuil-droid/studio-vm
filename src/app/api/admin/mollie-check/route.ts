// Controle van de Mollie-koppeling — enkel lezen, nooit de sleutel zelf.
//
// Zegt of de sleutel live of test is, bij welk Mollie-profiel hij hoort
// (naam + website: moet "Studio VM" / studio-vm.be zijn, niet het oude
// profiel) en welke betaalmethodes op dat profiel actief zijn.
//
// GET met Bearer CRON_SECRET, of als aangemelde admin.

import { NextResponse, type NextRequest } from "next/server";
import { cronSecret, mollieApiKey, paymentsEnabled } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const API = "https://api.mollie.com/v2";

async function vraag(pad: string): Promise<{ ok: boolean; status: number; json: Record<string, unknown> | null }> {
  try {
    const res = await fetch(`${API}${pad}`, {
      headers: { Authorization: `Bearer ${mollieApiKey}` },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: null };
  }
}

export async function GET(req: NextRequest) {
  const viaCron = !!cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`;
  if (!viaCron && !(await requireAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Soort sleutel aan het voorvoegsel; de sleutel zelf verlaat de server nooit.
  const soort = mollieApiKey.startsWith("live_")
    ? "live"
    : mollieApiKey.startsWith("test_")
      ? "test"
      : mollieApiKey.startsWith("access_")
        ? "organisatietoken (niet de API-sleutel)"
        : mollieApiKey.startsWith("pfl_")
          ? "profiel-ID (niet de API-sleutel)"
          : mollieApiKey.startsWith("org_")
            ? "organisatie-ID (niet de API-sleutel)"
            : mollieApiKey
              ? "onbekend"
              : "geen";
  if (soort === "geen") return NextResponse.json({ sleutel: "geen", betalingenAan: paymentsEnabled });
  const ruw = process.env.MOLLIE_API_KEY ?? "";
  const extra = {
    lengte: mollieApiKey.length,
    ...(ruw !== mollieApiKey ? { opgeschoond: "spaties of aanhalingstekens rond de sleutel weggeknipt" } : {}),
  };
  if (soort !== "live" && soort !== "test") return NextResponse.json({ sleutel: soort, ...extra, betalingenAan: paymentsEnabled });

  const [profiel, methodes] = await Promise.all([vraag("/profiles/me"), vraag("/methods?locale=nl_BE")]);
  const p = profiel.json;
  const lijst = (methodes.json?._embedded as { methods?: { id: string; description: string; status?: string }[] } | undefined)?.methods ?? [];

  return NextResponse.json({
    sleutel: soort,
    ...extra,
    betalingenAan: paymentsEnabled,
    sleutelWerkt: methodes.ok,
    profiel: profiel.ok && p ? { naam: p.name ?? null, website: p.website ?? null, status: p.status ?? null } : { fout: profiel.status },
    methodes: lijst.map((m) => m.id),
    ...(methodes.ok ? {} : { fout: `Mollie antwoordt ${methodes.status}` }),
  });
}
