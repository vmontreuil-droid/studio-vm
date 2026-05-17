import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { monitorConfigured, mollieConfigured } from "@/lib/supabase/config";
import { getMolliePayment } from "@/lib/mollie";
import { sendMail } from "@/lib/monitor";
import { siteUrl } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Mollie POST't enkel het payment-id. We halen de status zelf op bij
// Mollie (gezaghebbend) en zetten de factuur op betaald. Idempotent.
export async function POST(req: NextRequest) {
  if (!mollieConfigured || !monitorConfigured) {
    return NextResponse.json({ ok: true });
  }
  let id = "";
  try {
    const form = await req.formData();
    id = String(form.get("id") ?? "");
  } catch {
    id = "";
  }
  if (!id) return NextResponse.json({ ok: true });

  const payment = await getMolliePayment(id);
  if (!payment) return NextResponse.json({ ok: true });

  const invoiceId = payment.metadata?.invoice_id;
  const quoteId = payment.metadata?.quote_id;

  if (payment.status === "paid" && invoiceId) {
    try {
      await getSupabaseAdmin()
        .from("invoices")
        .update({
          status: "betaald",
          paid_at: new Date().toISOString(),
          mollie_payment_id: payment.id,
        })
        .eq("id", invoiceId);
    } catch {
      // Mollie herprobeert de webhook als we geen 200 geven; bij een
      // DB-hapering net wél 200 geven en op de volgende retry vertrouwen
      // zou data missen — daarom hier 500.
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  if (payment.status === "paid" && quoteId) {
    try {
      const db = getSupabaseAdmin();
      const { data } = await db
        .from("quotes")
        .select(
          "id, name, email, locale, deposit_status, base, plan, modules, one_off_cents, discount_cents, deposit_cents, term, monthly_install_cents, subscription_cents, monthly_total_cents",
        )
        .eq("id", quoteId)
        .maybeSingle();
      const q = data as {
        id: string;
        name: string;
        email: string;
        locale: string | null;
        deposit_status: string;
        base: string | null;
        plan: string | null;
        modules: string[] | null;
        one_off_cents: number | null;
        discount_cents: number | null;
        deposit_cents: number | null;
        term: number | null;
        monthly_install_cents: number | null;
        subscription_cents: number | null;
        monthly_total_cents: number | null;
      } | null;
      // Idempotent: enkel de eerste keer mailen.
      if (q && q.deposit_status !== "betaald") {
        await db
          .from("quotes")
          .update({
            deposit_status: "betaald",
            deposit_paid_at: new Date().toISOString(),
            mollie_payment_id: payment.id,
            status: "vastgelegd",
          })
          .eq("id", quoteId);

        const loc =
          q.locale === "fr" || q.locale === "en" ? q.locale : "nl";
        const eur = (c: number | null | undefined) =>
          "€ " +
          ((c ?? 0) / 100).toLocaleString("nl-BE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        // deposit_cents staat excl. btw opgeslagen; betaald werd incl. 21%.
        const amt = `${eur(Math.round((q.deposit_cents ?? 0) * 1.21))} incl. btw`;
        await sendMail("info@studio-vm.be", {
          subject: `Aanbetaling ontvangen — ${q.name}`,
          html: `<div style="font-family:system-ui,sans-serif;color:#111;line-height:1.6"><p><strong>${q.name}</strong> (${q.email}) heeft de aanbetaling van ${amt} betaald. De scope ligt vast — klaar om op te starten.</p></div>`,
        }).catch(() => {});

        // Magic-link zodat de klant meteen in zijn portaal kan (alles
        // staat er klaar: bestelling, betaling, voortgang, support).
        let portalUrl = `${siteUrl}/${loc}/portail`;
        try {
          const gen = await db.auth.admin.generateLink({
            type: "magiclink",
            email: q.email,
          });
          const hashed = gen.data?.properties?.hashed_token;
          if (!gen.error && hashed) {
            portalUrl = `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(
              hashed,
            )}&type=magiclink&next=${encodeURIComponent(
              `/${loc}/portail/dashboard`,
            )}`;
          }
        } catch {
          // Val terug op de portaal-login (link blijft werken).
        }

        const payable =
          (q.one_off_cents ?? 0) - (q.discount_cents ?? 0);
        const depIncl = Math.round((q.deposit_cents ?? 0) * 1.21);
        const baseName =
          ({
            onepager: "One-pager",
            starter: "Starter",
            pro: "Pro",
            webshop: "Webshop",
          } as Record<string, string>)[q.base ?? ""] ??
          q.base ??
          "—";

        // Betaalde aanbetaling als factuurregel in het portaal
        // (Betalingen/Facturen) — idempotent op mollie_payment_id.
        try {
          const { data: existInv } = await db
            .from("invoices")
            .select("id")
            .eq("mollie_payment_id", payment.id)
            .maybeSingle();
          if (!existInv) {
            const year = new Date().getFullYear();
            const { count } = await db
              .from("invoices")
              .select("id", { count: "exact", head: true });
            const invNo = `AANB-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
            const invDesc = {
              nl: `Aanbetaling 30% (incl. 21% btw) — ${baseName}`,
              fr: `Acompte 30% (TVA 21% incl.) — ${baseName}`,
              en: `30% deposit (incl. 21% VAT) — ${baseName}`,
            }[loc];
            await db.from("invoices").insert({
              client_email: q.email,
              number: invNo,
              description: invDesc,
              amount_cents: depIncl,
              status: "betaald",
              paid_at: new Date().toISOString(),
              mollie_payment_id: payment.id,
            });
          }
        } catch {
          // Niet-kritisch — de betaling zelf is sowieso geregistreerd.
        }

        const mods = (q.modules ?? []).filter(
          (m) =>
            !!m &&
            !/^Betaling:/i.test(m) &&
            !/^Spreiding:/i.test(m) &&
            !/Scope vastgelegd/i.test(m) &&
            !/^Domein & e-mail/i.test(m),
        );
        const domainNote = {
          nl: "Nog samen te bespreken — niet in deze prijs",
          fr: "À voir ensemble — hors de ce prix",
          en: "To discuss together — not in this price",
        }[loc];

        const TR = {
          nl: {
            subject: "Bevestiging — je aanbetaling is ontvangen",
            hi: `Dag ${q.name},`,
            thanks: `Bedankt voor je vertrouwen. We ontvingen je aanbetaling van <strong>${amt}</strong> in goede orde — je project bij Studio VM ligt nu vast. Geen sterretjes, geen verrassingen.`,
            sumHead: "Jouw samenstelling",
            lPkg: "Pakket",
            lSub: "Onderhoud (verplicht)",
            lExtra: "Gekozen opties",
            lOnce: "Eenmalig (excl. btw)",
            lDisc: "Vastlegkorting",
            lDep: "Aanbetaling betaald (incl. 21% btw)",
            lBal: "Saldo",
            lMonth: "Maandfactuur vanaf oplevering",
            lDomain: "Domein & e-mail",
            ctaBtn: "Open je klantenportaal",
            planHead: "Aflossingstabel",
            planCap: "Aflossing van je project + het verplichte onderhoud dat ernaast loopt.",
            planDep: "Aanbetaling (bij vastleggen) — betaald",
            planSplit: "Saldo gespreid",
            planTotal: "Projecttotaal (excl. btw)",
            planDuring: "Maandtotaal tijdens afbetaling",
            planAfter: "Maandtotaal daarna (onderhoud)",
            mnd: "maanden",
            planThen: "Daarna, vanaf oplevering",
            terms: `Op deze opdracht zijn onze <a href="${siteUrl}/${loc}/voorwaarden" style="color:${"#e08214"}">algemene voorwaarden</a> en <a href="${siteUrl}/${loc}/privacy" style="color:${"#e08214"}">privacyverklaring</a> van toepassing.`,
            balOnce: `${eur(payable - (q.deposit_cents ?? 0))} bij oplevering`,
            balSplit: `${q.term}× ${eur(q.monthly_install_cents)} / maand vanaf oplevering`,
            perMonth: "/ maand",
            stepsHead: "Wat nu? — de volgende stappen",
            steps: [
              "Ik neem binnen één werkdag persoonlijk contact op om de planning en jouw input (teksten, beeldmateriaal, toegang) af te spreken.",
              "Je krijgt een korte, heldere briefing-checklist in je klantenportaal — alles op één plek.",
              "Ik bouw je site (uitvoering 1–2 weken zodra het materiaal er is); je volgt de voortgang live in je portaal.",
              "Oplevering op een staging-omgeving — jij keurt goed.",
              "Live-gang op je domein. Vanaf oplevering start je maandfactuur (onderhoud); domein & e-mail bespreken we apart, rustig samen.",
            ],
            portal:
              "Alles — je offerte, voortgang, facturen en support — staat in je persoonlijke klantenportaal. Je krijgt een login-link per e-mail.",
            reassure:
              "Vragen tussendoor? Antwoord gerust gewoon op deze mail — je krijgt mij, geen bot.",
            sign: "Tot snel,<br>Vincent — Studio VM",
          },
          fr: {
            subject: "Confirmation — votre acompte est reçu",
            hi: `Bonjour ${q.name},`,
            thanks: `Merci pour votre confiance. Nous avons bien reçu votre acompte de <strong>${amt}</strong> — votre projet chez Studio VM est verrouillé. Sans astérisques, sans surprises.`,
            sumHead: "Votre composition",
            lPkg: "Forfait",
            lSub: "Maintenance (obligatoire)",
            lExtra: "Options choisies",
            lOnce: "Unique (HTVA)",
            lDisc: "Remise verrouillage",
            lDep: "Acompte payé (TVA 21% incl.)",
            lBal: "Solde",
            lMonth: "Facture mensuelle dès la livraison",
            lDomain: "Domaine & e-mail",
            ctaBtn: "Ouvrir votre espace client",
            planHead: "Tableau d'amortissement",
            planCap: "Amortissement de votre projet + la maintenance obligatoire qui s'ajoute.",
            planDep: "Acompte (au verrouillage) — payé",
            planSplit: "Solde échelonné",
            planTotal: "Total projet (HTVA)",
            planDuring: "Total mensuel pendant l'échelonnement",
            planAfter: "Total mensuel ensuite (maintenance)",
            mnd: "mois",
            planThen: "Ensuite, dès la livraison",
            terms: `Nos <a href="${siteUrl}/${loc}/voorwaarden" style="color:${"#e08214"}">conditions générales</a> et notre <a href="${siteUrl}/${loc}/privacy" style="color:${"#e08214"}">politique de confidentialité</a> s'appliquent à cette mission.`,
            balOnce: `${eur(payable - (q.deposit_cents ?? 0))} à la livraison`,
            balSplit: `${q.term}× ${eur(q.monthly_install_cents)} / mois dès la livraison`,
            perMonth: "/ mois",
            stepsHead: "Et maintenant ? — les prochaines étapes",
            steps: [
              "Je vous recontacte personnellement sous un jour ouvré pour le planning et vos éléments (textes, visuels, accès).",
              "Vous recevez une checklist de briefing claire dans votre espace client — tout au même endroit.",
              "Je construis votre site (réalisation 1–2 semaines dès réception du matériel) ; vous suivez l'avancement en direct.",
              "Livraison sur un environnement de staging — vous validez.",
              "Mise en ligne sur votre domaine. Dès la livraison, votre facture mensuelle démarre (maintenance) ; domaine & e-mail, on en parle séparément, tranquillement.",
            ],
            portal:
              "Tout — votre devis, l'avancement, les factures et le support — se trouve dans votre espace client. Vous recevez un lien de connexion par e-mail.",
            reassure:
              "Une question entre-temps ? Répondez simplement à cet e-mail — vous m'avez, moi, pas un bot.",
            sign: "À bientôt,<br>Vincent — Studio VM",
          },
          en: {
            subject: "Confirmation — your deposit is received",
            hi: `Hi ${q.name},`,
            thanks: `Thanks for your trust. We've received your deposit of <strong>${amt}</strong> — your project with Studio VM is locked in. No asterisks, no surprises.`,
            sumHead: "Your composition",
            lPkg: "Package",
            lSub: "Maintenance (required)",
            lExtra: "Chosen options",
            lOnce: "One-off (excl. VAT)",
            lDisc: "Lock-in discount",
            lDep: "Deposit paid (incl. 21% VAT)",
            lBal: "Balance",
            lMonth: "Monthly invoice from delivery",
            lDomain: "Domain & email",
            ctaBtn: "Open your client portal",
            planHead: "Repayment schedule",
            planCap: "Repayment of your project + the required maintenance running alongside.",
            planDep: "Deposit (at lock-in) — paid",
            planSplit: "Balance split",
            planTotal: "Project total (excl. VAT)",
            planDuring: "Monthly total during repayment",
            planAfter: "Monthly total after (maintenance)",
            mnd: "months",
            planThen: "Then, from delivery",
            terms: `Our <a href="${siteUrl}/${loc}/voorwaarden" style="color:${"#e08214"}">general terms</a> and <a href="${siteUrl}/${loc}/privacy" style="color:${"#e08214"}">privacy policy</a> apply to this assignment.`,
            balOnce: `${eur(payable - (q.deposit_cents ?? 0))} on delivery`,
            balSplit: `${q.term}× ${eur(q.monthly_install_cents)} / month from delivery`,
            perMonth: "/ month",
            stepsHead: "What's next? — the next steps",
            steps: [
              "I personally reach out within one working day to agree the planning and your input (texts, visuals, access).",
              "You get a short, clear briefing checklist in your client portal — all in one place.",
              "I build your site (1–2 weeks once the material is in); you follow progress live in your portal.",
              "Delivery on a staging environment — you approve.",
              "Go-live on your domain. From delivery your monthly invoice starts (maintenance); domain & email we discuss separately, calmly together.",
            ],
            portal:
              "Everything — your quote, progress, invoices and support — is in your personal client portal. You'll get a login link by email.",
            reassure:
              "A question in between? Just reply to this email — you get me, not a bot.",
            sign: "Talk soon,<br>Vincent — Studio VM",
          },
        }[loc];

        const accent = "#e08214";
        const font =
          "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
        const row = (k: string, v: string) =>
          `<tr><td style="padding:8px 20px 8px 0;font:400 13px/1.5 ${font};color:#78716c;vertical-align:top;width:42%">${k}</td><td style="padding:8px 0;font:600 14px/1.5 ${font};color:#1c1917;vertical-align:top">${v}</td></tr>`;
        const summaryRows =
          row(TR.lPkg, baseName) +
          (q.subscription_cents
            ? row(
                TR.lSub,
                `${eur(q.subscription_cents)}${TR.perMonth}`,
              )
            : "") +
          (mods.length
            ? row(TR.lExtra, mods.join(" · "))
            : "") +
          row(TR.lOnce, eur(q.one_off_cents)) +
          (q.discount_cents
            ? row(TR.lDisc, `− ${eur(q.discount_cents)}`)
            : "") +
          row(TR.lDep, `<span style="color:${accent}">${amt}</span>`) +
          row(
            TR.lBal,
            q.term && q.term > 0 ? TR.balSplit : TR.balOnce,
          ) +
          row(
            TR.lMonth,
            `${eur(q.monthly_total_cents)}${TR.perMonth}`,
          ) +
          row(TR.lDomain, domainNote);
        const planBlock =
          q.term && q.term > 0
            ? `<p style="margin:28px 0 4px;font:700 12px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#78716c">${TR.planHead}</p><p style="margin:0 0 10px;font:400 12px/1.5 ${font};color:#78716c">${TR.planCap}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td style="background:#ffffff;border:1px solid #e7e5e4;padding:20px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tbody>${
                row(
                  TR.planDep,
                  `<span style="color:${accent}">${amt}</span>`,
                ) +
                row(
                  TR.planSplit,
                  `${q.term}× ${eur(q.monthly_install_cents)}${TR.perMonth}`,
                ) +
                row(TR.planTotal, eur(payable)) +
                row(
                  TR.planDuring,
                  `<strong>${eur(q.monthly_total_cents)}</strong>${TR.perMonth} · ${q.term} ${TR.mnd}`,
                ) +
                row(
                  TR.planAfter,
                  `${eur(q.subscription_cents)}${TR.perMonth}`,
                )
              }</tbody></table></td></tr></table>`
            : "";
        const stepsHtml = TR.steps
          .map(
            (s, i) =>
              `<tr><td valign="top" style="padding:0 14px 16px 0"><span style="display:inline-block;width:24px;height:24px;background:${accent};color:#fff;font:700 13px/24px ${font};text-align:center">${i + 1}</span></td><td style="padding:0 0 16px;font:400 14px/1.6 ${font};color:#44403c">${s}</td></tr>`,
          )
          .join("");

        await sendMail(q.email, {
          subject: TR.subject,
          html: `<!DOCTYPE html><html lang="${loc}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0a09">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;border-collapse:collapse"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;border-collapse:collapse">
  <tr><td style="background:#fafaf9;border:1px solid #e7e5e4;padding:38px 36px">
    <p style="margin:0 0 22px;font:800 40px/1 ${font};letter-spacing:-2px;color:#1c1917">vm<span style="color:${accent}">.</span><span style="display:inline-block;margin-left:12px;font:700 11px/1 ui-monospace,monospace;letter-spacing:.22em;color:#a8a29e;vertical-align:middle">STUDIO&nbsp;VM</span></p>
    <p style="margin:0 0 6px;font:700 13px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:${accent}">${TR.subject}</p>
    <h1 style="margin:10px 0 14px;font:700 22px/1.3 ${font};color:#1c1917">${TR.hi}</h1>
    <p style="margin:0 0 26px;font:400 15px/1.65 ${font};color:#44403c">${TR.thanks}</p>

    <p style="margin:0 0 10px;font:700 12px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#78716c">${TR.sumHead}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td style="background:#ffffff;border:1px solid #e7e5e4;padding:20px 24px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tbody>${summaryRows}</tbody></table>
    </td></tr></table>
    ${planBlock}
    <p style="margin:30px 0 14px;font:700 12px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#78716c">${TR.stepsHead}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${stepsHtml}</table>

    <p style="margin:8px 0 20px;font:400 14px/1.65 ${font};color:#44403c">${TR.portal}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td bgcolor="${accent}" style="background:${accent}"><a href="${portalUrl}" style="display:inline-block;padding:14px 28px;font:700 14px/1 ${font};color:#ffffff;text-decoration:none">${TR.ctaBtn} &nbsp;→</a></td></tr></table>
    <p style="margin:24px 0 0;font:400 14px/1.65 ${font};color:#44403c">${TR.reassure}</p>
    <p style="margin:22px 0 0;font:400 15px/1.6 ${font};color:#1c1917">${TR.sign}</p>
    <p style="margin:24px 0 0;padding-top:18px;border-top:1px solid #e7e5e4;font:400 12px/1.6 ${font};color:#78716c">${TR.terms}</p>
  </td></tr>
  <tr><td style="padding:20px 4px 0;text-align:center;font:400 11px/1.6 ${font};color:#57534e">Studio VM · Vincent Montreuil · Nieuwpoortstraat 14-301, 8570 Anzegem · info@studio-vm.be · BE 0672.960.066</td></tr>
</table></td></tr></table></body></html>`,
        }).catch(() => {});
      }
    } catch {
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
