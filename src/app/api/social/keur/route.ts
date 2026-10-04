// Goedkeuren of overslaan vanuit het weekoverzicht, zonder admin-aanmelding.
//
//   GET  /api/social/keur?t=…  → bevestigingspagina met voorbeeld. Verandert
//                                 niets, dus linkscanners en voorladers die de
//                                 link openen keuren niets goed.
//   POST /api/social/keur      → t=… uit het formulier van die pagina. De
//                                 sleutel wordt in één UPDATE opgeëist
//                                 (used_at is null en niet verlopen) en
//                                 verandert ENKEL de status van dat bericht.
//
// De sleutels zelf staan nergens: in goedkeur_tokens staat enkel hun SHA-256.
// Publiceren gebeurt pas op scheduled_for en kan in de wachtrij nog gestopt
// worden. Buiten /admin en buiten de taal-middleware (api/ wordt overgeslagen).
//
// Referrer: de globale headers uit next.config overschrijven die van deze
// route. De pagina zet daarom zelf <meta name="referrer" content="strict-origin">:
// de POST krijgt zo een echte Origin (geen "null") en de sleutel uit het
// adres lekt niet via de Referer.

import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";
import { NIET_ACTIEF, bevestiging, pagina, verwerkVerzoek, type Antwoord } from "./keur";

export const dynamic = "force-dynamic";

function antwoord(a: Antwoord): Response {
  return new Response(a.html, {
    status: a.status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "strict-origin",
    },
  });
}

export async function GET(req: NextRequest) {
  if (!monitorConfigured) return antwoord(pagina(503, NIET_ACTIEF));
  return antwoord(await bevestiging(getSupabaseAdmin(), req.nextUrl.searchParams.get("t")));
}

export async function POST(req: NextRequest) {
  if (!monitorConfigured) return antwoord(pagina(503, NIET_ACTIEF));
  return antwoord(await verwerkVerzoek(req, getSupabaseAdmin()));
}
