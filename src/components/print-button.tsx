"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border bg-card-hover px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-foreground"
    >
      <Printer className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}
