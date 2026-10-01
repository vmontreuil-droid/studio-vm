import { notFound, redirect } from "next/navigation";
import { isValidLocale, localePath } from "@/lib/i18n/config";

// Websiteperiode: onboarding-checklist (logo, teksten, foto's…). Staat
// niet meer in het portaalmenu (Studio VM levert nu 3D-modellen) →
// oude links landen op het overzicht.
export default async function PortalChecklist({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  redirect(localePath(locale, "/portail/dashboard"));
}
