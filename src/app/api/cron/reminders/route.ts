import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret, siteUrl } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";
import { getCompanySettings } from "@/lib/admin/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Inv = {
  id: string;
  client_email: string;
  number: string;
  amount_cents: number;
  status: string;
  issued_at: string;
  due_at: string | null;
  reminder_level: number | null;
};

const DAY = 86_400_000;

const eur = (c: number) =>
  "€ " +
  (c / 100).toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Escalatie: 0 dagen over → 1e herinnering, +7 → 2e aanmaning,
// +14 → laatste aanmaning (factuur op 'vervallen').
const LEVELS: Record<
  number,
  { eyebrow: string; title: string; line: (n: string) => string }
> = {
  1: {
    eyebrow: "Vriendelijke herinnering",
    title: "Mogen we je even herinneren?",
    line: (n) =>
      `Factuur <strong>${n}</strong> is intussen vervallen. Wellicht over het hoofd gezien — geen probleem.`,
  },
  2: {
    eyebrow: "Tweede herinnering",
    title: "Factuur nog steeds open",
    line: (n) =>
      `Factuur <strong>${n}</strong> staat al meer dan een week open. Gelieve ze zo snel mogelijk te voldoen.`,
  },
  3: {
    eyebrow: "Laatste aanmaning",
    title: "Laatste aanmaning",
    line: (n) =>
      `Factuur <strong>${n}</strong> is meer dan twee weken vervallen. Dit is de laatste herinnering vóór verdere stappen.`,
  },
};

export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const s = await getCompanySettings();
  const now = Date.now();
  let sent = 0;
  let overdueFlagged = 0;

  const { data } = await db
    .from("invoices")
    .select(
      "id, client_email, number, amount_cents, status, issued_at, due_at, reminder_level",
    )
    .eq("status", "open")
    .limit(500);

  for (const i of (data as Inv[]) ?? []) {
    const dueISO =
      i.due_at ??
      new Date(
        new Date(i.issued_at).getTime() + s.payment_terms_days * DAY,
      )
        .toISOString()
        .slice(0, 10);
    const overdueDays = Math.floor(
      (now - new Date(dueISO).getTime()) / DAY,
    );
    if (overdueDays < 0) continue;

    const target =
      overdueDays >= 14 ? 3 : overdueDays >= 7 ? 2 : 1;
    const current = i.reminder_level ?? 0;
    if (target <= current) continue;

    const L = LEVELS[target];
    const ok = await sendMail(i.client_email, {
      subject: `${L.eyebrow} — factuur ${i.number} · ${s.company_name}`,
      html: portalEmailHtml({
        locale: "nl",
        eyebrow: L.eyebrow,
        title: L.title,
        bodyLines: [
          L.line(i.number),
          `Openstaand bedrag: <strong>${eur(i.amount_cents)}</strong>.`,
          `Je betaalt vlot en veilig via je klantenportaal — daar staat ook de volledige factuur.`,
        ],
        ctaLabel: "Betaal in je portaal",
        ctaHref: `${siteUrl}/nl/portail?next=${encodeURIComponent(
          "/nl/portail/dashboard/facturen",
        )}`,
        footnote:
          target === 3
            ? "Reeds betaald? Dan mag je deze mail negeren — onze excuses voor het ongemak."
            : "Reeds betaald? Dan mag je deze herinnering als onbestaande beschouwen.",
      }),
    });
    if (!ok) continue;

    const patch: Record<string, unknown> = {
      reminder_level: target,
      last_reminder_at: new Date().toISOString(),
    };
    if (target === 3) {
      patch.status = "vervallen";
      overdueFlagged++;
    }
    await db.from("invoices").update(patch).eq("id", i.id);
    sent++;
  }

  return NextResponse.json({ ok: true, sent, overdueFlagged });
}
