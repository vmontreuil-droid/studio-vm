import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret, siteUrl } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sub = {
  id: string;
  client_email: string;
  plan: string;
  price_cents: number;
  status: string;
  started_at: string | null;
  pay_method: string | null;
  free_months: number | null;
  last_cycle: number | null;
  grace_until: string | null;
};

const STUDIO = "info@studio-vm.be";

function monthsElapsed(startISO: string, now: Date): number {
  const s = new Date(startISO);
  let m =
    (now.getFullYear() - s.getFullYear()) * 12 +
    (now.getMonth() - s.getMonth());
  if (now.getDate() < s.getDate()) m -= 1;
  return Math.max(0, m);
}

const eur = (c: number) =>
  "€ " +
  (c / 100).toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  let invoiced = 0;
  let freeNotices = 0;
  let offlined = 0;

  // 1) Maatwerk-support: gratis-maand-meldingen + maandfacturen.
  const { data: subsData } = await db
    .from("subscriptions")
    .select(
      "id, client_email, plan, price_cents, status, started_at, pay_method, free_months, last_cycle, grace_until",
    )
    .eq("status", "actief")
    .not("offer_id", "is", null)
    .not("pay_method", "is", null)
    .limit(500);

  for (const s of (subsData as Sub[]) ?? []) {
    if (!s.started_at) continue;
    const cycleNow = monthsElapsed(s.started_at, now) + 1;
    const free = s.free_months ?? 0;
    let last = s.last_cycle ?? 0;
    for (let c = last + 1; c <= cycleNow; c++) {
      if (c <= free) {
        // Gratis maand — enkel melding, geen factuur.
        await sendMail(s.client_email, {
          subject: `Gratis supportmaand ${c}/${free} — Studio VM`,
          html: portalEmailHtml({
            locale: "nl",
            eyebrow: "Je supportabonnement",
            title: `Maand ${c}: gratis 🎁`,
            bodyLines: [
              `Maand ${c} van je <strong>${s.plan}</strong>-supportabonnement is <strong>gratis</strong> — je hoeft niets te betalen.`,
              free - c > 0
                ? `Nog ${free - c} gratis maand(en) te gaan; daarna ontvang je maandelijks een factuur.`
                : `Vanaf volgende maand ontvang je maandelijks een factuur in je portaal.`,
            ],
            ctaLabel: "Bekijk je portaal",
            ctaHref: `${siteUrl}/nl/portail?next=${encodeURIComponent(
              "/nl/portail/dashboard/abonnement",
            )}`,
          }),
        }).catch(() => {});
        freeNotices++;
      } else {
        // Betalende maand → factuur.
        const { count } = await db
          .from("invoices")
          .select("id", { count: "exact", head: true });
        const invNo = `FAC-${now.getFullYear()}-${String(
          (count ?? 0) + 1,
        ).padStart(3, "0")}`;
        const dueAt = new Date(Date.now() + 14 * 86400000)
          .toISOString()
          .slice(0, 10);
        const period = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        ).toLocaleDateString("nl-BE", {
          month: "long",
          year: "numeric",
        });
        const { error } = await db.from("invoices").insert({
          client_email: s.client_email,
          number: invNo,
          description: `Supportabonnement ${s.plan} — ${period}`,
          amount_cents: s.price_cents,
          status: "open",
          due_at: dueAt,
        });
        if (!error) {
          invoiced++;
          const incl = Math.round(s.price_cents * 1.21);
          await sendMail(s.client_email, {
            subject: `Supportfactuur ${invNo} — Studio VM`,
            html: portalEmailHtml({
              locale: "nl",
              eyebrow: "Je supportabonnement",
              title: `Factuur ${invNo} staat klaar`,
              bodyLines: [
                `Je maandelijkse <strong>${s.plan}</strong>-supportfactuur (${period}) staat in je portaal: ${eur(
                  s.price_cents,
                )} excl. btw — ${eur(incl)} incl. btw.`,
                `Betaalbaar tegen ${dueAt}. Je betaalt online via Mollie of via overschrijving in je portaal.`,
              ],
              ctaLabel: "Bekijk je factuur",
              ctaHref: `${siteUrl}/nl/portail?next=${encodeURIComponent(
                "/nl/portail/dashboard/facturen",
              )}`,
            }),
          }).catch(() => {});
        }
      }
      last = c;
    }
    if (last !== (s.last_cycle ?? 0)) {
      await db
        .from("subscriptions")
        .update({ last_cycle: last, updated_at: new Date().toISOString() })
        .eq("id", s.id);
    }
  }

  // 2) Dunning-sweep: grace verlopen → gestopt (publish-gate haalt
  //    builder-sites offline) + mail klant + admin-alarm.
  const { data: graceData } = await db
    .from("subscriptions")
    .select(
      "id, client_email, plan, price_cents, status, started_at, pay_method, free_months, last_cycle, grace_until",
    )
    .eq("status", "gepauzeerd")
    .not("grace_until", "is", null)
    .lt("grace_until", today)
    .limit(200);

  for (const s of (graceData as Sub[]) ?? []) {
    await db
      .from("subscriptions")
      .update({ status: "gestopt", updated_at: new Date().toISOString() })
      .eq("id", s.id);
    offlined++;
    await sendMail(s.client_email, {
      subject: "Je website is tijdelijk offline — abonnement onbetaald",
      html: portalEmailHtml({
        locale: "nl",
        eyebrow: "Actie nodig",
        title: "Je website staat tijdelijk offline",
        bodyLines: [
          `De betaling van je <strong>${s.plan}</strong>-abonnement is na de hersteltermijn nog niet in orde, daarom is je website tijdelijk offline gehaald.`,
          `Zodra de betaling in orde is, gaat je site automatisch terug online. Regel het in je portaal of neem contact op.`,
        ],
        ctaLabel: "Regel het in je portaal",
        ctaHref: `${siteUrl}/nl/portail?next=${encodeURIComponent(
          "/nl/portail/dashboard/facturen",
        )}`,
      }),
    }).catch(() => {});
    await sendMail(STUDIO, {
      subject: `⚠ Abonnement onbetaald → offline — ${s.client_email}`,
      html: `<div style="font:14px/1.6 system-ui,sans-serif;color:#111"><p><strong>${s.client_email}</strong> — abonnement <strong>${s.plan}</strong> na grace nog onbetaald. Status op 'gestopt'. <strong>Builder-sites zijn automatisch offline.</strong> Maatwerk: zet de site manueel offline indien nodig.</p></div>`,
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    invoiced,
    freeNotices,
    offlined,
  });
}
