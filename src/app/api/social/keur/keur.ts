// Logica en HTML van /api/social/keur (los van route.ts, zodat ze ook met een
// nep-databank getest kan worden). Zie route.ts voor het waarom.

import { hashToken, isTokenVorm, type SocialMedia } from "@/lib/admin/social-generator";
import { KANAAL_LABEL, POST_TYPE_LABEL, nieuweStatus, type PostType } from "@/lib/admin/social-templates";
import { escapeHtml, uittreksel } from "@/lib/admin/social-mail";

/** Het deel van de Supabase-client dat hier gebruikt wordt. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KeurDb = { from: (tabel: string) => any };

type Actie = "goedkeuren" | "overslaan";
type Bericht = {
  id: string;
  title: string;
  body: string | null;
  scheduled_for: string | null;
  status: string;
  platform: string;
  post_kind: string | null;
  post_type?: string | null;
  taal?: string | null;
  kanalen?: string[] | null;
  media?: Partial<SocialMedia> | null;
};

export type Antwoord = { status: number; html: string };

const AMBER = "#b45309";

/**
 * Komt de POST van een pagina op deze site? Browsers zetten Origin en
 * Sec-Fetch-Site zelf (een script kan ze niet vervalsen). "Origin: null"
 * verschijnt bij een strikte referrerregel of een sandbox; dat aanvaarden we
 * enkel als de browser er zelf "same-origin" bij zet. Zonder beide headers
 * (oude browser of mail-app) beslist de eenmalige sleutel alleen.
 */
export function vanEigenSite(h: Headers): boolean {
  const site = h.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = h.get("origin");
  if (!origin) return true;
  if (origin === "null") return site === "same-origin";
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0]!.trim().toLowerCase();
  try {
    return new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

function wanneer(iso: string | null): string {
  if (!iso) return "zonder datum";
  return new Date(iso).toLocaleString("nl-BE", {
    timeZone: "Europe/Brussels",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Wanneer een goedgekeurd bericht uitgaat (HTML, ge-escaped). Eerlijk over
 * een tijdstip dat al voorbij is: de publisher neemt het dan bij zijn
 * volgende ronde mee. `vooraf` = op de bevestigingspagina, nog vóór de klik.
 */
export function tijdstipTekst(iso: string | null, nu: Date, vooraf: boolean): string {
  if (!iso) return "Het heeft nog geen tijdstip: kies er een in de wachtrij, anders gaat het niet uit.";
  const w = escapeHtml(wanneer(iso));
  if (Date.parse(iso) <= nu.getTime()) {
    return vooraf
      ? `Het geplande tijdstip (${w}) is al voorbij: na uw akkoord gaat het uit bij de volgende publicatieronde. Liever een ander moment? Verplaats het dan eerst in de wachtrij.`
      : `Het geplande tijdstip (${w}) was al voorbij: het gaat uit bij de volgende publicatieronde. In de wachtrij kunt u het nog verplaatsen of tegenhouden.`;
  }
  return `Het gaat uit op ${w}. Tot dan kunt u het in de wachtrij nog tegenhouden.`;
}

export function pagina(status: number, o: { eyebrow: string; titel: string; tekst: string; inhoud?: string }): Antwoord {
  const html = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="referrer" content="strict-origin">
<title>${escapeHtml(o.titel)} · Studio VM</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f4f4f5;color:#1c1917;font:400 16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main{max-width:560px;margin:0 auto;padding:32px 16px 48px}
.kaart{background:#fff;border:1px solid #e7e5e4;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.05);padding:28px 22px}
.merk{margin:0 0 22px;font-weight:800;font-size:44px;line-height:1;letter-spacing:-3px;color:#1c1917}
.merk span{color:${AMBER}}
.eyebrow{margin:0 0 8px;font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:${AMBER}}
h1{margin:0 0 12px;font-size:23px;line-height:1.3}
p{margin:0 0 14px;color:#44403c}
.voorbeeld{display:flex;gap:16px;align-items:flex-start;margin:18px 0 6px;padding:14px;border:1px solid #e7e5e4;border-radius:12px;background:#fafaf9}
.voorbeeld img{display:block;flex:none;width:112px;border-radius:9px;background:#e7e5e4;object-fit:cover}
.voorbeeld .t{min-width:0}
.meta{margin:0 0 6px;font:700 11px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.06em;text-transform:uppercase;color:#78716c}
.kop{margin:0 0 6px;font-weight:700;color:#1c1917;line-height:1.35}
.uittreksel{margin:0 0 8px;font-size:14px;line-height:1.55;color:#57534e;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.kanalen{margin:0;font-size:13px;color:#78716c}
form{margin:22px 0 0}
button{display:block;width:100%;padding:15px 18px;border:0;border-radius:10px;font:inherit;font-weight:700;cursor:pointer}
.ja{background:${AMBER};color:#fff}
.nee{background:#292524;color:#fff}
.voet{margin:18px 0 0;padding-top:16px;border-top:1px solid #f0eeec;font-size:13px;color:#78716c}
.voet a{color:${AMBER}}
@media (max-width:420px){.voorbeeld{flex-direction:column}.voorbeeld img{width:100%;max-width:220px}}
</style></head>
<body><main><div class="kaart">
<p class="merk">vm<span>.</span></p>
<p class="eyebrow">${escapeHtml(o.eyebrow)}</p>
<h1>${escapeHtml(o.titel)}</h1>
<p>${o.tekst}</p>
${o.inhoud ?? ""}
<p class="voet">Deze pagina hoort bij het weekoverzicht van de social media. <a href="/admin/social/wachtrij">Naar de wachtrij</a> (aanmelden nodig).</p>
</div></main></body></html>`;
  return { status, html };
}

export function voorbeeld(b: Bericht): string {
  const f = b.post_kind === "story" || b.post_kind === "reel" ? "story" : b.platform === "google" ? "gbp" : "portrait";
  const beeld = b.media?.beelden?.[f];
  const ratio = f === "story" ? "9/16" : f === "gbp" ? "4/3" : "4/5";
  const soort = b.post_type && b.post_type in POST_TYPE_LABEL ? POST_TYPE_LABEL[b.post_type as PostType] : "Bericht";
  const kanalen = (Array.isArray(b.kanalen) && b.kanalen.length ? b.kanalen : [b.platform]).map((k) => KANAAL_LABEL[k] ?? k).join(" · ");
  const tekst = uittreksel(b.title, b.body, 400);
  return `<div class="voorbeeld">
${beeld ? `<img src="${escapeHtml(beeld)}" alt="" style="aspect-ratio:${ratio}" onerror="this.style.display='none'">` : ""}
<div class="t">
<p class="meta">${escapeHtml(wanneer(b.scheduled_for))} · ${escapeHtml(soort)}${b.taal ? ` · ${escapeHtml(b.taal.toUpperCase())}` : ""}</p>
<p class="kop">${escapeHtml(b.title)}</p>
${tekst ? `<p class="uittreksel">${escapeHtml(tekst)}</p>` : ""}
<p class="kanalen">${escapeHtml(kanalen)}</p>
</div></div>`;
}

export const NIET_ACTIEF = {
  eyebrow: "Social media",
  titel: "Goedkeuren via mail is nog niet actief",
  tekst: "De databank mist nog migratie 0050. Keur het bericht goed in de wachtrij.",
};

export function ongeldig(reden: "onbekend" | "gebruikt" | "verlopen"): Antwoord {
  const tekst =
    reden === "gebruikt"
      ? "Deze knop werd al gebruikt. Elke knop in het weekoverzicht werkt één keer."
      : reden === "verlopen"
        ? "Deze knop is verlopen: ze werkt 7 dagen. Kijk het bericht na in de wachtrij."
        : "Deze link is onbekend of onvolledig. Gebruik de knop uit het weekoverzicht, of de wachtrij.";
  return pagina(reden === "onbekend" ? 404 : 410, {
    eyebrow: "Social media",
    titel: reden === "gebruikt" ? "Al gebruikt" : reden === "verlopen" ? "Verlopen" : "Onbekende link",
    tekst: escapeHtml(tekst),
  });
}

async function leesBericht(db: KeurDb, id: string): Promise<Bericht | null> {
  const { data } = await db.from("social_posts").select("*").eq("id", id).maybeSingle();
  return (data as Bericht | null) ?? null;
}

/** GET: bevestigingspagina. Verandert niets. */
export async function bevestiging(db: KeurDb, t: unknown, nu = new Date()): Promise<Antwoord> {
  if (!isTokenVorm(t)) return ongeldig("onbekend");
  const { data, error } = await db
    .from("goedkeur_tokens")
    .select("post_id, actie, expires_at, used_at")
    .eq("token_hash", hashToken(t))
    .maybeSingle();
  if (error) return pagina(503, NIET_ACTIEF);
  const rij = data as { post_id: string; actie: Actie; expires_at: string; used_at: string | null } | null;
  if (!rij) return ongeldig("onbekend");
  if (rij.used_at) return ongeldig("gebruikt");
  if (Date.parse(rij.expires_at) < nu.getTime()) return ongeldig("verlopen");
  const b = await leesBericht(db, rij.post_id);
  if (!b) return pagina(404, { eyebrow: "Social media", titel: "Bericht bestaat niet meer", tekst: "Het werd intussen verwijderd." });

  const ja = rij.actie === "goedkeuren";
  const huidig = nieuweStatus(b.status);
  const reedsUit = huidig === "gepland" || huidig === "gepubliceerd";
  return pagina(200, {
    eyebrow: ja ? "Social media · goedkeuren" : "Social media · overslaan",
    titel: ja ? "Dit bericht goedkeuren?" : "Dit bericht overslaan?",
    tekst: reedsUit
      ? "Dit bericht is al doorgegeven aan de kanalen; de status kan hier niet meer veranderen."
      : ja
        ? `Na uw bevestiging staat het op <strong>goedgekeurd</strong>. ${tijdstipTekst(b.scheduled_for, nu, true)}`
        : "Na uw bevestiging staat het op <strong>overgeslagen</strong> en wordt het niet gepubliceerd.",
    inhoud:
      voorbeeld(b) +
      (reedsUit
        ? ""
        : `<form method="post" action="/api/social/keur">
<input type="hidden" name="t" value="${escapeHtml(t)}">
<input type="hidden" name="bevestig" value="1">
<button type="submit" class="${ja ? "ja" : "nee"}">${ja ? "Ja, goedkeuren" : "Ja, overslaan"}</button>
</form>`),
  });
}

/** POST: de sleutel opeisen (één keer) en ENKEL de status aanpassen. */
export async function verwerk(db: KeurDb, t: unknown, bevestig: unknown, nu = new Date()): Promise<Antwoord> {
  if (!isTokenVorm(t) || bevestig !== "1") return ongeldig("onbekend");
  const iso = nu.toISOString();
  const hash = hashToken(t);
  // Eén UPDATE: wie hem eerst opeist, wint. Een tweede klik vindt niets meer.
  const { data: geclaimd, error } = await db
    .from("goedkeur_tokens")
    .update({ used_at: iso })
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", iso)
    .select("post_id, actie")
    .maybeSingle();
  if (error) return pagina(503, NIET_ACTIEF);
  const rij = geclaimd as { post_id: string; actie: Actie } | null;
  if (!rij) {
    const { data: bestaand } = await db.from("goedkeur_tokens").select("used_at, expires_at").eq("token_hash", hash).maybeSingle();
    const b = bestaand as { used_at: string | null; expires_at: string } | null;
    return ongeldig(!b ? "onbekend" : b.used_at ? "gebruikt" : "verlopen");
  }

  const ja = rij.actie === "goedkeuren";
  // Enkel de status, en enkel zolang het bericht nog niet doorgegeven is.
  const patch: Record<string, unknown> = ja ? { status: "goedgekeurd", gekeurd_op: iso } : { status: "overgeslagen" };
  const { data: bijgewerkt } = await db
    .from("social_posts")
    .update(patch)
    .eq("id", rij.post_id)
    .in("status", ["concept", "goedgekeurd", "overgeslagen"])
    .select("id")
    .maybeSingle();
  const b = await leesBericht(db, rij.post_id);
  if (!bijgewerkt || !b) {
    return pagina(409, {
      eyebrow: "Social media",
      titel: "Niets veranderd",
      tekst: "Dit bericht is al doorgegeven aan de kanalen of bestaat niet meer.",
      inhoud: b ? voorbeeld(b) : "",
    });
  }
  return pagina(200, {
    eyebrow: ja ? "Social media · goedgekeurd" : "Social media · overgeslagen",
    titel: ja ? "Goedgekeurd" : "Overgeslagen",
    tekst: ja
      ? tijdstipTekst(b.scheduled_for, nu, false)
      : "Het bericht wordt niet gepubliceerd. In de wachtrij kunt u het later nog terugzetten.",
    inhoud: voorbeeld(b),
  });
}

const NIET_TOEGESTAAN = {
  eyebrow: "Social media",
  titel: "Niet toegestaan",
  tekst: "Bevestig via de knop op de bevestigingspagina.",
};

/**
 * Het volledige POST-verzoek: herkomst nakijken, formulier lezen, sleutel
 * opeisen. Apart van route.ts zodat een proef met een echte browser-klik
 * exact dezelfde weg aflegt (enkel de databank verschilt).
 */
export async function verwerkVerzoek(req: Request, db: KeurDb, nu = new Date()): Promise<Antwoord> {
  if (!vanEigenSite(req.headers)) return pagina(403, NIET_TOEGESTAAN);
  let t: unknown = null;
  let bevestig: unknown = null;
  try {
    const fd = await req.formData();
    t = fd.get("t");
    bevestig = fd.get("bevestig");
  } catch {
    t = null;
  }
  return verwerk(db, t, bevestig, nu);
}
