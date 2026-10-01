// ─────────────────────────────────────────────────────────────────────────
// Coördinatenstelsel + hoogtereferentie voorstellen op basis van de werf.
//
// Dit is een VOORSTEL voor de offerte, geen uitspraak: een aannemer kan met
// een lokaal werfstelsel of een eigen kalibratie werken. Daarom vraagt het
// formulier daar apart naar, en zegt de mail "voorstel".
//
// Volgorde: land (verplicht) → eventueel verfijnd met lengte/breedte uit het
// werfadres (UTM-zone, Franse CC-zone, Oostenrijkse meridiaan).
// ─────────────────────────────────────────────────────────────────────────

export type StelselVoorstel = {
  stelsel: string; // bv. "Belgian Lambert 72"
  epsg: string; // bv. "EPSG:31370"
  hoogte: string; // bv. "TAW (Oostende)"
  opmerking?: string;
};

// Europese landen waarvoor het formulier een werf aanvaardt (EU + EER + CH + VK).
export const LANDEN = [
  "AT", "BE", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR",
  "HR", "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MT", "NL", "NO", "PL", "PT",
  "RO", "SE", "SI", "SK",
] as const;

export type Land = (typeof LANDEN)[number];

export function isLand(x: string): x is Land {
  return (LANDEN as readonly string[]).includes(x);
}

function utmZone(lon: number): number {
  return Math.min(38, Math.max(28, Math.floor((lon + 180) / 6) + 1));
}

function etrsUtm(lon: number | null, standaard: number): { zone: number; epsg: string } {
  const zone = lon == null ? standaard : utmZone(lon);
  return { zone, epsg: `EPSG:${25800 + zone}` };
}

export function stelselVoor(land: Land, lat: number | null, lon: number | null): StelselVoorstel {
  switch (land) {
    case "BE":
      return {
        stelsel: "Belgian Lambert 72",
        epsg: "EPSG:31370",
        hoogte: "TAW / DNG (Oostende)",
        opmerking: "Lambert 2008 (EPSG:3812) is ook mogelijk als het plan daarin getekend is.",
      };
    case "NL":
      return { stelsel: "Amersfoort / RD New", epsg: "EPSG:28992", hoogte: "NAP" };
    case "LU":
      return { stelsel: "LUREF / Luxembourg TM", epsg: "EPSG:2169", hoogte: "NG95" };
    case "FR": {
      // Lambert-93 is nationaal; voor werven gebruikt men vaak de conische
      // CC-zone (CC42–CC50) van de breedtegraad, met kleinere vervorming.
      const cc = lat == null ? null : Math.min(50, Math.max(42, Math.round(lat)));
      return {
        stelsel: cc ? `RGF93 / CC${cc}` : "RGF93 / Lambert-93",
        epsg: cc ? `EPSG:${3900 + cc}` : "EPSG:2154",
        hoogte: "NGF-IGN69",
        opmerking: cc ? "Lambert-93 (EPSG:2154) als het plan nationaal getekend is." : undefined,
      };
    }
    case "DE": {
      const u = etrsUtm(lon, 32);
      return { stelsel: `ETRS89 / UTM zone ${u.zone}N`, epsg: u.epsg, hoogte: "DHHN2016" };
    }
    case "AT": {
      // MGI / Austria GK — meridiaan M28, M31 of M34 volgens de lengtegraad.
      const m = lon == null ? 31 : lon < 11.83 ? 28 : lon < 14.83 ? 31 : 34;
      const epsg = m === 28 ? "EPSG:31254" : m === 31 ? "EPSG:31255" : "EPSG:31256";
      return { stelsel: `MGI / Austria GK M${m}`, epsg, hoogte: "GHA (Triest)" };
    }
    case "CH":
    case "LI":
      return { stelsel: "CH1903+ / LV95", epsg: "EPSG:2056", hoogte: "LN02 / LHN95" };
    case "GB":
      return { stelsel: "OSGB36 / British National Grid", epsg: "EPSG:27700", hoogte: "ODN (Newlyn)" };
    case "IE":
      return { stelsel: "IRENET95 / Irish Transverse Mercator", epsg: "EPSG:2157", hoogte: "Malin Head" };
    case "ES": {
      const u = etrsUtm(lon, 30);
      return { stelsel: `ETRS89 / UTM zone ${u.zone}N`, epsg: u.epsg, hoogte: "REDNAP (Alicante)" };
    }
    case "PT":
      return { stelsel: "ETRS89 / Portugal TM06", epsg: "EPSG:3763", hoogte: "Cascais" };
    case "IT": {
      const zone = lon == null ? 32 : lon < 12 ? 32 : 33;
      return {
        stelsel: `RDN2008 / UTM zone ${zone}N`,
        epsg: zone === 32 ? "EPSG:6707" : "EPSG:6708",
        hoogte: "Genova (IGM)",
      };
    }
    case "PL":
      return { stelsel: "ETRF2000-PL / CS92", epsg: "EPSG:2180", hoogte: "PL-EVRF2007-NH" };
    case "CZ":
    case "SK":
      return { stelsel: "S-JTSK / Krovak East North", epsg: "EPSG:5514", hoogte: "Bpv (Baltisch)" };
    case "DK":
      return { stelsel: "ETRS89 / UTM zone 32N", epsg: "EPSG:25832", hoogte: "DVR90" };
    case "SE":
      return { stelsel: "SWEREF99 TM", epsg: "EPSG:3006", hoogte: "RH 2000" };
    case "FI":
      return { stelsel: "ETRS89 / TM35FIN", epsg: "EPSG:3067", hoogte: "N2000" };
    case "NO": {
      const u = etrsUtm(lon, 32);
      return { stelsel: `ETRS89 / UTM zone ${u.zone}N`, epsg: u.epsg, hoogte: "NN2000" };
    }
    default: {
      const u = etrsUtm(lon, 33);
      return {
        stelsel: `ETRS89 / UTM zone ${u.zone}N`,
        epsg: u.epsg,
        hoogte: "EVRF2007",
        opmerking: "Algemeen Europees voorstel — nationaal stelsel nog te bevestigen.",
      };
    }
  }
}
