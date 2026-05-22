// AI Content Engine — kern.
//
// Wordt aangeroepen door /api/cron/social-generate (dagelijks 7u).
//
// Logica:
// 1. Check welke templates de laatste 14 dagen al gebruikt zijn → vermijd herhaling
// 2. Bepaal dag-van-de-week (1=ma … 5=vr)
// 3. Kies 3 templates passend bij die dag, gemengd platform-FB/LI
// 4. Build elke post met variabele-injectie (klanten uit PORTFOLIO)
// 5. (optioneel) AI-modus — als ANTHROPIC_API_KEY is gezet, geef de
//    template-output aan Claude voor lichte herschrijving + variatie
// 6. Insert in social_posts met status='klaar' + 'Genereer-engine'-marker
//    in notes-veld

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  PORTFOLIO,
  pickTemplatesForDay,
  pickClients,
  type Template,
  type TemplateCtx,
} from "./social-templates";

export type GeneratedPost = {
  templateId: string;
  platform: "facebook" | "linkedin";
  post_kind: string;
  title: string;
  body: string;
  hashtags: string;
  target_url: string;
};

const DAY_NAMES_NL = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
];
const DAY_SHORT_NL = ["zo", "ma", "di", "wo", "do", "vr", "za"];

// =====================================================================
// AI-rewrite (optioneel) — alleen actief als ANTHROPIC_API_KEY bestaat.
// =====================================================================
async function aiRewrite(
  body: string,
  hint: { platform: string; dayName: string; humeur: string },
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return body;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `Je bent Vincent Montreuil, solo-website-bouwer voor KMO's in Vlaanderen (studio-vm.be). Schrijf altijd in Belgisch-Nederlands (geen Hollandse termen). Korte, eerlijke, zelfverzekerde toon zonder verkoop-jargon.

Herschrijf onderstaande post-tekst voor ${hint.platform}. Het is ${hint.dayName}. Stem: ${hint.humeur}.

Behoud de boodschap en structuur, maar varieer:
- Andere openingszin
- Andere woordkeuze waar mogelijk
- Behoud feitelijke claims, cijfers, URLs, klantnamen exact zoals ze zijn
- Behoud bullets en lijsten
- Lengte ongeveer gelijk

Geef ALLEEN de herschreven tekst terug, geen uitleg, geen markdown-code-fences.

ORIGINELE POST:
${body}`,
          },
        ],
      }),
    });
    if (!res.ok) return body;
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    return text && text.length > 50 ? text : body;
  } catch {
    return body;
  }
}

// =====================================================================
// "Humeur" — een willekeurige stem per dag voor variatie. Wordt aan AI
// gegeven om de toon te kleuren wanneer AI-modus actief is.
// =====================================================================
function pickHumeur(): string {
  const moods = [
    "zelfverzekerd en direct",
    "vriendelijk en uitnodigend",
    "kritisch maar respectvol",
    "verhalend en persoonlijk",
    "feitelijk en cijfer-gedreven",
    "energiek en actiegericht",
    "rustig en bedachtzaam",
  ];
  return moods[Math.floor(Math.random() * moods.length)]!;
}

// =====================================================================
// Hoofdfunctie — genereert N posts voor vandaag, schrijft ze in DB.
// =====================================================================
export async function generateDailyPosts(opts: {
  count?: number;
  forceDayOfWeek?: number; // voor testing
}): Promise<{ generated: number; posts: GeneratedPost[]; skipped: string[] }> {
  const db = getSupabaseAdmin();
  const count = opts.count ?? 3;

  // 1. Recent gebruikte template-ids (laatste 14 dagen) — uit notes-veld
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const { data: recent } = await db
    .from("social_posts")
    .select("notes")
    .gte("created_at", since)
    .limit(200);
  const recentIds = ((recent as Array<{ notes: string | null }> | null) ?? [])
    .map((r) => r.notes?.match(/template:([\w-]+)/)?.[1])
    .filter((x): x is string => !!x);

  // 2. Dag van de week
  const now = new Date();
  const jsDay = now.getDay(); // 0=zo
  const dayOfWeek = opts.forceDayOfWeek ?? (jsDay === 0 || jsDay === 6 ? 1 : jsDay);
  const dayName = DAY_NAMES_NL[jsDay]!;
  const dayShort = DAY_SHORT_NL[jsDay]!;
  const dateLabel = now.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
  });

  // 3. Kies templates
  const templates = pickTemplatesForDay(dayOfWeek, recentIds, count);
  if (templates.length === 0) {
    return {
      generated: 0,
      posts: [],
      skipped: [`Geen geschikte templates voor ${dayName}`],
    };
  }

  // 4. Build elke post + AI-rewrite (indien beschikbaar)
  const humeur = pickHumeur();
  const posts: GeneratedPost[] = [];
  const skipped: string[] = [];

  for (const t of templates) {
    const { client, altClient } = pickClients();
    const ctx: TemplateCtx = {
      dayName,
      dayShort,
      date: dateLabel,
      client,
      altClient,
    };
    const built = t.build(ctx);
    let finalBody = built.body;

    // AI-mode optionele rewrite
    if (process.env.ANTHROPIC_API_KEY) {
      finalBody = await aiRewrite(built.body, {
        platform: t.platform,
        dayName,
        humeur,
      });
    }

    posts.push({
      templateId: t.id,
      platform: t.platform,
      post_kind: t.post_kind,
      title: built.title,
      body: finalBody,
      hashtags: built.hashtags,
      target_url: t.target_url,
    });
  }

  // 5. Insert in DB (status=klaar zodat ze meteen klaar staan voor review)
  const inserts = posts.map((p) => ({
    platform: p.platform,
    post_kind: p.post_kind,
    status: "klaar" as const,
    title: p.title,
    body: p.body,
    hashtags: p.hashtags || null,
    target_url: p.target_url,
    utm_source: p.platform,
    utm_medium: "social",
    utm_campaign: `${now.toISOString().slice(0, 7).replace("-", "")}-${p.templateId}`,
    notes: `🤖 auto-engine · template:${p.templateId} · humeur:${humeur} · dag:${dayName}`,
  }));

  const { error } = await db.from("social_posts").insert(inserts);
  if (error) {
    return {
      generated: 0,
      posts: [],
      skipped: [`DB-fout: ${error.message}`],
    };
  }

  return { generated: posts.length, posts, skipped };
}

// =====================================================================
// Stats-helper — wordt door cron-endpoint gebruikt voor reporting
// =====================================================================
export async function countTodaysGenerated(): Promise<number> {
  const db = getSupabaseAdmin();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count } = await db
    .from("social_posts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start.toISOString())
    .like("notes", "%🤖 auto-engine%");
  return count ?? 0;
}

void PORTFOLIO;
