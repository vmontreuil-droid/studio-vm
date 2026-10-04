"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Link2, Mail, Share2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { metUtm, type UtmBron } from "@/lib/utm";
import { MerkIcoon, type Merk } from "@/components/merk-iconen";

// Deelrij: het deelvenster van het toestel (Web Share) waar dat bestaat, en
// altijd: link kopiëren, WhatsApp, Facebook, X en e-mail.
//
// Gewone links, geen scripts of pixels van de platformen: er gaat niets naar
// Facebook, WhatsApp of X zolang de bezoeker niet klikt (zie de
// privacyverklaring). WhatsApp zonder nummer (wa.me/?text=): de bezoeker kiest
// zelf naar wie. Links naar een platform krijgen utm_source=<platform> en
// utm_medium=share (lib/utm); gekopieerde en gemailde links blijven kaal.

const T: Record<
  Locale,
  {
    delen: string;
    groep: string;
    toestel: string;
    kopieer: string;
    gekopieerd: string;
    whatsapp: string;
    facebook: string;
    x: string;
    mail: string;
    mailIntro: string;
  }
> = {
  nl: {
    delen: "Delen",
    groep: "Deze pagina delen",
    toestel: "Delen via…",
    kopieer: "Link kopiëren",
    gekopieerd: "Link gekopieerd",
    whatsapp: "Delen via WhatsApp",
    facebook: "Delen op Facebook",
    x: "Delen op X",
    mail: "Versturen per e-mail",
    mailIntro: "Dit is misschien interessant voor u:",
  },
  fr: {
    delen: "Partager",
    groep: "Partager cette page",
    toestel: "Partager via…",
    kopieer: "Copier le lien",
    gekopieerd: "Lien copié",
    whatsapp: "Partager via WhatsApp",
    facebook: "Partager sur Facebook",
    x: "Partager sur X",
    mail: "Envoyer par e-mail",
    mailIntro: "Ceci pourrait vous intéresser :",
  },
  en: {
    delen: "Share",
    groep: "Share this page",
    toestel: "Share via…",
    kopieer: "Copy link",
    gekopieerd: "Link copied",
    whatsapp: "Share via WhatsApp",
    facebook: "Share on Facebook",
    x: "Share on X",
    mail: "Send by email",
    mailIntro: "You may find this useful:",
  },
  de: {
    delen: "Teilen",
    groep: "Diese Seite teilen",
    toestel: "Teilen über…",
    kopieer: "Link kopieren",
    gekopieerd: "Link kopiert",
    whatsapp: "Über WhatsApp teilen",
    facebook: "Auf Facebook teilen",
    x: "Auf X teilen",
    mail: "Per E-Mail senden",
    mailIntro: "Das könnte Sie interessieren:",
  },
  es: {
    delen: "Compartir",
    groep: "Compartir esta página",
    toestel: "Compartir mediante…",
    kopieer: "Copiar enlace",
    gekopieerd: "Enlace copiado",
    whatsapp: "Compartir por WhatsApp",
    facebook: "Compartir en Facebook",
    x: "Compartir en X",
    mail: "Enviar por correo electrónico",
    mailIntro: "Esto podría interesarle:",
  },
};

const geenAbonnement = () => () => {};
const kanToestelDelen = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

const KNOP =
  "grid h-10 w-10 place-items-center rounded-full border bg-card text-muted transition-colors hover:border-muted-foreground! hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:h-9 sm:w-9";

/** Naar het klembord; valt terug op execCommand en in laatste instantie op een venster om zelf te kopiëren. */
async function naarKlembord(tekst: string, vraag: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(tekst);
    return true;
  } catch {
    /* geen klembord-API (oude of ingebouwde browser): volgende poging */
  }
  try {
    const veld = document.createElement("textarea");
    veld.value = tekst;
    veld.setAttribute("readonly", "");
    veld.style.position = "fixed";
    veld.style.opacity = "0";
    document.body.appendChild(veld);
    veld.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(veld);
    if (ok) return true;
  } catch {
    /* laatste uitweg hieronder */
  }
  window.prompt(vraag, tekst);
  return false;
}

export function DeelKnoppen({
  locale,
  url,
  tekst,
  ariaLabel,
  metLabel = true,
  className = "",
}: {
  locale: Locale;
  /** Volledig, canoniek adres (https://www.studio-vm.be/…), eventueel met #anker. */
  url: string;
  /** Titel of korte zin die met de link meegaat. */
  tekst: string;
  /** Naam van de groep voor schermlezers; standaard "Deze pagina delen". */
  ariaLabel?: string;
  /** Het woord "Delen" vooraan tonen. */
  metLabel?: boolean;
  className?: string;
}) {
  const t = T[locale];
  const toestel = useSyncExternalStore(geenAbonnement, kanToestelDelen, () => false);
  const [gekopieerd, setGekopieerd] = useState(false);

  async function kopieer() {
    if (await naarKlembord(url, t.kopieer)) {
      setGekopieerd(true);
      window.setTimeout(() => setGekopieerd(false), 2500);
    }
  }

  async function deelViaToestel() {
    try {
      await navigator.share({ title: tekst, url });
    } catch (e) {
      // Zelf geannuleerd: niets doen. Anders (geweigerd, niet ondersteund): kopiëren.
      if (e instanceof DOMException && e.name === "AbortError") return;
      await kopieer();
    }
  }

  const naar = (bron: UtmBron) => metUtm(url, { bron, medium: "share" });
  const links: { merk: Merk; label: string; href: string }[] = [
    { merk: "whatsapp", label: t.whatsapp, href: `https://wa.me/?text=${encodeURIComponent(`${tekst}\n${naar("whatsapp")}`)}` },
    { merk: "facebook", label: t.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(naar("facebook"))}` },
    { merk: "x", label: t.x, href: `https://x.com/intent/tweet?text=${encodeURIComponent(tekst)}&url=${encodeURIComponent(naar("x"))}` },
  ];
  const mail = `mailto:?subject=${encodeURIComponent(tekst)}&body=${encodeURIComponent(`${t.mailIntro}\n\n${tekst}\n${url}`)}`;

  return (
    <div role="group" aria-label={ariaLabel ?? t.groep} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {metLabel && (
        // Op een smal scherm een eigen regel, zodat de zes knoppen naast elkaar passen.
        <span aria-hidden="true" className="basis-full font-mono text-xs uppercase tracking-widest text-muted sm:mr-1 sm:basis-auto">
          {t.delen}
        </span>
      )}
      {toestel && (
        <button type="button" onClick={deelViaToestel} aria-label={t.toestel} title={t.toestel} className={KNOP}>
          <Share2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}
      <span className="relative">
        <button
          type="button"
          onClick={kopieer}
          aria-label={t.kopieer}
          title={gekopieerd ? t.gekopieerd : t.kopieer}
          className={`${KNOP} ${gekopieerd ? "border-accent! text-accent hover:border-accent! hover:text-accent" : ""}`}
        >
          {gekopieerd ? <Check className="h-4 w-4" strokeWidth={2} /> : <Link2 className="h-4 w-4" strokeWidth={1.75} />}
        </button>
        {/* Zichtbare bevestiging boven de knop, zonder de rij te verschuiven. */}
        {gekopieerd && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background shadow-sm"
          >
            {t.gekopieerd}
          </span>
        )}
      </span>
      {links.map((l) => (
        <a key={l.merk} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} title={l.label} className={KNOP}>
          <MerkIcoon merk={l.merk} />
        </a>
      ))}
      <a href={mail} aria-label={t.mail} title={t.mail} className={KNOP}>
        <Mail className="h-4 w-4" strokeWidth={1.75} />
      </a>
      <span aria-live="polite" className="sr-only">
        {gekopieerd ? t.gekopieerd : ""}
      </span>
    </div>
  );
}
