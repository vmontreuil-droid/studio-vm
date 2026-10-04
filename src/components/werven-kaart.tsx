"use client";

// Werven-kaart boven een projectenlijst (klantenportaal en admin).
//
// De kaart zelf (Leaflet) laadt enkel in de browser: Leaflet raakt `window`
// aan bij het importeren. Deze omhulling houdt de gedeelde toestand bij:
// - over een kaartje/rij in de lijst (data-werf-id) → die pin pulseert sterker;
// - over een pin of een open popup → dat kaartje in de lijst licht op (data-werf-licht).
// Zonder één werf met coördinaten verschijnt er geen kaart, enkel de lijst.
// Punten maken: werfPunten() in @/lib/werf-punten.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import type { Locale } from "@/lib/i18n/config";

export type { WerfPunt } from "@/lib/werf-punten";
import type { WerfPunt } from "@/lib/werf-punten";

const KaartBinnen = dynamic(() => import("./werven-kaart-binnen"), {
  ssr: false,
  loading: () => <KaartSkelet />,
});

function KaartSkelet() {
  return (
    <div aria-hidden className="werven-kaart-skelet relative h-full overflow-hidden rounded-2xl border bg-card shadow-sm" />
  );
}

/** Ids in een gedeelde sleutel: één werf, of meerdere (bundel) gescheiden door een spatie. */
const ids = (sleutel: string | null) => (sleutel ? sleutel.split(" ") : []);

export function WervenKaart({
  punten,
  taal,
  kaartClass = "",
  zonderLocatie = 0,
  children,
}: {
  punten: WerfPunt[];
  taal: Locale;
  /** Extra klassen voor de kaart (bv. marge); de hoogte ligt vast. */
  kaartClass?: string;
  /** Projecten in de lijst zonder coördinaten (melding in de legende). */
  zonderLocatie?: number;
  children?: ReactNode;
}) {
  const [lijstId, setLijstId] = useState<string | null>(null);
  const [pinId, setPinId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const lijst = useRef<HTMLDivElement>(null);

  // Pin onder de muis (of open popup) → kaartje(s) in de lijst laten oplichten.
  const kaartLicht = pinId ?? openId;
  useEffect(() => {
    const el = lijst.current;
    if (!el) return;
    for (const n of el.querySelectorAll("[data-werf-licht]")) n.removeAttribute("data-werf-licht");
    for (const id of ids(kaartLicht)) {
      for (const n of el.querySelectorAll(`[data-werf-id="${CSS.escape(id)}"]`)) n.setAttribute("data-werf-licht", "");
    }
  }, [kaartLicht]);

  const kies = (e: SyntheticEvent) => {
    const doel = e.target instanceof Element ? e.target.closest("[data-werf-id]") : null;
    setLijstId(doel?.getAttribute("data-werf-id") ?? null);
  };
  const los = () => setLijstId(null);

  return (
    <>
      {punten.length > 0 && (
        <div className={`h-[280px] md:h-[360px] ${kaartClass}`}>
          <KaartBinnen
            punten={punten}
            taal={taal}
            zonderLocatie={zonderLocatie}
            lijstId={lijstId}
            pinId={pinId}
            openId={openId}
            setPinId={setPinId}
            setOpenId={setOpenId}
          />
        </div>
      )}
      <div ref={lijst} className="werven-lijst" onPointerOver={kies} onPointerLeave={los} onFocus={kies} onBlur={los}>
        {children}
      </div>
    </>
  );
}
