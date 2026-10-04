// Buffer als publicatiedienst: één API-sleutel, alle kanalen die de eigenaar
// in Buffer verbond (Facebook, Instagram, Google Bedrijfsprofiel, YouTube,
// TikTok, Pinterest, X, Threads, Bluesky).
//
// Gebouwd tegen de GraphQL-API van Buffer (publieke bèta sinds 27 mei 2026),
// zoals gedocumenteerd op 3 oktober 2026:
//   https://developers.buffer.com/llms.txt                      overzicht
//   https://developers.buffer.com/guides/getting-started.md     endpoint https://api.buffer.com, POST + JSON
//   https://developers.buffer.com/guides/authentication.md      "Authorization: Bearer <sleutel>", sleutel per account
//   https://developers.buffer.com/guides/agent-setup.md         organisaties en kanalen opvragen
//   https://developers.buffer.com/guides/your-first-post.md     createPost, PostActionSuccess / MutationError
//   https://developers.buffer.com/guides/posts-and-scheduling.md  schedulingType, mode, metadata per netwerk
//   https://developers.buffer.com/guides/hosting-media.md       media enkel via publieke, stabiele https-URL
//   https://developers.buffer.com/guides/error-handling.md      fouten in data (typed) en in errors (codes)
//   https://developers.buffer.com/guides/api-limits.md          429 + Retry-After, RateLimit-koppen
//   https://developers.buffer.com/guides/character-limits.md    tekstlimieten per netwerk
//   https://developers.buffer.com/reference.md                  CreatePostInput, PostInputMetaData, Service, ShareMode
//   https://developers.buffer.com/examples/get-channels.md, create-image-post.md, create-video-post.md
//
// Wat daaruit volgt:
//   - Eén endpoint, altijd HTTP 200 bij GraphQL-fouten; enkel 429 (te veel
//     verzoeken) en 401 (sleutel) komen als HTTP-status.
//   - Limieten gratis plan: 1 sleutel, 100 verzoeken per 15 min, 250 per
//     24 u, 3.000 per 30 dagen. Een 429 kost geen quotum. 3 kanalen en 10
//     berichten in de wachtrij per kanaal.
//   - Er is geen upload: elk beeld en elke video is een publieke URL die
//     bereikbaar blijft tot het bericht uit is (daarom de bevroren kopie in
//     de bucket social-media).
//   - Service-namen: facebook, instagram, googlebusiness, youtube, tiktok,
//     pinterest, twitter (= X), threads, bluesky, linkedin. De rest
//     gebruiken we niet.
//   - We sturen met mode "shareNow": de publisher roept dit pas op het
//     geplande tijdstip aan, dus niets blijft in de Buffer-wachtrij hangen
//     (de 10-per-kanaal-grens van het gratis plan speelt dan niet).
//
// Server-only: de sleutel komt uit BUFFER_API_KEY en gaat nooit naar de
// browser of in een log.

import type {
  GevondenKanaal,
  PublicatieBericht,
  PublicatieDienst,
  PublicatieKanaal,
  PublicatieUitkomst,
  RecentPost,
  Verbindingstest,
  Verzoeken,
} from "../publish";
import type { Kanaal } from "@/lib/admin/social-templates";

export const BUFFER_API = "https://api.buffer.com";
export const BUFFER_SLEUTEL_PAGINA = "https://publish.buffer.com/settings/api";

/** De API-sleutel (leeg = publisher uit). */
export function bufferSleutel(): string {
  return (process.env.BUFFER_API_KEY ?? "").trim();
}

/** Optioneel: vaste organisatie (anders de eerste van het account). */
export function bufferOrganisatieVast(): string | null {
  return (process.env.BUFFER_ORGANIZATION_ID ?? "").trim() || null;
}

/** Buffer-service → ons kanaal. Wat hier ontbreekt (mastodon, …) gebruiken we niet. */
export const BUFFER_SERVICE: Record<string, Kanaal> = {
  facebook: "facebook",
  instagram: "instagram",
  linkedin: "linkedin",
  googlebusiness: "google",
  youtube: "youtube",
  tiktok: "tiktok",
  pinterest: "pinterest",
  twitter: "x",
  threads: "threads",
  bluesky: "bluesky",
};

type Fout = { message: string; code: string | null };

export type BufferAntwoord<T> = {
  data: T | null;
  fouten: Fout[];
  http: number;
  retryNa: number | null;
  verzoeken: Verzoeken | null;
};

export type BufferOpties = {
  sleutel?: string;
  organisatieId?: string | null;
  /** Te vervangen in tests (opgenomen antwoorden). */
  fetch?: typeof fetch;
  /** Tijdslimiet per verzoek. */
  timeoutMs?: number;
};

// ─── Verzoek ─────────────────────────────────────────────────────────────

/**
 * RateLimit-koppen lezen: per venster (15 min / 24 u / 30 d) wat er over is.
 * Een venster herkennen we aan w uit RateLimit-Policy, niet aan de naam
 * (die volgt het plan). fetch voegt herhaalde koppen samen met ", ".
 */
export function leesVerzoeken(h: Headers, nu = new Date()): Verzoeken | null {
  const stand = h.get("ratelimit");
  if (!stand) return null;
  const delen = (s: string) => s.split(/,\s*(?=")/);
  const venster = new Map<string, { w: number; q: number }>();
  for (const p of delen(h.get("ratelimit-policy") ?? "")) {
    const naam = p.match(/"([^"]+)"/)?.[1];
    const w = Number(p.match(/\bw=(\d+)/)?.[1]);
    const q = Number(p.match(/\bq=(\d+)/)?.[1]);
    if (naam && w) venster.set(naam, { w, q });
  }
  const uit: Verzoeken = { op: nu.toISOString() };
  for (const p of delen(stand)) {
    const naam = p.match(/"([^"]+)"/)?.[1];
    const r = Number(p.match(/\br=(\d+)/)?.[1]);
    const t = Number(p.match(/\bt=(\d+)/)?.[1]);
    if (!naam || !Number.isFinite(r)) continue;
    const v = venster.get(naam);
    const w = v?.w ?? (/15\s*min/i.test(naam) ? 900 : /1\s*day/i.test(naam) ? 86_400 : /30\s*days/i.test(naam) ? 2_592_000 : 0);
    const q = v?.q ?? Number(naam.match(/^(\d+)/)?.[1] ?? 0);
    const sleutel = w === 900 ? "kwartier" : w === 86_400 ? "dag" : w === 2_592_000 ? "maand" : null;
    if (sleutel) uit[sleutel] = { over: r, quota: q || null, resetS: Number.isFinite(t) ? t : null };
  }
  return uit.kwartier || uit.dag || uit.maand ? uit : null;
}

/** Eén GraphQL-verzoek. Gooit nooit: netwerkfouten komen terug als code NETWERK. */
export async function bufferVraag<T>(
  o: BufferOpties,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<BufferAntwoord<T>> {
  const sleutel = o.sleutel ?? bufferSleutel();
  const f = o.fetch ?? fetch;
  let res: Response;
  try {
    res = await f(BUFFER_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sleutel}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(o.timeoutMs ?? 30_000),
      cache: "no-store",
    });
  } catch (e) {
    const naam = e instanceof Error ? e.name : "";
    return {
      data: null,
      fouten: [{ message: naam === "TimeoutError" ? "Buffer antwoordde niet op tijd" : "Buffer niet bereikbaar", code: "NETWERK" }],
      http: 0,
      retryNa: null,
      verzoeken: null,
    };
  }
  const verzoeken = leesVerzoeken(res.headers);
  const retry = Number(res.headers.get("retry-after"));
  let body: { data?: T | null; errors?: Array<{ message?: unknown; extensions?: { code?: unknown } }> } | null = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const fouten: Fout[] = Array.isArray(body?.errors)
    ? body.errors.map((e) => ({
        message: typeof e?.message === "string" ? e.message : "Onbekende fout",
        code: typeof e?.extensions?.code === "string" ? e.extensions.code : null,
      }))
    : [];
  if (res.status === 429 && !fouten.some((f2) => f2.code === "RATE_LIMIT_EXCEEDED"))
    fouten.push({ message: "Te veel verzoeken naar Buffer", code: "RATE_LIMIT_EXCEEDED" });
  if (res.status === 401 && !fouten.some((f2) => f2.code === "UNAUTHORIZED"))
    fouten.push({ message: "Buffer weigert de API-sleutel", code: "UNAUTHORIZED" });
  if (res.status >= 500 && !fouten.length) fouten.push({ message: `Buffer gaf HTTP ${res.status}`, code: "UNEXPECTED" });
  if (!body && res.ok && !fouten.length) fouten.push({ message: "Onleesbaar antwoord van Buffer", code: "UNEXPECTED" });
  return {
    data: (body?.data ?? null) as T | null,
    fouten,
    http: res.status,
    retryNa: Number.isFinite(retry) && retry > 0 ? retry : null,
    verzoeken,
  };
}

function heeftCode(a: { fouten: Fout[] }, code: string): boolean {
  return a.fouten.some((f) => f.code === code);
}

/** Leesbare foutzin zonder sleutel of headers. */
function foutTekst(a: { fouten: Fout[]; http: number }): string {
  const f = a.fouten[0];
  if (!f) return a.http ? `HTTP ${a.http}` : "onbekende fout";
  return f.code && f.code !== "NETWERK" ? `${f.message} (${f.code})` : f.message;
}

// ─── Organisaties en kanalen ────────────────────────────────────────────

const Q_ORGANISATIES = /* GraphQL */ `
  query Organisaties {
    account {
      id
      organizations {
        id
        name
        channelCount
        limits {
          channels
        }
      }
    }
  }
`;

const Q_KANALEN = /* GraphQL */ `
  query Kanalen($organizationId: OrganizationId!) {
    channels(input: { organizationId: $organizationId }) {
      id
      name
      displayName
      service
      type
      descriptor
      avatar
      externalLink
      isDisconnected
      isLocked
      isQueuePaused
      metadata {
        __typename
        ... on PinterestMetadata {
          boards {
            id
            serviceId
            name
          }
        }
      }
    }
  }
`;

type RuwOrganisatie = { id: string; name: string; channelCount?: number; limits?: { channels?: number } | null };
type RuwKanaal = {
  id: string;
  name: string;
  displayName?: string | null;
  service: string;
  type?: string | null;
  descriptor?: string | null;
  avatar?: string | null;
  externalLink?: string | null;
  isDisconnected?: boolean;
  isLocked?: boolean;
  isQueuePaused?: boolean;
  metadata?: { __typename?: string; boards?: Array<{ id: string; serviceId: string; name: string }> } | null;
};

/** Buffer-kanaal → ons formaat; null voor diensten die we niet gebruiken. */
export function zetKanaalOm(k: RuwKanaal): GevondenKanaal | null {
  const dienst = BUFFER_SERVICE[k.service];
  if (!dienst) return null;
  return {
    id: k.id,
    dienst,
    service: k.service,
    naam: k.name,
    weergave: k.displayName ?? null,
    soort: k.descriptor ?? k.type ?? null,
    link: k.externalLink ?? null,
    avatar: k.avatar ?? null,
    ontkoppeld: !!k.isDisconnected,
    vergrendeld: !!k.isLocked,
    gepauzeerd: !!k.isQueuePaused,
    borden: (k.metadata?.boards ?? [])
      .filter((b) => b && typeof b.serviceId === "string")
      .map((b) => ({ id: b.serviceId, naam: b.name })),
  };
}

/**
 * Sleutel nakijken en alle kanalen ophalen (2 verzoeken). Leest enkel.
 * Organisatie: BUFFER_ORGANIZATION_ID als die bestaat, anders de eerste.
 */
export async function bufferTest(o: BufferOpties = {}): Promise<Verbindingstest> {
  const a = await bufferVraag<{ account: { id: string; organizations: RuwOrganisatie[] } }>(o, Q_ORGANISATIES);
  if (heeftCode(a, "UNAUTHORIZED") || heeftCode(a, "FORBIDDEN"))
    return { ok: false, sleutelFout: true, fout: "Buffer weigert de API-sleutel", verzoeken: a.verzoeken };
  if (heeftCode(a, "RATE_LIMIT_EXCEEDED"))
    return { ok: false, limiet: true, fout: "Buffer-limiet bereikt, later opnieuw", verzoeken: a.verzoeken, retryNa: a.retryNa };
  const orgs = a.data?.account?.organizations ?? [];
  if (a.fouten.length || !a.data) return { ok: false, fout: foutTekst(a), verzoeken: a.verzoeken };
  if (!orgs.length) return { ok: false, fout: "Geen organisatie in dit Buffer-account", verzoeken: a.verzoeken };
  const vast = o.organisatieId === undefined ? bufferOrganisatieVast() : o.organisatieId;
  const org = (vast ? orgs.find((x) => x.id === vast) : undefined) ?? orgs[0]!;
  const waarschuwing = vast && org.id !== vast ? `BUFFER_ORGANIZATION_ID ${vast} niet gevonden; eerste organisatie gebruikt` : undefined;

  const k = await bufferVraag<{ channels: RuwKanaal[] }>(o, Q_KANALEN, { organizationId: org.id });
  const verzoeken = k.verzoeken ?? a.verzoeken;
  if (heeftCode(k, "UNAUTHORIZED")) return { ok: false, sleutelFout: true, fout: "Buffer weigert de API-sleutel", verzoeken };
  if (heeftCode(k, "RATE_LIMIT_EXCEEDED"))
    return { ok: false, limiet: true, fout: "Buffer-limiet bereikt, later opnieuw", verzoeken, retryNa: k.retryNa };
  if (k.fouten.length || !k.data) return { ok: false, fout: foutTekst(k), verzoeken };

  const kanalen: GevondenKanaal[] = [];
  const ongebruikt: Array<{ service: string; naam: string }> = [];
  for (const ruw of k.data.channels ?? []) {
    const om = zetKanaalOm(ruw);
    if (om) kanalen.push(om);
    else ongebruikt.push({ service: ruw.service, naam: ruw.displayName || ruw.name });
  }
  return {
    ok: true,
    organisatie: { id: org.id, naam: org.name, maxKanalen: org.limits?.channels ?? null },
    organisaties: orgs.length,
    kanalen,
    ongebruikt,
    verzoeken,
    ...(waarschuwing ? { waarschuwing } : {}),
  };
}

// ─── Bericht maken ──────────────────────────────────────────────────────

const M_POST = /* GraphQL */ `
  mutation MaakPost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess {
        post {
          id
          status
          externalLink
          dueAt
          sentAt
          error {
            message
          }
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

type MaakPostData = {
  createPost:
    | {
        __typename: "PostActionSuccess";
        post: {
          id: string;
          status: string;
          externalLink?: string | null;
          dueAt?: string | null;
          sentAt?: string | null;
          error?: { message: string } | null;
        };
      }
    | { __typename: string; message?: string };
};

/** Afbeelding of video als Buffer-asset; alt-tekst voor toegankelijkheid. */
function beeldAsset(url: string, alt: string) {
  return { image: { url, metadata: { altText: alt.slice(0, 1000) } } };
}

/**
 * Ons bericht → CreatePostInput voor één kanaal. Puur (getest zonder netwerk).
 * Tekst bevat nooit een URL; de link van een linkbericht (enkel Facebook)
 * gaat als linkAttachment, die volgens de docs niet samen met beelden mag.
 */
export function bufferInvoer(b: PublicatieBericht, k: PublicatieKanaal): Record<string, unknown> {
  const invoer: Record<string, unknown> = {
    channelId: k.id,
    text: b.tekst,
    schedulingType: "automatic",
    mode: "shareNow",
  };
  const beelden = b.beelden.map((x) => beeldAsset(x.url, x.alt));
  const video = b.video ? [{ video: { url: b.video, metadata: { thumbnailOffset: 1000 } } }] : [];
  let assets: unknown[] = b.soort === "reel" ? video : beelden;
  const metadata: Record<string, unknown> = {};

  switch (k.dienst) {
    case "facebook": {
      const type = b.soort === "story" ? "story" : b.soort === "reel" ? "reel" : "post";
      if (b.link && b.soort === "bericht") {
        assets = [];
        metadata.facebook = {
          type,
          linkAttachment: {
            url: b.link.url,
            title: b.link.titel,
            description: b.link.beschrijving,
            thumbnail: { url: b.link.beeld },
          },
        };
      } else metadata.facebook = { type };
      break;
    }
    case "instagram":
      metadata.instagram = {
        type: b.soort === "story" ? "story" : b.soort === "reel" ? "reel" : "post",
        shouldShareToFeed: b.soort !== "story",
      };
      break;
    case "linkedin":
      // Link als eerste reactie (hoogstens 1.250 tekens); de tekst zelf blijft zonder URL.
      if (b.eersteReactie) metadata.linkedin = { firstComment: b.eersteReactie.slice(0, 1250) };
      break;
    case "google":
      metadata.google = {
        type: "whats_new",
        detailsWhatsNew: b.doelLink ? { button: "learn_more", link: b.doelLink } : { button: "none" },
      };
      break;
    case "youtube":
      assets = video;
      metadata.youtube = {
        title: b.titel.slice(0, 100),
        categoryId: "28", // Science & Technology
        privacy: "public",
        madeForKids: false,
        notifySubscribers: true,
        embeddable: true,
      };
      break;
    case "tiktok":
      assets = video;
      break;
    case "pinterest":
      metadata.pinterest = {
        boardServiceId: k.bord ?? undefined,
        title: b.titel.slice(0, 100),
        ...(b.doelLink ? { url: b.doelLink } : {}),
      };
      break;
    case "x":
    case "threads":
    case "bluesky":
      if (b.soort === "reel") assets = video;
      break;
  }
  invoer.assets = assets;
  if (Object.keys(metadata).length) invoer.metadata = metadata;
  return invoer;
}

/** Antwoord van createPost → uitkomst. Puur. */
export function bufferUitkomst(a: BufferAntwoord<MaakPostData>): PublicatieUitkomst {
  const leeg = { url: null, id: null };
  if (heeftCode(a, "UNAUTHORIZED")) return { ok: false, ...leeg, error: "Buffer weigert de API-sleutel", stop: "sleutel" };
  if (heeftCode(a, "RATE_LIMIT_EXCEEDED"))
    return { ok: false, ...leeg, error: "Buffer-limiet bereikt", stop: "limiet", retryNa: a.retryNa };
  if (heeftCode(a, "NETWERK")) return { ok: false, ...leeg, error: foutTekst(a), tijdelijk: true, onzeker: true };
  if (heeftCode(a, "UNEXPECTED") || a.http >= 500)
    return { ok: false, ...leeg, error: foutTekst(a), tijdelijk: true, onzeker: true };
  if (heeftCode(a, "FORBIDDEN")) return { ok: false, ...leeg, error: "Geen toegang tot dit kanaal in Buffer" };
  if (heeftCode(a, "NOT_FOUND")) return { ok: false, ...leeg, error: "Kanaal niet gevonden in Buffer" };
  const r = a.data?.createPost;
  if (!r) return { ok: false, ...leeg, error: a.fouten.length ? foutTekst(a) : "Leeg antwoord van Buffer" };
  if (r.__typename === "PostActionSuccess" && "post" in r && r.post) {
    const p = r.post;
    if (p.status === "error") return { ok: false, url: null, id: p.id, error: p.error?.message || "Buffer meldt een fout bij publiceren" };
    const verzonden = p.status !== "sent";
    return { ok: true, url: p.externalLink ?? null, id: p.id, error: null, verzonden };
  }
  const melding = ("message" in r && r.message) || r.__typename;
  // Wachtrij of daglimiet vol: niets aangemaakt, later opnieuw.
  if (r.__typename === "LimitReachedError") return { ok: false, ...leeg, error: melding, tijdelijk: true };
  // Onverwacht aan Buffers kant: misschien toch aangemaakt → eerst nakijken.
  if (r.__typename === "UnexpectedError") return { ok: false, ...leeg, error: melding, tijdelijk: true, onzeker: true };
  // InvalidInputError, NotFoundError, UnauthorizedError (kanaal), RestProxyError, …
  return { ok: false, ...leeg, error: melding };
}

// ─── Recente berichten (nakijken en bevestigen) ─────────────────────────

const Q_RECENT = /* GraphQL */ `
  query Recent($organizationId: OrganizationId!, $channelIds: [ChannelId!], $sinds: DateTime) {
    posts(
      first: 50
      input: {
        organizationId: $organizationId
        filter: { channelIds: $channelIds, createdAt: { start: $sinds } }
        sort: [{ field: createdAt, direction: desc }]
      }
    ) {
      edges {
        node {
          id
          channelId
          status
          text
          externalLink
          sentAt
          createdAt
          error {
            message
          }
        }
      }
    }
  }
`;

type RecentData = {
  posts: {
    edges: Array<{
      node: {
        id: string;
        channelId: string;
        status: string;
        text: string;
        externalLink?: string | null;
        sentAt?: string | null;
        createdAt?: string | null;
        error?: { message: string } | null;
      };
    }> | null;
  } | null;
};

// ─── De dienst ──────────────────────────────────────────────────────────

/** null zonder BUFFER_API_KEY. */
export function maakBufferDienst(o: BufferOpties = {}): PublicatieDienst | null {
  const sleutel = o.sleutel ?? bufferSleutel();
  if (!sleutel) return null;
  const opties: BufferOpties = { ...o, sleutel };
  let laatste: Verzoeken | null = null;
  const onthoud = (v: Verzoeken | null) => {
    if (v) laatste = v;
  };

  return {
    naam: "buffer",
    async publish(bericht, kanaal) {
      const a = await bufferVraag<MaakPostData>(opties, M_POST, { input: bufferInvoer(bericht, kanaal) });
      onthoud(a.verzoeken);
      return bufferUitkomst(a);
    },
    async test() {
      const t = await bufferTest(opties);
      onthoud(t.verzoeken ?? null);
      return t;
    },
    async recent(organisatieId, kanaalIds, sinds) {
      const a = await bufferVraag<RecentData>(opties, Q_RECENT, {
        organizationId: organisatieId,
        channelIds: kanaalIds,
        sinds: sinds.toISOString(),
      });
      onthoud(a.verzoeken);
      if (heeftCode(a, "UNAUTHORIZED")) return { ok: false, stop: "sleutel", posts: [] };
      if (heeftCode(a, "RATE_LIMIT_EXCEEDED")) return { ok: false, stop: "limiet", posts: [] };
      if (a.fouten.length || !a.data) return { ok: false, posts: [], fout: foutTekst(a) };
      const posts: RecentPost[] = (a.data.posts?.edges ?? []).map(({ node: n }) => ({
        id: n.id,
        kanaalId: n.channelId,
        status: n.status === "sent" ? "gepubliceerd" : n.status === "error" ? "mislukt" : "verzonden",
        tekst: n.text ?? "",
        url: n.externalLink ?? null,
        fout: n.error?.message ?? null,
        op: n.sentAt ?? n.createdAt ?? null,
      }));
      return { ok: true, posts };
    },
    verzoeken() {
      return laatste;
    },
  };
}
