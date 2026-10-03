// Omhulsel voor de juridische teksten in het klantenportaal: een kop zoals de
// andere portaalpagina's, tabbladen tussen de drie documenten, een leesbare
// kolom en een compacte inhoudstafel. Geen hero of achtergrond van de
// publieke site; de portaal-shell (menu) komt uit de dashboard-layout.
import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ScrollText, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { InhoudToc, type TocItem } from "@/components/inhoud-toc";
import { PAGINA_BIJGEWERKT, datumLabel } from "@/lib/bijgewerkt";
import { VOORWAARDEN } from "./voorwaarden-inhoud";
import { PRIVACY } from "./privacy-inhoud";
import { COOKIES } from "./cookies-inhoud";
import { juridischeLinks, type JuridischPad } from "./links";

type Kop = { eyebrow: string; title: string; updated: string };

const KOPPEN: Record<JuridischPad, Record<Locale, Kop>> = {
  "/voorwaarden": VOORWAARDEN,
  "/privacy": PRIVACY,
  "/cookies": COOKIES,
};

const ICOON: Record<JuridischPad, LucideIcon> = {
  "/voorwaarden": ScrollText,
  "/privacy": ShieldCheck,
  "/cookies": Cookie,
};

const VOLGORDE: JuridischPad[] = ["/voorwaarden", "/privacy", "/cookies"];

const L: Record<Locale, { inhoud: string; documenten: string }> = {
  nl: { inhoud: "Inhoud", documenten: "Juridische documenten" },
  fr: { inhoud: "Sommaire", documenten: "Documents juridiques" },
  en: { inhoud: "Contents", documenten: "Legal documents" },
  de: { inhoud: "Inhalt", documenten: "Rechtliche Dokumente" },
  es: { inhoud: "Índice", documenten: "Documentos legales" },
};

/** Metadata voor een juridische portaalpagina: zelfde titel als publiek, niet geïndexeerd. */
export function portaalJuridischMeta(meta: { title: string; description: string }): Metadata {
  return {
    title: { absolute: meta.title },
    description: meta.description,
    robots: { index: false, follow: false },
  };
}

export function PortaalJuridisch({
  locale,
  pad,
  toc,
  genummerd = false,
  children,
}: {
  locale: Locale;
  pad: JuridischPad;
  toc: TocItem[];
  genummerd?: boolean;
  children: React.ReactNode;
}) {
  const kop = KOPPEN[pad][locale];
  const l = L[locale];
  const links = juridischeLinks(locale, "portaal");
  const Icoon = ICOON[pad];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
            <Icoon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {kop.title}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {kop.updated}: {datumLabel(locale, PAGINA_BIJGEWERKT[pad])}
            </p>
          </div>
        </div>
        <nav aria-label={l.documenten} className="flex flex-wrap gap-1.5">
          {VOLGORDE.map((p) => {
            const actief = p === pad;
            const TabIcoon = ICOON[p];
            return (
              <Link
                key={p}
                href={links[p]}
                aria-current={actief ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  actief
                    ? "bg-card-hover font-medium text-foreground"
                    : "text-muted hover:bg-card-hover hover:text-foreground"
                }`}
              >
                <TabIcoon className="h-3.5 w-3.5" strokeWidth={2} />
                {KOPPEN[p][locale].eyebrow}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,75ch)_15rem] xl:gap-14">
        <article className="min-w-0 max-w-[75ch]">
          <details className="mb-8 rounded-2xl border bg-card px-5 py-4 xl:hidden">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-muted">
              {l.inhoud} ({toc.length})
            </summary>
            <div className="mt-4">
              <InhoudToc items={toc} genummerd={genummerd} ariaLabel={l.inhoud} />
            </div>
          </details>
          <div className="space-y-10">{children}</div>
        </article>
        <aside className="hidden xl:sticky xl:top-10 xl:block xl:max-h-[calc(100dvh-5rem)] xl:self-start xl:overflow-y-auto">
          <InhoudToc kop={l.inhoud} items={toc} genummerd={genummerd} />
        </aside>
      </div>
    </>
  );
}
