"use client";

// Markeert een ticket als gelezen door de studio zodra de detailpagina open
// staat (enkel gerenderd als het ticket ongelezen is). Toont niets.

import { useEffect } from "react";
import { markeerGelezenStudio } from "@/app/actions/tickets-admin";

export function TicketGelezen({ ticketId }: { ticketId: string }) {
  useEffect(() => {
    markeerGelezenStudio(ticketId).catch(() => {
      // Niet-kritisch: de volgende keer opnieuw.
    });
  }, [ticketId]);
  return null;
}
