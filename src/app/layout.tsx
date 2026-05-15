import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
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
  metadataBase: new URL("https://studio-vm.be"),
  title: {
    default: "Studio VM — Websites en webshops voor lokale ondernemers",
    template: "%s",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const c = await cookies();
  const cookieLocale = c.get("locale")?.value;
  const lang = isValidLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('theme-light');else if(t==='dark')document.documentElement.classList.add('theme-dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
        >
          Skip to content
        </a>
        {children}
        <ServiceWorkerRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
