import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, cronSecret, siteUrl } from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";

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
    const accent = "#e08214";
    const font =
      "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    await sendMail(o.client_email, {
      subject: `Herinnering: je offerte ${o.offer_no ?? ""} verloopt binnenkort`,
      html: `<!DOCTYPE html><html><body style="margin:0;background:#0c0a09">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;border-collapse:collapse"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;border-collapse:collapse">
  <tr><td style="padding:0 4px 18px;font:700 14px/1 ui-monospace,monospace;letter-spacing:.22em;text-transform:uppercase;color:${accent}">STUDIO&nbsp;VM<span style="color:${accent}">.</span></td></tr>
  <tr><td style="background:#161210;border:1px solid #2c2521;border-radius:18px;padding:30px">
    <h1 style="margin:0 0 14px;font:700 20px/1.3 ${font};color:#fafaf9">Je offerte verloopt over 2 dagen</h1>
    <p style="margin:0 0 12px;font:400 15px/1.6 ${font};color:#a8a29e">De offerte <strong>${o.title}</strong>${
      o.offer_no ? ` (${o.offer_no})` : ""
    } is geldig tot <strong>${o.valid_until}</strong>. Daarna vervalt ze automatisch.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;border-collapse:separate"><tr>
      <td align="center" bgcolor="#fafaf9" style="border-radius:9999px">
        <a href="${siteUrl}/nl/portail" style="display:block;padding:15px 26px;font:700 15px/1 ${font};color:#0c0a09;text-decoration:none">Bekijk &amp; beslis &nbsp;→</a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:20px 4px 0;text-align:center;font:400 11px/1.5 ${font};color:#57534e">© ${new Date().getFullYear()} Studio VM · studio-vm.be</td></tr>
</table></td></tr></table></body></html>`,
    }).catch(() => {});
    await db
      .from("offers")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", o.id);
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
