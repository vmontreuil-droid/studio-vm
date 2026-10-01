import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Eén-klik opt-out — geen account, geen bevestiging. De gebruiker
// die op de link in de mail klikt wordt direct op 'geen_interesse'
// gezet. GDPR-vriendelijk en eerlijk.
//
// GET  = klik op de link in de mail (toont een bevestigingspagina)
// POST = RFC 8058 one-click (List-Unsubscribe-Post) vanuit Gmail/Outlook

const TEKST = {
  nl: { titel: "Uit de lijst gehaald", tekst: "U ontvangt geen verdere e-mails meer van mij. Excuses voor het storen." },
  fr: { titel: "Désinscription confirmée", tekst: "Vous ne recevrez plus d'e-mails de ma part. Désolé pour le dérangement." },
  en: { titel: "Unsubscribed", tekst: "You won't receive any further emails from me. Sorry for the interruption." },
  de: { titel: "Abgemeldet", tekst: "Sie erhalten keine weiteren E-Mails mehr von mir. Entschuldigen Sie die Störung." },
} as const;

async function afmelden(token: string): Promise<void> {
  await getSupabaseAdmin()
    .from("prospect_outreach")
    .update({
      status: "geen_interesse",
      updated_at: new Date().toISOString(),
    })
    .eq("scan_token", token);
}

export async function GET(req: NextRequest) {
  if (!monitorConfigured) {
    return NextResponse.json({ error: "n/a" }, { status: 503 });
  }
  const token = req.nextUrl.searchParams.get("t");
  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 400 });
  }
  await afmelden(token);

  const l = req.nextUrl.searchParams.get("l");
  const lang = l === "fr" || l === "en" || l === "de" ? l : "nl";
  const t = TEKST[lang];

  return new Response(
    `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${t.titel}</title></head>
<body style="font:400 16px/1.55 system-ui;margin:0;background:#fafaf9;color:#1c1917">
  <div style="max-width:520px;margin:80px auto;padding:32px;background:#fff;border-radius:16px;text-align:center">
    <p style="font-size:28px;margin:0 0 8px;font-weight:700;letter-spacing:-1px">vm<span style="color:#e08214">.</span></p>
    <h1 style="font-size:22px;margin:0 0 14px">${t.titel}</h1>
    <p style="color:#57534e;margin:0 0 22px">${t.tekst}</p>
    <p style="margin:0"><a href="https://studio-vm.be" style="color:#e08214;text-decoration:none">studio-vm.be</a></p>
  </div>
</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function POST(req: NextRequest) {
  if (!monitorConfigured) {
    return NextResponse.json({ error: "n/a" }, { status: 503 });
  }
  const token = req.nextUrl.searchParams.get("t");
  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 400 });
  }
  await afmelden(token);
  return NextResponse.json({ ok: true });
}
