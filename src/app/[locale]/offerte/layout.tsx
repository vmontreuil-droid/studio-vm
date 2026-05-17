import type { Metadata } from "next";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const META: Record<Locale, { title: string; description: string }> = {
  nl: {
    title: "Stel je website samen — vaste prijs | Studio VM",
    description:
      "Kies je pakket, onderhoud en domein en zie meteen je exacte vaste prijs. 30% om je scope vast te leggen — geen offertes met sterretjes, geen lock-in op je code.",
  },
  fr: {
    title: "Composez votre site — prix fixe | Studio VM",
    description:
      "Choisissez forfait, maintenance et domaine et voyez votre prix fixe exact. 30% pour verrouiller votre scope — sans astérisques, sans lock-in sur votre code.",
  },
  en: {
    title: "Build your website — fixed price | Studio VM",
    description:
      "Pick your package, maintenance and domain and see your exact fixed price. 30% to lock your scope — no quotes with asterisks, no lock-in on your code.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const m = META[l];
  const url = `https://studio-vm.be/${l}/offerte`;
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: url },
    openGraph: {
      title: m.title,
      description: m.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: m.title,
      description: m.description,
    },
  };
}

export default function OfferteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
