import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";
import { unsubVerify } from "@/lib/newsletter-token";

export const dynamic = "force-dynamic";

const MSG: Record<string, string> = {
  nl: "Je bent uitgeschreven — je krijgt geen updates meer. Tot ziens!",
  fr: "Vous êtes désinscrit — plus d'e-mails. À bientôt !",
  en: "You're unsubscribed — no more updates. See you!",
};
const BAD: Record<string, string> = {
  nl: "Deze uitschrijflink is ongeldig of verlopen.",
  fr: "Ce lien de désinscription est invalide ou expiré.",
  en: "This unsubscribe link is invalid or expired.",
};

function page(text: string) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Studio VM</title><div style="font-family:system-ui,sans-serif;max-width:480px;margin:18vh auto;text-align:center;color:#111;padding:0 20px"><p style="font-size:18px">${text}</p><p style="margin-top:24px"><a href="https://www.studio-vm.be" style="color:#b45309;text-decoration:none">studio-vm.be</a></p></div>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const locale = (req.nextUrl.searchParams.get("l") ?? "nl") in MSG
    ? (req.nextUrl.searchParams.get("l") ?? "nl")
    : "nl";
  if (!monitorConfigured) return page(BAD[locale]);

  const email = (req.nextUrl.searchParams.get("e") ?? "")
    .trim()
    .toLowerCase();
  const sig = req.nextUrl.searchParams.get("s") ?? "";
  if (!email || !unsubVerify(email, sig)) return page(BAD[locale]);

  try {
    await getSupabaseAdmin()
      .from("newsletter_subscribers")
      .update({ active: false, unsubscribed_at: new Date().toISOString() })
      .eq("email", email);
  } catch {
    return page(BAD[locale]);
  }
  return page(MSG[locale]);
}
