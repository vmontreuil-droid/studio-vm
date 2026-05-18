"use client";

import { useMemo, useState } from "react";

type Item = { key: string; slug?: string; name: string; cents: number; desc?: string };
type Included = Record<
  string,
  { addons: string[]; sub: string; lang: string }
>;
type VatLookup = {
  valid: boolean | null;
  name: string | null;
  address: string | null;
};
export type OfferPrefill = Partial<{
  client_email: string;
  client_name: string;
  client_company: string;
  client_address: string;
  vat_number: string;
  base: string;
  sub: string;
  valid_days: string;
  title: string;
  amount: string;
  body: string;
  internal_note: string;
  lockin: string;
}>;

const eur = (c: number) => `€ ${(c / 100).toFixed(2)}`;
const VAT_RATE = 0.21;
const LOCKIN_DISCOUNT = 0.07;
const DEPOSIT_RATE = 0.3;

export function OfferBuilder({
  email,
  emailEditable = false,
  bases,
  addons,
  subs,
  included,
  action,
  lookupVat,
  prefill = {},
}: {
  email: string;
  emailEditable?: boolean;
  bases: Item[];
  addons: Item[];
  subs: Item[];
  included: Included;
  action: (formData: FormData) => Promise<void>;
  lookupVat?: (vat: string) => Promise<VatLookup>;
  prefill?: OfferPrefill;
}) {
  const baseFromPrefill =
    bases.find((b) => b.key === prefill.base || b.slug === prefill.base)?.key ??
    "";
  const [baseKey, setBaseKey] = useState(baseFromPrefill);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [company, setCompany] = useState(prefill.client_company ?? "");
  const [address, setAddress] = useState(prefill.client_address ?? "");
  const [vat, setVat] = useState(prefill.vat_number ?? "");
  const [vatState, setVatState] = useState<
    "idle" | "loading" | "ok" | "bad" | "unknown"
  >("idle");
  const [vatName, setVatName] = useState<string | null>(null);
  const [subOverride, setSubOverride] = useState(prefill.sub ?? "");
  const [lockin, setLockin] = useState(prefill.lockin === "1");

  const base = bases.find((b) => b.key === baseKey);
  const inc = base?.slug ? included[base.slug] : undefined;
  const incNames = useMemo(() => inc?.addons ?? [], [inc]);

  // Welk abonnement? Expliciete keuze wint; anders het bij het pakket
  // inbegrepen abonnement.
  const effectiveSubSlug = subOverride || inc?.sub || "";
  const effectiveSub = subs.find((s) => s.slug === effectiveSubSlug);

  // BTW-land: alles wat geldig is en niet 'BE' = verlegd (0%).
  const vatCountry = vat.trim().toUpperCase().slice(0, 2);
  const isReverse =
    vatState === "ok" && /^[A-Z]{2}$/.test(vatCountry) && vatCountry !== "BE";

  const lines = useMemo(() => {
    const out: {
      label: string;
      desc: string;
      cents: number;
      incl: boolean;
      sub?: boolean;
    }[] = [];
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
    }
    if (effectiveSub)
      out.push({
        label: `${effectiveSub.name} — verplicht · 12 maanden minimum`,
        desc: effectiveSub.desc ?? "",
        cents: 0,
        incl: false,
        sub: true,
      });
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
  }, [base, inc, checked, addons, effectiveSub, incNames]);

  const subtotal = lines.reduce((s, l) => s + l.cents, 0);
  const discount = lockin ? Math.round(subtotal * LOCKIN_DISCOUNT) : 0;
  const payable = subtotal - discount;
  const vatCents = isReverse ? 0 : Math.round(payable * VAT_RATE);
  const grand = payable + vatCents;
  const deposit = lockin ? Math.round(payable * DEPOSIT_RATE) : 0;
  const rest = payable - deposit;

  const field =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";
  const labelCls =
    "mb-2 font-mono text-[10px] uppercase tracking-widest text-muted";

  async function runVies() {
    if (!lookupVat || !vat.trim()) return;
    setVatState("loading");
    setVatName(null);
    try {
      const r = await lookupVat(vat.trim());
      if (r.valid === true) {
        setVatState("ok");
        setVatName(r.name);
        if (r.name) setCompany(r.name);
        if (r.address) setAddress(r.address);
      } else if (r.valid === false) {
        setVatState("bad");
      } else {
        setVatState("unknown");
      }
    } catch {
      setVatState("unknown");
    }
  }

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-dashed bg-card/50 p-5"
    >
      {emailEditable ? (
        <div>
          <p className={labelCls}>
            Klant e-mail (verplicht — hierop komt de portaal-login)
          </p>
          <input
            name="client_email"
            type="email"
            required
            defaultValue={prefill.client_email ?? email}
            placeholder="klant@bedrijf.be"
            className={field}
          />
        </div>
      ) : (
        <input type="hidden" name="client_email" value={email} />
      )}

      <div>
        <p className={labelCls}>Klantgegevens</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="client_name"
            defaultValue={prefill.client_name ?? ""}
            placeholder="Naam contactpersoon"
            className={field}
          />
          <input
            name="client_company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Bedrijf"
            className={field}
          />
        </div>
        <input
          name="client_address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Adres"
          className={`mt-2 ${field}`}
        />
      </div>

      {/* BTW & adres — tussen klantgegevens en pakket */}
      <div className="rounded-xl border bg-background p-4">
        <p className={labelCls}>BTW &amp; adres</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            name="vat_number"
            value={vat}
            onChange={(e) => {
              setVat(e.target.value);
              setVatState("idle");
            }}
            placeholder="BTW-nummer (bv. BE0123456789)"
            className={field}
          />
          <button
            type="button"
            onClick={runVies}
            disabled={!lookupVat || !vat.trim() || vatState === "loading"}
            className="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-card-hover disabled:opacity-50"
          >
            {vatState === "loading"
              ? "Ophalen…"
              : "Gegevens ophalen"}
          </button>
        </div>
        {vatState === "ok" && (
          <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">
            ✓ Geldig BTW-nummer{vatName ? ` — ${vatName}` : ""}. Bedrijf
            en adres zijn ingevuld; pas gerust aan waar nodig.
          </p>
        )}
        {vatState === "bad" && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            ✗ Dit BTW-nummer is niet geldig volgens VIES. Controleer
            het of vul de gegevens handmatig in.
          </p>
        )}
        {vatState === "unknown" && (
          <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            VIES is even onbereikbaar — vul de gegevens handmatig in,
            de offerte kan gewoon door.
          </p>
        )}
        {isReverse && (
          <p className="mt-2 text-xs text-muted">
            Buitenlands geldig BTW-nummer → btw verlegd (0%,
            intracommunautair).
          </p>
        )}
      </div>

      <div>
        <p className={labelCls}>Pakket</p>
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
        <p className={labelCls}>Extra opties</p>
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

      {/* Abonnement — vrij te kiezen, overschrijft het inbegrepen */}
      <div>
        <p className={labelCls}>
          Abonnement (verplicht · 12 maanden minimum)
        </p>
        <select
          name="sub"
          value={effectiveSubSlug}
          onChange={(e) => setSubOverride(e.target.value)}
          className={field}
        >
          <option value="">— Geen abonnement —</option>
          {subs.map((s) => (
            <option key={s.slug ?? s.key} value={s.slug ?? s.key}>
              {s.name} · {eur(s.cents)} / maand
              {inc?.sub && (s.slug ?? s.key) === inc.sub
                ? " (standaard bij dit pakket)"
                : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Directe ondertekening — vastlegkorting + aanbetaling */}
      <label className="flex items-start gap-3 rounded-xl border bg-background p-4 text-sm">
        <input
          type="checkbox"
          name="lockin"
          value="1"
          checked={lockin}
          onChange={(e) => setLockin(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <span className="font-medium">
            Directe ondertekening — 7% korting + 30% aanbetaling + 2
            gratis maanden
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            Zoals op de website: tekent de klant meteen en betaalt hij
            de aanbetaling van 30%, dan ligt de scope vast en krijgt
            hij 7% korting op het eenmalige bedrag én de eerste 2
            maanden van het abonnement gratis. Het abonnement loopt
            minimum 12 maanden. De factuur voor de aanbetaling
            verschijnt automatisch in zijn portaal.
          </span>
        </span>
      </label>

      {/* Live offerte-lijnen + BTW */}
      <div className="rounded-xl border bg-background p-4">
        <p className={labelCls}>Offerte-lijnen</p>
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
                    l.sub
                      ? "text-amber-600 dark:text-amber-400"
                      : l.incl
                        ? "text-accent"
                        : ""
                  }`}
                >
                  {l.sub
                    ? `${eur(effectiveSub?.cents ?? 0)}/m`
                    : l.incl
                      ? "inbegrepen"
                      : eur(l.cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Subtotaal (excl. btw)</span>
            <span className="font-mono">{eur(subtotal)}</span>
          </div>
          {lockin && (
            <div className="flex items-center justify-between text-green-700 dark:text-green-400">
              <span>Vastlegkorting (directe ondertekening) −7%</span>
              <span className="font-mono">− {eur(discount)}</span>
            </div>
          )}
          {lockin && (
            <div className="flex items-center justify-between text-muted">
              <span>Na korting (excl. btw)</span>
              <span className="font-mono">{eur(payable)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-muted">
            <span>{isReverse ? "Btw (0% — verlegd)" : "Btw (21%)"}</span>
            <span className="font-mono">{eur(vatCents)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Totaal (incl. btw)</span>
            <span className="font-mono text-base font-bold">
              {eur(grand)}
            </span>
          </div>
          {lockin && (
            <div className="mt-2 space-y-1 border-t pt-2">
              <div className="flex items-center justify-between font-medium text-foreground">
                <span>Nu te betalen — aanbetaling 30% (excl. btw)</span>
                <span className="font-mono">{eur(deposit)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Rest na oplevering (excl. btw)</span>
                <span className="font-mono">{eur(rest)}</span>
              </div>
            </div>
          )}
          {effectiveSub && (
            <div className="flex items-center justify-between pt-1 text-amber-600 dark:text-amber-400">
              <span>
                + {effectiveSub.name} maandelijks (excl. btw) · 12 mnd
                minimum
              </span>
              <span className="font-mono">
                {eur(effectiveSub.cents)}/m
              </span>
            </div>
          )}
          {lockin && effectiveSub && (
            <div className="flex items-center justify-between text-green-700 dark:text-green-400">
              <span>Eerste 2 maanden abonnement gratis</span>
              <span className="font-mono">
                − {eur(effectiveSub.cents * 2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <select
          name="valid_days"
          defaultValue={prefill.valid_days ?? "7"}
          className={field}
        >
          <option value="7">Bedenktijd: 1 week</option>
          <option value="14">Bedenktijd: 14 dagen</option>
          <option value="30">Bedenktijd: 30 dagen</option>
        </select>
        <input
          name="title"
          defaultValue={prefill.title ?? ""}
          placeholder="Titel (optioneel)"
          className={field}
        />
        <input
          name="amount"
          defaultValue={prefill.amount ?? ""}
          placeholder="Totaal override € (optioneel)"
          className={field}
        />
      </div>

      <textarea
        name="body"
        rows={6}
        defaultValue={prefill.body ?? ""}
        placeholder="Omschrijving voor de klant (optioneel)"
        className={field}
      />
      <textarea
        name="internal_note"
        rows={2}
        defaultValue={prefill.internal_note ?? ""}
        placeholder="Interne notities (enkel voor jou — niet zichtbaar voor de klant)"
        className={field}
      />

      <button className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90">
        Offerte aanmaken &amp; versturen
      </button>
    </form>
  );
}
