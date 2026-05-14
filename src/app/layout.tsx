import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studio VM — Websites en webshops voor lokale ondernemers",
  description:
    "Vincent Montreuil, freelance webdeveloper. Ik bouw snelle, tweetalige websites en webshops voor lokale ondernemers in Vlaanderen.",
  metadataBase: new URL("https://studio-vm.be"),
  openGraph: {
    title: "Studio VM — Websites en webshops voor lokale ondernemers",
    description:
      "Snelle, tweetalige sites en webshops gebouwd met Next.js en Supabase. Restaurants, ateliers, fotografen, KMO's.",
    url: "https://studio-vm.be",
    siteName: "Studio VM",
    locale: "nl_BE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
