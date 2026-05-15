export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={`font-extrabold lowercase tracking-tighter ${className ?? ""}`}
    >
      vm<span className="text-accent">.</span>
    </span>
  );
}
