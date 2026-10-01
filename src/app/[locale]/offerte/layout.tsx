import type { Metadata } from "next";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const META: Record<Locale, { title: string; description: string }> = {
  nl: {
    title: "Offerte aanvragen — 3D-model voor machinesturing | Studio VM",
    description:
      "Laad uw plannen op, geef het werfadres en het merk van uw machinesturing. U krijgt een offerte op maat voor een 3D-model in het juiste formaat en coördinatenstelsel.",
  },
  fr: {
    title: "Demander un devis — modèle 3D pour le guidage d'engins | Studio VM",
    description:
      "Chargez vos plans, indiquez l'adresse du chantier et la marque de votre guidage. Vous recevez un devis sur mesure pour un modèle 3D dans le bon format et système de coordonnées.",
  },
  en: {
    title: "Request a quote — 3D model for machine control | Studio VM",
    description:
      "Upload your plans, give the site address and your machine control brand. You get a tailored quote for a 3D model in the right format and coordinate system.",
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
