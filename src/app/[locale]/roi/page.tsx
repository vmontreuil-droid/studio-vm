import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoiCalculator } from "@/components/roi-calculator";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

const meta: Record<Locale, { title: string; desc: string }> = {
  nl: {
    title: "Wat kost een trage site je? — Studio VM",
    desc: "Reken uit hoeveel omzet je jaarlijks verliest door een trage website. Verstelbaar, indicatief, eerlijk.",
  },
  fr: {
    title: "Que vous coûte un site lent ? — Studio VM",
    desc: "Calculez combien de chiffre d'affaires vous perdez chaque année à cause d'un site lent. Ajustable, indicatif, honnête.",
  },
  en: {
    title: "What does a slow site cost you? — Studio VM",
    desc: "Work out how much revenue you lose yearly to a slow website. Adjustable, indicative, honest.",
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

export default async function RoiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return (
    <main>
      <RoiCalculator />
    </main>
  );
}
