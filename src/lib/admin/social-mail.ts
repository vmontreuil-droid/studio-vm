// Weekoverzicht van de contentmachine, naar de eigen inbox.
//
// Lichte huisstijl (portalEmailHtml), amber, nooit donker. Alle tekst uit de
// databank wordt ge-escaped. Berichten die op een akkoord wachten krijgen twee
// knoppen ("Goedkeuren" / "Overslaan"): die openen eerst een bevestigings-
// pagina (GET verandert niets), pas de knop daar (POST, eenmalige sleutel)
// past de status aan. Linkscanners en voorladers kunnen dus niets goedkeuren.

import { portalEmailHtml } from "@/lib/email";
import { siteUrl } from "@/lib/supabase/config";
import { socialBeeldPad, type SocialFormaat } from "@/lib/social/beeld-url";
import { KANAAL_LABEL, POST_TYPE_LABEL, TAAL_LABEL, nieuweStatus, type PostType } from "./social-templates";
import type { GoedkeurLinks, WeekBericht } from "./social-generator";

type Mail = { subject: string; html: string };

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
// Knop "Goedkeuren": steen, niet oranje. Het gedeelde sjabloon (email.ts)
// heeft al zijn eigen oranje voor logo, kicker en hoofdknop; een tweede tint
// oranje ernaast oogt rommelig, en wit op dat sjabloon-oranje leest slecht.
const KNOP = "#1c1917";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Bijschrift als één regel, zonder de kop die er soms als eerste regel in staat. */
export function uittreksel(titel: string, body: string | null | undefined, max: number): string {
  let t = (body ?? "").trim();
  const eerste = t.split("\n")[0] ?? "";
  if (titel && eerste.startsWith(titel)) t = t.slice(eerste.length);
  t = t.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function formaatVan(b: WeekBericht): SocialFormaat {
  if (b.post_kind === "story" || b.post_kind === "reel") return "story";
  if (b.platform === "google") return "gbp";
  return "portrait";
}

const MAAT: Record<SocialFormaat, { w: number; h: number }> = {
  portrait: { w: 72, h: 90 },
  story: { w: 56, h: 100 },
  gbp: { w: 88, h: 66 },
  square: { w: 80, h: 80 },
  og: { w: 96, h: 50 },
};

function moment(iso: string | null): string {
  if (!iso) return "zonder datum";
  return new Date(iso).toLocaleString("nl-BE", {
    timeZone: "Europe/Brussels",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusChip(b: WeekBericht): string {
  const s = nieuweStatus(b.status);
  const [label, bg, fg] =
    s === "concept" && b.goedkeuring_nodig
      ? ["Wacht op akkoord", "#fde68a", "#451a03"]
      : s === "goedgekeurd"
        ? ["Goedgekeurd", "#bbf7d0", "#052e16"]
        : s === "gepland"
          ? ["Gepland bij platform", "#bae6fd", "#082f49"]
          : s === "gepubliceerd"
            ? ["Gepubliceerd", "#86efac", "#052e16"]
            : s === "mislukt"
              ? ["Mislukt", "#fecaca", "#450a0a"]
              : s === "overgeslagen"
                ? ["Overgeslagen", "#e7e5e4", "#292524"]
                : ["Concept", "#e7e5e4", "#292524"];
  return `<span style="display:inline-block;padding:3px 9px;border-radius:999px;background:${bg};color:${fg};font:700 11px/1.4 ${FONT}">${label}</span>`;
}

function berichtHtml(b: WeekBericht, links?: GoedkeurLinks): string {
  const f = formaatVan(b);
  const m = MAAT[f];
  const pad = b.media?.beelden?.[f] ?? socialBeeldPad(b.id, f, b.media?.v);
  const soort = b.post_type && b.post_type in POST_TYPE_LABEL ? POST_TYPE_LABEL[b.post_type as PostType] : b.post_kind === "story" ? "Story" : "Bericht";
  const taal = b.taal && b.taal in TAAL_LABEL ? b.taal.toUpperCase() : "";
  const plaats = b.post_kind === "reel" ? "Reel" : b.post_kind === "story" ? "Story" : b.platform === "google" ? "Google" : "Bericht";
  const kanalen = (Array.isArray(b.kanalen) && b.kanalen.length ? b.kanalen : [b.platform])
    .map((k) => KANAAL_LABEL[k] ?? k)
    .join(" · ");
  const kort = uittreksel(b.title, b.body, 200);
  const knoppen = links
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 0;border-collapse:separate"><tr>
<td bgcolor="${KNOP}" style="background:${KNOP};border-radius:8px"><a href="${escapeHtml(links.goedkeuren)}" style="display:inline-block;padding:10px 16px;font:700 14px/1 ${FONT};color:#ffffff;text-decoration:none">Goedkeuren</a></td>
<td width="8" style="width:8px"></td>
<td style="border:1px solid #d6d3d1;border-radius:8px;background:#ffffff"><a href="${escapeHtml(links.overslaan)}" style="display:inline-block;padding:9px 15px;font:700 14px/1 ${FONT};color:#44403c;text-decoration:none">Overslaan</a></td>
</tr></table>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 12px;border:1px solid #e7e5e4;border-radius:12px;background:#fafaf9">
<tr>
<td width="${m.w}" valign="top" style="width:${m.w}px;padding:12px 0 12px 12px"><img src="${escapeHtml(siteUrl + pad)}" width="${m.w}" height="${m.h}" alt="" style="display:block;width:${m.w}px;height:${m.h}px;border-radius:7px;background:#e7e5e4;object-fit:cover"></td>
<td valign="top" style="padding:12px 14px">
<p style="margin:0 0 6px;font:700 11px/1.4 ${MONO};letter-spacing:.06em;text-transform:uppercase;color:#78716c">${escapeHtml(moment(b.scheduled_for))} · ${escapeHtml(plaats)} · ${escapeHtml(soort)}${taal ? ` · ${taal}` : ""}</p>
<p style="margin:0 0 6px;font:700 16px/1.35 ${FONT};color:#1c1917">${escapeHtml(b.title)}</p>
${kort ? `<p style="margin:0 0 8px;font:400 13px/1.55 ${FONT};color:#57534e">${escapeHtml(kort)}</p>` : ""}
<p style="margin:0 0 8px;font:400 12px/1.5 ${FONT};color:#78716c">${escapeHtml(kanalen)}</p>
${statusChip(b)}
${knoppen}
</td>
</tr>
</table>`;
}

// =====================================================================
// Melding van de publisher (hoogstens één per dag, zie lib/social/publish)
// =====================================================================

/** Eén kanaal waarop een bericht niet uitging, of een verbindingsprobleem. */
export type PublicatieFout = { titel: string; kanaal: string; fout: string; op: string; postId?: string | null };

/**
 * Lichte mail naar de eigenaar wanneer publiceren mislukt of Buffer de
 * API-sleutel weigert. Alle tekst ge-escaped (foutmeldingen komen van buiten).
 */
export function buildPublicatieMeldingMail(o: { fouten: PublicatieFout[]; sleutel?: string | null }): Mail {
  const n = o.fouten.length;
  const titel = o.sleutel
    ? "Buffer weigert de API-sleutel"
    : `${n === 1 ? "Eén publicatie" : `${n} publicaties`} niet gelukt`;
  const regels: string[] = [];
  if (o.sleutel) {
    regels.push(
      "De publisher kon niet bij Buffer: de API-sleutel is ingetrokken of verlopen. Tot dat opgelost is, gaat er niets uit; goedgekeurde berichten blijven wachten (tot 48 uur na hun tijdstip).",
      "Oplossen: maak in Buffer een nieuwe sleutel (Instellingen → API), vervang <strong>BUFFER_API_KEY</strong> in Vercel (Production) en deploy opnieuw. Druk daarna in het beheer op <strong>Verbinding testen</strong>.",
    );
  } else {
    regels.push(
      "Deze berichten gingen niet (of niet overal) uit. De andere kanalen zijn wel gelukt. Kijk de reden na; na een aanpassing kunt u in het beheer <strong>Opnieuw proberen</strong> kiezen.",
    );
  }
  const rijen = o.fouten
    .slice(0, 20)
    .map(
      (f) => `<tr>
<td valign="top" style="padding:10px 12px 10px 0;border-top:1px solid #e7e5e4;font:700 12px/1.5 ${MONO};letter-spacing:.04em;text-transform:uppercase;color:#78716c;white-space:nowrap">${escapeHtml(f.kanaal)}</td>
<td valign="top" style="padding:10px 0;border-top:1px solid #e7e5e4">
<p style="margin:0 0 3px;font:700 14px/1.4 ${FONT};color:#1c1917">${escapeHtml(f.titel)}</p>
<p style="margin:0;font:400 13px/1.5 ${FONT};color:#57534e">${escapeHtml(f.fout)}</p>
<p style="margin:3px 0 0;font:400 12px/1.5 ${FONT};color:#a8a29e">${escapeHtml(moment(f.op))}</p>
</td>
</tr>`,
    )
    .join("");
  const lijst = rijen
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 0;border-collapse:collapse;border-bottom:1px solid #e7e5e4">${rijen}</table>`
    : "";
  const html = portalEmailHtml({
    locale: "nl",
    eyebrow: "Social media · publiceren",
    title: escapeHtml(titel),
    bodyLines: regels,
    extraHtml: lijst,
    ctaLabel: "Open Kanalen",
    ctaHref: `${siteUrl}/admin/social#kanalen`,
    footnote:
      "U krijgt deze melding hoogstens één keer per dag; wat intussen nog misloopt, komt in de volgende. Er wordt nooit iets dubbel gepost: een kanaal dat al gelukt is, wordt overgeslagen.",
  });
  return {
    subject: o.sleutel ? "Social media: Buffer weigert de API-sleutel" : `Social media: ${titel.toLowerCase()}`,
    html,
  };
}

/** Weekoverzicht met miniaturen; wachtende berichten met hun goedkeurknoppen. */
export function buildSocialDigestMail(o: {
  week: string;
  berichten: WeekBericht[];
  links: Map<string, GoedkeurLinks>;
  allesAutomatisch: boolean;
}): Mail {
  const weekNr = Number(o.week.slice(-2));
  const zichtbaar = o.berichten.filter((b) => nieuweStatus(b.status) !== "overgeslagen");
  const wachtend = zichtbaar.filter((b) => nieuweStatus(b.status) === "concept" && b.goedkeuring_nodig);
  const n = zichtbaar.length;
  const titel =
    wachtend.length > 0
      ? `${n} ${n === 1 ? "bericht" : "berichten"} gepland, ${wachtend.length} ${wachtend.length === 1 ? "wacht" : "wachten"} op akkoord`
      : `${n} ${n === 1 ? "bericht staat" : "berichten staan"} klaar voor week ${weekNr}`;
  const regels = [
    "Elke maandag plant de contentmachine de week. Hieronder ziet u wat er wanneer verschijnt en op welke kanalen.",
  ];
  if (wachtend.length) {
    regels.push(
      `<strong>${wachtend.length === 1 ? "Eén bericht wacht" : `${wachtend.length} berichten wachten`} op uw akkoord.</strong> Een realisatie kan klantgegevens tonen: kijk het beeld na en kies Goedkeuren of Overslaan. Zonder akkoord wordt het niet gepubliceerd.`,
    );
  } else if (o.allesAutomatisch) {
    regels.push("De schakelaar 'Alles automatisch' staat aan: ook realisaties gaan zonder akkoord uit.");
  } else {
    regels.push("Er hoeft niets goedgekeurd te worden: deze berichten gaan vanzelf uit op hun tijdstip.");
  }
  const lijst = zichtbaar.map((b) => berichtHtml(b, o.links.get(b.id))).join("");
  const html = portalEmailHtml({
    locale: "nl",
    eyebrow: `Social media · week ${weekNr}`,
    title: escapeHtml(titel),
    bodyLines: regels,
    extraHtml: `<div style="margin:6px 0 0">${lijst}</div>`,
    ctaLabel: "Open de wachtrij",
    ctaHref: `${siteUrl}/admin/social/wachtrij?week=${encodeURIComponent(o.week)}`,
    footnote:
      "De knoppen veranderen enkel de status. Publiceren gebeurt pas op het geplande tijdstip en kan in de wachtrij nog tegengehouden worden. Elke knop werkt één keer en 7 dagen lang, en opent eerst een bevestigingspagina.",
  });
  return {
    subject: wachtend.length
      ? `Social media week ${weekNr}: ${wachtend.length} ${wachtend.length === 1 ? "bericht wacht" : "berichten wachten"} op akkoord`
      : `Social media week ${weekNr}: ${n} ${n === 1 ? "bericht" : "berichten"} gepland`,
    html,
  };
}
