"use client";

// Leaflet-kaart van de werven — enkel in de browser geladen (zie werven-kaart.tsx).
//
// - Ondergrond volgt het thema (donker/licht) en wisselt live mee
//   (MutationObserver op <html>) met een zachte overvloeiing. Zie lagenVoor().
// - Pinnen: pulserende stippen in de statuskleur; sterker bij hover/selectie.
// - Werven die op het scherm te dicht bij elkaar liggen, vormen een bundel
//   (ring met de statusverdeling + aantal). Klik = inzoomen; liggen ze op
//   dezelfde plek, dan een lijstje.
// - Legende = filter: een statusgroep aan- of uitklikken (enkel op de kaart).
// - Breed: popup-kaartje bij de pin. Smal (< 640 px): blad onderaan de kaart.
// - Knop "vergroten": de kaart over (bijna) het hele scherm.
// - Scrollwiel zoomt pas na een klik of focus op de kaart; op een aanraakscherm
//   verschuift één vinger pas na een tik (anders scrolt de pagina gewoon door).
// - Stijlen: sectie "Werven-kaart" onderaan src/app/globals.css.
//
// Extra (optioneel, voor de werfkaart in de admin; zonder deze props blijft
// alles zoals hierboven): luchtfoto als ondergrond + wisselknop, legende
// zonder filter, scrollwiel meteen actief, "passend zoomen" en "vlieg naar
// een werf en open haar popup" van buitenaf. Nul punten mag dan ook.

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import { AttributionControl, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { ArrowRight, Map as KaartIcoon, MapPin, Maximize2, Minimize2, Minus, Plus, Satellite, Scan, X, Zap } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { WERF_GROEPEN, werfGroep, type WerfGroep, type WerfPunt } from "@/lib/werf-punten";

type Hint = "wiel" | "aanraking";
type Zet = Dispatch<SetStateAction<string | null>>;

/** Ondergrond van de kaart: themakaart (licht/donker volgens het thema) of luchtfoto. */
export type OndergrondSoort = "kaart" | "luchtfoto";
/** Verzoek van buitenaf: vlieg naar deze werf en open ze (n telt op, ook voor dezelfde werf). */
export type KaartFocus = { id: string; n: number };
/** Na het vliegen: popup openen van de pin of bundel met deze sleutel. */
type OpenVraag = { sleutel: string; n: number };

const TXT: Record<
  Locale,
  {
    kaart: string;
    openen: string;
    sluiten: string;
    inzoomen: string;
    uitzoomen: string;
    alles: string;
    groter: string;
    kleiner: string;
    wiel: string;
    aanraking: string;
    osm: string;
    /** Slot van de Esri-bronvermelding ("and the GIS user community"). */
    gis: string;
    filter: string;
    tonen: (groep: string) => string;
    verbergen: (groep: string) => string;
    zonder: (n: number) => string;
    bundel: (n: number) => string;
    bundelZoom: string;
    opDezePlek: (n: number) => string;
    groep: Record<WerfGroep, string>;
    ondergrond: string;
    kaartLaag: string;
    luchtfoto: string;
  }
> = {
  nl: {
    kaart: "Kaart van de werven",
    openen: "Openen",
    sluiten: "Sluiten",
    inzoomen: "Inzoomen",
    uitzoomen: "Uitzoomen",
    alles: "Alle werven tonen",
    groter: "Kaart vergroten",
    kleiner: "Kaart verkleinen",
    wiel: "Klik op de kaart om te zoomen",
    aanraking: "Tik op de kaart om ze te verschuiven",
    osm: "OpenStreetMap-bijdragers",
    gis: "en de GIS-gebruikersgemeenschap",
    filter: "Filter op status",
    tonen: (g) => `${g} tonen`,
    verbergen: (g) => `${g} verbergen`,
    zonder: (n) => `${n} zonder locatie`,
    bundel: (n) => `${n} werven`,
    bundelZoom: "klik om in te zoomen",
    opDezePlek: (n) => `${n} werven op deze plek`,
    groep: { open: "Aanvraag & offerte", bezig: "In uitvoering", klaar: "Geleverd", grijs: "Geannuleerd" },
    ondergrond: "Ondergrond",
    kaartLaag: "Kaart",
    luchtfoto: "Luchtfoto",
  },
  fr: {
    kaart: "Carte des chantiers",
    openen: "Ouvrir",
    sluiten: "Fermer",
    inzoomen: "Zoom avant",
    uitzoomen: "Zoom arrière",
    alles: "Afficher tous les chantiers",
    groter: "Agrandir la carte",
    kleiner: "Réduire la carte",
    wiel: "Cliquez sur la carte pour zoomer",
    aanraking: "Touchez la carte pour la déplacer",
    osm: "contributeurs OpenStreetMap",
    gis: "et la communauté des utilisateurs SIG",
    filter: "Filtrer par statut",
    tonen: (g) => `Afficher : ${g}`,
    verbergen: (g) => `Masquer : ${g}`,
    zonder: (n) => `${n} sans localisation`,
    bundel: (n) => `${n} chantiers`,
    bundelZoom: "cliquez pour zoomer",
    opDezePlek: (n) => `${n} chantiers à cet endroit`,
    groep: { open: "Demande & devis", bezig: "En cours", klaar: "Livré", grijs: "Annulé" },
    ondergrond: "Fond de carte",
    kaartLaag: "Carte",
    luchtfoto: "Photo aérienne",
  },
  en: {
    kaart: "Map of the sites",
    openen: "Open",
    sluiten: "Close",
    inzoomen: "Zoom in",
    uitzoomen: "Zoom out",
    alles: "Show all sites",
    groter: "Enlarge map",
    kleiner: "Reduce map",
    wiel: "Click the map to zoom",
    aanraking: "Tap the map to move it",
    osm: "OpenStreetMap contributors",
    gis: "and the GIS user community",
    filter: "Filter by status",
    tonen: (g) => `Show ${g}`,
    verbergen: (g) => `Hide ${g}`,
    zonder: (n) => `${n} without location`,
    bundel: (n) => `${n} sites`,
    bundelZoom: "click to zoom in",
    opDezePlek: (n) => `${n} sites at this location`,
    groep: { open: "Request & quote", bezig: "In progress", klaar: "Delivered", grijs: "Cancelled" },
    ondergrond: "Base map",
    kaartLaag: "Map",
    luchtfoto: "Aerial photo",
  },
  de: {
    kaart: "Karte der Baustellen",
    openen: "Öffnen",
    sluiten: "Schließen",
    inzoomen: "Hineinzoomen",
    uitzoomen: "Herauszoomen",
    alles: "Alle Baustellen anzeigen",
    groter: "Karte vergrößern",
    kleiner: "Karte verkleinern",
    wiel: "Klicken Sie auf die Karte, um zu zoomen",
    aanraking: "Tippen Sie auf die Karte, um sie zu verschieben",
    osm: "OpenStreetMap-Mitwirkende",
    gis: "und die GIS-Anwendergemeinschaft",
    filter: "Nach Status filtern",
    tonen: (g) => `${g} einblenden`,
    verbergen: (g) => `${g} ausblenden`,
    zonder: (n) => `${n} ohne Standort`,
    bundel: (n) => `${n} Baustellen`,
    bundelZoom: "zum Vergrößern klicken",
    opDezePlek: (n) => `${n} Baustellen an diesem Ort`,
    groep: { open: "Anfrage & Angebot", bezig: "In Bearbeitung", klaar: "Geliefert", grijs: "Storniert" },
    ondergrond: "Grundkarte",
    kaartLaag: "Karte",
    luchtfoto: "Luftbild",
  },
  es: {
    kaart: "Mapa de las obras",
    openen: "Abrir",
    sluiten: "Cerrar",
    inzoomen: "Acercar",
    uitzoomen: "Alejar",
    alles: "Mostrar todas las obras",
    groter: "Ampliar el mapa",
    kleiner: "Reducir el mapa",
    wiel: "Haga clic en el mapa para hacer zoom",
    aanraking: "Toque el mapa para moverlo",
    osm: "colaboradores de OpenStreetMap",
    gis: "y la comunidad de usuarios de SIG",
    filter: "Filtrar por estado",
    tonen: (g) => `Mostrar: ${g}`,
    verbergen: (g) => `Ocultar: ${g}`,
    zonder: (n) => `${n} sin ubicación`,
    bundel: (n) => `${n} obras`,
    bundelZoom: "haga clic para acercar",
    opDezePlek: (n) => `${n} obras en este lugar`,
    groep: { open: "Solicitud y presupuesto", bezig: "En curso", klaar: "Entregado", grijs: "Cancelado" },
    ondergrond: "Mapa base",
    kaartLaag: "Mapa",
    luchtfoto: "Foto aérea",
  },
};

// ── Ondergrond ─────────────────────────────────────────────────────────────
// CARTO (Dark Matter / Positron) vraagt sinds 2026 een sleutel; zonder sleutel
// komt er "API KEY REQUIRED" over elke tegel. Gratis sleutel (1M tegels per
// maand commercieel) via carto.com/basemaps/apikey → NEXT_PUBLIC_CARTO_KEY.
// Zonder sleutel: Esri Canvas (donker- of lichtgrijs + aparte laag met namen),
// dezelfde rustige stijl, met de bronvermelding die Esri voorschrijft
// ("Powered by Esri" + de copyrighttekst van de dienst). Voor productie hoort
// daar volgens de voorwaarden van Esri een ArcGIS-account bij: liefst de
// CARTO-sleutel zetten.
const CARTO_SLEUTEL = process.env.NEXT_PUBLIC_CARTO_KEY ?? "";

type Laag = { sleutel: string; url: string; attributie: string; maxNativeZoom: number };

const link = (href: string, tekst: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${tekst}</a>`;

/** Wat de ondergrond toont: themakaart (donker of licht) of luchtfoto. */
type Stijl = "donker" | "licht" | "luchtfoto";

// Luchtfoto: Esri World Imagery (wereldwijd, ook BE/NL/FR) met een aparte,
// doorzichtige laag met grenzen en plaatsnamen erover. Bronvermelding zoals
// Esri ze voorschrijft ("Powered by Esri" + de copyrighttekst van beide diensten).
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";

function lagenVoor(stijl: Stijl, taal: Locale): Laag[] {
  const t = TXT[taal];
  const osmBron = `© ${link("https://www.openstreetmap.org/copyright", t.osm)}`;
  if (stijl === "luchtfoto") {
    const bron = `Powered by ${link("https://www.esri.com", "Esri")} · Esri, Vantor, Earthstar Geographics, HERE, Garmin, ${osmBron} ${t.gis}`;
    return [
      { sleutel: "esri-luchtfoto", url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, attributie: bron, maxNativeZoom: 19 },
      {
        sleutel: "esri-luchtfoto-namen",
        url: `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`,
        attributie: bron,
        maxNativeZoom: 19,
      },
    ];
  }
  const donker = stijl === "donker";
  if (CARTO_SLEUTEL) {
    const stijl = donker ? "dark_all" : "light_all";
    return [
      {
        sleutel: `carto-${stijl}`,
        url: `https://basemaps.cartocdn.com/${stijl}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CARTO_SLEUTEL)}`,
        attributie: `${osmBron} © ${link("https://carto.com/attributions", "CARTO")}`,
        maxNativeZoom: 20,
      },
    ];
  }
  const kleur = donker ? "Dark" : "Light";
  const bron = `Powered by ${link("https://www.esri.com", "Esri")} · Esri, HERE, Garmin, ${osmBron} ${t.gis}`;
  return ["Base", "Reference"].map((deel) => ({
    sleutel: `esri-${kleur}-${deel}`,
    url: `${ESRI}/Canvas/World_${kleur}_Gray_${deel}/MapServer/tile/{z}/{y}/{x}`,
    attributie: bron,
    maxNativeZoom: 16,
  }));
}

// Ruimte voor de legende (links boven) en de knoppen (rechts boven); één werf
// komt zo op zoomniveau 14 in beeld.
const PASSEN: L.FitBoundsOptions = { paddingTopLeft: [40, 72], paddingBottomRight: [64, 40], maxZoom: 14 };
const MAX_ZOOM = 19;
// Beeld zonder één punt (enkel de werfkaart met filters): België en omstreken.
const LEEG_MIDDEN: L.LatLngTuple = [50.6, 4.4];
const LEEG_ZOOM = 7;

/** Beeld na het laatste "passend maken"; null zodra iemand zelf verschuift of zoomt. */
type Stand = { z: number; c: L.LatLng };

/** Alle werven in beeld brengen en dat beeld onthouden (zie staatPassend). */
function passen(map: L.Map, grenzen: L.LatLngBounds, stand: RefObject<Stand | null>, hoe: "direct" | "glij" | "vlieg") {
  map.once("moveend", () => {
    stand.current = { z: map.getZoom(), c: map.getCenter() };
  });
  if (hoe === "vlieg") map.flyToBounds(grenzen, { ...PASSEN, duration: 0.6 });
  else map.fitBounds(grenzen, { ...PASSEN, animate: hoe === "glij" });
}

/** Staat de kaart nog op het passende beeld (niet zelf verschoven of gezoomd)? */
function staatPassend(map: L.Map, stand: Stand | null): boolean {
  if (!stand || map.getZoom() !== stand.z) return false;
  return map.project(map.getCenter(), stand.z).distanceTo(map.project(stand.c, stand.z)) < 2;
}

/** Bedienbare elementen in de kaart (voor de focusval van "vergroten"). */
function focusbaar(r: HTMLElement): HTMLElement[] {
  return [...r.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(
    (el) => !el.closest("[inert]") && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden",
  );
}

/**
 * Popup of blad geopend met het toetsenbord (Enter op een pin)? Dan de focus
 * meteen naar de eerste knop erin, anders zit de inhoud achter alle pinnen
 * in de tabvolgorde. Met muis of vinger blijft de focus waar ze is.
 */
function useFocusBijToets(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const actief = document.activeElement;
    if (actief instanceof HTMLElement && actief.matches(".leaflet-marker-icon:focus-visible")) {
      ref.current?.focus({ preventScroll: true });
    }
  }, [ref]);
}

const isEnter = (e: L.LeafletKeyboardEvent) => e.originalEvent.key === "Enter";

// ── Thema van <html> volgen ────────────────────────────────────────────────
function leesDonker(): boolean {
  const r = document.documentElement;
  if (r.classList.contains("theme-dark") || r.dataset.theme === "dark") return true;
  if (r.classList.contains("theme-light") || r.dataset.theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function volgThema(melding: () => void) {
  const mo = new MutationObserver(melding);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", melding);
  return () => {
    mo.disconnect();
    mq.removeEventListener("change", melding);
  };
}

// Smal scherm: blad onderaan i.p.v. popup (een popup past niet in 280 px).
const SMAL = "(max-width: 639px)";
function leesSmal(): boolean {
  return window.matchMedia(SMAL).matches;
}
function volgSmal(melding: () => void) {
  const mq = window.matchMedia(SMAL);
  mq.addEventListener("change", melding);
  return () => mq.removeEventListener("change", melding);
}

// ── Bundelen ───────────────────────────────────────────────────────────────
// 1. Pinnen die op het huidige zoomniveau dichter dan STRAAL px bij elkaar
//    liggen, worden één bundel (gretig, met een veeg langs x: ook 1000 werven
//    blijven vlot).
// 2. Bundels/pinnen waarvan de iconen elkaar dan nog zouden raken, smelten
//    samen tot niets meer overlapt.
const STRAAL = 44;

type Bundel = { sleutel: string; punten: WerfPunt[]; lat: number; lon: number };
type Lid = { p: WerfPunt; i: number; x: number; y: number };
type Groep = { leden: Lid[]; x: number; y: number };

/** Doorsnede van het icoon in px (zie bundelIcoon; een losse pin oogt ~18 px). */
function maatVan(n: number): number {
  return n === 1 ? 18 : n < 10 ? 38 : n < 100 ? 44 : 50;
}

function bundelen(punten: WerfPunt[], map: L.Map, zoom: number): Bundel[] {
  const pts: Lid[] = punten
    .map((p, i) => {
      const xy = map.project([p.lat, p.lon], zoom);
      return { p, i, x: xy.x, y: xy.y };
    })
    .sort((a, b) => a.x - b.x || a.y - b.y);

  const genomen = new Uint8Array(pts.length);
  let groepen: Groep[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (genomen[i]) continue;
    genomen[i] = 1;
    const leden = [pts[i]];
    for (let j = i + 1; j < pts.length && pts[j].x - pts[i].x <= STRAAL; j++) {
      if (genomen[j]) continue;
      const dx = pts[j].x - pts[i].x;
      const dy = pts[j].y - pts[i].y;
      if (dx * dx + dy * dy <= STRAAL * STRAAL) {
        genomen[j] = 1;
        leden.push(pts[j]);
      }
    }
    groepen.push({
      leden,
      x: leden.reduce((s, l) => s + l.x, 0) / leden.length,
      y: leden.reduce((s, l) => s + l.y, 0) / leden.length,
    });
  }

  const BEREIK = maatVan(1000) + 4;
  for (let samen = true; samen; ) {
    samen = false;
    groepen.sort((a, b) => a.x - b.x);
    const weg = new Uint8Array(groepen.length);
    for (let i = 0; i < groepen.length; i++) {
      if (weg[i]) continue;
      const a = groepen[i];
      for (let j = i + 1; j < groepen.length && groepen[j].x - a.x <= BEREIK; j++) {
        if (weg[j]) continue;
        const b = groepen[j];
        const min = (maatVan(a.leden.length) + maatVan(b.leden.length)) / 2 + 4;
        if ((b.x - a.x) ** 2 + (b.y - a.y) ** 2 >= min * min) continue;
        const n = a.leden.length + b.leden.length;
        a.x = (a.x * a.leden.length + b.x * b.leden.length) / n;
        a.y = (a.y * a.leden.length + b.y * b.leden.length) / n;
        a.leden = a.leden.concat(b.leden);
        weg[j] = 1;
        samen = true;
      }
    }
    groepen = groepen.filter((_, k) => !weg[k]);
  }

  return groepen.map((g) => {
    // Volgorde van de lijst (nieuwste eerst) aanhouden in het lijstje.
    const ps = g.leden.sort((a, b) => a.i - b.i).map((l) => l.p);
    const plek = ps.length === 1 ? L.latLng(ps[0].lat, ps[0].lon) : map.unproject([g.x, g.y], zoom);
    return { sleutel: ps.map((p) => p.id).join(" "), punten: ps, lat: plek.lat, lon: plek.lng };
  });
}

/** Liggen alle werven van de bundel op (nagenoeg) dezelfde plek? */
function zelfdePlek(b: Bundel): boolean {
  const [eerste] = b.punten;
  return b.punten.every((p) => Math.abs(p.lat - eerste.lat) < 1e-6 && Math.abs(p.lon - eerste.lon) < 1e-6);
}

/**
 * Zoomniveau waarop deze werf los ligt (minstens 13, of het huidige niveau
 * als dat hoger is), en de sleutel van de pin die er dan staat. Liggen er
 * meer werven op exact dezelfde plek, dan de bundel (met haar lijstje).
 */
function focusDoel(punten: WerfPunt[], p: WerfPunt, map: L.Map): { zoom: number; sleutel: string } {
  for (let zoom = Math.min(MAX_ZOOM, Math.max(Math.round(map.getZoom()), 13)); ; zoom++) {
    const b = bundelen(punten, map, zoom).find((x) => x.punten.some((q) => q.id === p.id));
    if (!b || b.punten.length === 1) return { zoom, sleutel: p.id };
    if (zoom >= MAX_ZOOM || zelfdePlek(b)) return { zoom, sleutel: b.sleutel };
  }
}

// ── Pinnen ─────────────────────────────────────────────────────────────────
const PIN = 32; // klikvlak; de stip zelf is 12 px

// Vaste icoon-objecten: een nieuw icoon zou het DOM-element vervangen en de
// puls herstarten. "Sterk" gaat daarom via een klasse op het element.
const ICONEN = new Map<string, L.DivIcon>();

function pinIcoon(groep: WerfGroep, vertraging: number): L.DivIcon {
  const sleutel = `pin|${groep}|${vertraging}`;
  let icoon = ICONEN.get(sleutel);
  if (!icoon) {
    icoon = L.divIcon({
      className: `werf-pin werf-pin--${groep}`,
      html: `<span class="werf-pin__puls" style="--werf-d:${vertraging}s" aria-hidden="true"></span><span class="werf-pin__kern" aria-hidden="true"></span>`,
      iconSize: [PIN, PIN],
      iconAnchor: [PIN / 2, PIN / 2],
      popupAnchor: [0, -8],
      tooltipAnchor: [0, -10],
    });
    ICONEN.set(sleutel, icoon);
  }
  return icoon;
}

/** Bundel: ring met de verdeling over de statusgroepen, aantal in het midden. */
function bundelIcoon(punten: WerfPunt[]): L.DivIcon {
  const n = punten.length;
  const maat = maatVan(n);
  let tot = 0;
  const stops: string[] = [];
  for (const g of WERF_GROEPEN) {
    const k = punten.filter((p) => werfGroep(p.status) === g).length;
    if (!k) continue;
    const van = (tot / n) * 360;
    tot += k;
    stops.push(`var(--pin-${g}) ${van.toFixed(1)}deg ${((tot / n) * 360).toFixed(1)}deg`);
  }
  const sleutel = `bundel|${maat}|${n}|${stops.join(",")}`;
  let icoon = ICONEN.get(sleutel);
  if (!icoon) {
    icoon = L.divIcon({
      className: "werf-bundel",
      html: `<span class="werf-bundel__ring" style="background:conic-gradient(${stops.join(",")})" aria-hidden="true"></span><span class="werf-bundel__kern" aria-hidden="true">${n}</span>`,
      iconSize: [maat, maat],
      iconAnchor: [maat / 2, maat / 2],
      popupAnchor: [0, -maat / 2 + 6],
      tooltipAnchor: [0, -maat / 2 + 2],
    });
    ICONEN.set(sleutel, icoon);
  }
  return icoon;
}

/** Vaste, per werf verschillende fase zodat niet alle pinnen tegelijk kloppen. */
function vertragingVan(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return -((Math.abs(h) % 28) / 10);
}

/** Popup sluiten met de sluitknop; de focus gaat terug naar de pin. */
function sluitPopup(m: L.Marker | null) {
  m?.closePopup();
  m?.getElement()?.focus();
}

// Boven: net onder de legende (12 px marge + ~34 px hoog).
const POPUP = {
  className: "werf-popup",
  closeButton: false,
  autoPanPaddingTopLeft: [16, 52] as L.PointTuple,
  autoPanPaddingBottomRight: [64, 24] as L.PointTuple,
};

function Pin({
  p,
  taal,
  sterk,
  grof,
  smal,
  openVraag = null,
  setPinId,
  setOpenId,
}: {
  p: WerfPunt;
  taal: Locale;
  sterk: boolean;
  grof: boolean;
  /** Smalle kaart: geen Leaflet-popup maar een blad onderaan (zie Blad). */
  smal: boolean;
  /** Gevraagd van buitenaf (zie KaartFocus): popup openen. Enkel gezet voor deze pin. */
  openVraag?: OpenVraag | null;
  setPinId: Zet;
  setOpenId: Zet;
}) {
  const ref = useRef<L.Marker>(null);
  const positie = useMemo(() => L.latLng(p.lat, p.lon), [p.lat, p.lon]);

  useEffect(() => {
    if (openVraag && !smal) ref.current?.openPopup();
  }, [openVraag, smal]);

  useEffect(() => {
    const el = ref.current?.getElement();
    if (!el) return;
    el.classList.toggle("is-sterk", sterk);
    el.setAttribute("aria-label", `${p.titel} — ${p.statusLabel}`);
    el.dataset.werf = p.id;
  }, [sterk, p.id, p.titel, p.statusLabel]);

  return (
    <Marker
      ref={ref}
      position={positie}
      icon={pinIcoon(werfGroep(p.status), vertragingVan(p.id))}
      zIndexOffset={sterk ? 1000 : 0}
      eventHandlers={{
        mouseover: () => setPinId(p.id),
        mouseout: () => setPinId((cur) => (cur === p.id ? null : cur)),
        click: () => {
          if (smal) setOpenId(p.id);
        },
        // Breed opent Leaflet de popup zelf met Enter; smal hangt er geen popup aan.
        keypress: (e: L.LeafletKeyboardEvent) => {
          if (smal && isEnter(e)) setOpenId(p.id);
        },
        popupopen: () => {
          ref.current?.closeTooltip();
          setOpenId(p.id);
        },
      }}
    >
      {!grof && !smal && (
        <Tooltip className="werf-tip" direction="top" offset={[0, -6]} opacity={1}>
          {p.titel}
        </Tooltip>
      )}
      {!smal && (
        <Popup {...POPUP} minWidth={256} maxWidth={288}>
          <WerfKaartje p={p} taal={taal} onSluit={() => sluitPopup(ref.current)} />
        </Popup>
      )}
    </Marker>
  );
}

function BundelPin({
  b,
  taal,
  sterk,
  grof,
  smal,
  kanSplitsen,
  onSplits,
  openVraag = null,
  setPinId,
  setOpenId,
}: {
  b: Bundel;
  taal: Locale;
  sterk: boolean;
  grof: boolean;
  smal: boolean;
  /** Uit elkaar te halen door in te zoomen; anders opent een lijstje. */
  kanSplitsen: boolean;
  onSplits: (b: Bundel, viaToets: boolean) => void;
  openVraag?: OpenVraag | null;
  setPinId: Zet;
  setOpenId: Zet;
}) {
  const t = TXT[taal];
  const ref = useRef<L.Marker>(null);
  const positie = useMemo(() => L.latLng(b.lat, b.lon), [b.lat, b.lon]);
  const n = b.punten.length;

  useEffect(() => {
    if (openVraag && !smal && !kanSplitsen) ref.current?.openPopup();
  }, [openVraag, smal, kanSplitsen]);

  useEffect(() => {
    const el = ref.current?.getElement();
    if (!el) return;
    el.classList.toggle("is-sterk", sterk);
    el.setAttribute("aria-label", kanSplitsen ? `${t.bundel(n)} — ${t.bundelZoom}` : t.opDezePlek(n));
    el.dataset.werf = b.sleutel;
  }, [sterk, kanSplitsen, n, t, b.sleutel]);

  return (
    <Marker
      ref={ref}
      position={positie}
      icon={bundelIcoon(b.punten)}
      zIndexOffset={sterk ? 1000 : 100}
      eventHandlers={{
        mouseover: () => setPinId(b.sleutel),
        mouseout: () => setPinId((cur) => (cur === b.sleutel ? null : cur)),
        click: () => {
          if (kanSplitsen) onSplits(b, false);
          else if (smal) setOpenId(b.sleutel);
        },
        keypress: (e: L.LeafletKeyboardEvent) => {
          if (!isEnter(e)) return;
          if (kanSplitsen) onSplits(b, true);
          else if (smal) setOpenId(b.sleutel);
        },
        popupopen: () => {
          ref.current?.closeTooltip();
          setOpenId(b.sleutel);
        },
      }}
    >
      {!grof && !smal && (
        <Tooltip className="werf-tip" direction="top" offset={[0, -4]} opacity={1}>
          {kanSplitsen ? `${t.bundel(n)} · ${t.bundelZoom}` : t.opDezePlek(n)}
        </Tooltip>
      )}
      {!kanSplitsen && !smal && (
        <Popup {...POPUP} minWidth={264} maxWidth={300}>
          <WerfLijst punten={b.punten} taal={taal} onSluit={() => sluitPopup(ref.current)} />
        </Popup>
      )}
    </Marker>
  );
}

// ── Inhoud van popup en blad ───────────────────────────────────────────────
function StatusPil({ p, klein = false }: { p: WerfPunt; klein?: boolean }) {
  return (
    <span
      className={`werf-status werf-status--${werfGroep(p.status)} inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold ${
        klein ? "px-2 py-px text-[10px]" : "px-2.5 py-0.5 text-[11px]"
      }`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden />
      <span className="truncate">{p.statusLabel}</span>
    </span>
  );
}

function SluitKnop({ onSluit, label }: { onSluit: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onSluit}
      aria-label={label}
      title={label}
      className="werf-sluit absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-card-hover hover:text-foreground"
    >
      <X className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

/** Eén werf: popup (breed) en blad (smal, compact). */
function WerfKaartje({ p, taal, onSluit, compact = false }: { p: WerfPunt; taal: Locale; onSluit: () => void; compact?: boolean }) {
  const t = TXT[taal];
  const openRef = useRef<HTMLAnchorElement>(null);
  useFocusBijToets(openRef);
  const zichtbaar = compact ? p.merken.slice(0, 1) : p.merken.slice(0, 3);
  const extra = p.merken.length - zichtbaar.length;
  const chips = (
    <>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 ${
          p.categorie === "last-minute" ? "werf-chip--dringend font-semibold" : ""
        }`}
      >
        {p.categorie === "last-minute" && <Zap className="h-3 w-3" strokeWidth={2.5} aria-hidden />}
        {p.categorieLabel}
      </span>
      {zichtbaar.map((m) => (
        <span key={m} className="truncate rounded-full border px-2 py-0.5 text-muted">
          {m}
        </span>
      ))}
      {extra > 0 && <span className="shrink-0 px-0.5 text-muted">+{extra}</span>}
    </>
  );
  const openen = (
    <Link
      ref={openRef}
      href={p.href}
      className={`werf-open group flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-foreground font-medium transition-opacity hover:opacity-90 ${
        compact ? "px-3.5 py-1.5 text-[13px]" : "mt-4 px-4 py-2 text-sm"
      }`}
    >
      {t.openen}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} aria-hidden />
    </Link>
  );

  // Geen <p>: leaflet.css geeft .leaflet-popup-content p een eigen marge.
  return (
    <div className="relative">
      <SluitKnop onSluit={onSluit} label={t.sluiten} />
      <div className="max-w-[calc(100%-2rem)]">
        <StatusPil p={p} />
      </div>
      {/* Twee regels: met drie paste een volle popup (lange titel, vier
          chips) niet meer boven de pin op een kaart van 360 px. */}
      <div
        title={p.titel}
        className={`mt-2 line-clamp-2 pr-2 font-semibold leading-snug tracking-tight ${compact ? "text-sm" : "text-[15px]"}`}
      >
        {p.titel}
      </div>
      {p.klant && <div className="mt-0.5 truncate font-mono text-[11px] text-muted">{p.klant}</div>}
      {p.adres && (
        <div className={`mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-muted ${compact ? "min-w-0" : ""}`}>
          <MapPin className="mt-[3px] h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          <span className={compact ? "truncate" : "line-clamp-2"}>{p.adres}</span>
        </div>
      )}
      {compact ? (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-[11px]">{chips}</div>
          {openen}
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">{chips}</div>
          {openen}
        </>
      )}
    </div>
  );
}

/** Meerdere werven op dezelfde plek: lijstje met een link per werf. */
function WerfLijst({ punten, taal, onSluit, compact = false }: { punten: WerfPunt[]; taal: Locale; onSluit: () => void; compact?: boolean }) {
  const t = TXT[taal];
  const eersteRef = useRef<HTMLAnchorElement>(null);
  useFocusBijToets(eersteRef);
  return (
    <div className="relative">
      <SluitKnop onSluit={onSluit} label={t.sluiten} />
      <div className="flex items-center gap-1.5 pr-8 text-xs font-semibold tracking-tight">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
        {t.opDezePlek(punten.length)}
      </div>
      {punten[0]?.adres && <div className="mt-0.5 truncate pl-5 text-[11px] text-muted">{punten[0].adres}</div>}
      <ul className={`werf-rijen -mx-2 mt-2 overflow-y-auto overscroll-contain ${compact ? "max-h-[132px]" : "max-h-[168px]"}`}>
        {punten.map((p, i) => (
          <li key={p.id}>
            <Link
              ref={i === 0 ? eersteRef : undefined}
              href={p.href}
              className="werf-rij group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-card-hover"
            >
              <span className={`werf-stip werf-stip--${werfGroep(p.status)} shrink-0`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium leading-snug">{p.titel}</span>
                <span className="block truncate text-[11px] leading-snug text-muted">
                  {p.statusLabel}
                  {p.klant ? ` · ${p.klant}` : ""}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Ondergrond: bij een themawissel laadt de nieuwe laag óver de oude ──────
// (ook bij de wissel tussen kaart en luchtfoto)
function Ondergrond({ stijl, taal }: { stijl: Stijl; taal: Locale }) {
  const [huidig, setHuidig] = useState(stijl);
  const [vorige, setVorige] = useState<Stijl | null>(null);
  if (huidig !== stijl) {
    setVorige(huidig);
    setHuidig(stijl);
  }
  // Vangnet: laadt de nieuwe laag niet volledig (offline), dan toch opruimen.
  useEffect(() => {
    if (vorige === null) return;
    const klok = window.setTimeout(() => setVorige(null), 2000);
    return () => window.clearTimeout(klok);
  }, [vorige]);

  const oud = vorige !== null && vorige !== huidig ? lagenVoor(vorige, taal) : [];
  const nieuw = lagenVoor(huidig, taal);
  return (
    <>
      {oud.map((l, i) => (
        <TileLayer
          key={l.sleutel}
          url={l.url}
          attribution={l.attributie}
          maxNativeZoom={l.maxNativeZoom}
          maxZoom={MAX_ZOOM}
          zIndex={1 + i}
        />
      ))}
      {nieuw.map((l, i) => (
        <TileLayer
          key={l.sleutel}
          url={l.url}
          attribution={l.attributie}
          maxNativeZoom={l.maxNativeZoom}
          maxZoom={MAX_ZOOM}
          zIndex={10 + i}
          eventHandlers={i === 0 ? { load: () => setVorige(null) } : undefined}
        />
      ))}
    </>
  );
}

// ── Pinnen en bundels op het huidige zoomniveau ────────────────────────────
function Werven({
  punten,
  taal,
  grof,
  smal,
  rustig,
  sterk,
  openVraag,
  setPinId,
  setOpenId,
}: {
  punten: WerfPunt[];
  taal: Locale;
  grof: boolean;
  smal: boolean;
  rustig: boolean;
  sterk: Set<string>;
  openVraag: OpenVraag | null;
  setPinId: Zet;
  setOpenId: Zet;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({
    // Een pin die bij het zoomen in een bundel opgaat, krijgt geen mouseout meer.
    zoomstart: () => setPinId(null),
    zoomend: () => setZoom(map.getZoom()),
    // Op kaartniveau: een popup die met zijn pin verdwijnt, meldt het nog.
    popupclose: () => setOpenId(null),
  });

  const bundels = useMemo(() => bundelen(punten, map, zoom), [punten, map, zoom]);

  // Heel veel losse pinnen tegelijk: geen puls (rustiger en lichter).
  const veel = bundels.length > 150;
  useEffect(() => {
    map.getContainer().classList.toggle("werven-kaart--rustig", veel);
  }, [map, veel]);

  const splits = (b: Bundel, viaToets: boolean) => {
    const grens = L.latLngBounds(b.punten.map((p) => [p.lat, p.lon] as L.LatLngTuple));
    const doel = Math.min(MAX_ZOOM, Math.max(map.getZoom() + 1, map.getBoundsZoom(grens, false, L.point(120, 120))));
    // De bundel verdwijnt bij het inzoomen: de focus naar de kaart, zodat Tab
    // daarna bij de losse pinnen uitkomt i.p.v. bovenaan de pagina.
    if (viaToets) map.getContainer().focus({ preventScroll: true });
    if (rustig) map.setView(grens.getCenter(), doel, { animate: false });
    else map.flyTo(grens.getCenter(), doel, { duration: 0.55 });
  };

  // Sleutel met `smal`: bij een breedtewissel een nieuw pin-element. Leaflet
  // ruimt de focus-luisteraar van een losgekoppelde Tooltip niet op; op
  // hetzelfde element gaf de volgende focus anders een TypeError.
  const soort = smal ? "s" : "b";

  return (
    <>
      {bundels.map((b) =>
        b.punten.length === 1 ? (
          <Pin
            key={`${b.sleutel}|${soort}`}
            p={b.punten[0]}
            taal={taal}
            grof={grof}
            smal={smal}
            sterk={sterk.has(b.sleutel)}
            openVraag={openVraag?.sleutel === b.sleutel ? openVraag : null}
            setPinId={setPinId}
            setOpenId={setOpenId}
          />
        ) : (
          <BundelPin
            key={`${b.sleutel}|${soort}`}
            b={b}
            taal={taal}
            grof={grof}
            smal={smal}
            kanSplitsen={zoom < MAX_ZOOM && !zelfdePlek(b)}
            onSplits={splits}
            sterk={b.punten.some((p) => sterk.has(p.id))}
            openVraag={openVraag?.sleutel === b.sleutel ? openVraag : null}
            setPinId={setPinId}
            setOpenId={setOpenId}
          />
        ),
      )}
    </>
  );
}

const ids = (sleutel: string | null) => (sleutel ? sleutel.split(" ") : []);

export default function WervenKaartBinnen({
  punten,
  taal,
  zonderLocatie = 0,
  lijstId,
  pinId,
  openId,
  setPinId,
  setOpenId,
  ondergrond = "kaart",
  onOndergrond,
  legende = "filter",
  vrijZoomen = false,
  passendTeller = 0,
  focus = null,
}: {
  punten: WerfPunt[];
  taal: Locale;
  zonderLocatie?: number;
  lijstId: string | null;
  pinId: string | null;
  openId: string | null;
  setPinId: Zet;
  setOpenId: Zet;
  /** Themakaart (standaard) of luchtfoto. */
  ondergrond?: OndergrondSoort;
  /** Gegeven: wisselknop kaart/luchtfoto linksonder op de kaart. */
  onOndergrond?: (o: OndergrondSoort) => void;
  /** "filter" (standaard): statusgroepen aan- en uitklikken; "vast": enkel de legende. */
  legende?: "filter" | "vast";
  /** Scrollwiel zoomt meteen, zonder eerst te klikken (kaart die de pagina vult). */
  vrijZoomen?: boolean;
  /** Elke nieuwe waarde: passend zoomen op alle punten. */
  passendTeller?: number;
  /** Vlieg naar deze werf en open haar popup (smal: het blad). */
  focus?: KaartFocus | null;
}) {
  const t = TXT[taal];
  const donker = useSyncExternalStore(volgThema, leesDonker, () => true);
  const stijl: Stijl = ondergrond === "luchtfoto" ? "luchtfoto" : donker ? "donker" : "licht";
  const [grof] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const [rustig] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const smal = useSyncExternalStore(volgSmal, leesSmal, () => false);
  const [map, setMap] = useState<L.Map | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [groot, setGroot] = useState(false);
  const [verborgen, setVerborgen] = useState<WerfGroep[]>([]);
  const bladRef = useRef<HTMLDivElement>(null);
  const regio = useRef<HTMLDivElement>(null);
  const legendeRef = useRef<HTMLDivElement>(null);
  const stand = useRef<Stand | null>(null);

  // Legende als filter. Valt na een nieuwe selectie alles weg, dan weer alles.
  const tellingen = WERF_GROEPEN.map((g) => ({ g, n: punten.filter((p) => werfGroep(p.status) === g).length })).filter((x) => x.n > 0);
  const gefilterd = useMemo(
    () => (legende === "vast" ? punten : punten.filter((p) => !verborgen.includes(werfGroep(p.status)))),
    [punten, verborgen, legende],
  );
  const zichtbaar = gefilterd.length ? gefilterd : punten;
  const uit = (g: WerfGroep) => gefilterd.length > 0 && verborgen.includes(g);
  const wissel = (g: WerfGroep) => {
    const volgende = uit(g) ? verborgen.filter((x) => x !== g) : [...verborgen.filter((x) => tellingen.some((tl) => tl.g === x)), g];
    // Nooit alles uit: de laatste zichtbare groep uitklikken zet alles terug aan.
    setVerborgen(tellingen.every((tl) => volgende.includes(tl.g)) ? [] : volgende);
    setOpenId(null);
  };

  const openIds = ids(openId);
  const blad = smal && openId ? zichtbaar.filter((p) => openIds.includes(p.id)) : [];
  const bladOpen = blad.length > 0;
  const sterk = new Set([...ids(lijstId), ...ids(pinId), ...openIds]);

  // Zonder punten (werfkaart: niets voldoet aan de filters) zijn de grenzen
  // ongeldig: dan blijft het beeld staan.
  const grenzen = useMemo(() => L.latLngBounds(zichtbaar.map((p) => [p.lat, p.lon] as L.LatLngTuple)), [zichtbaar]);
  const sleutel = zichtbaar.map((p) => `${p.lat},${p.lon}`).join(";");
  const legendeSleutel = `${tellingen.map((x) => `${x.g}${x.n}`).join(",")}|${zonderLocatie}|${taal}`;

  // Laatste grenzen voor de ResizeObserver hieronder (die blijft staan).
  const grenzenRef = useRef(grenzen);
  useEffect(() => {
    grenzenRef.current = grenzen;
  }, [grenzen]);

  /** Focus terug naar de pin of bundel met deze sleutel (na sluiten). */
  const focusPin = (id: string) => {
    regio.current?.querySelector<HTMLElement>(`[data-werf="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  };
  const sluitBlad = () => {
    const id = openId;
    setOpenId(null);
    if (id) focusPin(id);
  };

  // Zoomen met het wiel / verschuiven met één vinger pas na interactie.
  useEffect(() => {
    if (!map) return;
    const el = map.getContainer();
    // De kaart is net op alle werven gepast (MapContainer `bounds`).
    stand.current = { z: map.getZoom(), c: map.getCenter() };
    let klok: number | undefined;
    const toon = (h: Hint) => {
      setHint(h);
      window.clearTimeout(klok);
      klok = window.setTimeout(() => setHint(null), 1400);
    };
    const aan = () => {
      map.scrollWheelZoom.enable();
      map.dragging.enable();
      window.clearTimeout(klok);
      setHint(null);
    };
    const wielUit = () => {
      if (!vrijZoomen) map.scrollWheelZoom.disable();
    };
    const buiten = (e: PointerEvent) => {
      if (e.target instanceof Node && el.parentElement?.contains(e.target)) return;
      if (!vrijZoomen) map.scrollWheelZoom.disable();
      if (grof) map.dragging.disable();
    };
    const wiel = () => {
      if (!map.scrollWheelZoom.enabled()) toon("wiel");
    };
    const aanraking = (e: TouchEvent) => {
      if (!map.dragging.enabled() && e.touches.length === 1) toon("aanraking");
    };
    map.on("click focus popupopen", aan);
    el.addEventListener("mouseleave", wielUit);
    el.addEventListener("wheel", wiel, { passive: true });
    el.addEventListener("touchstart", aanraking, { passive: true });
    document.addEventListener("pointerdown", buiten);
    // Breedte wijzigt ook zonder venster-resize (zijbalk in- of uitklappen,
    // vergroten, gsm draaien). Stond de kaart nog op "alle werven", dan opnieuw
    // passend maken; heeft iemand zelf verschoven of gezoomd, dan blijft het
    // midden staan.
    const ro = new ResizeObserver(() => {
      const passend = staatPassend(map, stand.current);
      map.invalidateSize({ debounceMoveend: true });
      if (passend && grenzenRef.current.isValid()) passen(map, grenzenRef.current, stand, "direct");
    });
    ro.observe(el);
    // Hoogte van de bronvermelding (kan op een gsm twee regels zijn): het blad
    // onderaan komt erboven (CSS-variabele --werf-bron, zie globals.css).
    const bron = el.querySelector<HTMLElement>(".leaflet-control-attribution");
    const roBron = new ResizeObserver(() => el.parentElement?.style.setProperty("--werf-bron", `${bron?.offsetHeight ?? 0}px`));
    if (bron) roBron.observe(bron);
    return () => {
      window.clearTimeout(klok);
      map.off("click focus popupopen", aan);
      el.removeEventListener("mouseleave", wielUit);
      el.removeEventListener("wheel", wiel);
      el.removeEventListener("touchstart", aanraking);
      document.removeEventListener("pointerdown", buiten);
      ro.disconnect();
      roBron.disconnect();
    };
  }, [map, grof, vrijZoomen]);

  // Andere selectie (filter) → opnieuw passend maken.
  const vorigeSleutel = useRef(sleutel);
  useEffect(() => {
    if (!map || vorigeSleutel.current === sleutel) return;
    vorigeSleutel.current = sleutel;
    map.closePopup();
    if (grenzen.isValid()) passen(map, grenzen, stand, rustig ? "direct" : "glij");
  }, [map, sleutel, grenzen, rustig]);

  // "Passend zoomen" van buitenaf (teller).
  const vorigePassend = useRef(passendTeller);
  useEffect(() => {
    if (!map || vorigePassend.current === passendTeller) return;
    vorigePassend.current = passendTeller;
    if (grenzen.isValid()) passen(map, grenzen, stand, rustig ? "direct" : "vlieg");
  }, [map, passendTeller, grenzen, rustig]);

  // Werf in de lijst aangeklikt (focus): erheen vliegen tot ze los ligt, dan
  // haar popup openen (breed, via openVraag in de pin) of het blad (smal).
  // Liggen er meer werven op dezelfde plek, dan het lijstje van die bundel.
  const [openVraag, setOpenVraag] = useState<OpenVraag | null>(null);
  const vorigeFocus = useRef(focus?.n ?? 0);
  useEffect(() => {
    if (!map || !focus || vorigeFocus.current === focus.n) return;
    vorigeFocus.current = focus.n;
    const p = zichtbaar.find((x) => x.id === focus.id);
    if (!p) return;
    const doel = focusDoel(zichtbaar, p, map);
    let klok: number | undefined;
    const aangekomen = () => {
      if (smal) setOpenId(doel.sleutel);
      else {
        setOpenVraag({ sleutel: doel.sleutel, n: focus.n });
        // Vangnet: opent er geen popup (pin intussen weg), dan de vraag vergeten.
        klok = window.setTimeout(() => setOpenVraag(null), 800);
      }
    };
    map.closePopup();
    map.once("moveend", aangekomen);
    if (rustig) map.setView([p.lat, p.lon], doel.zoom, { animate: false });
    else map.flyTo([p.lat, p.lon], doel.zoom, { duration: 0.7 });
    return () => {
      map.off("moveend", aangekomen);
      window.clearTimeout(klok);
    };
  }, [map, focus, zichtbaar, smal, rustig, setOpenId]);
  // Popup open → de vraag is beantwoord.
  useEffect(() => {
    if (!map) return;
    const klaar = () => setOpenVraag(null);
    map.on("popupopen", klaar);
    return () => {
      map.off("popupopen", klaar);
    };
  }, [map]);

  // Legende past niet op één rij (smalle kaart): de rand vervaagt aan de kant
  // waar nog iets staat, zodat het duidelijk is dat ze verder schuift.
  useEffect(() => {
    const el = legendeRef.current;
    if (!el) return;
    const meet = () => {
      const rest = el.scrollWidth - el.clientWidth - el.scrollLeft;
      el.classList.toggle("is-links", el.scrollLeft > 1);
      el.classList.toggle("is-rechts", rest > 1);
    };
    meet();
    el.addEventListener("scroll", meet, { passive: true });
    const ro = new ResizeObserver(meet);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", meet);
      ro.disconnect();
    };
  }, [legendeSleutel]);

  // Smal: een tik naast de pinnen sluit het blad.
  useEffect(() => {
    if (!map || !smal) return;
    const dicht = () => setOpenId(null);
    map.on("click", dicht);
    return () => {
      map.off("click", dicht);
    };
  }, [map, smal, setOpenId]);

  // Smal: de gekozen werf boven het blad in beeld schuiven. Gaat het blad
  // weer dicht en heeft niemand intussen zelf verschoven, dan schuift de kaart
  // terug naar het beeld van daarvoor (anders bleef de pin onder de legende
  // liggen, die met het blad terugkomt, en was ze niet meer aan te tikken).
  const bladPlek = blad.length ? `${blad[0].lat},${blad[0].lon}` : "";
  const bladTerug = useRef<{ voor: L.LatLng; na: Stand } | null>(null);
  useEffect(() => {
    if (!map) return;
    const anim = { animate: !rustig, duration: 0.3 };
    if (!bladPlek) {
      const terug = bladTerug.current;
      bladTerug.current = null;
      if (terug && staatPassend(map, terug.na)) map.panTo(terug.voor, anim);
      return;
    }
    const [lat, lon] = bladPlek.split(",").map(Number);
    const el = map.getContainer();
    // offsetTop (niet getBoundingClientRect): het blad schuift nog binnen.
    const bladTop = bladRef.current?.offsetTop ?? el.clientHeight;
    const pin = map.latLngToContainerPoint([lat, lon]);
    const rand = 24;
    const onder = bladTop - rand;
    const dx = pin.x < rand ? pin.x - rand : pin.x > el.clientWidth - rand ? pin.x - (el.clientWidth - rand) : 0;
    const dy = pin.y > onder ? pin.y - onder : pin.y < rand ? pin.y - rand : 0;
    const voor = bladTerug.current?.voor ?? map.getCenter();
    const doel = map.containerPointToLatLng(map.getSize().divideBy(2).add([dx, dy]));
    bladTerug.current = { voor, na: { z: map.getZoom(), c: doel } };
    if (dx || dy) map.panBy([dx, dy], anim);
  }, [map, bladPlek, rustig]);

  // Vergroot: pagina eronder niet laten scrollen.
  useEffect(() => {
    if (!groot) return;
    const html = document.documentElement;
    const vorig = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = vorig;
    };
  }, [groot]);

  // Vergroot = modaal venster: Escape sluit (waar de focus ook zit), en de
  // focus kan niet naar de gedimde pagina erachter (zie ook Tab in onKeyDown).
  // Staat er een popup of blad open, dan sluit Escape eerst dat.
  useEffect(() => {
    if (!groot) return;
    const toets = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && !openId) setGroot(false);
    };
    const terug = (e: FocusEvent) => {
      const r = regio.current;
      if (r && e.target instanceof Node && !r.contains(e.target)) {
        r.querySelector<HTMLElement>("[data-groot-knop]")?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", toets);
    document.addEventListener("focusin", terug);
    return () => {
      document.removeEventListener("keydown", toets);
      document.removeEventListener("focusin", terug);
    };
  }, [groot, openId]);

  const allesTonen = () => {
    if (map && grenzen.isValid()) passen(map, grenzen, stand, rustig ? "direct" : "vlieg");
  };

  const toetsen = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // Focusval in de vergrote kaart.
    if (e.key === "Tab" && groot && regio.current) {
      const lijst = focusbaar(regio.current);
      if (!lijst.length) return;
      const eerste = lijst[0];
      const laatste = lijst[lijst.length - 1];
      if (e.shiftKey && document.activeElement === eerste) {
        e.preventDefault();
        laatste.focus({ preventScroll: true });
      } else if (!e.shiftKey && document.activeElement === laatste) {
        e.preventDefault();
        eerste.focus({ preventScroll: true });
      }
      return;
    }
    if (e.key !== "Escape" || !openId) return;
    // Focus op een pin of in de popup/het blad: Leaflet zelf reageert dan niet.
    e.preventDefault();
    if (bladOpen) sluitBlad();
    else {
      map?.closePopup();
      focusPin(openId);
    }
  };
  const wisselGroot = () => {
    if (map && !groot) {
      map.scrollWheelZoom.enable();
      map.dragging.enable();
    }
    setGroot((g) => !g);
  };

  const knop =
    "grid h-9 w-9 place-items-center text-muted transition-colors hover:bg-card-hover hover:text-foreground disabled:opacity-40";

  return (
    <>
      {groot && <div aria-hidden className="werf-groot-achter fixed inset-0 z-[89]" onClick={() => setGroot(false)} />}
      <div
        ref={regio}
        role={groot ? "dialog" : "region"}
        aria-modal={groot || undefined}
        aria-label={t.kaart}
        className={`werven-kaart isolate overflow-hidden rounded-2xl border bg-card shadow-sm ${
          stijl === "luchtfoto" ? "werven-kaart--luchtfoto " : ""
        }${
          groot ? "werven-kaart--groot fixed inset-3 z-[90] sm:inset-6 lg:inset-10" : "relative h-full"
        }`}
        onKeyDown={toetsen}
      >
        <MapContainer
          ref={setMap}
          className="h-full w-full"
          bounds={grenzen.isValid() ? grenzen : undefined}
          boundsOptions={PASSEN}
          center={grenzen.isValid() ? undefined : LEEG_MIDDEN}
          zoom={grenzen.isValid() ? undefined : LEEG_ZOOM}
          scrollWheelZoom={vrijZoomen}
          dragging={!grof}
          zoomControl={false}
          attributionControl={false}
          minZoom={3}
          maxZoom={MAX_ZOOM}
          zoomAnimation={!rustig}
          fadeAnimation={!rustig}
          markerZoomAnimation={!rustig}
          worldCopyJump
        >
          <Ondergrond stijl={stijl} taal={taal} />
          <AttributionControl position="bottomright" prefix={false} />
          <Werven
            punten={zichtbaar}
            taal={taal}
            grof={grof}
            smal={smal}
            rustig={rustig}
            sterk={sterk}
            openVraag={openVraag}
            setPinId={setPinId}
            setOpenId={setOpenId}
          />
        </MapContainer>

        {/* Legende = filter op statusgroep. Wijkt op een smalle kaart voor het
            blad: onzichtbaar én inert (niet aan te tikken, niet bereikbaar met Tab). */}
        <div
          inert={bladOpen}
          className={`pointer-events-none absolute left-3 top-3 z-[650] flex max-w-[calc(100%-4.75rem)] transition-opacity duration-200 ${
            bladOpen ? "opacity-0" : ""
          }`}
        >
          <div
            role="group"
            aria-label={legende === "filter" ? t.filter : t.kaart}
            className={`werf-glas flex min-w-0 max-w-full overflow-hidden rounded-xl border p-1 shadow-sm ${bladOpen ? "" : "pointer-events-auto"}`}
          >
            <div
              ref={legendeRef}
              className="werf-legende flex min-w-0 items-center gap-0.5 overflow-x-auto overscroll-x-contain text-[11px] font-medium"
            >
              {tellingen.map(({ g, n }) =>
                tellingen.length > 1 && legende === "filter" ? (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={!uit(g)}
                    onClick={() => wissel(g)}
                    title={uit(g) ? t.tonen(t.groep[g]) : t.verbergen(t.groep[g])}
                    className="werf-filter inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 transition-colors hover:bg-card-hover"
                  >
                    <span className={`werf-stip werf-stip--${g}`} aria-hidden />
                    {t.groep[g]}
                    <span className="font-mono text-muted">{n}</span>
                  </button>
                ) : (
                  <span key={g} className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-1">
                    <span className={`werf-stip werf-stip--${g}`} aria-hidden />
                    {t.groep[g]}
                    <span className="font-mono text-muted">{n}</span>
                  </span>
                ),
              )}
              {zonderLocatie > 0 && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 text-muted">
                  <span className="werf-stip werf-stip--leeg" aria-hidden />
                  {t.zonder(zonderLocatie)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zoomknoppen, alles tonen, vergroten (inert zolang het blad openstaat) */}
        <div
          inert={bladOpen}
          className={`werf-glas absolute right-3 top-3 z-[650] flex flex-col overflow-hidden rounded-xl border shadow-sm transition-opacity duration-200 ${
            bladOpen ? "pointer-events-none opacity-0" : ""
          }`}
        >
          <button type="button" className={knop} onClick={() => map?.zoomIn()} aria-label={t.inzoomen} title={t.inzoomen}>
            <Plus className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="h-px bg-border" aria-hidden />
          <button type="button" className={knop} onClick={() => map?.zoomOut()} aria-label={t.uitzoomen} title={t.uitzoomen}>
            <Minus className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="h-px bg-border" aria-hidden />
          <button type="button" className={knop} onClick={allesTonen} aria-label={t.alles} title={t.alles}>
            <Scan className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="h-px bg-border" aria-hidden />
          <button
            type="button"
            data-groot-knop
            className={knop}
            onClick={wisselGroot}
            aria-label={groot ? t.kleiner : t.groter}
            aria-pressed={groot}
            title={groot ? t.kleiner : t.groter}
          >
            {groot ? <Minimize2 className="h-4 w-4" strokeWidth={2} /> : <Maximize2 className="h-4 w-4" strokeWidth={2} />}
          </button>
        </div>

        {/* Ondergrond: kaart of luchtfoto (enkel met onOndergrond) */}
        {onOndergrond && (
          <div
            inert={bladOpen}
            role="group"
            aria-label={t.ondergrond}
            className={`werf-glas werf-ondergrond absolute left-3 z-[650] flex gap-0.5 rounded-xl border p-1 text-[12px] font-medium shadow-sm transition-opacity duration-200 ${
              bladOpen ? "pointer-events-none opacity-0" : ""
            }`}
          >
            {(["kaart", "luchtfoto"] as const).map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={ondergrond === o}
                onClick={() => onOndergrond(o)}
                className="werf-ondergrond__knop inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                {o === "kaart" ? (
                  <KaartIcoon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                ) : (
                  <Satellite className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                )}
                {o === "kaart" ? t.kaartLaag : t.luchtfoto}
              </button>
            ))}
          </div>
        )}

        {/* Hint: wiel of één vinger zonder eerst te klikken/tikken */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-[660] grid place-items-center bg-black/25 transition-opacity duration-300 ${
            hint ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="rounded-full bg-black/75 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur">
            {hint === "aanraking" ? t.aanraking : t.wiel}
          </span>
        </div>

        {/* Smalle kaart: gekozen werf (of bundel) als blad onderaan, boven de
            bronvermelding (hoogte daarvan in --werf-bron, zie globals.css) */}
        {bladOpen && (
          <div key={openId} ref={bladRef} className="werf-blad absolute inset-x-2 z-[670] rounded-2xl border bg-card p-3.5">
            {blad.length === 1 ? (
              <WerfKaartje p={blad[0]} taal={taal} onSluit={sluitBlad} compact />
            ) : (
              <WerfLijst punten={blad} taal={taal} onSluit={sluitBlad} compact />
            )}
          </div>
        )}
      </div>
    </>
  );
}
