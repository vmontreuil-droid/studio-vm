import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret, siteUrl } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";
import { klantTaal } from "@/lib/klant-taal";
import type { Locale } from "@/lib/i18n/config";

const T: Record<Locale, { subject: (nr: string) => string; eyebrow: string; title: string; body: (titel: string, nr: string, datum: string) => string; cta: string }> = {
  nl: { subject: (nr) => `Herinnering: uw offerte ${nr} verloopt binnenkort`, eyebrow: "Herinnering", title: "Uw offerte verloopt over 2 dagen", body: (t, nr, d) => `De offerte <strong>${t}</strong>${nr ? ` (${nr})` : ""} is geldig tot <strong>${d}</strong>. Daarna vervalt ze automatisch.`, cta: "Bekijk & beslis" },
  fr: { subject: (nr) => `Rappel : votre devis ${nr} expire bientôt`, eyebrow: "Rappel", title: "Votre devis expire dans 2 jours", body: (t, nr, d) => `Le devis <strong>${t}</strong>${nr ? ` (${nr})` : ""} est valable jusqu'au <strong>${d}</strong>. Il expire ensuite automatiquement.`, cta: "Consulter et décider" },
  en: { subject: (nr) => `Reminder: your quote ${nr} expires soon`, eyebrow: "Reminder", title: "Your quote expires in 2 days", body: (t, nr, d) => `The quote <strong>${t}</strong>${nr ? ` (${nr})` : ""} is valid until <strong>${d}</strong>. After that it expires automatically.`, cta: "View & decide" },
  de: { subject: (nr) => `Erinnerung: Ihr Angebot ${nr} läuft bald ab`, eyebrow: "Erinnerung", title: "Ihr Angebot läuft in 2 Tagen ab", body: (t, nr, d) => `Das Angebot <strong>${t}</strong>${nr ? ` (${nr})` : ""} ist gültig bis <strong>${d}</strong>. Danach verfällt es automatisch.`, cta: "Ansehen & entscheiden" },
  es: { subject: (nr) => `Recordatorio: su presupuesto ${nr} vence pronto`, eyebrow: "Recordatorio", title: "Su presupuesto vence en 2 días", body: (t, nr, d) => `El presupuesto <strong>${t}</strong>${nr ? ` (${nr})` : ""} es válido hasta el <strong>${d}</strong>. Después vence automáticamente.`, cta: "Ver y decidir" },
};

export const dynamic = "force-dynamic";

// Dagelijks: herinnering 2 dagen vóór de vervaldag van een open offerte.
export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const target = new Date(Date.now() + 2 * 86400000)
    .toISOString()
    .slice(0, 10);

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("offers")
    .select("id, client_email, title, offer_no, valid_until")
    .eq("status", "open")
    .eq("valid_until", target)
    .is("reminder_sent_at", null)
    .limit(200);

  const offers =
    (data as
      | {
          id: string;
          client_email: string;
          title: string;
          offer_no: string | null;
          valid_until: string;
        }[]
      | null) ?? [];

  let sent = 0;
  for (const o of offers) {
    const loc = await klantTaal(o.client_email);
    const t = T[loc];
    const datum = new Date(`${o.valid_until}T00:00:00`).toLocaleDateString(loc === "en" ? "en-GB" : `${loc}-${loc === "nl" || loc === "fr" ? "BE" : loc.toUpperCase()}`, { day: "numeric", month: "long", year: "numeric" });
    await sendMail(o.client_email, {
      subject: t.subject(o.offer_no ?? ""),
      html: portalEmailHtml({
        locale: loc,
        eyebrow: t.eyebrow,
        title: t.title,
        bodyLines: [t.body(o.title, o.offer_no ?? "", datum)],
        ctaLabel: t.cta,
        ctaHref: `${siteUrl}/${loc}/portail/dashboard/offertes`,
      }),
    }).catch(() => {});
    await db
      .from("offers")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", o.id);
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
