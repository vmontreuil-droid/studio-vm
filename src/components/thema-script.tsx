"use client";

import { useLayoutEffect, useState, useSyncExternalStore } from "react";

// Zet de themaklasse vóór de eerste paint (geen flits bij licht/donker).
//
// Twee wegen, omdat een 404 onder een geldige taal (/es/foo, verlopen
// /portail/[token]) zonder server-HTML binnenkomt: Next stuurt dan een lege
// <html id="__next_error__"> en React bouwt de layout pas in de browser op.
// Een <script> dat React in de browser aanmaakt, wordt nooit uitgevoerd (en
// geeft in dev een consolefout). Daarom:
// - server-HTML (SSR en hydratatie): het inline script, vóór de eerste paint;
// - puur in de browser gerenderd: geen script, maar dezelfde stap in
//   useLayoutEffect, nog altijd vóór de paint.

const SCRIPT =
  // Standaard donker; 'light' en 'auto' (systeem) zijn bewuste keuzes van de bezoeker.
  "(function(){var c=document.documentElement.classList;try{var t=localStorage.getItem('theme');if(t==='light')c.add('theme-light');else if(t!=='auto')c.add('theme-dark');}catch(e){c.add('theme-dark');}})()";

const geenAbonnement = () => () => {};

export function ThemaScript() {
  // true op de server en tijdens hydratatie, false bij renderen in de browser
  // zonder server-HTML (createRoot op een __next_error__-pagina).
  const uitServerHtml = useSyncExternalStore(
    geenAbonnement,
    () => false,
    () => true,
  );
  // Vastgezet bij de eerste render: na hydratatie blijft het script staan.
  const [metScript] = useState(uitServerHtml);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (
      root.classList.contains("theme-light") ||
      root.classList.contains("theme-dark")
    ) {
      return;
    }
    try {
      const t = localStorage.getItem("theme");
      if (t === "light") root.classList.add("theme-light");
      else if (t !== "auto") root.classList.add("theme-dark");
    } catch {
      root.classList.add("theme-dark");
    }
  }, []);

  if (!metScript) return null;
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
