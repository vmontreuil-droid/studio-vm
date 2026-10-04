import { maakMerkkaart } from "@/lib/social/merkkaart";
import { paginaKaart } from "@/lib/social/paginakaart";

// Wortelkaart (interne routes + global-not-found): de Nederlandse merkkaart
// van de startpagina, als JPEG. Geen persoonsnaam: de kaart spreekt als
// Studio VM ("vm." bovenaan).
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const alt = "Studio VM — 3D-modellen voor machinesturing";

export default async function OG() {
  const beeld = await maakMerkkaart(paginaKaart("nl", "home")!, "og");
  return new Response(new Uint8Array(beeld.data), { headers: { "content-type": beeld.contentType } });
}
