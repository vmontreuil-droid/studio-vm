"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

// Knop die automatisch een draaiende cirkel toont + zichzelf uitschakelt
// zolang de bijhorende server action loopt. Gebruik binnen een <form>.
export function SubmitButton({
  children,
  className,
  pendingLabel,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 disabled:cursor-progress disabled:opacity-70 ${
        className ?? ""
      }`}
    >
      {pending && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2} />
      )}
      <span>{pending && pendingLabel ? pendingLabel : children}</span>
    </button>
  );
}
