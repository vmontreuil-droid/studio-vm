import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { verstuurMail } from "@/lib/monitor";
import { getCompanySettings } from "@/lib/admin/settings";
import { factuurBedrag, factuurTaal, type KlantFactuur } from "@/lib/factuur-klant";
import { betaalHerinneringMail } from "@/lib/klant-mails";
import { verwijlinterest } from "@/lib/facturatie/rente";
import { logBewijs } from "@/lib/invordering/bewijslog";
import { zetDossiersKlaar } from "@/lib/invordering/klaarzetten";
import { haalRevolutOp } from "@/lib/revolut";
import type { Locale } from "@/lib/i18n/config";
import { betaalLink, zorgVoorToken } from "@/lib/facturatie/online-betalen";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Inv = KlantFactuur & {
  client_email: string;
  number: string;
  status: string;
  issued_at: string;
  due_at: string | null;
  reminder_level: number | null;
  client_vat?: string | null;
  public_token?: string | null;
};

const DAY = 86_400_000;

// Escalatie: de dag na de vervaldag → 1e herinnering, 7 dagen over → 2e,
// 14 dagen over → laatste herinnering (factuur op 'vervallen'). Nog eens 14
// dagen later zonder betaling: dossier klaar voor de deurwaarder
// (zetDossiersKlaar; Studio VM verstuurt het zelf vanuit het beheer).
// Elke herinnering komt met haar volledige tekst in de bewijslog.
// Mail: betaalHerinneringMail() in de taal van de klant, met het bedrag dat
// hij echt betaalt (project-/revisiefactuur: incl. btw of btw verlegd).
export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Eerst de betalingen van Revolut ophalen: wie gisteren betaalde, krijgt
  // vandaag geen herinnering (stil overgeslagen zolang niet gekoppeld).
  const revolut = await haalRevolutOp().catch(() => null);

  const db = getSupabaseAdmin();
  const s = await getCompanySettings();
  const now = Date.now();
  let sent = 0;
  let overdueFlagged = 0;

  const { data } = await db
    .from("invoices")
    // "*": ticket_id en vat_reverse bestaan pas na migratie 0049.
    .select("*")
    .eq("status", "open")
    .limit(500);

  const talen = new Map<string, Locale>();

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
    if (overdueDays < 1) continue;

    const target =
      overdueDays >= 14 ? 3 : overdueDays >= 7 ? 2 : 1;
    const current = i.reminder_level ?? 0;
    if (target <= current) continue;

    // Bedrag zoals de klant het betaalt; bij een databankfout het bedrag
    // van de factuur zelf, zonder btw-vermelding.
    const b = await factuurBedrag(i);
    const sleutel = `${i.client_email}|${i.ticket_id ?? ""}|${b?.quoteId ?? ""}`;
    let taal = talen.get(sleutel);
    if (!taal) {
      taal = await factuurTaal(i, b?.quoteId ?? null);
      talen.set(sleutel, taal);
    }
    // Verwijlinterest (wet 2 augustus 2002) tot vandaag, Belgische datum.
    // Enkel tussen ondernemingen (btw-nummer op de factuur): voor een
    // particulier geldt die wet niet. null = rentevoet van dit semester nog
    // niet in de tabel: de mail noemt dan geen percentage.
    const bedragCent = b?.totaalCent ?? i.amount_cents;
    const vandaag = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });
    const rente = i.client_vat ? verwijlinterest(bedragCent, dueISO, vandaag) : undefined;
    const mail = betaalHerinneringMail(taal, target as 1 | 2 | 3, {
      nummer: i.number,
      bedragCent,
      btw: !b || !b.metBtw ? "geen" : b.verlegd ? "verlegd" : "incl",
      dueAt: dueISO,
      rente,
      // Knop "Online betalen" zonder aanmelden (oude factuur: token aanmaken).
      betaalHref: betaalLink(taal, await zorgVoorToken(i.id, i.public_token)),
    });
    const { ok, id: resendId } = await verstuurMail(i.client_email, mail);
    if (!ok) continue;
    await logBewijs({
      soort: "herinnering_verstuurd",
      invoice_id: i.id,
      project_id: b?.projectId ?? null,
      client_email: i.client_email,
      details: {
        niveau: target,
        aan: i.client_email,
        onderwerp: mail.subject,
        html: mail.html,
        resend_id: resendId,
        bedrag_cent: bedragCent,
        vervaldag: dueISO,
        rente: rente ?? null,
      },
    });

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

  // Dossiers voor de deurwaarder (stil overgeslagen zonder migratie 0052).
  let invordering: Awaited<ReturnType<typeof zetDossiersKlaar>> | null = null;
  try {
    invordering = await zetDossiersKlaar(now);
  } catch (e) {
    console.error("[invordering] klaarzetten mislukt:", e);
  }

  return NextResponse.json({ ok: true, revolut, sent, overdueFlagged, invordering });
}
