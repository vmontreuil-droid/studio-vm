// TIJDELIJKE debug-route — verwijderen na CRON_SECRET-debug.
// Lekt GEEN secret-waarden, alleen: aanwezig? lengte? match?
// Te verwijderen zodra outreach-pipeline draait.

import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const envSecret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return NextResponse.json({
    envSecretPresent: envSecret.length > 0,
    envSecretLength: envSecret.length,
    envSecretFirst4: envSecret.slice(0, 4),
    envSecretLast4: envSecret.slice(-4),
    receivedHeaderPresent: auth.length > 0,
    receivedHeaderLength: auth.length,
    receivedHasBearer: auth.startsWith("Bearer "),
    receivedBearerLength: bearer.length,
    receivedFirst4: bearer.slice(0, 4),
    receivedLast4: bearer.slice(-4),
    exactMatch: bearer === envSecret,
  });
}
