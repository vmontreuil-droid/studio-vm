import { notFound, redirect } from "next/navigation";
import { isValidLocale, localePath } from "@/lib/i18n/config";

// Websiteperiode: voortgang briefing → ontwerp → bouw → online. Staat
// niet meer in het portaalmenu; de voortgang per 3D-model staat nu op
// de projectpagina → oude links landen op het overzicht.
export default async function PortalProgress({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  redirect(localePath(locale, "/portail/dashboard"));
}
