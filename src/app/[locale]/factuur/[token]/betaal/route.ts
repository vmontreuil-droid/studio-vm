import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mollieConfigured, siteUrl } from "@/lib/supabase/config";
import { isValidLocale } from "@/lib/i18n/config";
import { createMolliePayment, getMolliePayment } from "@/lib/mollie";
import { factuurBedrag, type KlantFactuur } from "@/lib/factuur-klant";
import { MOLLIE_LOCALE, TOKEN } from "@/lib/facturatie/online-betalen";

export const dynamic = "force-dynamic";

// "Online betalen" uit een factuur- of herinneringsmail: zonder aanmelden,
// met de geheime link van de factuur. Opent meteen de Mollie-betaalpagina in
// de taal van de klant; na het betalen komt hij terug op het factuurdocument.
// Een betaling die nog openstaat (tweede klik, of een linkscanner die de mail
// al opende) wordt hergebruikt in plaats van een nieuwe te maken.

type Inv = KlantFactuur & {
  number: string;
  status: string;
  mollie_payment_id?: string | null;
};

export async function GET(req: Request, ctx: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await ctx.params;
  const taal = isValidLocale(locale) ? locale : "nl";
  const document = (melding?: string) =>
    NextResponse.redirect(
      new URL(`/${taal}/factuur/${encodeURIComponent(token)}${melding ? `?betaling=${melding}` : ""}`, req.url),
      303,
    );
  if (!TOKEN.test(token)) return document();
  if (!mollieConfigured) return document("fout");

  const db = getSupabaseAdmin();
  const { data } = await db.from("invoices").select("*").eq("public_token", token).maybeSingle();
  const inv = data as Inv | null;
  if (!inv) return document();
  if (inv.status === "betaald") return document("ok");

  const bedragCent = (await factuurBedrag(inv))?.totaalCent ?? null;
  if (bedragCent == null || bedragCent <= 0) return document("fout");
  const waarde = (bedragCent / 100).toFixed(2);

  if (inv.mollie_payment_id) {
    const p = await getMolliePayment(inv.mollie_payment_id);
    const href = p?._links?.checkout?.href;
    if (p?.status === "open" && p.amount?.value === waarde && p.metadata?.invoice_id === inv.id && href) {
      return NextResponse.redirect(href, 303);
    }
  }

  const basis = siteUrl.replace(/\/$/, "");
  const pay = await createMolliePayment({
    amountCents: bedragCent,
    description: `Factuur ${inv.number} — Studio VM`,
    redirectUrl: `${basis}/${taal}/factuur/${encodeURIComponent(token)}?betaling=terug`,
    webhookUrl: `${basis}/api/mollie/webhook`,
    metadata: { invoice_id: inv.id },
    locale: MOLLIE_LOCALE[taal],
  });
  if (!pay) return document("fout");
  await db.from("invoices").update({ mollie_payment_id: pay.id }).eq("id", inv.id);
  return NextResponse.redirect(pay.checkoutUrl, 303);
}
