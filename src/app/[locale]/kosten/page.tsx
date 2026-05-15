import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TcoChart } from "@/components/tco-chart";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

const meta: Record<Locale, { title: string; desc: string }> = {
  nl: {
    title: "5-jaars kostenvergelijking — Studio VM",
    desc: "Totale kost over 5 jaar: Studio VM vs WordPress vs Shopify vs agency. Met omzet-slider.",
  },
  fr: {
    title: "Comparaison de coûts sur 5 ans — Studio VM",
    desc: "Coût total sur 5 ans : Studio VM vs WordPress vs Shopify vs agence. Avec curseur de CA.",
  },
  en: {
    title: "5-year cost comparison — Studio VM",
    desc: "Total cost over 5 years: Studio VM vs WordPress vs Shopify vs agency. With revenue slider.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return { title: meta[locale].title, description: meta[locale].desc };
}

export default async function KostenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return (
    <main>
      <TcoChart />
    </main>
  );
}
