import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Eén-klik opt-out — geen account, geen bevestiging. De gebruiker
// die op de link in de mail klikt wordt direct op 'geen_interesse'
// gezet. GDPR-vriendelijk en eerlijk.
export async function GET(req: NextRequest) {
  if (!monitorConfigured) {
    return NextResponse.json({ error: "n/a" }, { status: 503 });
  }
  const token = req.nextUrl.searchParams.get("t");
  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 400 });
  }
  await getSupabaseAdmin()
    .from("prospect_outreach")
    .update({
      status: "geen_interesse",
      updated_at: new Date().toISOString(),
    })
    .eq("scan_token", token);

  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Opgelost</title></head>
<body style="font:400 16px/1.55 system-ui;margin:0;background:#fafaf9">
  <div style="max-width:520px;margin:80px auto;padding:32px;background:#fff;border-radius:16px;text-align:center">
    <p style="font-size:28px;margin:0 0 8px;font-weight:700;letter-spacing:-1px">vm<span style="color:#e08214">.</span></p>
    <h1 style="font-size:22px;margin:0 0 14px">Uit de lijst gehaald</h1>
    <p style="color:#57534e;margin:0 0 22px">Je ontvangt geen verdere mails meer van mij. Excuses voor het storen.</p>
    <p style="margin:0"><a href="https://studio-vm.be" style="color:#e08214;text-decoration:none">studio-vm.be</a></p>
  </div>
</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
