export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Pagina laden"
      className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden"
    >
      <div className="h-full w-full origin-left animate-[loading-bar_1.2s_ease-in-out_infinite] bg-accent" />
      <style>{`
        @keyframes loading-bar {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.6); }
          100% { transform: scaleX(1); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
