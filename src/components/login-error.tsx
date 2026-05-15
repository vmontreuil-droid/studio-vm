"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

function ErrorChip() {
  const failed = useSearchParams().get("e") === "1";
  if (!failed) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <span>Verkeerd wachtwoord. Probeer opnieuw.</span>
    </p>
  );
}

export function LoginError() {
  return (
    <Suspense fallback={null}>
      <ErrorChip />
    </Suspense>
  );
}
