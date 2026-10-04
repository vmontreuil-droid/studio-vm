import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret, resendApiKey } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml, siteLink } from "@/lib/email";
import {
  AUTO_SLUIT_DAGEN,
  esc,
  soortVan,
  ticketRef,
  toonOnderwerp,
  wachtKort,
  wachtUren,
  type TicketRij,
} from "@/lib/tickets";
import { SOORT_LABEL } from "@/lib/tickets-teksten";
import {
  herlaadTicket,
  isOntbrekend,
  studioInbox,
  ticketSchema,
  vergeetTicketSchema,
} from "@/lib/tickets-server";
import { mailKlantGesloten } from "@/lib/tickets-mail";

// Dagelijkse ticket-cron (werkdagen 06:30 UTC, zie vercel.json):
// 1) één Nederlandse overzichtsmail naar de studio-inbox met de tickets die
//    al langer dan 24 u op een antwoord van de studio wachten;
// 2) tickets die AUTO_SLUIT_DAGEN dagen op de klant wachten, vanzelf sluiten
//    (met een mail aan de klant in de taal van het ticket; zonder mail als het
//    ticket al langer dan STIL_SLUITEN_NA_DAGEN dagen stil is).
// Zonder migratie 0049 (geen wacht_op/laatste_bericht_op/herinnerd_op) doet
// deze route niets en schrijft ze niets.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUR = 3_600_000;
const DAG = 24 * UUR;
const DIGEST_NA_UUR = 24;
/** Dezelfde tickets niet opnieuw melden binnen deze termijn (tweede run op dezelfde dag). */
const HERINNER_PAUZE_UUR = 20;
const DIGEST_MAX = 100;
const SLUIT_MAX = 50;
/**
 * Langer stil dan dit: wel sluiten, maar zonder mail aan de klant. In gewone
 * werking sluit de cron een ticket na AUTO_SLUIT_DAGEN (+ hoogstens een
 * weekend). Zo oud wordt een ticket enkel als oude tickets bij migratie 0049
 * wacht_op = 'klant' kregen (laatste bericht van de studio, soms maanden
 * geleden) of als de cron lang stillag. Voor zo'n ticket zou de mail "gesloten
 * omdat er 14 dagen geen reactie kwam" de klant enkel verrassen.
 */
const STIL_SLUITEN_NA_DAGEN = 30;
/** Ruim onder maxDuration blijven: daarna geen nieuwe tickets meer sluiten. */
const TIJDSBUDGET_MS = 45_000;
/**
 * Resend aanvaardt standaard maar enkele verzoeken per seconde per team. De
 * mails gaan pas uit nadat het ticket gesloten is; een 429 zou de klant dus
 * nooit meer bereiken (de volgende run slaat het ticket over). Daarom minstens
 * MAIL_PAUZE_MS tussen twee mails, en na een mislukte mail één herkansing.
 */
const MAIL_PAUZE_MS = 600;
const MAIL_HERKANS_MS = 1_100;

const wacht = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

type DigestRij = Pick<TicketRij, "id" | "client_email" | "subject" | "nummer" | "soort" | "laatste_bericht_op">;

function digestRegel(t: DigestRij, nu: number): string {
  const href = esc(siteLink(`/admin/tickets/${t.id}`));
  const wacht = `wacht ${wachtKort(wachtUren(t.laatste_bericht_op, nu))}`;
  const delen = [
    `<strong style="color:#1c1917">${esc(ticketRef(t))}</strong>`,
    esc(SOORT_LABEL[soortVan(t)].nl),
    `<span style="color:#1c1917">${esc(toonOnderwerp(t))}</span>`,
    esc(t.client_email),
    `<strong style="color:#b45309;white-space:nowrap">${esc(wacht)}</strong>`,
  ];
  return `<tr><td style="padding:11px 0;border-top:1px solid #f0eeec;font:400 15px/1.55 ${FONT};color:#57534e"><a href="${href}" style="color:#57534e;text-decoration:none">${delen.join(" &middot; ")}</a></td></tr>`;
}

function digestHtml(rijen: DigestRij[], nu: number, misschienMeer: boolean): { onderwerp: string; html: string } {
  const n = rijen.length;
  const titel = n === 1 ? "1 ticket wacht op u" : `${n} tickets wachten op u`;
  const lijst = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;border-collapse:collapse;border-bottom:1px solid #f0eeec">${rijen
    .map((t) => digestRegel(t, nu))
    .join("")}</table>`;
  const meer = misschienMeer
    ? `<p style="margin:14px 0 0;font:400 14px/1.6 ${FONT};color:#78716c">Dit zijn de ${n} oudste; mogelijk wachten er nog meer. De volledige lijst staat in de admin.</p>`
    : "";
  return {
    onderwerp: `[Support] ${titel}`,
    html: portalEmailHtml({
      locale: "nl",
      eyebrow: "Support",
      title: esc(titel),
      bodyLines: [
        n === 1
          ? "Dit ticket wacht al langer dan 24 uur op een antwoord van u:"
          : "Deze tickets wachten al langer dan 24 uur op een antwoord van u (oudste eerst):",
      ],
      extraHtml: lijst + meer,
      ctaLabel: "Open de tickets",
      ctaHref: siteLink("/admin/tickets"),
      footnote:
        "U ontvangt dit overzicht elke werkdagochtend zolang er tickets langer dan 24 uur op u wachten. Antwoord via de admin, zodat het in het portaal van de klant staat.",
    }),
  };
}

export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const overgeslagen = () => NextResponse.json({ ok: true, overgeslagen: "migratie 0049" });

  const db = getSupabaseAdmin();

  // Basisstand (vóór migratie 0049): niets te doen, niets schrijven.
  // ticketSchema() geeft v2 = false ook na een mislukte peiling (netwerk,
  // time-out; die wordt niet gecachet). Daarom hier rechtstreeks nakijken of
  // de kolommen van deze route ontbreken: enkel dan "overgeslagen". Een andere
  // fout wordt een 503, zodat het Vercel-cronoverzicht de mislukte run toont
  // in plaats van een stille sprong over de herinnering en het sluiten.
  if (!(await ticketSchema()).v2) {
    let fout: { code?: string | null; message?: string | null } | null = null;
    try {
      const { error } = await db
        .from("tickets")
        .select("id, nummer, soort, wacht_op, laatste_bericht_op, herinnerd_op, gesloten_op")
        .limit(1);
      fout = error;
    } catch (e) {
      fout = { code: null, message: e instanceof Error ? e.message : String(e) };
    }
    if (fout) {
      if (isOntbrekend(fout)) return overgeslagen();
      console.error("[cron tickets] schema-peiling mislukt:", fout.code, fout.message);
      return NextResponse.json({ ok: false, fout: "schema-peiling" }, { status: 503 });
    }
    // Kolommen bestaan wel (peiling liep eerder mis of 0049 is net gedraaid).
    vergeetTicketSchema();
  }

  const start = Date.now();
  let ok = true;
  let digest = 0;
  let gesloten = 0;
  let stilGesloten = 0;

  // Tempo naar Resend (zie MAIL_PAUZE_MS). Zonder sleutel gaat er niets naar
  // buiten en hoeft er ook niet gewacht te worden.
  let laatsteMail = 0;
  const mailRust = async () => {
    if (!resendApiKey) return;
    const nog = laatsteMail + MAIL_PAUZE_MS - Date.now();
    if (nog > 0) await wacht(nog);
  };
  const mailGedaan = () => {
    laatsteMail = Date.now();
  };

  // ── 1) Overzichtsmail: tickets die > 24 u op de studio wachten ─────────
  {
    const nu = Date.now();
    const { data, error } = await db
      .from("tickets")
      .select("id, nummer, client_email, subject, soort, laatste_bericht_op")
      .neq("status", "gesloten")
      .eq("wacht_op", "studio")
      .neq("soort", "intern")
      .lt("laatste_bericht_op", new Date(nu - DIGEST_NA_UUR * UUR).toISOString())
      .or(`herinnerd_op.is.null,herinnerd_op.lt.${new Date(nu - HERINNER_PAUZE_UUR * UUR).toISOString()}`)
      .order("laatste_bericht_op", { ascending: true })
      .limit(DIGEST_MAX);

    if (error) {
      if (isOntbrekend(error)) {
        vergeetTicketSchema();
        return overgeslagen();
      }
      ok = false;
      console.error("[cron tickets] wachtende tickets ophalen mislukt:", error.code, error.message);
    }

    const rijen = (data as DigestRij[] | null) ?? [];
    if (rijen.length > 0) {
      try {
        const { onderwerp, html } = digestHtml(rijen, nu, rijen.length >= DIGEST_MAX);
        const naar = await studioInbox();
        const verstuurd = await sendMail(naar, { subject: onderwerp, html });
        mailGedaan();
        if (verstuurd) {
          digest = rijen.length;
          const { error: fout } = await db
            .from("tickets")
            .update({ herinnerd_op: new Date().toISOString() })
            .in(
              "id",
              rijen.map((t) => t.id),
            );
          if (fout) {
            ok = false;
            console.error("[cron tickets] herinnerd_op bijwerken mislukt:", fout.code, fout.message);
          }
        } else {
          // Niet gemarkeerd: de volgende run probeert het opnieuw.
          ok = false;
          console.info(
            `[cron tickets] overzichtsmail niet verstuurd (geen RESEND_API_KEY of fout) → ${naar}: ${onderwerp}`,
          );
        }
      } catch (e) {
        ok = false;
        console.error("[cron tickets] overzichtsmail mislukt:", e);
      }
    }
  }

  // ── 2) Automatisch sluiten: > AUTO_SLUIT_DAGEN dagen stilte van de klant ─
  {
    const grens = new Date(Date.now() - AUTO_SLUIT_DAGEN * DAG).toISOString();
    const { data, error } = await db
      .from("tickets")
      .select("*")
      .neq("status", "gesloten")
      .eq("wacht_op", "klant")
      .neq("soort", "intern")
      .lt("laatste_bericht_op", grens)
      .order("laatste_bericht_op", { ascending: true })
      .limit(SLUIT_MAX);

    if (error) {
      ok = false;
      console.error("[cron tickets] stille tickets ophalen mislukt:", error.code, error.message);
    }

    for (const t of (data as TicketRij[] | null) ?? []) {
      if (Date.now() - start > TIJDSBUDGET_MS) {
        console.warn("[cron tickets] tijdsbudget op; de rest volgt bij de volgende run.");
        break;
      }
      try {
        // Voorwaardelijk sluiten (niet via zetStatus, dat enkel op id werkt):
        // antwoordde de klant intussen, dan zette de trigger wacht_op op
        // 'studio' en laatste_bericht_op op nu, en sluit deze update niets.
        // Postgres toetst de voorwaarden opnieuw na een rijvergrendeling, dus
        // ook een gelijktijdig antwoord sluit het ticket niet.
        const nu = new Date().toISOString();
        const { data: dicht, error: fout } = await db
          .from("tickets")
          .update({ status: "gesloten", gesloten_op: nu, updated_at: nu })
          .eq("id", t.id)
          .neq("status", "gesloten")
          .eq("wacht_op", "klant")
          .neq("soort", "intern")
          .lt("laatste_bericht_op", grens)
          .select("id");
        if (fout) {
          ok = false;
          console.error(`[cron tickets] automatisch sluiten mislukt voor ${t.id}:`, fout.code, fout.message);
          if (isOntbrekend(fout)) {
            vergeetTicketSchema();
            break;
          }
          continue;
        }
        if (!dicht || dicht.length === 0) continue; // intussen beantwoord of al gesloten
        gesloten++;
        const stilDagen = (Date.now() - Date.parse(t.laatste_bericht_op ?? "")) / DAG;
        if (stilDagen > STIL_SLUITEN_NA_DAGEN) {
          stilGesloten++;
          continue;
        }
        // Taal van het ticket (ticketTaal in mailKlantGesloten); faalt nooit hard.
        // Het ticket is al dicht: na een mislukte mail (bv. 429) één herkansing,
        // want een latere run komt er niet meer op terug.
        await mailRust();
        let gemaild = await mailKlantGesloten(t, { automatisch: true });
        mailGedaan();
        if (!gemaild && resendApiKey) {
          await wacht(MAIL_HERKANS_MS);
          console.info(`[cron tickets] gesloten-mail opnieuw proberen voor ${t.id}`);
          gemaild = await mailKlantGesloten(t, { automatisch: true });
          mailGedaan();
        }
        if (!gemaild) ok = false;
      } catch (e) {
        ok = false;
        console.error(`[cron tickets] automatisch sluiten mislukt voor ${t.id}:`, e);
      }
    }
  }

  if (gesloten > 0) herlaadTicket();

  return NextResponse.json({ ok, digest, gesloten, zonderMail: stilGesloten });
}
