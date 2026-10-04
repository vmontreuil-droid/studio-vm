"use client";

// Markeert een ticket als gelezen zodra de klant het opent. De pagina rendert
// dit enkel bij een ongelezen antwoord; na het markeren ververst de server
// het portaal (teller in de zijbalk, bolletje in de lijst).

import { useEffect, useRef } from "react";
import { markeerGelezenKlant } from "@/app/actions/tickets-klant";

export function MarkeerGelezen({ ticketId }: { ticketId: string }) {
  const gedaan = useRef(false);
  useEffect(() => {
    if (gedaan.current) return;
    gedaan.current = true;
    markeerGelezenKlant(ticketId).catch(() => {});
  }, [ticketId]);
  return null;
}
