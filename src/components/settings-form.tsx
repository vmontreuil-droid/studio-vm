"use client";

import { useActionState } from "react";
import { Save, Check, AlertCircle } from "lucide-react";
import { saveCompanySettingsAction } from "@/app/actions/accounting";
import { SubmitButton } from "@/components/submit-button";
import type { CompanySettings } from "@/lib/admin/settings";
import type { OutreachConfig } from "@/lib/admin/outreach";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        step={type === "number" ? "any" : undefined}
        className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
      />
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card shadow-sm p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-accent">
        {title}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function SettingsForm({
  settings,
  outreach,
}: {
  settings: CompanySettings;
  outreach: OutreachConfig;
}) {
  const [state, formAction] = useActionState(saveCompanySettingsAction, null);
  const s = settings;
  const o = outreach;

  return (
    <form action={formAction} className="mt-6 space-y-3">
      <Section title="Firmagegevens">
        <Field label="Handelsnaam" name="company_name" defaultValue={s.company_name} />
        <Field label="Juridische naam" name="legal_name" defaultValue={s.legal_name} placeholder="bv. Studio VM BV" />
        <Field label="Btw-nummer" name="vat_number" defaultValue={s.vat_number} placeholder="BE0xxx.xxx.xxx" />
        <Field label="E-mail" name="email" type="email" defaultValue={s.email} />
        <Field label="Telefoon" name="phone" defaultValue={s.phone} />
        <Field label="Website" name="website" defaultValue={s.website} />
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">Adres</span>
          <textarea
            name="address"
            rows={2}
            defaultValue={s.address ?? ""}
            placeholder="Straat nr, postcode gemeente"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>
      </Section>

      <Section title="Bankgegevens">
        <Field label="Rekeninghouder" name="bank_holder" defaultValue={s.bank_holder} />
        <Field label="IBAN" name="iban" defaultValue={s.iban} />
        <Field label="BIC" name="bic" defaultValue={s.bic} />
      </Section>

      <Section title="Facturatie">
        <p className="text-sm text-muted sm:col-span-2">
          Nummering gebeurt automatisch door de databank, doorlopend per jaar en zonder gaten:
          facturen <span className="font-mono">FAC-2026-001</span>, creditnota&apos;s{" "}
          <span className="font-mono">CN-2026-001</span>, offertes <span className="font-mono">OFF-2026-001</span>.
          Elke factuur krijgt haar eigen gestructureerde mededeling. Een factuur met een nummer
          kan niet gewist worden — maak een creditnota.
        </p>
        <Field label="Betaaltermijn (dagen)" name="payment_terms_days" type="number" defaultValue={s.payment_terms_days} />
        <Field label="Standaard btw-tarief (%)" name="default_vat_rate" type="number" defaultValue={s.default_vat_rate} />
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">Voettekst op facturen</span>
          <textarea
            name="invoice_footer"
            rows={2}
            defaultValue={s.invoice_footer ?? ""}
            placeholder="bv. Bedankt voor het vertrouwen — betaalbaar binnen 14 dagen."
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          />
        </label>
      </Section>

      <Section title="Outreach-engine">
        <label className="flex items-center gap-3 sm:col-span-2">
          <input
            type="checkbox"
            name="outreach_paused"
            defaultChecked={o.paused}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span className="text-sm">
            <strong>Pauze actief</strong> — geen automatische mails naar aannemers. Vink uit om de engine te starten.
          </span>
        </label>
        <Field label="Afzender-naam" name="outreach_sender_name" defaultValue={o.senderName} hint="Verschijnt als 'Van' in de mail" />
        <Field label="Afzender-mail" name="outreach_sender_email" type="email" defaultValue={o.senderEmail} hint="Moet geverifieerd zijn in Resend" />
        <Field label="Dagquota" name="outreach_daily_quota" type="number" defaultValue={o.dailyQuota} hint="Warm-up curve cap't dit eerste 3 weken" />
        <Field label="Cal.com-link (optioneel)" name="outreach_cal_link" defaultValue={o.calLink} placeholder="https://cal.com/…" hint="Afsprakenlink in het klantenportaal" />
        {/* Score-venster hoort bij de oude website-campagne; waarden blijven bewaard. */}
        <input type="hidden" name="outreach_min_score" value={o.minScore} />
        <input type="hidden" name="outreach_max_score" value={o.maxScore} />
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">NACE-prefixen aannemers (kommagescheiden)</span>
          <input
            name="outreach_nace_prefixes"
            defaultValue={o.nacePrefixes.join(", ")}
            placeholder="leeg = 42.11, 42.12, 42.13, 42.21, 42.22, 42.91, 42.99, 43.11, 43.12, 43.13, 43.99"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          />
          <span className="mt-1 block text-[11px] text-muted">
            Enkel aannemers met hoofdactiviteit binnen deze prefixen worden gekwalificeerd en gemaild. Leeg = standaardselectie grond-, weg- en waterbouw. Met of zonder punten. Overzicht met omschrijvingen: Outreach-pagina.
          </span>
        </label>
        <div className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">Landen actief</span>
          <div className="mt-2 flex flex-wrap gap-3">
            {(["be", "fr", "uk"] as const).map((l) => (
              <label
                key={l}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name={`outreach_land_${l}`}
                  defaultChecked={o.lands.includes(l)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                {l === "be" ? "🇧🇪 België" : l === "fr" ? "🇫🇷 Frankrijk" : "🇬🇧 UK"}
              </label>
            ))}
          </div>
        </div>
        {o.startedAt && (
          <p className="sm:col-span-2 text-xs text-muted">
            Warm-up actief sinds <strong className="text-foreground">{o.startedAt}</strong> — engine bouwt afzender-reputatie geleidelijk op (dag 0–3: max 5/dag, dag 4–7: 10, dag 8–10: 25, dag 11–13: 50, daarna jouw quota).
          </p>
        )}
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          pendingLabel="Bewaren…"
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          Instellingen bewaren
        </SubmitButton>
        {state?.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Bewaard
          </span>
        )}
        {state && !state.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" strokeWidth={2} />
            {state.error ?? "Bewaren mislukt"}
          </span>
        )}
      </div>
    </form>
  );
}
