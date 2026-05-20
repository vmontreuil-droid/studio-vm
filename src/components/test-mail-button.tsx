"use client";

import { useActionState } from "react";
import { Send, Check, AlertCircle } from "lucide-react";
import { sendTestMailAction } from "@/app/actions/outreach";
import { SubmitButton } from "@/components/submit-button";

export function TestMailButton({ id, to }: { id: string; to: string }) {
  const [state, action] = useActionState(sendTestMailAction, null);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        pendingLabel="Verzenden…"
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Send className="h-4 w-4" strokeWidth={2.5} />
        Stuur naar {to}
      </SubmitButton>
      {state?.ok && (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" strokeWidth={2.5} />
          Verstuurd — check je inbox (en spam-folder!)
        </span>
      )}
      {state && !state.ok && (
        <span className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
          {state.error}
        </span>
      )}
    </form>
  );
}
