"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Rocket, ArrowRight } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

// Slanke, sluitbare promobalk over de publieke site: triggert bezoekers
// naar het zelfbouw-aanbod zonder een opdringerige popup. Onthoudt
// "gesloten" lokaal zodat hij niet blijft terugkomen.
export function PromoBar() {
  const path = usePathname() || "";
  const seg = path.split("/")[1];
  const locale: Locale = isValidLocale(seg) ? seg : "nl";
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem("vm_promo_zb") !== "0");
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const t =
    locale === "fr"
      ? {
          msg: "Vous préférez construire vous-même ? Site en ligne dès",
          cta: "Découvrir",
          per: "/mois",
        }
      : locale === "en"
        ? {
            msg: "Rather build it yourself? Site online from",
            cta: "Discover",
            per: "/month",
          }
        : {
            msg: "Liever zelf bouwen? Je site online vanaf",
            cta: "Ontdek",
            per: "/maand",
          };

  return (
    <div className="relative z-40 bg-accent text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-10 py-2 text-center text-xs sm:text-sm">
        <Rocket className="hidden h-3.5 w-3.5 shrink-0 sm:block" strokeWidth={2} />
        <span>
          {t.msg} <strong>€39{t.per}</strong>.
        </span>
        <Link
          href={localePath(locale, "/zelf-bouwen")}
          className="inline-flex shrink-0 items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-90"
        >
          {t.cta}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </Link>
      </div>
      <button
        type="button"
        aria-label="Sluiten"
        onClick={() => {
          try {
            localStorage.setItem("vm_promo_zb", "0");
          } catch {
            /* negeren */
          }
          setShow(false);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
