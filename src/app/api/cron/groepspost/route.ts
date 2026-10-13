import { NextResponse, type NextRequest } from "next/server";
import { monitorConfigured, cronSecret } from "@/lib/supabase/config";
import { verstuurMail } from "@/lib/monitor";
import { BEDRIJF } from "@/lib/bedrijf";
import {
  GROEPSPOST_MAIL_UUR,
  bewaarGroepspostMail,
  groepspostMail,
  laatsteGroepspostMail,
  recentstePaginapost,
} from "@/lib/social/groepspost-mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Dagelijks kort na de middagpost; mailt hoogstens om de twee dagen de
// groepspost in vier talen (zie lib/social/groepspost-mail). Niets nieuws op
// de pagina sinds de vorige mail → geen mail.
export async function GET(req: NextRequest) {
  if (!monitorConfigured || !cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const nu = new Date();
  const vorige = await laatsteGroepspostMail();
  if (vorige && nu.getTime() - Date.parse(vorige.op) < GROEPSPOST_MAIL_UUR * 3_600_000) {
    return NextResponse.json({ ok: true, overgeslagen: "te kort na de vorige mail" });
  }
  const post = await recentstePaginapost(nu);
  if (!post) return NextResponse.json({ ok: true, overgeslagen: "geen recent bericht" });
  if (vorige?.postId === post.id) return NextResponse.json({ ok: true, overgeslagen: "al gemaild" });

  const r = await verstuurMail(BEDRIJF.email, await groepspostMail(post));
  if (r.ok) await bewaarGroepspostMail(post.id, nu);
  return NextResponse.json({ ok: r.ok, post: post.title });
}
