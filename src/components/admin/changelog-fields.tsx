import { LOCALES } from "@/lib/i18n/config";
import type { ChangelogRow } from "@/lib/changelog-db";

const LOCALE_LABEL: Record<string, string> = {
  nl: "Nederlands",
  fr: "Français",
  en: "English",
};
const KINDS: { value: string; label: string }[] = [
  { value: "launch", label: "Lancering" },
  { value: "feature", label: "Nieuw" },
  { value: "improve", label: "Beter" },
  { value: "fix", label: "Fix" },
];

const input =
  "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent";
const label =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

export function ChangelogFields({ row }: { row?: ChangelogRow }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="entry_date">
            Datum
          </label>
          <input
            id="entry_date"
            name="entry_date"
            type="date"
            defaultValue={row?.entry_date ?? today}
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="version">
            Versie
          </label>
          <input
            id="version"
            name="version"
            defaultValue={row?.version ?? ""}
            placeholder="bv. 1.6"
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="kind">
            Soort
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue={row?.kind ?? "feature"}
            className={input}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {LOCALES.map((loc) => {
        const c = row?.content?.[loc];
        return (
          <fieldset key={loc} className="rounded-2xl border bg-card p-5">
            <legend className="px-2 font-mono text-xs uppercase tracking-widest text-accent">
              {LOCALE_LABEL[loc] ?? loc}
            </legend>
            <div className="space-y-4">
              <div>
                <label className={label} htmlFor={`title_${loc}`}>
                  Titel
                </label>
                <input
                  id={`title_${loc}`}
                  name={`title_${loc}`}
                  defaultValue={c?.title ?? ""}
                  className={input}
                />
              </div>
              <div>
                <label className={label} htmlFor={`detail_${loc}`}>
                  Detail
                </label>
                <textarea
                  id={`detail_${loc}`}
                  name={`detail_${loc}`}
                  rows={3}
                  defaultValue={c?.detail ?? ""}
                  className={input}
                />
              </div>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
