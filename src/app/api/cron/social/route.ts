import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  monitorConfigured,
  cronSecret,
  siteUrl,
  studioEmail,
} from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { CHANNEL_LABEL, type Channel, type Variants } from "@/lib/social";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  locale: string;
  headline: string;
  link: string | null;
  channels: string[];
  variants: Variants;
  scheduled_at: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!studioEmail) {
    return NextResponse.json({
      ok: true,
      skipped: "no STUDIO_EMAIL configured",
    });
  }

  // Posts gepland voor vandaag in Brusselse tijd waarvoor nog geen
  // herinnering verstuurd is.
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("social_posts")
    .select(
      "id, locale, headline, link, channels, variants, scheduled_at",
    )
    .eq("status", "gepland")
    .is("notify_sent_at", null)
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(30);
  const rows = (data as Row[]) ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, count: 0 });
  }

  const accent = "#e08214";
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("nl-BE", {
          timeZone: "Europe/Brussels",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const blocks = rows
    .map((r) => {
      const slots = (r.channels as Channel[])
        .map((ch) => {
          const text = r.variants?.[ch]?.text ?? "";
          return `
<div style="margin-top:14px;border-top:1px solid #2c2521;padding-top:12px">
  <p style="margin:0 0 6px;font:700 12px/1 ${font};color:#fafaf9">${CHANNEL_LABEL[ch] ?? ch}</p>
  <pre style="margin:0;padding:10px 12px;background:#0c0a09;border:1px solid #2c2521;border-radius:10px;white-space:pre-wrap;word-break:break-word;font:400 13px/1.5 ui-monospace,monospace;color:#d6d3d1">${escapeHtml(text)}</pre>
</div>`;
        })
        .join("");
      return `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:18px;border-collapse:collapse">
  <tr><td style="background:#161210;border:1px solid #2c2521;border-radius:14px;padding:18px">
    <p style="margin:0;font:700 14px/1.3 ${font};color:#fafaf9">
      <span style="color:${accent}">${fmt(r.scheduled_at)}</span> · ${r.locale.toUpperCase()} · ${escapeHtml(r.headline)}
    </p>
    ${r.link ? `<p style="margin:6px 0 0;font:400 12px/1.4 ${font};color:#a8a29e"><a href="${r.link}" style="color:${accent};text-decoration:none">${escapeHtml(r.link)}</a></p>` : ""}
    ${slots}
    <p style="margin:14px 0 0;font:400 11px/1.4 ${font};color:#78716c">
      <a href="${siteUrl}/admin/social/${r.id}" style="color:${accent};text-decoration:none">Open in admin →</a>
    </p>
  </td></tr>
</table>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#0c0a09">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;border-collapse:collapse"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:100%;border-collapse:collapse">
  <tr><td style="padding:0 4px 18px;font:700 14px/1 ui-monospace,monospace;letter-spacing:.22em;text-transform:uppercase;color:${accent}">STUDIO&nbsp;VM<span style="color:${accent}">.</span></td></tr>
  <tr><td>
    <h1 style="margin:0;font:700 22px/1.3 ${font};color:#fafaf9">Social-posts van vandaag</h1>
    <p style="margin:8px 0 0;font:400 14px/1.6 ${font};color:#a8a29e">${rows.length} post${rows.length === 1 ? "" : "s"} klaar om te plaatsen. Kopieer per kanaal en markeer als gepost in de admin.</p>
  </td></tr>
  <tr><td>${blocks}</td></tr>
  <tr><td style="padding:20px 4px 0;text-align:center;font:400 11px/1.5 ${font};color:#57534e">© ${new Date().getFullYear()} Studio VM · studio-vm.be</td></tr>
</table></td></tr></table></body></html>`;

  const sent = await sendMail(studioEmail, {
    subject: `Social vandaag — ${rows.length} post${rows.length === 1 ? "" : "s"}`,
    html,
  });

  if (sent) {
    const ids = rows.map((r) => r.id);
    await db
      .from("social_posts")
      .update({ notify_sent_at: new Date().toISOString() })
      .in("id", ids);
  }

  return NextResponse.json({ ok: true, sent, count: rows.length });
}
