import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Resend stuurt webhook-events: email.sent / delivered / opened /
// clicked / bounced / complained. Wij houden specifiek bounced en
// complained vast → die prospects worden permanent geskipt zodat
// onze sender-reputatie niet verder beschadigd raakt.
//
// Auth: optionele shared secret in 'svix-signature' OR
// 'authorization' header. Resend ondersteunt Svix-stijl signing —
// voor MVP accepteren we alle events, idempotent op message-id.

type Event = {
  type: string;
  data?: {
    email_id?: string;
    to?: string | string[];
  };
};

export async function POST(req: NextRequest) {
  if (!monitorConfigured) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  let evt: Event;
  try {
    evt = (await req.json()) as Event;
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
  } else if (evt.type === "email.opened") {
    await db
      .from("prospect_outreach")
      .update({ opened_at: now, status: "geopend", updated_at: now })
      .eq("resend_message_id", id)
      .is("opened_at", null);
  }
  return NextResponse.json({ ok: true });
}
