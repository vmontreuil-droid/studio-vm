import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const MSG: Record<string, string> = {
  nl: "Je ontvangt geen monitoring-mails meer. Tot ziens!",
  fr: "Vous ne recevrez plus d'e-mails de suivi. À bientôt !",
  en: "You'll no longer receive monitoring emails. See you!",
};

export async function GET(req: NextRequest) {
  if (!monitorConfigured)
    return NextResponse.json({ error: "not configured" }, { status: 503 });

  const token = req.nextUrl.searchParams.get("token") ?? "";
  let locale = "nl";

  if (token) {
    const db = getSupabaseAdmin();
    const { data: mon } = await db
      .from("monitors")
      .select("id, locale")
      .eq("token", token)
      .maybeSingle();
    if (mon) {
      locale = mon.locale || "nl";
      await db
        .from("monitors")
        .update({
          active: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("id", mon.id);
    }
  }

  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Studio VM</title><div style="font-family:system-ui,sans-serif;max-width:480px;margin:18vh auto;text-align:center;color:#111;padding:0 20px"><p style="font-size:18px">${
      MSG[locale] ?? MSG.nl
    }</p><p><a href="https://studio-vm.be" style="color:#b45309">studio-vm.be</a></p></div>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
