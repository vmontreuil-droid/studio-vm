// Persoonlijke outreach-mail per prospect. Looks like a real one-to-one
// mail — geen marketing-template, geen groot logo. Bevat hun naam,
// score, top-3 issues, link naar hun persoonlijk scan-portaal en een
// nette opt-out-voet.

import type { OutreachConfig } from "@/lib/admin/outreach";

type Tone = "nl" | "fr" | "en";

type Prospect = {
  name: string;
  website: string;
  scanScore: number;
  scanGrade: string;
  scanIssues: string[];
  scanToken: string;
  land: "be" | "fr" | "uk";
};

const T = {
  nl: {
    subject: (name: string, score: number) =>
      `Quick check op ${name} — score ${score}/100`,
    greeting: "Beste",
    intro: (host: string) =>
      `Ik liep vanochtend even over <strong>${host}</strong> en zag een paar dingen die binnen een halve dag aangepakt kunnen worden:`,
    portalCta: "Volledig rapport hier",
    softNote:
      "Geen verkooppraat — als je iemand intern hebt die dit oppakt, perfect. Anders kunnen we het samen oplossen.",
    signOff: "Hartelijke groet",
    unsub:
      "Geen interesse? Klik hier — dan haal ik je uit mijn lijst (eenmalig, geen vervolg):",
  },
  fr: {
    subject: (name: string, score: number) =>
      `Vérification rapide de ${name} — score ${score}/100`,
    greeting: "Bonjour",
    intro: (host: string) =>
      `J'ai parcouru votre site <strong>${host}</strong> ce matin et j'ai relevé quelques points qui peuvent être traités rapidement :`,
    portalCta: "Rapport complet ici",
    softNote:
      "Pas de discours commercial — si vous avez quelqu'un en interne pour ça, parfait. Sinon, on peut le faire ensemble.",
    signOff: "Cordialement",
    unsub:
      "Pas intéressé(e) ? Cliquez ici et je vous retire de ma liste (une seule fois, pas de suivi) :",
  },
  en: {
    subject: (name: string, score: number) =>
      `Quick check on ${name} — score ${score}/100`,
    greeting: "Hi",
    intro: (host: string) =>
      `I ran a quick check on <strong>${host}</strong> this morning and noticed a few things that can be addressed within half a day:`,
    portalCta: "Full report here",
    softNote:
      "No sales pitch — if you have someone in-house who can handle this, great. Otherwise, happy to help.",
    signOff: "Best regards",
    unsub:
      "Not interested? Click here and I'll remove you from my list (one-off, no follow-ups):",
  },
} as const;

export type OutreachMail = {
  subject: string;
  html: string;
  text: string;
  from: string;
};

const FONT =
  "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";

export function buildOutreachMail(
  p: Prospect,
  cfg: OutreachConfig,
  lang: Tone,
  variant: "first" | "followup" = "first",
): OutreachMail {
  const t = T[lang];
  const host = p.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const portal = `${process.env.NEXT_PUBLIC_SITE_URL || "https://studio-vm.be"}/${lang}/portail/scan/${p.scanToken}`;
  const unsub = `${process.env.NEXT_PUBLIC_SITE_URL || "https://studio-vm.be"}/api/outreach/unsubscribe?t=${p.scanToken}`;

  const issuesHtml = p.scanIssues
    .slice(0, 3)
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join("");
  const issuesTxt = p.scanIssues
    .slice(0, 3)
    .map((i, k) => `${k + 1}. ${i}`)
    .join("\n");

  const subject =
    variant === "first"
      ? t.subject(host, p.scanScore)
      : lang === "nl"
        ? `Re: ${t.subject(host, p.scanScore)}`
        : lang === "fr"
          ? `Re: ${t.subject(host, p.scanScore)}`
          : `Re: ${t.subject(host, p.scanScore)}`;

  const greeting =
    variant === "first"
      ? `<p style="margin:0 0 14px;font:400 15px/1.55 ${FONT};color:#1c1917">${t.greeting},</p>`
      : "";

  const introBlock =
    variant === "first"
      ? `<p style="margin:0 0 14px;font:400 15px/1.55 ${FONT};color:#1c1917">${t.intro(host)}</p>
       <ol style="margin:0 0 18px;padding-left:22px;font:400 15px/1.7 ${FONT};color:#1c1917">${issuesHtml}</ol>`
      : `<p style="margin:0 0 14px;font:400 15px/1.55 ${FONT};color:#1c1917">${followupIntro(lang, host)}</p>`;

  const html = `<!doctype html><html><body style="margin:0;background:#fff">
<div style="max-width:560px;margin:24px auto;padding:0 16px">
  ${greeting}
  ${introBlock}
  <p style="margin:0 0 18px;font:400 15px/1.55 ${FONT}">
    <a href="${portal}" style="color:#e08214;font-weight:600;text-decoration:underline">${t.portalCta} →</a>
  </p>
  <p style="margin:0 0 18px;font:400 14px/1.55 ${FONT};color:#57534e">${t.softNote}</p>
  <p style="margin:18px 0 4px;font:400 15px/1.55 ${FONT};color:#1c1917">${t.signOff},</p>
  <p style="margin:0;font:400 15px/1.55 ${FONT};color:#1c1917">${escapeHtml(cfg.senderName)} — <a href="https://studio-vm.be" style="color:#1c1917;text-decoration:none">studio-vm.be</a></p>
  <p style="margin:36px 0 0;padding-top:14px;border-top:1px solid #f0eeec;font:400 11px/1.55 ${FONT};color:#a8a29e">
    ${t.unsub} <a href="${unsub}" style="color:#a8a29e">${unsub}</a>
  </p>
</div></body></html>`;

  const text =
    (variant === "first"
      ? `${t.greeting},\n\n${stripTags(t.intro(host))}\n\n${issuesTxt}\n\n`
      : `${stripTags(followupIntro(lang, host))}\n\n`) +
    `${t.portalCta}: ${portal}\n\n${t.softNote}\n\n${t.signOff},\n${cfg.senderName} — studio-vm.be\n\n${t.unsub} ${unsub}\n`;

  return {
    subject,
    html,
    text,
    from: `${cfg.senderName} <${cfg.senderEmail}>`,
  };
}

function followupIntro(lang: Tone, host: string): string {
  if (lang === "nl") {
    return `Niet zeker of mijn vorige mail je bereikte — daarom kort: ik had drie verbeterpunten genoteerd op <strong>${host}</strong>. Geen tijd of interesse? Laat het me weten, dan haal ik je uit mijn lijst.`;
  }
  if (lang === "fr") {
    return `Pas sûr que mon premier mail vous soit parvenu — pour rappel : j'avais relevé trois points d'amélioration sur <strong>${host}</strong>. Pas le temps ou pas intéressé(e) ? Faites-le-moi savoir, je vous retire de ma liste.`;
  }
  return `Not sure my first email reached you — quick reminder: I had three improvement points on <strong>${host}</strong>. No time or not interested? Let me know and I'll remove you from my list.`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}
