import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { paginaMeta } from "@/lib/seo";

// Titel en beschrijving van /offerte. De pagina leest ze ook voor haar JSON-LD.
export const META: Record<Locale, { title: string; description: string; ogAlt: string }> = {
  nl: {
    title: "Offerte voor een 3D-model machinebesturing | Studio VM",
    description:
      "Laad uw plannen op, geef het werfadres en het merk van uw machinegeleiding of GPS-kraan. U krijgt een offerte op maat, met het juiste coördinatenstelsel.",
    ogAlt: "Offerte voor een 3D-model — Studio VM",
  },
  fr: {
    title: "Devis pour un modèle 3D de guidage d'engins | Studio VM",
    description:
      "Chargez vos plans, indiquez l'adresse du chantier et la marque de votre guidage d'engins ou pelle GPS. Vous recevez un devis sur mesure, avec le bon système.",
    ogAlt: "Devis pour un modèle 3D — Studio VM",
  },
  en: {
    title: "Quote for a machine control 3D model | Studio VM",
    description:
      "Upload your plans, give the site address and your machine control brand or GPS excavator. You get a tailored quote, with the right coordinate system proposed.",
    ogAlt: "Quote for a 3D model — Studio VM",
  },
  de: {
    title: "Angebot für ein 3D-Modell anfordern | Studio VM",
    description:
      "Laden Sie Ihre Pläne hoch und nennen Sie Baustellenadresse und die Marke Ihrer Maschinensteuerung oder Ihres GPS-Baggers. Sie erhalten ein Angebot nach Maß.",
    ogAlt: "Angebot für ein 3D-Modell — Studio VM",
  },
  es: {
    title: "Presupuesto de modelo 3D para maquinaria | Studio VM",
    description:
      "Suba sus planos e indique la dirección de la obra y la marca de su control de maquinaria o excavadora GPS. Recibirá un presupuesto a medida.",
    ogAlt: "Presupuesto de modelo 3D — Studio VM",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const m = META[locale];
  return paginaMeta(locale, "/offerte", {
    title: m.title,
    description: m.description,
    ogBeeld: { url: `/${locale}/offerte/opengraph-image`, alt: m.ogAlt },
  });
}

export default function OfferteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
