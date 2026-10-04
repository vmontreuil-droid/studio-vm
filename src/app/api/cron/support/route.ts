import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { slaFactuurOp } from "@/lib/facturatie/opslaan";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { klantGegevens } from "@/lib/projecten-admin";
import {
  supportFactuurMail,
  supportGratisMaandMail,
  websiteOfflineMail,
} from "@/lib/klant-mails";
import type { Locale } from "@/lib/i18n/config";

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

// Archief websites: oude supportabonnementen. Mails in de taal van de klant
// (accountprofiel → laatste aanvraag), per run gecachet.
const talen = new Map<string, Locale>();
async function taalVan(email: string): Promise<Locale> {
  const k = email.trim().toLowerCase();
  let t = talen.get(k);
  if (!t) {
    t = (await klantGegevens(k)).taal;
    talen.set(k, t);
  }
  return t;
}

function monthsElapsed(startISO: string, now: Date): number {
  const s = new Date(startISO);
  let m =
    (now.getFullYear() - s.getFullYear()) * 12 +
    (now.getMonth() - s.getMonth());
  if (now.getDate() < s.getDate()) m -= 1;
  return Math.max(0, m);
}

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
        await sendMail(
          s.client_email,
          supportGratisMaandMail(await taalVan(s.client_email), { plan: s.plan, maand: c, gratis: free }),
        ).catch(() => {});
        freeNotices++;
      } else {
        // Betalende maand → factuur.
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
        const opgeslagen = await slaFactuurOp({
          client_email: s.client_email,
          description: `Supportabonnement ${s.plan} — ${period}`,
          amount_cents: s.price_cents,
          status: "open",
          due_at: dueAt,
        }, db);
        if (opgeslagen.ok) {
          const invNo = opgeslagen.doc.nummer;
          invoiced++;
          await sendMail(
            s.client_email,
            supportFactuurMail(await taalVan(s.client_email), {
              plan: s.plan,
              nummer: invNo,
              periodeIso: today,
              exclCent: s.price_cents,
              dueAt,
            }),
          ).catch(() => {});
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
    await sendMail(
      s.client_email,
      websiteOfflineMail(await taalVan(s.client_email), { plan: s.plan }),
    ).catch(() => {});
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
