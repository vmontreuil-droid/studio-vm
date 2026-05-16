"use client";

import { useMemo, useState } from "react";

type Item = { key: string; slug?: string; name: string; cents: number; desc?: string };
type Included = Record<
  string,
  { addons: string[]; sub: string; lang: string }
>;

const eur = (c: number) => `€ ${(c / 100).toFixed(2)}`;

export function OfferBuilder({
  email,
  bases,
  addons,
  subs,
  included,
  action,
}: {
  email: string;
  bases: Item[];
  addons: Item[];
  subs: Item[];
  included: Included;
  action: (formData: FormData) => Promise<void>;
}) {
  const [baseKey, setBaseKey] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const base = bases.find((b) => b.key === baseKey);
  const inc = base?.slug ? included[base.slug] : undefined;
  const incNames = useMemo(() => inc?.addons ?? [], [inc]);

  const lines = useMemo(() => {
    const out: { label: string; desc: string; cents: number; incl: boolean }[] =
      [];
    if (base)
      out.push({
        label: base.name,
        desc: "Basispakket",
        cents: base.cents,
        incl: false,
      });
    if (inc) {
      for (const n of inc.addons) {
        const a = addons.find((x) => x.name === n);
        if (a)
          out.push({
            label: a.name,
            desc: a.desc ?? "",
            cents: 0,
            incl: true,
          });
      }
      const s = subs.find((x) => x.slug === inc.sub);
      if (s)
        out.push({
          label: s.name,
          desc: s.desc ?? "",
          cents: 0,
          incl: true,
        });
    }
    for (const k of checked) {
      const a = addons.find((x) => x.key === k);
      if (!a || incNames.includes(a.name)) continue;
      out.push({
        label: a.name,
        desc: a.desc ?? "",
        cents: a.cents,
        incl: false,
      });
    }
    return out;
  }, [base, inc, checked, addons, subs, incNames]);

  const total = lines.reduce((s, l) => s + l.cents, 0);
  const field =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-dashed bg-card/50 p-5"
    >
      <input type="hidden" name="client_email" value={email} />

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          Klantgegevens
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="client_name" placeholder="Naam contactpersoon" className={field} />
          <input name="client_company" placeholder="Bedrijf" className={field} />
        </div>
        <input name="client_address" placeholder="Adres" className={`mt-2 ${field}`} />
        <input
          name="vat_number"
          placeholder="BTW-nummer (bv. BE0123456789) — VIES-controle"
          className={`mt-2 ${field}`}
        />
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          Pakket
        </p>
        <select
          name="base"
          value={baseKey}
          onChange={(e) => setBaseKey(e.target.value)}
          className={field}
        >
          <option value="">— Geen basispakket —</option>
          {bases.map((b) => (
            <option key={b.key} value={b.key}>
              {b.name} · {eur(b.cents)}
            </option>
          ))}
        </select>
        {inc && (
          <p className="mt-1 font-mono text-[11px] text-accent">
            {inc.lang} · inbegrepen opties verschijnen automatisch hieronder
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          Extra opties
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {addons.map((a) => {
            const isInc = incNames.includes(a.name);
            return (
              <label
                key={a.key}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  isInc ? "border-accent/40 bg-accent/5" : "bg-background"
                }`}
              >
                <input
                  type="checkbox"
                  name="addon"
                  value={a.key}
                  disabled={isInc}
                  checked={isInc || checked.has(a.key)}
                  onChange={(e) =>
                    setChecked((prev) => {
                      const n = new Set(prev);
                      if (e.target.checked) n.add(a.key);
                      else n.delete(a.key);
                      return n;
                    })
                  }
                />
                <span className="flex-1">{a.name}</span>
                <span className="font-mono text-xs text-muted">
                  {isInc ? "inbegrepen" : a.cents ? eur(a.cents) : "—"}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Live offerte-lijnen */}
      <div className="rounded-xl border bg-background p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          Offerte-lijnen
        </p>
        {lines.length === 0 ? (
          <p className="text-sm text-muted">
            Kies een pakket en opties — de lijnen verschijnen hier.
          </p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 border-b pb-2 text-sm last:border-0 last:pb-0"
              >
                <span className="min-w-0">
                  <span className="font-medium">{l.label}</span>
                  {l.desc && (
                    <span className="mt-0.5 block text-xs text-muted">
                      {l.desc}
                    </span>
                  )}
                </span>
                <span
                  className={`shrink-0 font-mono text-xs ${
                    l.incl ? "text-accent" : ""
                  }`}
                >
                  {l.incl ? "inbegrepen" : eur(l.cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold">Totaal (excl. btw)</span>
          <span className="font-mono text-base font-bold">{eur(total)}</span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <select name="valid_days" defaultValue="7" className={field}>
          <option value="7">Bedenktijd: 1 week</option>
          <option value="14">Bedenktijd: 14 dagen</option>
          <option value="30">Bedenktijd: 30 dagen</option>
        </select>
        <input name="title" placeholder="Titel (optioneel)" className={field} />
        <input
          name="amount"
          placeholder="Totaal override € (optioneel)"
          className={field}
        />
      </div>

      <textarea
        name="body"
        rows={2}
        placeholder="Omschrijving voor de klant (optioneel)"
        className={field}
      />
      <textarea
        name="internal_note"
        rows={2}
        placeholder="Interne notities (enkel voor jou — niet zichtbaar voor de klant)"
        className={field}
      />

      <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
        Offerte aanmaken &amp; versturen
      </button>
    </form>
  );
}
