import { SITE } from "@/lib/seo";
import { BEDRIJF, FUNCTIE, LAND } from "@/lib/bedrijf";
import { MINIMUM_UREN, UURTARIEF_CENT, euro } from "@/lib/tarieven";

// /llms.txt — korte, feitelijke samenvatting voor taalmodellen
// (https://llmstxt.org). Wordt bij de build opgebouwd; de prijzen komen
// uit src/lib/tarieven.ts zodat ze nooit afwijken van de tarievenpagina.
export const dynamic = "force-static";

// Intl zet een vaste spatie (U+00A0) tussen € en het bedrag; in platte
// tekst liever een gewone spatie.
const prijs = (cent: number) => euro(cent, "nl").replace(/ /g, " ");

function inhoud(): string {
  const uren = MINIMUM_UREN === 1 ? "uur" : "uren";
  return [
    "# Studio VM",
    "",
    `> Studio VM (${FUNCTIE.nl}, ${BEDRIJF.gemeente}, ${LAND.nl}) maakt 3D-ontwerpmodellen voor GPS-machinesturing van graafmachines, graders en dozers: ontwerpoppervlak (TIN), lijnwerk en breeklijnen, hoogtelijnen en hellingscontrole, geleverd in het formaat van Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu en Caterpillar, in het juiste nationale coördinatenstelsel en de juiste hoogtereferentie, voor aannemers in heel Europa.`,
    "",
    `Uurtarief excl. btw: ${prijs(UURTARIEF_CENT.vroegtijdig)} vroegtijdig (meer dan 3 weken op voorhand), ${prijs(UURTARIEF_CENT.normaal)} normaal (levering binnen 1 à 3 weken), ${prijs(UURTARIEF_CENT["last-minute"])} last-minute (binnen 5 werkdagen). Minimum ${MINIMUM_UREN} ${uren}. Extra machinesystemen zonder meerprijs.`,
    "",
    "## Pagina's",
    "",
    `- [3D-modellen voor machinesturing](${SITE}/nl/3d-modellen)`,
    `- [Tarieven](${SITE}/nl/tarieven)`,
    `- [Offerte aanvragen](${SITE}/nl/offerte)`,
    `- [Realisaties](${SITE}/nl/realisaties)`,
    `- [Kennisbank](${SITE}/nl/kennis)`,
    `- [Over Studio VM](${SITE}/nl/over)`,
    `- [English](${SITE}/en)`,
    `- [Français](${SITE}/fr)`,
    `- [Deutsch](${SITE}/de)`,
    `- [Español](${SITE}/es)`,
    "",
    "## Contact",
    "",
    `${BEDRIJF.email} · ${BEDRIJF.telefoon} · ${BEDRIJF.straat}, ${BEDRIJF.postcode} ${BEDRIJF.gemeente}, ${LAND.nl} · ${BEDRIJF.btw}`,
    "",
  ].join("\n");
}

export function GET() {
  return new Response(inhoud(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
