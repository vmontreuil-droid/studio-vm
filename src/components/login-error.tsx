"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";

// Foutcodes van /api/admin/login (?e=).
function melding(e: string | null, m: string | null): string | null {
  if (e === "1") return "Wachtwoord of code klopt niet. Probeer opnieuw.";
  if (e === "2") {
    const min = Number(m) || 15;
    return `Te veel foute pogingen. Probeer opnieuw over ${min} ${min === 1 ? "minuut" : "minuten"}.`;
  }
  if (e === "3") return "Vul ook de code uit je authenticator-app in.";
  if (e === "4") return "De databank is even niet bereikbaar. Probeer het zo meteen opnieuw.";
  return null;
}

function ErrorChip() {
  const q = useSearchParams();
  const tekst = melding(q.get("e"), q.get("m"));
  if (!tekst) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400"
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <span>{tekst}</span>
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

/** Verborgen veld: na het aanmelden terug naar deze pagina binnen /admin. */
export function TerugVeld() {
  const pad = usePathname() || "/admin";
  return <input type="hidden" name="terug" value={pad} />;
}
