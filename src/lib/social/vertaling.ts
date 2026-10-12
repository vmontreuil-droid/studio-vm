// Een bericht van de contentmachine in de andere taal (nl ↔ fr): elk sjabloon
// heeft beide teksten, en de notities van het bericht zeggen welk sjabloon en
// welk project het gebruikte (template:…, realisatie:…). Zo kan de
// groepspagina van elk bericht ook de andere taal tonen, met een beeld waarop
// de vertaalde kop staat (/beeld/social/…?taal=fr).

import { REALISATIE_IDS, bouwTekst, realisatieKeuze, templateOpId, type Dia } from "@/lib/admin/social-templates";

export type PostTaal = "nl" | "fr";

export type Vertaling = {
  taal: PostTaal;
  title: string;
  body: string;
  dias: Dia[] | undefined;
  /** Doelpagina in die taal, bv. "/fr/realisaties/a11". */
  doel: string;
};

function notitie(notes: string | null | undefined, sleutel: string): string | null {
  return notes?.match(new RegExp(`(?:^|·)\\s*${sleutel}:([\\w./-]+)`))?.[1] ?? null;
}

/** Taal waarin het bericht gemaakt werd (notitie taal:…), anders null. */
export function postTaal(notes: string | null | undefined): PostTaal | null {
  const t = notitie(notes, "taal");
  return t === "nl" || t === "fr" ? t : null;
}

/**
 * Het bericht in `taal`, opnieuw opgebouwd uit zijn sjabloon. null als het
 * al in die taal is, of als sjabloon of project niet (meer) te vinden is.
 */
export function postInTaal(p: { notes?: string | null }, taal: PostTaal): Vertaling | null {
  if (postTaal(p.notes) === taal) return null;
  const t = templateOpId(notitie(p.notes, "template") ?? "");
  if (!t) return null;
  const rid = notitie(p.notes, "realisatie");
  const realisatie = rid ? realisatieKeuze(rid) : undefined;
  // realisatieKeuze valt bij een onbekend id terug op een willekeurig project.
  if (rid && realisatie?.id !== rid) return null;
  const ctx = { realisatie };
  const tk = bouwTekst(t, taal, ctx);
  return {
    taal,
    title: tk.kop,
    body: tk.body,
    dias: t.dias?.[taal] ?? realisatie?.dias?.[taal],
    doel: `/${taal}${(t.realisatie && realisatie?.pad) || t.doel}`,
  };
}

/** Groepsposts hebben altijd 4 beelden: de hoofdkaart + 3 dia's. */
export const GROEP_DIAS = 3;

/**
 * Precies GROEP_DIAS dia's: eerst die van het bericht zelf, dan aangevuld met
 * de weergaven (luchtfoto, hoogtelijnen, net …) van een archiefproject, vast
 * gekozen per bericht zodat hetzelfde bericht altijd dezelfde beelden geeft.
 */
export function groepsDias(postId: string, taal: PostTaal, eigen: Dia[]): Dia[] {
  if (eigen.length >= GROEP_DIAS) return eigen.slice(0, GROEP_DIAS);
  const nodig = GROEP_DIAS - eigen.length;
  const kandidaten = REALISATIE_IDS.map((id) => realisatieKeuze(id)).filter((r) => (r.dias?.[taal]?.length ?? 0) >= nodig);
  if (!kandidaten.length) return eigen;
  let h = 0;
  for (const c of postId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = kandidaten[h % kandidaten.length]!;
  return [...eigen, ...r.dias![taal].slice(0, nodig)];
}
