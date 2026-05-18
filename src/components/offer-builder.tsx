"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Package,
  Languages,
  MailCheck,
  CalendarCheck,
  Newspaper,
  Lock,
  Search,
  Camera,
  ShieldCheck,
  PenLine,
  LayoutDashboard,
  Smartphone,
  Share2,
  BarChart3,
  Mail,
  RefreshCw,
  CreditCard,
  Tag,
  Repeat,
  Check,
  type LucideIcon,
} from "lucide-react";

function lineIcon(label: string): LucideIcon {
  const s = label.toLowerCase();
  if (s.includes("korting")) return Tag;
  if (
    s.includes("abonnement") ||
    /\b(care|plus|scale|partner)\b/.test(s)
  )
    return Repeat;
  if (s.includes("basispakket") || s.includes("aanbetaling"))
    return Package;
  if (s.includes("taal")) return Languages;
  if (s.includes("formulier")) return MailCheck;
  if (s.includes("reservatie") || s.includes("afspra"))
    return CalendarCheck;
  if (s.includes("blog") || s.includes("nieuws-cms"))
    return Newspaper;
  if (s.includes("leden")) return Lock;
  if (s.includes("seo")) return Search;
  if (s.includes("foto")) return Camera;
  if (s.includes("cookie") || s.includes("gdpr")) return ShieldCheck;
  if (s.includes("tekst") || s.includes("copywriting"))
    return PenLine;
  if (s.includes("admin") || s.includes("cms"))
    return LayoutDashboard;
  if (s.includes("mobile") || s.includes("dark mode"))
    return Smartphone;
  if (s.includes("open graph") || s.includes("sitemap"))
    return Share2;
  if (s.includes("analytics") || s.includes("structured data"))
    return BarChart3;
  if (s.includes("newsletter") || s.includes("nieuwsbrief"))
    return Mail;
  if (s.includes("ronde") || s.includes("revisie")) return RefreshCw;
  if (
    s.includes("mollie") ||
    s.includes("stripe") ||
    s.includes("betaal")
  )
    return CreditCard;
  return Check;
}

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
  scanAction,
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
  scanAction?: (formData: FormData) => Promise<void>;
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
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | "offer" | "scan">(null);
  const [notice, setNotice] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  function submitOffer() {
    const form = formRef.current;
    if (!form || busy) return;
    const fd = new FormData(form);
    if (!String(fd.get("client_email") ?? "").trim()) {
      setNotice({ ok: false, text: "Vul eerst de klant-e-mail in." });
      return;
    }
    setNotice(null);
    setBusy("offer");
    startTransition(async () => {
      try {
        await action(fd);
        setNotice({
          ok: true,
          text: "Offerte aangemaakt en verstuurd naar de klant.",
        });
      } catch {
        setNotice({
          ok: false,
          text: "Versturen mislukt — probeer opnieuw.",
        });
      } finally {
        setBusy(null);
      }
    });
  }

  function submitScan() {
    const form = formRef.current;
    if (!form || !scanAction || busy) return;
    const fd = new FormData(form);
    if (
      !String(fd.get("client_email") ?? "").trim() ||
      !String(fd.get("url") ?? "").trim()
    ) {
      setNotice({
        ok: false,
        text: "Voor de scan: vul de klant-e-mail én de website in.",
      });
      return;
    }
    setNotice(null);
    setBusy("scan");
    startTransition(async () => {
      try {
        await scanAction(fd);
        setNotice({
          ok: true,
          text: "Scan toegevoegd — staat in het portaal van de klant (zonder mail).",
        });
      } catch {
        setNotice({
          ok: false,
          text: "Scan mislukt — controleer de URL en probeer opnieuw.",
        });
      } finally {
        setBusy(null);
      }
    });
  }

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
        label: `${effectiveSub.name} — verplicht · 12 maanden minimum, daarna stilzwijgend verlengd`,
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
  const depositVat = isReverse ? 0 : Math.round(deposit * VAT_RATE);
  const depositIncl = deposit + depositVat;

  const field =
    "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent";
  const labelCls =
    "mb-2 font-mono text-[10px] uppercase tracking-widest text-muted";

  // Automatische VIES-opzoeking: zodra een plausibel BTW-nummer
  // getypt is, vult bedrijf + adres zich vanzelf in. Geen knop.
  const lastVat = useRef<string>("");
  useEffect(() => {
    if (!lookupVat) return;
    const clean = vat.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z]{2}[0-9A-Z]{6,}$/.test(clean)) {
      setVatState("idle");
      return;
    }
    if (clean === lastVat.current) return;
    const t = setTimeout(async () => {
      lastVat.current = clean;
      setVatState("loading");
      setVatName(null);
      try {
        const r = await lookupVat(clean);
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
    }, 700);
    return () => clearTimeout(t);
  }, [vat, lookupVat]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        submitOffer();
      }}
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

      {/* BTW bovenaan — vult bedrijf + adres automatisch in via VIES */}
      <div className="rounded-xl border bg-background p-4">
        <p className={labelCls}>
          BTW-nummer — bedrijf &amp; adres vullen automatisch in
        </p>
        <input
          name="vat_number"
          value={vat}
          onChange={(e) => setVat(e.target.value)}
          placeholder="BTW-nummer (bv. BE0123456789)"
          className={field}
        />
        {vatState === "loading" && (
          <p className="mt-2 text-xs font-medium text-muted">
            VIES controleren…
          </p>
        )}
        {vatState === "ok" && (
          <p className="mt-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white dark:bg-green-600">
            ✓ Geldig BTW-nummer{vatName ? ` — ${vatName}` : ""}. Bedrijf
            en adres zijn automatisch ingevuld; pas gerust aan.
          </p>
        )}
        {vatState === "bad" && (
          <p className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">
            ✗ Niet geldig volgens VIES. Controleer het nummer of vul
            de gegevens handmatig in.
          </p>
        )}
        {vatState === "unknown" && (
          <p className="mt-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white">
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
        <p className={labelCls}>Klantgegevens</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Naam contactpersoon
            </span>
            <input
              name="client_name"
              defaultValue={prefill.client_name ?? ""}
              placeholder="bv. Gerry Carpentier"
              className={field}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Bedrijf {vatState === "ok" ? "(via VIES)" : ""}
            </span>
            <input
              name="client_company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="bv. NV Carpentier"
              className={field}
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Adres {vatState === "ok" ? "(via VIES)" : ""}
          </span>
          <input
            name="client_address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Straat nr, postcode gemeente"
            className={field}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Omschrijving voor de klant (optioneel)
          </span>
          <textarea
            name="body"
            rows={6}
            defaultValue={prefill.body ?? ""}
            placeholder="Vrije toelichting bovenaan de offerte…"
            className={field}
          />
        </label>
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
          Abonnement (verplicht · 12 mnd min., daarna stilzwijgend verlengd)
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
            Beslissing vóór de offertedatum — 7% korting + 2 gratis
            maanden
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            Beslist de klant vóór de vervaldatum van deze offerte, dan
            ligt de scope vast en krijgt hij 7% korting op het
            eenmalige bedrag én de eerste 2 maanden van het abonnement
            gratis. Het abonnement loopt minimum 12 maanden en wordt
            daarna stilzwijgend verlengd. Na de offertedatum vervalt
            deze korting automatisch. Betaling:
            30% voorschot om te starten, de resterende 70% vóór de
            site live gaat. Alle betalingen verlopen uitsluitend via
            het beveiligde klantenportaal — geen uitzonderingen. De
            voorschotfactuur staat meteen klaar in het portaal; zodra
            het voorschot betaald is, start het project en vindt de
            klant de betaalde factuur er onmiddellijk terug.
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
                <span className="flex min-w-0 gap-2.5">
                  {(() => {
                    const Icon = lineIcon(l.label);
                    return (
                      <Icon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          l.sub
                            ? "text-orange-600 dark:text-orange-400"
                            : l.incl
                              ? "text-accent"
                              : "text-muted"
                        }`}
                        strokeWidth={2}
                      />
                    );
                  })()}
                  <span className="min-w-0">
                    <span className="font-medium">{l.label}</span>
                    {l.desc && (
                      <span className="mt-0.5 block text-xs text-muted">
                        {l.desc}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={`shrink-0 font-mono text-xs ${
                    l.sub
                      ? "text-orange-600 dark:text-orange-400"
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
            <div className="-mx-1 flex items-center justify-between rounded-lg bg-green-600 px-2 py-1.5 font-semibold text-white">
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
              <div className="flex items-center justify-between text-muted">
                <span>Aanbetaling 30% (excl. btw)</span>
                <span className="font-mono">{eur(deposit)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>
                  {isReverse ? "Btw (0% — verlegd)" : "Btw 21% op aanbetaling"}
                </span>
                <span className="font-mono">{eur(depositVat)}</span>
              </div>
              <div className="-mx-1 flex items-center justify-between rounded-lg bg-foreground px-2 py-1.5 font-bold text-background">
                <span>Nu te betalen (incl. btw)</span>
                <span className="font-mono">{eur(depositIncl)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Rest — vóór livegang (excl. btw)</span>
                <span className="font-mono">{eur(rest)}</span>
              </div>
            </div>
          )}
          {effectiveSub && (
            <div className="flex items-center justify-between pt-1 text-orange-600 dark:text-orange-400">
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
            <div className="-mx-1 flex items-center justify-between rounded-lg bg-green-600 px-2 py-1.5 font-semibold text-white">
              <span>Eerste 2 maanden abonnement gratis</span>
              <span className="font-mono">
                − {eur(effectiveSub.cents * 2)}
              </span>
            </div>
          )}
          <p className="mt-2 border-t pt-2 text-xs text-muted">
            Onderaan de offerte komt automatisch een standaard
            clausule over domein &amp; e-mail
            {lockin ? " en de vastleg-/betaalvoorwaarden" : ""} — die
            hoef je niet zelf te typen.
          </p>
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

      {scanAction && (
        <div className="rounded-xl border border-dashed bg-background p-4">
          <p className={labelCls}>
            Optioneel — analyse meesturen (zonder de klant te mailen)
          </p>
          <p className="mt-1 text-xs text-muted">
            Scant de huidige site en koppelt de volledige analyse aan
            dezelfde klant-e-mail. Ze verschijnt in zijn portaal naast
            de offerte — jij beslist zelf wanneer je hem contacteert.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              name="url"
              placeholder="huidige website (bv. klant.be)"
              className={field}
            />
            <button
              type="button"
              onClick={submitScan}
              disabled={busy !== null}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors hover:bg-card-hover disabled:opacity-60"
            >
              {busy === "scan" && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {busy === "scan" ? "Scan bezig…" : "Scan toevoegen"}
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={busy !== null}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy === "offer" && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {busy === "offer"
          ? "Bezig met versturen…"
          : "Offerte aanmaken & versturen"}
      </button>

      {notice && (
        <p
          className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${
            notice.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {notice.ok ? "✓ " : "✗ "}
          {notice.text}
        </p>
      )}

      <div className="mt-2 border-t pt-4">
        <p className={labelCls}>
          Interne notities — enkel voor jou, niet zichtbaar voor de klant
        </p>
        <textarea
          name="internal_note"
          rows={3}
          defaultValue={prefill.internal_note ?? ""}
          placeholder="Bv. context, afspraken, opvolging…"
          className={`mt-1 ${field}`}
        />
      </div>
    </form>
  );
}
