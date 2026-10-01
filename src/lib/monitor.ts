import { randomBytes } from "node:crypto";
import { resendApiKey, resendFrom, siteUrl } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n/config";
import type { ScanResult } from "@/app/actions/scan";

export type MonitorRow = {
  id: string;
  url: string;
  email: string;
  locale: Locale;
  token: string;
  active: boolean;
  last_scan_at: string | null;
};

export type ScanRow = {
  scanned_at: string;
  score: number | null;
  grade: string | null;
  stack: string | null;
  cert_days_left: number | null;
  critical_count: number | null;
};

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());
}

export function snapshotOf(r: Extract<ScanResult, { ok: true }>) {
  return {
    score: r.score,
    grade: r.grade,
    stack: r.stack,
    cert_days_left: r.tls?.daysLeft ?? null,
    critical_count: r.findings.filter((f) => f.severity === "critical").length,
  };
}

// Wat is er veranderd t.o.v. de vorige scan? Bepaalt of we mailen.
export function diffAlert(
  locale: Locale,
  prev: ScanRow | null,
  cur: ReturnType<typeof snapshotOf>,
): string[] {
  const L = ALERTS[locale];
  const out: string[] = [];
  if (cur.cert_days_left !== null && cur.cert_days_left < 21)
    out.push(L.cert(cur.cert_days_left));
  if (prev && prev.score !== null && cur.score <= prev.score - 8)
    out.push(L.score(prev.score, cur.score));
  if (
    prev &&
    prev.critical_count !== null &&
    cur.critical_count > prev.critical_count
  )
    out.push(L.critical(prev.critical_count, cur.critical_count));
  if (prev && prev.grade && cur.grade !== prev.grade && gradeWorse(cur.grade, prev.grade))
    out.push(L.grade(prev.grade, cur.grade));
  return out;
}

function gradeWorse(now: string, before: string): boolean {
  return "ABCDEF".indexOf(now) > "ABCDEF".indexOf(before);
}

const ALERTS: Record<
  Locale,
  {
    cert: (d: number) => string;
    score: (a: number, b: number) => string;
    critical: (a: number, b: number) => string;
    grade: (a: string, b: string) => string;
  }
> = {
  nl: {
    cert: (d) =>
      d < 0
        ? "Je SSL-certificaat is verlopen — bezoekers krijgen nu een waarschuwing."
        : `Je SSL-certificaat verloopt over ${d} dagen.`,
    score: (a, b) => `Je score zakte van ${a} naar ${b}/100.`,
    critical: (a, b) => `Aantal kritieke punten steeg van ${a} naar ${b}.`,
    grade: (a, b) => `Je rapportcijfer ging van ${a} naar ${b}.`,
  },
  fr: {
    cert: (d) =>
      d < 0
        ? "Votre certificat SSL a expiré — les visiteurs voient un avertissement."
        : `Votre certificat SSL expire dans ${d} jours.`,
    score: (a, b) => `Votre score est passé de ${a} à ${b}/100.`,
    critical: (a, b) => `Le nombre de points critiques est passé de ${a} à ${b}.`,
    grade: (a, b) => `Votre note est passée de ${a} à ${b}.`,
  },
  en: {
    cert: (d) =>
      d < 0
        ? "Your SSL certificate has expired — visitors now see a warning."
        : `Your SSL certificate expires in ${d} days.`,
    score: (a, b) => `Your score dropped from ${a} to ${b}/100.`,
    critical: (a, b) => `Critical issues rose from ${a} to ${b}.`,
    grade: (a, b) => `Your grade went from ${a} to ${b}.`,
  },
  de: {
    cert: (d) =>
      d < 0
        ? "Ihr SSL-Zertifikat ist abgelaufen — Besucher sehen jetzt eine Warnung."
        : `Ihr SSL-Zertifikat läuft in ${d} Tagen ab.`,
    score: (a, b) => `Ihr Score ist von ${a} auf ${b}/100 gesunken.`,
    critical: (a, b) => `Die Anzahl kritischer Punkte ist von ${a} auf ${b} gestiegen.`,
    grade: (a, b) => `Ihre Bewertung hat sich von ${a} auf ${b} geändert.`,
  },
  es: {
    cert: (d) =>
      d < 0
        ? "Su certificado SSL ha caducado — los visitantes ven ahora una advertencia."
        : `Su certificado SSL caduca dentro de ${d} días.`,
    score: (a, b) => `Su puntuación bajó de ${a} a ${b}/100.`,
    critical: (a, b) => `Los puntos críticos aumentaron de ${a} a ${b}.`,
    grade: (a, b) => `Su calificación pasó de ${a} a ${b}.`,
  },
};

type Mail = { subject: string; html: string; replyTo?: string };

const T: Record<
  Locale,
  {
    confirmSubject: string;
    confirmBody: (url: string, link: string) => string;
    alertSubject: (host: string) => string;
    alertIntro: (host: string) => string;
    alertView: string;
    alertCta: string;
    alertUnsub: string;
    welcomeSubject: (host: string) => string;
    welcomeBody: (host: string, link: string) => string;
  }
> = {
  nl: {
    confirmSubject: "Bevestig je site-monitoring — Studio VM",
    confirmBody: (url, link) =>
      `Je vroeg om ${url} wekelijks te laten opvolgen. Bevestig met één klik en je krijgt enkel een mail wanneer er iets verandert (score zakt, certificaat verloopt, nieuwe kritieke punten).`,
    alertSubject: (h) => `Er veranderde iets aan ${h}`,
    alertIntro: (h) => `Bij de wekelijkse controle van ${h} viel dit op:`,
    alertView: "Bekijk de volledige historiek",
    alertCta: "Laat dit door mij oplossen",
    alertUnsub: "Geen mails meer",
    welcomeSubject: (h) => `Monitoring actief voor ${h}`,
    welcomeBody: (h, link) =>
      `Top — ${h} wordt nu wekelijks gecontroleerd. Je hoort enkel iets als er een echt probleem opduikt. Je historiek staat hier:`,
  },
  fr: {
    confirmSubject: "Confirmez le suivi de votre site — Studio VM",
    confirmBody: (url, link) =>
      `Vous avez demandé un suivi hebdomadaire de ${url}. Confirmez en un clic et vous ne recevrez un e-mail que si quelque chose change (baisse de score, certificat expirant, nouveaux points critiques).`,
    alertSubject: (h) => `Quelque chose a changé sur ${h}`,
    alertIntro: (h) => `Lors du contrôle hebdomadaire de ${h}, ceci est ressorti :`,
    alertView: "Voir l'historique complet",
    alertCta: "Faites-moi corriger ça",
    alertUnsub: "Ne plus recevoir d'e-mails",
    welcomeSubject: (h) => `Suivi actif pour ${h}`,
    welcomeBody: (h, link) =>
      `Parfait — ${h} est désormais contrôlé chaque semaine. Vous n'aurez de nouvelles qu'en cas de vrai problème. Votre historique :`,
  },
  en: {
    confirmSubject: "Confirm your site monitoring — Studio VM",
    confirmBody: (url, link) =>
      `You asked to monitor ${url} weekly. Confirm in one click and you'll only get an email when something changes (score drop, expiring certificate, new critical issues).`,
    alertSubject: (h) => `Something changed on ${h}`,
    alertIntro: (h) => `During the weekly check of ${h}, this stood out:`,
    alertView: "View the full history",
    alertCta: "Have me fix this",
    alertUnsub: "Stop emails",
    welcomeSubject: (h) => `Monitoring active for ${h}`,
    welcomeBody: (h, link) =>
      `Great — ${h} is now checked weekly. You'll only hear from us if a real problem shows up. Your history:`,
  },
  de: {
    confirmSubject: "Bestätigen Sie Ihr Website-Monitoring — Studio VM",
    confirmBody: (url, link) =>
      `Sie haben eine wöchentliche Überwachung von ${url} angefragt. Bestätigen Sie mit einem Klick — Sie erhalten nur dann eine E-Mail, wenn sich etwas ändert (Score sinkt, Zertifikat läuft ab, neue kritische Punkte).`,
    alertSubject: (h) => `Bei ${h} hat sich etwas geändert`,
    alertIntro: (h) => `Bei der wöchentlichen Prüfung von ${h} ist Folgendes aufgefallen:`,
    alertView: "Vollständigen Verlauf ansehen",
    alertCta: "Lassen Sie mich das beheben",
    alertUnsub: "Keine E-Mails mehr",
    welcomeSubject: (h) => `Monitoring aktiv für ${h}`,
    welcomeBody: (h, link) =>
      `Prima — ${h} wird jetzt wöchentlich geprüft. Sie hören nur von uns, wenn ein echtes Problem auftritt. Ihr Verlauf:`,
  },
  es: {
    confirmSubject: "Confirme la monitorización de su sitio — Studio VM",
    confirmBody: (url, link) =>
      `Ha solicitado un seguimiento semanal de ${url}. Confirme con un clic y solo recibirá un correo cuando algo cambie (baja la puntuación, caduca el certificado, nuevos puntos críticos).`,
    alertSubject: (h) => `Algo ha cambiado en ${h}`,
    alertIntro: (h) => `En la revisión semanal de ${h} se detectó lo siguiente:`,
    alertView: "Ver el historial completo",
    alertCta: "Deje que lo solucione yo",
    alertUnsub: "No recibir más correos",
    welcomeSubject: (h) => `Monitorización activa para ${h}`,
    welcomeBody: (h, link) =>
      `Perfecto — ${h} se revisa ahora cada semana. Solo tendrá noticias nuestras si surge un problema real. Su historial:`,
  },
};

function shell(body: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.6">
${body}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0"/>
<p style="font-size:12px;color:#888">Studio VM · webontwikkeling · West-Vlaanderen, België · <a href="${siteUrl}" style="color:#888">studio-vm.be</a></p>
</div>`;
}

function host(u: string): string {
  try {
    return new URL(u).hostname;
  } catch {
    return u;
  }
}

export function confirmMail(
  locale: Locale,
  url: string,
  token: string,
): Mail {
  const t = T[locale];
  const link = `${siteUrl}/api/monitor/confirm?token=${token}`;
  return {
    subject: t.confirmSubject,
    html: shell(
      `<p>${t.confirmBody(url, link)}</p>
<p style="margin:24px 0"><a href="${link}" style="background:#111;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${
        { nl: "Bevestigen", fr: "Confirmer", en: "Confirm", de: "Bestätigen", es: "Confirmar" }[locale]
      }</a></p>`,
    ),
  };
}

export function welcomeMail(
  locale: Locale,
  url: string,
  token: string,
): Mail {
  const t = T[locale];
  const link = `${siteUrl}/${locale}/scan/historiek/${token}`;
  return {
    subject: t.welcomeSubject(host(url)),
    html: shell(
      `<p>${t.welcomeBody(host(url), link)}</p><p><a href="${link}" style="color:#b45309">${link}</a></p>`,
    ),
  };
}

export function alertMail(
  locale: Locale,
  url: string,
  token: string,
  changes: string[],
): Mail {
  const t = T[locale];
  const hist = `${siteUrl}/${locale}/scan/historiek/${token}`;
  const contact = `${siteUrl}/${locale}/#contact`;
  const unsub = `${siteUrl}/api/monitor/unsubscribe?token=${token}`;
  return {
    subject: t.alertSubject(host(url)),
    html: shell(
      `<p>${t.alertIntro(host(url))}</p>
<ul style="padding-left:18px">${changes.map((c) => `<li style="margin:6px 0">${c}</li>`).join("")}</ul>
<p style="margin:24px 0">
  <a href="${contact}" style="background:#111;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${t.alertCta}</a>
  &nbsp;&nbsp;<a href="${hist}" style="color:#b45309">${t.alertView}</a>
</p>
<p style="font-size:12px;color:#888"><a href="${unsub}" style="color:#888">${t.alertUnsub}</a></p>`,
    ),
  };
}

// Resend via REST — geen SDK-afhankelijkheid. Zonder key: stil overslaan.
export async function sendMail(to: string, mail: Mail): Promise<boolean> {
  if (!resendApiKey) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [to],
        subject: mail.subject,
        html: mail.html,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      console.error("[resend] verzenden mislukt:", r.status, detail);
    }
    return r.ok;
  } catch (e) {
    console.error("[resend] netwerk-error:", e);
    return false;
  }
}
