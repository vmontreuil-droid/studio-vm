import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { nowConfigured, dbNowRow } from "@/lib/now-db";
import { saveNow } from "@/app/actions/now";
import { LOCALES } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  nl: "Nederlands",
  fr: "Français",
  en: "English",
};
const input =
  "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent";
const label =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

export default async function AdminNow() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  if (!nowConfigured) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">/now</h1>
        <p className="mt-4 max-w-prose text-muted">
          De now-tabel bestaat nog niet. Pas migratie{" "}
          <code>0009_now.sql</code> toe in Supabase → SQL Editor. Tot dan toont
          /now de ingebouwde teksten en verandert er niets live.
        </p>
      </>
    );
  }

  const row = await dbNowRow();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">/now bewerken</h1>
      <p className="mt-2 text-sm text-muted">
        Eén item per regel. Leeg laten = de ingebouwde tekst blijft staan.
      </p>

      <form action={saveNow} className="mt-6 space-y-6">
        <div className="max-w-xs">
          <label className={label} htmlFor="updated_on">
            Bijgewerkt op
          </label>
          <input
            id="updated_on"
            name="updated_on"
            type="date"
            defaultValue={row?.updated_on ?? today}
            className={input}
          />
        </div>

        {LOCALES.map((loc) => {
          const c = row?.content?.[loc];
          return (
            <fieldset key={loc} className="rounded-2xl border bg-card p-5">
              <legend className="px-2 font-mono text-xs uppercase tracking-widest text-accent">
                {LABEL[loc] ?? loc}
              </legend>
              <div className="space-y-4">
                <div>
                  <label className={label} htmlFor={`work_${loc}`}>
                    Werk in uitvoering (één per regel)
                  </label>
                  <textarea
                    id={`work_${loc}`}
                    name={`work_${loc}`}
                    rows={4}
                    defaultValue={(c?.work ?? []).join("\n")}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label} htmlFor={`ideas_${loc}`}>
                    Ideeën (één per regel)
                  </label>
                  <textarea
                    id={`ideas_${loc}`}
                    name={`ideas_${loc}`}
                    rows={4}
                    defaultValue={(c?.ideas ?? []).join("\n")}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label} htmlFor={`bandwidth_${loc}`}>
                    Bandbreedte-tekst
                  </label>
                  <textarea
                    id={`bandwidth_${loc}`}
                    name={`bandwidth_${loc}`}
                    rows={2}
                    defaultValue={c?.bandwidth ?? ""}
                    className={input}
                  />
                </div>
              </div>
            </fieldset>
          );
        })}

        <button className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90">
          Opslaan
        </button>
      </form>
    </>
  );
}
