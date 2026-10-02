import type { Metadata } from "next";
import "../globals.css";
import { SITE } from "@/lib/seo";
import { fontKlassen } from "@/lib/fonts";
import { ThemaScript } from "@/components/thema-script";
import { AmbientBackdrop } from "@/components/ambient-backdrop";

// Root layout voor de interne routes (/admin/**, /auth/**). De route-groep
// (intern) verandert de adressen niet. Intern is alles Nederlands en hoort
// niets in een zoekmachine.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Studio VM", template: "%s" },
  robots: { index: false, follow: false },
};

export default function InternLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={fontKlassen} suppressHydrationWarning>
      <head>
        <ThemaScript />
      </head>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <AmbientBackdrop />
        {children}
      </body>
    </html>
  );
}
