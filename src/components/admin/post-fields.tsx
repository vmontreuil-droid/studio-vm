import { LOCALES } from "@/lib/i18n/config";
import type { JournalRow } from "@/lib/journal-db";

const LOCALE_LABEL: Record<string, string> = {
  nl: "Nederlands",
  fr: "Français",
  en: "English",
};

const input =
  "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent";
const label =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

export function PostFields({ row }: { row?: JournalRow }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className={label} htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={row?.slug ?? ""}
            placeholder="bv. waarom-weg-van-wordpress"
            className={input}
          />
          <p className="mt-1 text-[11px] text-muted">
            Leeg laten = automatisch uit NL-titel.
          </p>
        </div>
        <div>
          <label className={label} htmlFor="post_date">
            Datum
          </label>
          <input
            id="post_date"
            name="post_date"
            type="date"
            defaultValue={row?.post_date ?? today}
            className={input}
          />
        </div>
        <div>
          <label className={label} htmlFor="read_min">
            Leestijd (min)
          </label>
          <input
            id="read_min"
            name="read_min"
            type="number"
            min={1}
            max={60}
            defaultValue={row?.read_min ?? 4}
            className={input}
          />
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
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
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
                  <label className={label} htmlFor={`tag_${loc}`}>
                    Tag
                  </label>
                  <input
                    id={`tag_${loc}`}
                    name={`tag_${loc}`}
                    defaultValue={c?.tag ?? ""}
                    placeholder="Migratie"
                    className={`${input} sm:w-40`}
                  />
                </div>
              </div>
              <div>
                <label className={label} htmlFor={`excerpt_${loc}`}>
                  Inleiding
                </label>
                <textarea
                  id={`excerpt_${loc}`}
                  name={`excerpt_${loc}`}
                  rows={2}
                  defaultValue={c?.excerpt ?? ""}
                  className={input}
                />
              </div>
              <div>
                <label className={label} htmlFor={`body_${loc}`}>
                  Tekst
                </label>
                <textarea
                  id={`body_${loc}`}
                  name={`body_${loc}`}
                  rows={12}
                  defaultValue={c?.body ?? ""}
                  placeholder={
                    "Alinea's scheiden met een lege regel.\n**Tussentitel** op eigen regel.\n- opsomming met streepje"
                  }
                  className={`${input} font-mono text-[13px] leading-relaxed`}
                />
              </div>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
