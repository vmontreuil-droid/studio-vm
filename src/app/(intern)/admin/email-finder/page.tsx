import { AlertTriangle } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { EmailFinderForm } from "@/components/email-finder-form";

export const dynamic = "force-dynamic";

export default async function AdminEmailFinder({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { url } = await searchParams;
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Contactadres-zoeker
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Geef één website-URL — ik haal het publiek vermelde contactadres
          (mailto-links + contactpagina&apos;s op hetzelfde domein) zodat je
          die prospect persoonlijk kan benaderen met zijn scan.
        </p>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0"
          strokeWidth={2}
        />
        <p>
          Bewust <strong>één site per keer</strong>. Massa-scraping van
          duizenden websites bouw ik niet — onder GDPR/ePrivacy heb je in
          België opt-in nodig voor commerciële e-mail, dus zo&apos;n lijst
          zou je niet legaal mogen aanschrijven, en het kost je
          afzenderreputatie (blacklist). Deze tool helpt je gericht: één
          prospect, één concreet contactadres dat het bedrijf zelf
          publiceert.
        </p>
      </div>

      <EmailFinderForm initialUrl={url} />
    </>
  );
}
