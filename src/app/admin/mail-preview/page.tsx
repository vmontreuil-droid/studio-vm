import Link from "next/link";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { TestMailButton } from "@/components/test-mail-button";
import { buildOutreachMail } from "@/lib/admin/outreach-mail";
import {
  portalEmailHtml,
  offerPreviewHtml,
  invoicePaidPreviewHtml,
} from "@/lib/email";

export const dynamic = "force-dynamic";

// Voorbeeld-data om elke template realistisch te renderen.
const sampleProspect = (lang: "nl" | "fr" | "en") => ({
  name: "carpentiernv.be",
  website: "https://carpentiernv.be",
  scanScore: 62,
  scanGrade: "C",
  scanIssues:
    lang === "nl"
      ? [
          "SSL-certificaat verloopt binnenkort",
          "Geen mobiele viewport-instelling",
          "Trage Largest Contentful Paint (4,3s)",
        ]
      : lang === "fr"
        ? [
            "Le certificat SSL expire bientôt",
            "Pas de paramètre viewport mobile",
            "Largest Contentful Paint lent (4,3s)",
          ]
        : [
            "SSL certificate expires soon",
            "No mobile viewport meta tag",
            "Slow Largest Contentful Paint (4.3s)",
          ],
  scanToken: "preview-abc123",
  land: "be" as const,
});

const sampleCfg = {
  paused: false,
  dailyQuota: 20,
  calLink: null,
  senderName: "Vincent Montreuil",
  senderEmail: "vincent@studio-vm.be",
  minScore: 30,
  maxScore: 65,
  nacePrefixes: [],
  lands: ["be" as const],
  startedAt: null,
};

const sampleOffer = {
  offerNo: "OFF2026-0042",
  greeting: "Jan Carpentier",
  amountExclCents: 290000,
  vatReverse: false,
  validUntil: "2026-06-19",
  includes: [
    "Studio Pro — onepager met portfolio",
    "Domein + hosting setup",
    "On-page SEO + sitemap",
  ],
  subLabel: "Care-abonnement",
  subMonthlyCents: 4900,
  discountCents: 20300,
  freeMonthsCents: 9800,
};

const sampleInvoicePaid = {
  number: "F2026-0017",
  description: "Voorschot 30% — nieuwe website",
  amountExclCents: 148760,
  vatReverse: false,
  paidAt: "2026-05-19T14:32:00Z",
  locale: "nl",
};
const sampleClientName = "Jan Carpentier";
const samplePortalHref = "https://studio-vm.be/nl/portail";
const sampleDecideBy = "2026-05-29";

type Preview = {
  id: string;
  title: string;
  category: "Outreach" | "Offerte" | "Factuur" | "Support";
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

function buildPreviews(): Preview[] {
  const out: Preview[] = [];

  // Outreach — 6 varianten
  for (const lang of ["nl", "fr", "en"] as const) {
    for (const variant of ["first", "followup"] as const) {
      const m = buildOutreachMail(
        sampleProspect(lang),
        sampleCfg,
        lang,
        variant,
      );
      out.push({
        id: `outreach-${variant}-${lang}`,
        title: `Outreach — ${variant === "first" ? "eerste mail" : "opvolg-mail"} (${lang.toUpperCase()})`,
        category: "Outreach",
        subject: m.subject,
        html: m.html,
        text: m.text,
        from: m.from,
      });
    }
  }

  // Offerte verstuurd (NL voorbeeld)
  out.push({
    id: "offer-sent-nl",
    title: "Offerte verstuurd (NL)",
    category: "Offerte",
    subject: "Je offerte staat klaar — Studio VM",
    html: portalEmailHtml({
      locale: "nl",
      eyebrow: "Je offerte",
      title: `Hi ${sampleClientName},`,
      bodyLines: [
        "Hierbij je persoonlijke offerte — alle prijzen, voorwaarden en betaalopties staan in je portaal.",
        `Beslis je vóór <strong>${sampleDecideBy}</strong>, dan krijg je automatisch de vastlegkorting van 7% én 2 gratis maanden support.`,
      ],
      ctaLabel: "Bekijk je voorstel",
      ctaHref: samplePortalHref,
      extraHtml: offerPreviewHtml(sampleOffer),
      footnote:
        "Vragen of liever eerst telefonisch? Antwoord op deze mail.",
    }),
  });

  // Factuur betaald (NL)
  out.push({
    id: "invoice-paid-nl",
    title: "Factuur betaald — bevestiging (NL)",
    category: "Factuur",
    subject: `Factuur ${sampleInvoicePaid.number} is betaald — bedankt!`,
    html: portalEmailHtml({
      locale: "nl",
      eyebrow: "Factuur betaald",
      title: "Bedankt voor je betaling 🎉",
      bodyLines: [
        `Je betaling voor <strong>${sampleInvoicePaid.description}</strong> is goed binnengekomen.`,
        "Je vindt de factuur met 'BETAALD'-stempel in je portaal.",
      ],
      ctaLabel: "Open mijn portaal",
      ctaHref: samplePortalHref,
      extraHtml: invoicePaidPreviewHtml(sampleInvoicePaid),
    }),
  });

  // Support — gratis maand
  out.push({
    id: "support-free-nl",
    title: "Support — gratis maand-melding (NL)",
    category: "Support",
    subject: "Je supportmaand is gratis 🎁 — Studio VM",
    html: portalEmailHtml({
      locale: "nl",
      eyebrow: "Je supportabonnement",
      title: "Maand 1: gratis 🎁",
      bodyLines: [
        "Maand 1 van je <strong>Care-abonnement</strong> is <strong>gratis</strong> — je hoeft niets te betalen.",
        "Vanaf volgende maand ontvang je maandelijks een factuur in je portaal.",
      ],
      ctaLabel: "Bekijk je portaal",
      ctaHref: "https://studio-vm.be/nl/portail",
    }),
  });

  // Aanmaning — eerste herinnering
  out.push({
    id: "reminder-1-nl",
    title: "Aanmaning — eerste herinnering (NL)",
    category: "Factuur",
    subject: "Vriendelijke herinnering — factuur F2026-0017 · Studio VM",
    html: portalEmailHtml({
      locale: "nl",
      eyebrow: "Vriendelijke herinnering",
      title: "Mogen we je even herinneren?",
      bodyLines: [
        "Factuur <strong>F2026-0017</strong> is intussen vervallen. Wellicht over het hoofd gezien — geen probleem.",
        "Openstaand bedrag: <strong>€ 180,00</strong>.",
        "Je betaalt vlot en veilig via je klantenportaal — daar staat ook de volledige factuur.",
      ],
      ctaLabel: "Betaal in je portaal",
      ctaHref: "https://studio-vm.be/nl/portail",
      footnote:
        "Reeds betaald? Dan mag je deze herinnering als onbestaande beschouwen.",
    }),
  });

  return out;
}

export default async function MailPreview({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const previews = buildPreviews();
  const selected =
    previews.find((p) => p.id === sp.id) ?? previews[0];
  const cfg = await getOutreachConfig();

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Mail-preview
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Alle automatische mails die studio-vm verstuurt — bekijk
          ze hier in echte HTML-rendering vóór ze de deur uit gaan,
          en finetune via de templates in <code>src/lib/email.ts</code> en{" "}
          <code>src/lib/admin/outreach-mail.ts</code>.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Lijst */}
        <aside className="rounded-2xl bg-card p-3 shadow-sm">
          {(["Outreach", "Offerte", "Factuur", "Support"] as const).map(
            (cat) => (
              <div key={cat} className="mb-3 last:mb-0">
                <p className="px-2 pb-1 font-mono text-[10px] font-medium uppercase tracking-widest text-muted">
                  {cat}
                </p>
                <ul className="space-y-1">
                  {previews
                    .filter((p) => p.category === cat)
                    .map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/admin/mail-preview?id=${p.id}`}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            selected.id === p.id
                              ? "bg-accent/15 font-medium text-accent"
                              : "text-muted hover:bg-card-hover hover:text-foreground"
                          }`}
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ),
          )}
        </aside>

        {/* Detail */}
        <section className="space-y-3">
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Onderwerp
            </p>
            <p className="mt-1 font-medium">{selected.subject}</p>
            {selected.from && (
              <>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                  Van
                </p>
                <p className="mt-1 font-mono text-sm">{selected.from}</p>
              </>
            )}
            <div className="mt-4 border-t pt-4">
              <TestMailButton id={selected.id} to={cfg.senderEmail} />
              <p className="mt-2 text-xs text-muted">
                Verzendt naar jouw sender-mail zelf, zodat je live kan
                checken hoe Gmail/Outlook hem rendert en of hij
                bezorgd raakt. Voeg <code>[TEST]</code>-prefix toe in
                onderwerp.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
            <div className="border-b px-5 py-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                HTML-weergave (zoals in de mailbox)
              </p>
            </div>
            <iframe
              srcDoc={selected.html}
              sandbox=""
              className="block h-[700px] w-full bg-white"
              title={selected.title}
            />
          </div>

          {selected.text && (
            <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
              <div className="border-b px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Platte tekst-versie (voor mailclients zonder HTML)
                </p>
              </div>
              <pre className="overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-relaxed">
                {selected.text}
              </pre>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
