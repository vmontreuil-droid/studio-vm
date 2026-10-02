import { Montserrat, Geist_Mono } from "next/font/google";

// Gedeeld door alle root layouts ([locale], (intern)) en global-not-found.
// next/font moet op module-niveau aangeroepen worden; door het hier één
// keer te doen krijgen alle root layouts dezelfde klassen en bestanden.
const montserrat = Montserrat({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// De mono-letter staat nergens boven de vouw: niet voorladen, zodat hij
// niet concurreert met de hoofdletter en het hero-beeld.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const fontKlassen = `${montserrat.variable} ${geistMono.variable}`;
