// Inhoudstafel voor lange leesteksten (voorwaarden, privacy, cookies, kennis).
// Puur ankerlinks, geen client-JS. De pagina zet `id` + scroll-mt op de secties.

export type TocItem = { id: string; label: string };

export function InhoudToc({
  items,
  kop,
  ariaLabel,
  genummerd = false,
}: {
  items: TocItem[];
  kop?: string;
  ariaLabel?: string;
  genummerd?: boolean;
}) {
  return (
    <nav aria-label={ariaLabel ?? kop} className="text-sm">
      {kop && (
        <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted">{kop}</p>
      )}
      <ol className="space-y-0.5 border-l">
        {items.map((it, i) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className="-ml-px flex gap-3 border-l border-transparent py-1.5 pl-4 leading-snug text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              {genummerd && (
                <span className="w-5 shrink-0 font-mono text-xs leading-5 text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <span>{it.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
