// Oud adres van de social-kaarten: /api/social-image/{post_id}[?format=story].
// Het beeldsysteem staat nu op /beeld/social/{id}/{formaat}.jpg (buiten /api/,
// dat robots.txt blokkeert). Deze route stuurt enkel door, zodat oude links
// in mails, de admin en al geplaatste berichten blijven werken.
//
// ?format=story → het staande 1080×1920-beeld; anders het 1200×630-beeld.
// Een ?v= gaat mee, zodat de cache van het nieuwe adres klopt.

import { socialBeeldPad } from "@/lib/social/beeld-url";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const formaat = url.searchParams.get("format") === "story" ? "story" : "og";
  const v = url.searchParams.get("v") ?? undefined;
  // 307: tijdelijk, zodat niemand het oude adres voorgoed vastlegt.
  return Response.redirect(new URL(socialBeeldPad(id, formaat, v), url.origin), 307);
}
