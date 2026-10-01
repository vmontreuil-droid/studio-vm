"use client";

import { usePathname } from "next/navigation";

// De [locale]-layout is gedeeld tussen de publieke site en het
// portaal. Bij client-side navigatie wordt een gedeelde layout NIET
// opnieuw gerenderd, dus een server-side keuze op basis van het pad
// bleef "hangen" (header/footer weg tot een harde refresh). Daarom
// beslissen we hier, client-side, op basis van het live pad.
export function SiteChrome({
  header,
  footer,
  extras,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  extras: React.ReactNode;
  children: React.ReactNode;
}) {
  const path = usePathname() || "";
  const bare = /\/(portail|admin|builder|preview)(\/|$)/.test(path);

  if (bare) {
    return (
      <div id="main" className="flex min-h-dvh flex-col">
        {children}
      </div>
    );
  }

  return (
    <>
      {header}
      <div id="main" className="flex-1">
        {children}
      </div>
      {footer}
      {extras}
    </>
  );
}
