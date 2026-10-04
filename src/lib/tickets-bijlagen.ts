import "server-only";
// Bijlagen bij tickets: privé-bucket 'ticket-bijlagen' (max. 50 MB per bestand).
//
// Opladen gaat NIET door een server action: de server maakt na zijn eigen
// controles eenmalige upload-links (maakUploadPlekken), de browser laadt
// rechtstreeks op, en daarna registreert de server de bestanden
// (registreerBijlagen) — enkel paden onder de eigen map en enkel bestanden
// die echt bestaan. Downloaden enkel via tijdelijke links (bijlageLink) die de
// server pas na een eigendomscontrole aanmaakt.
//
// Mappen: k/<sha256(e-mail) 24 tekens>/… voor de klant, s/<ticketId>/… voor
// de studio. Elke functie geeft een resultaat terug en gooit nooit.

import { createHash, randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  BIJLAGE_MAX_AANTAL,
  BIJLAGE_MAX_BYTES,
  bijlageExt,
  bijlageFout,
  isUuid,
  mimeVoor,
  type ActieResultaat,
  type Afzender,
  type BijlageRij,
  type UploadPlek,
} from "@/lib/tickets";
import { isOntbrekend, ticketSchema } from "@/lib/tickets-server";

export const BUCKET = "ticket-bijlagen";
const PLANNEN_BUCKET = "plannen";

let bucketKlaar = false;

/** Zorgt dat de privé-bucket bestaat (migratie 0049 maakt hem ook aan). */
export async function zorgVoorBucket(): Promise<boolean> {
  if (bucketKlaar) return true;
  try {
    const db = getSupabaseAdmin();
    const { data } = await db.storage.getBucket(BUCKET);
    if (!data) {
      const { error } = await db.storage.createBucket(BUCKET, { public: false, fileSizeLimit: BIJLAGE_MAX_BYTES });
      if (error && !/exist/i.test(error.message)) {
        console.error("[tickets] bucket aanmaken mislukt:", error.message);
        return false;
      }
    }
    bucketKlaar = true;
    return true;
  } catch (e) {
    console.error("[tickets] bucket controleren mislukt:", e);
    return false;
  }
}

/** Map van de klant: 'k/' + de eerste 24 tekens van sha256(e-mail in kleine letters). */
export function klantMap(email: string): string {
  return "k/" + createHash("sha256").update(String(email ?? "").trim().toLowerCase()).digest("hex").slice(0, 24);
}

/** Map van de studio voor dit ticket. */
export function studioMap(ticketId: string): string {
  return "s/" + ticketId;
}

/** Bestandsnaam die veilig in een opslagpad past (zelfde regel als bij de projectplannen). */
export function veiligeNaam(naam: string): string {
  return naam.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(-120) || "bestand";
}

function geldigeMap(map: string): boolean {
  return /^k\/[0-9a-f]{24}$/.test(map) || (map.startsWith("s/") && isUuid(map.slice(2)));
}

/** Weergavenaam van hoogstens `max` tekens; een te lange naam houdt zijn extensie. */
function kortNaam(naam: string, max = 200): string {
  const n = naam.trim();
  if (n.length <= max) return n;
  const ext = bijlageExt(n);
  return ext ? `${n.slice(0, max - ext.length - 1)}.${ext}` : n.slice(0, max);
}

/** Bestandsnaam uit een opslagpad: laatste deel zonder het '<uuid>-'-voorvoegsel. */
function naamUitPad(pad: string): string {
  return (pad.split("/").pop() ?? "").replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "");
}

/**
 * Eenmalige upload-links voor deze bestanden in `map` (klantMap of studioMap).
 * Controleert aantal, grootte en type. Pad = map/<uuid>-<veilige naam>.
 * 'migratie' zolang de tabel ticket_bijlagen er niet is: dan zou niets de
 * opgeladen bestanden registreren (en wordt de bucket ook niet aangemaakt).
 */
export async function maakUploadPlekken(
  map: string,
  bestanden: { naam: string; grootte: number }[],
): Promise<ActieResultaat<{ plekken: UploadPlek[] }>> {
  try {
    if (!Array.isArray(bestanden) || bestanden.length === 0) return { ok: true, plekken: [] };
    if (!(await ticketSchema()).bijlagen) return { ok: false, fout: "migratie" };
    if (bestanden.length > BIJLAGE_MAX_AANTAL) return { ok: false, fout: "bijlage_aantal" };
    for (const b of bestanden) {
      const fout = bijlageFout(String(b?.naam ?? ""), Number(b?.grootte));
      if (fout) return { ok: false, fout };
    }
    if (!geldigeMap(map)) return { ok: false, fout: "opslag" };
    if (!(await zorgVoorBucket())) return { ok: false, fout: "opslag" };
    const db = getSupabaseAdmin();
    const plekken = await Promise.all(
      bestanden.map(async (b): Promise<UploadPlek | null> => {
        const naam = kortNaam(String(b.naam));
        const pad = `${map}/${randomUUID()}-${veiligeNaam(naam)}`;
        const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(pad);
        if (error || !data) {
          console.error("[tickets] upload-link mislukt:", error?.message);
          return null;
        }
        return { naam, pad, url: data.signedUrl, grootte: Number(b.grootte) };
      }),
    );
    if (plekken.some((p) => !p)) return { ok: false, fout: "opslag" };
    return { ok: true, plekken: plekken as UploadPlek[] };
  } catch (e) {
    console.error("[tickets] upload-links mislukt:", e);
    return { ok: false, fout: "opslag" };
  }
}

/**
 * Registreert opgeladen bestanden bij een ticket (en bericht). Enkel paden
 * onder `map` + '/' die echt in de opslag staan, worden bewaard; de rest wordt
 * overgeslagen (aantal in `overgeslagen`). Grootte en type komen uit de opslag
 * en het pad, de naam enkel als zijn extensie die van het pad is.
 * Herhaalbaar: een pad dat al bij dit ticket hoort, komt gewoon mee terug.
 * 'migratie' als de tabel nog niet bestaat.
 */
export async function registreerBijlagen(args: {
  ticketId: string;
  messageId?: string | null;
  door: Afzender;
  map: string;
  items: unknown;
}): Promise<ActieResultaat<{ bijlagen: BijlageRij[]; overgeslagen: number }>> {
  try {
    const lijst = Array.isArray(args.items) ? (args.items as unknown[]) : [];
    if (lijst.length === 0) return { ok: true, bijlagen: [], overgeslagen: 0 };
    if (lijst.length > BIJLAGE_MAX_AANTAL) return { ok: false, fout: "bijlage_aantal" };
    if (!isUuid(args.ticketId) || (args.door !== "klant" && args.door !== "studio") || !geldigeMap(args.map)) {
      return { ok: false, fout: "opslag" };
    }
    const db = getSupabaseAdmin();
    const opslag = db.storage.from(BUCKET);
    const prefix = `${args.map}/`;
    const gezien = new Set<string>();

    // Type en grootte komen van het opgeladen bestand zelf, niet van de
    // browser: het pad kreeg zijn naam pas na bijlageFout (maakUploadPlekken).
    // De opgegeven naam telt enkel met een toegelaten extensie die gelijk is
    // aan die van het pad, anders de naam uit het pad.
    const kandidaten = lijst
      .map((x) => {
        const i = (x ?? {}) as { naam?: unknown; pad?: unknown };
        const pad = typeof i.pad === "string" ? i.pad : "";
        const uitPad = naamUitPad(pad);
        const opgegeven = typeof i.naam === "string" ? kortNaam(i.naam) : "";
        const naamOk = opgegeven !== "" && bijlageFout(opgegeven, 1) === null && bijlageExt(opgegeven) === bijlageExt(uitPad);
        return { pad, uitPad, naam: naamOk ? opgegeven : uitPad };
      })
      .filter((i) => {
        const ok =
          i.pad.startsWith(prefix) &&
          !i.pad.slice(prefix.length).includes("/") &&
          !i.pad.includes("..") &&
          i.pad.length <= 400 &&
          bijlageFout(i.uitPad, 1) === null &&
          !gezien.has(i.pad);
        if (ok) gezien.add(i.pad);
        return ok;
      });

    // Bestaat het bestand echt, en hoe groot is het? (info: 404 = niet opgeladen)
    const echt = await Promise.all(
      kandidaten.map(async (i): Promise<{ grootte: number | null } | null> => {
        try {
          const { data, error } = await opslag.info(i.pad);
          if (error || !data) return null;
          const g = Number(data.size);
          if (Number.isFinite(g) && g > BIJLAGE_MAX_BYTES) return null;
          return { grootte: Number.isFinite(g) && g > 0 ? Math.round(g) : null };
        } catch {
          return null;
        }
      }),
    );
    const rijen = kandidaten.flatMap((i, k) => {
      const e = echt[k];
      if (!e) return [];
      return [
        {
          ticket_id: args.ticketId,
          message_id: isUuid(args.messageId) ? args.messageId : null,
          door: args.door,
          naam: i.naam,
          pad: i.pad,
          grootte: e.grootte,
          mime: mimeVoor(i.uitPad),
        },
      ];
    });
    if (rijen.length === 0) {
      console.warn(`[tickets] ${lijst.length} bijlage(n) overgeslagen (pad ongeldig of niet opgeladen)`);
      return { ok: true, bijlagen: [], overgeslagen: lijst.length };
    }

    // Opnieuw verstuurd (antwoord onderweg verloren, dubbelklik): een pad dat
    // al geregistreerd is, mag de rest niet laten mislukken (pad is uniek).
    // Al bij DIT ticket = gelukt (komt mee terug, telt niet als overgeslagen);
    // bij een ander ticket = overgeslagen. Wie tegelijk binnenkomt, valt op
    // 'ignoreDuplicates' (on conflict do nothing) en telt als overgeslagen.
    const { data: bestaand, error: zoekFout } = await db
      .from("ticket_bijlagen")
      .select("*")
      .in("pad", rijen.map((r) => r.pad));
    if (zoekFout) {
      if (isOntbrekend(zoekFout)) return { ok: false, fout: "migratie" };
      console.error("[tickets] bijlagen opzoeken mislukt:", zoekFout.code, zoekFout.message);
      return { ok: false, fout: "opslag" };
    }
    const perPad = new Map<string, BijlageRij>();
    const bezet = new Set<string>();
    for (const b of (bestaand as BijlageRij[] | null) ?? []) {
      bezet.add(b.pad);
      if (b.ticket_id === args.ticketId) perPad.set(b.pad, b);
    }
    const nieuw = rijen.filter((r) => !bezet.has(r.pad));
    if (nieuw.length > 0) {
      const { data, error } = await db
        .from("ticket_bijlagen")
        .upsert(nieuw, { onConflict: "pad", ignoreDuplicates: true })
        .select("*");
      if (error) {
        if (isOntbrekend(error)) return { ok: false, fout: "migratie" };
        console.error("[tickets] bijlagen registreren mislukt:", error.code, error.message);
        return { ok: false, fout: "opslag" };
      }
      for (const b of (data as BijlageRij[] | null) ?? []) perPad.set(b.pad, b);
    }

    const bijlagen = rijen.flatMap((r) => {
      const b = perPad.get(r.pad);
      return b ? [b] : [];
    });
    const overgeslagen = lijst.length - bijlagen.length;
    if (overgeslagen > 0) {
      console.warn(`[tickets] ${overgeslagen} bijlage(n) overgeslagen (pad ongeldig, niet opgeladen of bij een ander ticket)`);
    }
    return { ok: true, bijlagen, overgeslagen };
  } catch (e) {
    console.error("[tickets] bijlagen registreren mislukt:", e);
    return { ok: false, fout: "opslag" };
  }
}

/** Tijdelijke downloadlink (standaard 10 minuten), met de oorspronkelijke bestandsnaam. */
export async function bijlageLink(pad: string, naam: string, seconden = 600): Promise<string | null> {
  if (!pad) return null;
  try {
    const { data, error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .createSignedUrl(pad, Math.max(30, Math.min(Math.round(seconden), 7 * 24 * 3600)), { download: naam || true });
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

async function verwijderPaden(paden: string[]): Promise<number> {
  const db = getSupabaseAdmin();
  const uniek = [...new Set(paden.filter(Boolean))];
  let weg = 0;
  for (let i = 0; i < uniek.length; i += 100) {
    const stuk = uniek.slice(i, i + 100);
    const { error } = await db.storage.from(BUCKET).remove(stuk);
    if (error) console.error("[tickets] bestanden verwijderen mislukt:", error.message);
    else weg += stuk.length;
  }
  return weg;
}

async function lijstMap(map: string): Promise<string[]> {
  const db = getSupabaseAdmin();
  const paden: string[] = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const { data, error } = await db.storage.from(BUCKET).list(map, { limit: 1000, offset });
    if (error || !data || data.length === 0) break;
    for (const o of data) if (o.id) paden.push(`${map}/${o.name}`);
    if (data.length < 1000) break;
  }
  return paden;
}

/**
 * Verwijdert alle opgeslagen bestanden van deze tickets: de geregistreerde
 * bijlagen én wat nog los in de studiomap s/<ticketId>/ staat. De rijen zelf
 * verdwijnen met het ticket (on delete cascade).
 */
export async function verwijderTicketBestanden(ticketIds: string[]): Promise<{ ok: boolean; verwijderd: number }> {
  const ids = [...new Set((ticketIds ?? []).filter(isUuid))];
  if (ids.length === 0) return { ok: true, verwijderd: 0 };
  try {
    const db = getSupabaseAdmin();
    const paden: string[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await db.from("ticket_bijlagen").select("pad").in("ticket_id", ids.slice(i, i + 100));
      if (error) {
        if (isOntbrekend(error)) break; // tabel bestaat nog niet: geen geregistreerde bijlagen
        console.error("[tickets] bijlagen opzoeken mislukt:", error.message);
        return { ok: false, verwijderd: 0 };
      }
      for (const r of (data as { pad: string }[] | null) ?? []) paden.push(r.pad);
    }
    for (const id of ids) paden.push(...(await lijstMap(studioMap(id))));
    return { ok: true, verwijderd: await verwijderPaden(paden) };
  } catch (e) {
    console.error("[tickets] bestanden verwijderen mislukt:", e);
    return { ok: false, verwijderd: 0 };
  }
}

/** Verwijdert de volledige klantmap (k/<hash>/…) van deze e-mail. */
export async function verwijderKlantMap(email: string): Promise<{ ok: boolean; verwijderd: number }> {
  if (!String(email ?? "").trim()) return { ok: true, verwijderd: 0 };
  try {
    return { ok: true, verwijderd: await verwijderPaden(await lijstMap(klantMap(email))) };
  } catch (e) {
    console.error("[tickets] klantmap verwijderen mislukt:", e);
    return { ok: false, verwijderd: 0 };
  }
}

/**
 * Kopieert een bijlage naar de projectplannen (bucket 'plannen', pad
 * projecten/<projectId>/<stempel>-<naam>), zoals een plan dat de admin oplaadt.
 * Geeft het plan terug om aan projecten.plannen toe te voegen, of null.
 */
export async function kopieerNaarPlannen(
  pad: string,
  projectId: string,
  naam: string,
  grootte?: number | null,
): Promise<{ naam: string; pad: string; grootte?: number } | null> {
  if (!pad || !isUuid(projectId)) return null;
  try {
    const db = getSupabaseAdmin();
    const schoon = String(naam ?? "").trim().slice(0, 200) || pad.split("/").pop() || "plan";
    const doel = `projecten/${projectId}/${Date.now().toString(36)}-${veiligeNaam(schoon)}`;
    const kopie = await db.storage.from(BUCKET).copy(pad, doel, { destinationBucket: PLANNEN_BUCKET });
    if (kopie.error) {
      // Oudere opslag zonder kopie tussen buckets: ophalen en opnieuw opladen.
      const { data: blob, error: leesFout } = await db.storage.from(BUCKET).download(pad);
      if (leesFout || !blob) {
        console.error("[tickets] plan kopiëren mislukt:", kopie.error.message);
        return null;
      }
      const { error: schrijfFout } = await db.storage
        .from(PLANNEN_BUCKET)
        .upload(doel, blob, { contentType: mimeVoor(schoon), upsert: false });
      if (schrijfFout) {
        console.error("[tickets] plan kopiëren mislukt:", schrijfFout.message);
        return null;
      }
    }
    let g = typeof grootte === "number" && grootte > 0 ? grootte : null;
    if (g == null) {
      const { data } = await db.from("ticket_bijlagen").select("grootte").eq("pad", pad).maybeSingle();
      const x = Number((data as { grootte?: number | null } | null)?.grootte);
      g = Number.isFinite(x) && x > 0 ? x : null;
    }
    return g ? { naam: schoon, pad: doel, grootte: g } : { naam: schoon, pad: doel };
  } catch (e) {
    console.error("[tickets] plan kopiëren mislukt:", e);
    return null;
  }
}
