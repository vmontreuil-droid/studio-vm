import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";
import { verifySvix } from "@/lib/svix";

export const dynamic = "force-dynamic";

// Resend stuurt webhook-events: email.sent / delivered / opened /
// clicked / bounced / complained. Wij houden specifiek bounced en
// complained vast → die prospects worden permanent geskipt zodat
// onze sender-reputatie niet verder beschadigd raakt. Opened/clicked
// zetten opened_at (eerste keer).
//
// Authenticatie — Resend ondertekent via Svix:
//   headers  svix-id, svix-timestamp, svix-signature
//            (of de standaardnamen webhook-id / -timestamp / -signature)
//   inhoud   `${id}.${timestamp}.${ruwe body}`
//   sleutel  base64-gedeelte van het geheim na "whsec_"
//   handtek. HMAC-SHA256, base64; header bevat "v1,<sig>" (spatie-
//            gescheiden lijst, bij sleutelrotatie meerdere)
// Geheim: env RESEND_WEBHOOK_SECRET, anders company_settings.
// outreach_webhook_secret. Is er een geheim ingesteld, dan wordt elke
// niet-kloppende of verouderde (> 5 min) aanvraag geweigerd. Zonder
// geheim worden events nog aanvaard, maar dat wordt gelogd.

type Event = {
  type: string;
  data?: {
    email_id?: string;
    to?: string | string[];
  };
};

async function webhookSecret(): Promise<string | null> {
  const env = (process.env.RESEND_WEBHOOK_SECRET ?? "").trim();
  if (env) return env;
  try {
    const { data } = await getSupabaseAdmin()
      .from("company_settings")
      .select("outreach_webhook_secret")
      .eq("id", "default")
      .maybeSingle();
    const s = (data as { outreach_webhook_secret: string | null } | null)
      ?.outreach_webhook_secret;
    return s && s.trim() ? s.trim() : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!monitorConfigured) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  // Ruwe body nodig voor de handtekening — pas daarna JSON parsen.
  const raw = await req.text();

  const secret = await webhookSecret();
  if (secret) {
    const h = req.headers;
    const ok = verifySvix(
      secret,
      h.get("svix-id") ?? h.get("webhook-id"),
      h.get("svix-timestamp") ?? h.get("webhook-timestamp"),
      h.get("svix-signature") ?? h.get("webhook-signature"),
      raw,
    );
    if (!ok) {
      return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
    }
  } else {
    console.warn(
      "[resend-webhook] Geen RESEND_WEBHOOK_SECRET / outreach_webhook_secret ingesteld — event aanvaard zonder handtekeningcontrole.",
    );
  }

  let evt: Event;
  try {
    evt = JSON.parse(raw) as Event;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const id = evt.data?.email_id;
  if (!id) return NextResponse.json({ ok: true, skipped: true });
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (evt.type === "email.bounced") {
    await db
      .from("prospect_outreach")
      .update({ bounced_at: now, status: "geen_interesse", updated_at: now })
      .eq("resend_message_id", id);
  } else if (
    evt.type === "email.complained" ||
    evt.type === "email.complaint"
  ) {
    await db
      .from("prospect_outreach")
      .update({ complaint_at: now, status: "geen_interesse", updated_at: now })
      .eq("resend_message_id", id);
  } else if (evt.type === "email.opened" || evt.type === "email.clicked") {
    // Enkel de eerste keer, en nooit een afgemelde/gebouncede rij terug
    // naar 'geopend' zetten.
    await db
      .from("prospect_outreach")
      .update({ opened_at: now, status: "geopend", updated_at: now })
      .eq("resend_message_id", id)
      .is("opened_at", null)
      .in("status", ["verzonden", "opgevolgd"]);
  }
  return NextResponse.json({ ok: true });
}
