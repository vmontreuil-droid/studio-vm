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
        <Field label="Factuur-prefix" name="invoice_prefix" defaultValue={s.invoice_prefix} hint="bv. F → F2026-0001" />
        <Field label="Factuurteller" name="invoice_counter" type="number" defaultValue={s.invoice_counter} hint="laatst gebruikte volgnummer" />
        <Field label="Creditnota-prefix" name="credit_prefix" defaultValue={s.credit_prefix} hint="bv. CN" />
        <Field label="Creditnotateller" name="credit_counter" type="number" defaultValue={s.credit_counter} />
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
            <strong>Pauze actief</strong> — geen automatische mails. Vink uit om de engine te starten.
          </span>
        </label>
        <Field label="Afzender-naam" name="outreach_sender_name" defaultValue={o.senderName} hint="Verschijnt als 'Van' in de mail" />
        <Field label="Afzender-mail" name="outreach_sender_email" type="email" defaultValue={o.senderEmail} hint="Moet geverifieerd zijn in Resend" />
        <Field label="Dagquota" name="outreach_daily_quota" type="number" defaultValue={o.dailyQuota} hint="Warm-up curve cap't dit eerste 3 weken" />
        <Field label="Cal.com-link (optioneel)" name="outreach_cal_link" defaultValue={o.calLink} placeholder="https://cal.com/vincent-montreuil/30min" hint="Verschijnt als CTA in het scan-portaal" />
        <Field label="Min. score (te-mailen-range)" name="outreach_min_score" type="number" defaultValue={o.minScore} hint="0=alles, 30=enkel sites met echt probleem" />
        <Field label="Max. score (te-mailen-range)" name="outreach_max_score" type="number" defaultValue={o.maxScore} hint="65=skip al goeie sites — geen nood aan jou" />
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">NACE-prefixen (kommagescheiden)</span>
          <input
            name="outreach_nace_prefixes"
            defaultValue={o.nacePrefixes.join(", ")}
            placeholder="bv. 56, 74, 47, 96"
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          />
          <span className="mt-1 block text-[11px] text-muted">
            Enkel prospects met hoofdactiviteit binnen deze prefixen worden gemaild. Leeg = alle sectoren.
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
            Warm-up actief sinds <strong className="text-foreground">{o.startedAt}</strong> — engine bouwt afzender-reputatie geleidelijk op (week 1: max 5/dag, week 2: 10, week 3: 15, week 4+: jouw quota).
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
