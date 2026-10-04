// Meta Graph API (Facebook-pagina + Instagram) — STUB, nog niet aangesloten.
//
// Buffer publiceert voorlopig alles (één sleutel, geen Meta-app, geen
// system-user-token). Deze adapter is er voor later, vooral om cijfers op te
// halen die Buffer niet geeft. Hij wordt nergens gebruikt; publish() weigert.
//
// Voor wie hem later afwerkt:
//
// 1. Volgorde (kritiek 26): Instagram professioneel account maken → koppelen
//    aan de Facebookpagina → beide in het Meta Business-portfolio → pas dan
//    het system-user-token aanmaken. Daarvóór de privacytekst (B7) live
//    zetten en de app op Live schakelen (in Development zijn API-berichten
//    enkel zichtbaar voor rollen op de app).
//
// 2. Rechten van het system-user-token (kritiek 2): de Instagram-publicatie
//    vraagt ads_management OF ads_read wanneer de paginarol via Business
//    Manager toegekend werd — en dat is precies de system-user-route.

import type { PublicatieAdapter, PublicatieBericht, PublicatieKanaal, PublicatieUitkomst } from "../publish";

export const META_PERMISSIES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_manage_engagement",
  "read_insights",
  "instagram_basic",
  "instagram_content_publish",
  "ads_read",
  "business_management",
] as const;

// 3. Inzichten (kritiek 3): de oude namen geven fout #100. Afgeschaft op
//    15 nov. 2025 (impressions, page fans) en 15 juni 2026 (o.a. de unieke
//    bereikcijfers). Bronnen: developers.facebook.com/blog/post/2025/08/15/
//    page-insights-api-updates/ en de connector-changelogs van juni 2026.
//    Vóór gebruik nogmaals nakijken in developers.facebook.com/docs/
//    graph-api/reference/insights/.
export const META_INZICHTEN: Record<string, string | null> = {
  // oud → nieuw (null = geen vervanger)
  page_impressions: "page_media_view",
  page_impressions_unique: "page_total_media_view_unique",
  post_impressions: "post_media_view",
  post_impressions_unique: "post_total_media_view_unique",
  page_fans: "page_follows",
  page_video_views_unique: null,
};

// 4. Geen URL's in de tekst en geen link in de eerste reactie: Meta One
//    (15 sept. 2026) telt links in berichten én reacties (± 2 per maand).
//    De publisher houdt dat budget al bij (LINK_BUDGET_PER_MAAND).
//
// 5. Endpoints: POST /{page-id}/photos (beeldbytes of url), /{page-id}/
//    photo_stories, /{page-id}/video_reels; Instagram: /{ig-user-id}/media
//    (image_url | media_type=REELS | STORIES) + /{ig-user-id}/media_publish.
//    Versie vastpinnen (bv. v24.0) en wekelijks debug_token nakijken.

export const META_API_VERSIE = "v24.0";

/** Stub: nooit actief. */
export const metaAdapter: PublicatieAdapter = {
  naam: "meta",
  async publish(_post: PublicatieBericht, _channel: PublicatieKanaal): Promise<PublicatieUitkomst> {
    void _post;
    void _channel;
    return { ok: false, url: null, id: null, error: "Meta-adapter is nog niet aangesloten (publiceren loopt via Buffer)" };
  },
};
