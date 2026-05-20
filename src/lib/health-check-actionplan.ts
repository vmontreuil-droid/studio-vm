// Auto-actieplan-generator voor Site Health Check.
// Neemt de scan-bevindingen en transformeert ze naar een
// gestructureerd geschreven actieplan met prioriteit, uitleg-
// waarom en concrete fix-stappen. NL/FR/EN.

import type { ScanResult } from "@/app/actions/scan";
import { FIND, type Txt } from "@/lib/scan-findings";

export type ActionItem = {
  priority: "kritiek" | "belangrijk" | "optioneel";
  cat: string;
  title: string;
  why: string;
  fix: string;
  impact: string; // korte impactschatting in mensentaal
};

const PRIO_ORDER = { kritiek: 0, belangrijk: 1, optioneel: 2 } as const;

// Per categorie + ernst → impactschatting in normaal Nederlands.
function impactFor(
  lang: "nl" | "fr" | "en",
  cat: string,
  sev: "critical" | "warning",
): string {
  const NL: Record<string, [string, string]> = {
    speed: [
      "Bezoekers haken af vóór je site geladen is — direct verlies aan leads/sales.",
      "Trage pagina's verlagen Google-ranking en mobile-conversie.",
    ],
    seo: [
      "Google vindt of begrijpt je pagina's niet goed — minder organisch verkeer.",
      "Kleine SEO-gaten waardoor je niet rankt op je merkterm.",
    ],
    mobile: [
      "Smartphones (60-70% van bezoekers) krijgen een kapotte ervaring.",
      "Mobiel werkt maar niet optimaal — bezoekers haken eerder af.",
    ],
    security: [
      "Risico op site-onderbreking, hack, of e-mail die in spam komt.",
      "Verhoogt kans op spam-classificatie of vertrouwens-verlies.",
    ],
    platform: [
      "Verouderd platform — risico op crashes of beveiligingslekken.",
      "Platform-keuze beperkt wat je makkelijk kan aanpassen.",
    ],
  };
  const FR: Record<string, [string, string]> = {
    speed: [
      "Les visiteurs partent avant le chargement — perte directe de leads.",
      "Pages lentes = baisse de classement Google et conversion mobile.",
    ],
    seo: [
      "Google ne trouve/comprend pas vos pages — moins de trafic organique.",
      "Petits manques SEO qui empêchent de ranker même sur votre nom.",
    ],
    mobile: [
      "Les smartphones (60-70% du trafic) reçoivent une expérience cassée.",
      "Le mobile fonctionne mais pas optimalement.",
    ],
    security: [
      "Risque de panne, hack, ou mails en spam.",
      "Augmente le risque de classification spam.",
    ],
    platform: [
      "Plateforme dépassée — risque de crash ou faille de sécurité.",
      "Le choix de plateforme limite ce qu'on peut adapter facilement.",
    ],
  };
  const EN: Record<string, [string, string]> = {
    speed: [
      "Visitors leave before the page loads — direct lead loss.",
      "Slow pages lower Google ranking and mobile conversion.",
    ],
    seo: [
      "Google doesn't find/understand your pages — less organic traffic.",
      "Small SEO gaps that prevent ranking on your brand term.",
    ],
    mobile: [
      "Phones (60-70% of visitors) get a broken experience.",
      "Mobile works but not optimally.",
    ],
    security: [
      "Risk of downtime, hack, or emails landing in spam.",
      "Increases chance of spam classification.",
    ],
    platform: [
      "Outdated platform — risk of crash or security hole.",
      "Platform choice limits what's easy to change.",
    ],
  };
  const dict = lang === "fr" ? FR : lang === "en" ? EN : NL;
  const pair = dict[cat] ?? dict.platform;
  return sev === "critical" ? pair[0] : pair[1];
}

export function buildActionPlan(
  scan: ScanResult,
  lang: "nl" | "fr" | "en" = "nl",
): ActionItem[] {
  if (!scan.ok) return [];
  const dict: Record<string, Txt> = FIND[lang] ?? FIND.nl;

  const items: ActionItem[] = [];
  for (const f of scan.findings) {
    if (f.severity !== "critical" && f.severity !== "warning") continue;
    const t = dict[f.key];
    if (!t) continue;
    items.push({
      priority: f.severity === "critical" ? "kritiek" : "belangrijk",
      cat: f.cat,
      title: t.title,
      why: t.why,
      fix: t.fix,
      impact: impactFor(lang, f.cat, f.severity),
    });
  }
  // 'Good'-bevindingen markeren we als optionele bevestiging (max 3)
  for (const f of scan.findings) {
    if (f.severity !== "good") continue;
    const t = dict[f.key];
    if (!t) continue;
    if (items.filter((i) => i.priority === "optioneel").length >= 3) break;
    items.push({
      priority: "optioneel",
      cat: f.cat,
      title: t.title,
      why: t.why,
      fix: t.fix,
      impact:
        lang === "nl"
          ? "Goed — laat dit zo, of bouw erop verder."
          : lang === "fr"
            ? "Bon — gardez-le ou construisez dessus."
            : "Good — keep it or build on it.",
    });
  }
  items.sort((a, b) => PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority]);
  return items.slice(0, 12);
}
