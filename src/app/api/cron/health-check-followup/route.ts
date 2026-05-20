import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  monitorConfigured,
  cronSecret,
  resendApiKey,
  siteUrl,
} from "@/lib/supabase/config";
import { sendMail } from "@/lib/monitor";
import { portalEmailHtml } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 86_400_000;

type Hc = {
  id: string;
  email: string;
  website: string;
  locale: string;
  scan_token: string;
  paid_at: string;
};

const T3 = {
  nl: {
    subject: "Heb je iets aan je Site Health Check gehad?",
    eyebrow: "Site Health Check — opvolging",
    title: "Even checken — heeft het rapport je geholpen?",
    lines: [
      "Drie dagen geleden bezorgde ik je een Site Health Check voor je website.",
      "Korte vraag: <strong>heb je iets gevonden waarmee je aan de slag bent</strong>, of zat er iets onduidelijks in?",
      "Antwoord gerust op deze mail — ik lees en beantwoord alles persoonlijk.",
    ],
    cta: "Open mijn rapport opnieuw",
  },
  fr: {
    subject: "Avez-vous trouvé votre Site Health Check utile ?",
    eyebrow: "Site Health Check — suivi",
    title: "Petit check — le rapport vous a-t-il aidé ?",
    lines: [
      "Il y a trois jours, je vous ai livré un Site Health Check pour votre site.",
      "Petite question : <strong>avez-vous trouvé quelque chose d'actionnable</strong>, ou y avait-il des points peu clairs ?",
      "Répondez à ce mail si vous voulez — je lis et réponds personnellement.",
    ],
    cta: "Ouvrir à nouveau mon rapport",
  },
  en: {
    subject: "Was your Site Health Check useful?",
    eyebrow: "Site Health Check — follow-up",
    title: "Quick check — did the report help?",
    lines: [
      "Three days ago I delivered your Site Health Check.",
      "Quick question: <strong>did you find something actionable</strong>, or was anything unclear?",
      "Reply to this mail if you like — I read and answer personally.",
    ],
    cta: "Open my report again",
  },
} as const;

const T7 = {
  nl: {
    subject: "Hulp nodig om je site-issues op te lossen?",
    eyebrow: "Site Health Check — week later",
    title: "Nog hulp nodig om de gevonden issues op te lossen?",
    lines: [
      "Een week geleden bezorgde ik je het rapport van je site.",
      "Als je het zelf hebt opgepakt: top! Als sommige fixes je hoofdpijn geven, ik kan ze voor je oplossen — gewoon een eerlijk uurtarief of een vast prijsje per fix.",
      "Antwoord op deze mail met welk punt je dwarszit — ik geef je een schatting binnen 24u.",
    ],
    cta: "Bekijk mijn rapport",
  },
  fr: {
    subject: "Besoin d'aide pour corriger les problèmes du rapport ?",
    eyebrow: "Site Health Check — semaine plus tard",
    title: "Besoin d'aide pour corriger les points trouvés ?",
    lines: [
      "Il y a une semaine, je vous ai livré le rapport de votre site.",
      "Si vous l'avez pris en main : super ! Si certaines corrections vous causent des maux de tête, je peux les faire pour vous — taux horaire honnête ou forfait par correction.",
      "Répondez à ce mail avec le point qui coince — je vous donne une estimation sous 24h.",
    ],
    cta: "Voir mon rapport",
  },
  en: {
    subject: "Need help fixing the issues in your report?",
    eyebrow: "Site Health Check — week later",
    title: "Need help fixing the found issues?",
    lines: [
      "A week ago I delivered your site report.",
      "If you've handled it: great! If some fixes are giving you headaches, I can do them for you — honest hourly rate or flat fee per fix.",
      "Reply to this mail with the item that's blocking you — estimate within 24h.",
    ],
    cta: "View my report",
  },
} as const;

async function sendFollowup(
  hc: Hc,
  variant: "3d" | "7d",
): Promise<boolean> {
  const lang = (hc.locale === "fr"
    ? "fr"
    : hc.locale === "en"
      ? "en"
      : "nl") as "nl" | "fr" | "en";
  const t = variant === "3d" ? T3[lang] : T7[lang];
  const portal = `${siteUrl}/${lang}/portail/health-check/${hc.scan_token}`;
  return await sendMail(hc.email, {
    subject: t.subject,
    html: portalEmailHtml({
      locale: lang,
      eyebrow: t.eyebrow,
      title: t.title,
      bodyLines: [...t.lines],
      ctaLabel: t.cta,
      ctaHref: portal,
    }),
  });
}

export async function GET(req: NextRequest) {
  if (
    !monitorConfigured ||
    !cronSecret ||
    req.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!resendApiKey) {
    return NextResponse.json({ error: "resend missing" }, { status: 500 });
  }
  const db = getSupabaseAdmin();
  const now = Date.now();
  const cutoff3 = new Date(now - 3 * DAY).toISOString();
  const cutoff7 = new Date(now - 7 * DAY).toISOString();
  const cutoff14 = new Date(now - 14 * DAY).toISOString();

  // 3-dag follow-up
  const { data: d3 } = await db
    .from("health_checks")
    .select("id, email, website, locale, scan_token, paid_at")
    .eq("status", "betaald")
    .lt("paid_at", cutoff3)
    .gt("paid_at", cutoff7)
    .is("followup_3d_sent_at", null)
    .limit(50);
  let sent3 = 0;
  for (const hc of (d3 as Hc[] | null) ?? []) {
    const ok = await sendFollowup(hc, "3d");
    if (ok) {
      sent3++;
      await db
        .from("health_checks")
        .update({ followup_3d_sent_at: new Date().toISOString() })
        .eq("id", hc.id);
    }
  }

  // 7-dag follow-up
  const { data: d7 } = await db
    .from("health_checks")
    .select("id, email, website, locale, scan_token, paid_at")
    .eq("status", "betaald")
    .lt("paid_at", cutoff7)
    .gt("paid_at", cutoff14)
    .is("followup_7d_sent_at", null)
    .limit(50);
  let sent7 = 0;
  for (const hc of (d7 as Hc[] | null) ?? []) {
    const ok = await sendFollowup(hc, "7d");
    if (ok) {
      sent7++;
      await db
        .from("health_checks")
        .update({ followup_7d_sent_at: new Date().toISOString() })
        .eq("id", hc.id);
    }
  }

  return NextResponse.json({ ok: true, sent3, sent7 });
}
