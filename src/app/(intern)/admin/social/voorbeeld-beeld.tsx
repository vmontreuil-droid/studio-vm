"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

// Voorbeeldbeeld van een bericht met terugvalbronnen: eerst de JPEG-route
// (/beeld/social/…), dan de oude kaartroute, dan het bronbeeld uit /public.
// Een beeld dat al vóór de hydratatie mislukte, vangt de ref op.
export function VoorbeeldBeeld({
  bronnen,
  alt,
  ratio,
  className = "",
}: {
  bronnen: string[];
  alt: string;
  /** CSS aspect-ratio, bv. "4 / 5". */
  ratio: string;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const src = bronnen[i];
  if (!src) {
    return (
      <div
        className={`grid place-items-center rounded-lg bg-card-hover text-muted ${className}`}
        style={{ aspectRatio: ratio }}
        aria-label={alt}
      >
        <ImageOff className="h-5 w-5" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`block rounded-lg bg-card-hover object-cover ${className}`}
      style={{ aspectRatio: ratio }}
      onError={() => setI((x) => x + 1)}
      ref={(el) => {
        if (el && el.complete && el.naturalWidth === 0 && el.getAttribute("src") === src) setI((x) => (x === i ? x + 1 : x));
      }}
    />
  );
}
