import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieBanner } from "@/components/cookie-banner";
import { OrganizationJsonLd } from "@/components/json-ld";

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
    <html lang="nl" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('theme-light');else if(t==='dark')document.documentElement.classList.add('theme-dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <OrganizationJsonLd />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
