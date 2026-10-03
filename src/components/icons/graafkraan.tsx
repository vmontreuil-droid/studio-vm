import { createLucideIcon } from "lucide-react";

// Graafkraan in lucide-stijl (24×24, lijnen, ronde uiteinden): rupsband,
// bovenwagen met cabine, giek, steel en bak. Lucide heeft zelf geen
// graafkraan, en een tractor is niet de machine waar onze modellen op draaien.
export const Graafkraan = createLucideIcon("graafkraan", [
  ["rect", { x: "2", y: "17.5", width: "12", height: "3.5", rx: "1.75", key: "rups" }],
  ["path", { d: "M3.5 17.5V14H12v3.5", key: "bovenwagen" }],
  ["path", { d: "M4.5 14v-4h3.2l1.3 4", key: "cabine" }],
  ["path", { d: "M12 14 15.5 6.5l5 4.5", key: "giek" }],
  ["path", { d: "M20.5 11c1.2 1.4 1.6 3 1.2 4.5-1.3.3-2.8 0-4-1z", key: "bak" }],
]);
