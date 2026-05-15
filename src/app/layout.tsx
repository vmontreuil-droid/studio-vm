import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AmbientBackdrop } from "@/components/ambient-backdrop";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { WebVitals } from "@/components/web-vitals";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import "./globals.css";

const geistSans = Montserrat({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://studio-vm.be"),
  title: {
    default: "Studio VM — Websites en webshops voor lokale ondernemers",
    template: "%s",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Geen headers()/cookies() hier: dat zou de héle site per request
  // dynamisch maken (trage TTFB). De locale zit in de URL; <html lang>
  // wordt statisch op de default gezet en vóór paint uit het pad
  // gecorrigeerd door het inline script hieronder (suppressHydrationWarning).
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=location.pathname.split('/')[1];if(s==='nl'||s==='fr'||s==='en')document.documentElement.lang=s;var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('theme-light');else if(t==='dark')document.documentElement.classList.add('theme-dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <AmbientBackdrop />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
        >
          Skip to content
        </a>
        {children}
        <ServiceWorkerRegister />
        <WebVitals />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
