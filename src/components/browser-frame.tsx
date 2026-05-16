// Toont de échte voorpagina van een realisatie in een browser-frame,
// zónder weg te linken — de bezoeker blijft op studio-vm. Bij hover
// "scrollt" de pagina traag door zodat het levend aanvoelt.

function hostOf(url: string | null): string {
  if (!url) return "voorbeeld.be";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

export function BrowserFrame({
  url,
  image,
  name,
  accent,
}: {
  url: string | null;
  image?: string;
  name: string;
  accent: string;
}) {
  const host = hostOf(url);
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* browser-chrome */}
      <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="mx-auto flex items-center gap-2 rounded-full border bg-card px-4 py-1 font-mono text-xs text-muted">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: accent }}
          />
          {host}
        </span>
      </div>

      {/* viewport — echte screenshot, scrollt traag bij hover */}
      <div className="group relative h-[440px] overflow-hidden sm:h-[560px]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${name} — echte voorpagina`}
            className="absolute inset-x-0 top-0 w-full transition-transform duration-[7000ms] ease-linear group-hover:-translate-y-[55%] motion-reduce:transition-none"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${accent}, color-mix(in oklab, ${accent} 60%, #0c0a09))`,
            }}
          />
        )}
      </div>
    </div>
  );
}
