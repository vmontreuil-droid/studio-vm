import BuilderPage from "@/app/[locale]/builder/page";

export const dynamic = "force-dynamic";

// De visuele builder, maar binnen het klantportaal (sidebar blijft).
// De klant kan z'n ontwerp lokaal bewaren (autosave) en doorsturen;
// Studio VM krijgt een mail en ziet het in /admin/aanvragen.
export default function PortalBuilder() {
  return <BuilderPage />;
}
