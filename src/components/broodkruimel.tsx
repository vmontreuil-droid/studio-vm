import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { HOME_LABEL } from "@/lib/seo";

const LABEL: Record<Locale, string> = {
  nl: "Kruimelpad",
  fr: "Fil d'Ariane",
  en: "Breadcrumb",
  de: "Brotkrumen",
  es: "Ruta de navegación",
};

/**
 * Zichtbaar kruimelpad. Home staat er automatisch vooraan; `pad` is zonder
 * taal. De laatste schakel is de huidige pagina en krijgt geen link.
 * Rendert zelf geen JSON-LD: de pagina zet kruimels() in haar graph.
 */
export function Broodkruimel({
  locale,
  items,
}: {
  locale: Locale;
  items: { naam: string; pad?: string }[];
}) {
  return (
    <nav aria-label={LABEL[locale]}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <li>
          {items.length === 0 ? (
            <span aria-current="page">{HOME_LABEL[locale]}</span>
          ) : (
            <Link href={`/${locale}`} className="hover:text-accent">
              {HOME_LABEL[locale]}
            </Link>
          )}
        </li>
        {items.map((it, i) => {
          const laatste = i === items.length - 1;
          return (
            <li key={`${i}-${it.naam}`} className="flex items-center gap-1.5">
              <span aria-hidden="true">›</span>
              {laatste ? (
                <span aria-current="page">{it.naam}</span>
              ) : it.pad ? (
                <Link href={`/${locale}${it.pad === "/" ? "" : it.pad}`} className="hover:text-accent">
                  {it.naam}
                </Link>
              ) : (
                <span>{it.naam}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
