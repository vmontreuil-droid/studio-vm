import { ogmVoorFactuur } from "@/lib/facturatie/nummers";

// Bankgegevens voor betaling via overschrijving (Studio VM).
export const BANK = {
  holder: "Vincent Montreuil",
  iban: "BE18 6508 9831 1165",
  bic: "REVOBEB2",
} as const;

// Belgische gestructureerde mededeling van een factuur — zie
// src/lib/facturatie/nummers.ts (jaar + volgnummer, nooit 000 vooraan;
// dezelfde formule als de databank).
export function structuredComm(invoiceNumber: string, opgeslagen?: string | null): string {
  return ogmVoorFactuur(invoiceNumber, opgeslagen);
}
