// Het studio-vm wordmerk: "vm" + accent-punt. Eén bron van waarheid
// zodat sidebar, documenten en pagina's exact hetzelfde tonen.
// Grootte stuur je via className (text-* bepaalt de grootte).
export function Logo({
  className,
  withAdmin = false,
}: {
  className?: string;
  /** Toon het kleine "admin"-suffix (zoals in de admin-sidebar). */
  withAdmin?: boolean;
}) {
  return (
    <span
      className={`font-extrabold lowercase tracking-tighter ${className ?? ""}`}
    >
      vm<span className="text-accent">.</span>
      {withAdmin && (
        <span className="ml-2 align-middle font-mono text-[10px] font-normal uppercase tracking-widest text-muted">
          admin
        </span>
      )}
    </span>
  );
}
