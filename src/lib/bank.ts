// Bankgegevens voor betaling via overschrijving (Studio VM).
export const BANK = {
  holder: "Vincent Montreuil",
  iban: "BE18 6508 9831 1165",
  bic: "REVOBEB2",
} as const;

// Belgische gestructureerde mededeling (VCS): 10 cijfers + 2
// controlecijfers (mod 97, 0 → 97), getoond als +++xxx/xxxx/xxxxx+++.
// Afgeleid van het factuurnummer zodat elke factuur een eigen,
// geldige code heeft.
export function structuredComm(invoiceNumber: string): string {
  const digits = (invoiceNumber.replace(/\D/g, "") || "0")
    .slice(-10)
    .padStart(10, "0");
  // 10 cijfers ≤ ~1e10 → ruim binnen Number.MAX_SAFE_INTEGER.
  const check = Number(digits) % 97 || 97;
  const full = digits + String(check).padStart(2, "0");
  return `+++${full.slice(0, 3)}/${full.slice(3, 7)}/${full.slice(7)}+++`;
}
