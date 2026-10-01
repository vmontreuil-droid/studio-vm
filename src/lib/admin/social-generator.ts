// AI Content Engine — kern.
//
// Wordt aangeroepen door /api/cron/social-generate (dagelijks 7u).
//
// Logica:
// 1. Check welke templates de laatste 14 dagen al gebruikt zijn → vermijd herhaling
// 2. Bepaal dag-van-de-week (1=ma … 5=vr)
// 3. Kies 3 templates passend bij die dag, gemengd platform-FB/LI
// 4. Build elke post met variabele-injectie (realisaties uit
//    src/lib/realisaties.ts — beelden in public/3d/r/)
// 5. (optioneel) AI-modus — als ANTHROPIC_API_KEY is gezet, geef de
//    template-output aan Claude voor lichte herschrijving + variatie
// 6. Insert in social_posts met status='klaar' + 'Genereer-engine'-marker
//    in notes-veld. Enkel drafts — er wordt nooit automatisch gepost.

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  kiesRealisatie,
  pickTemplatesForDay,
  pickStoryCaseForDay,
  type TemplateCtx,
} from "./social-templates";

export type GeneratedPost = {
  id?: string; // ingevuld na DB-insert
  templateId: string;
  platform: "facebook" | "linkedin";
  post_kind: string;
  title: string;
  body: string;
  hashtags: string;
  target_url: string;
  /** Projectbeeld om bij de post te voegen (pad in /public). */
  beeld?: string;
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
  hint: { platform: string; dayName: string; humeur: string; taal: "nl" | "fr" },
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
            content: `Je bent Vincent Montreuil, landmeter. Onder de naam Studio VM (studio-vm.be) maak je 3D-ontwerpmodellen voor machinesturing (graafmachines, graders, dozers) voor aannemers in grond-, weg- en waterbouw, in het juiste coördinatenstelsel en per systeem (Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar), aan een transparant uurtarief. ${hint.taal === "fr" ? "Schrijf in het Frans (Belgisch-Frans, vakjargon van terrassement en voirie)." : "Schrijf altijd in Belgisch-Nederlands (geen Hollandse termen), vakjargon van grondwerken en wegenbouw."} Korte, eerlijke, zelfverzekerde toon zonder verkoop-jargon. Noem nooit andere merken, producten of bedrijfsnamen dan die in de originele post staan.

Herschrijf onderstaande post-tekst voor ${hint.platform}. Het is ${hint.dayName}. Stem: ${hint.humeur}.

Behoud de boodschap en structuur, maar varieer:
- Andere openingszin
- Andere woordkeuze waar mogelijk
- Behoud feitelijke claims, cijfers, prijzen, URLs, merknamen en coördinatenstelsels exact zoals ze zijn
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

  // 3. Kies templates + story-case voor vandaag
  const templates = pickTemplatesForDay(dayOfWeek, recentIds, count);
  // Week-nummer voor de vrijdag-alternantie tussen twee stories
  const weekNumber = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
      (7 * 86_400_000),
  );
  const storyTemplate = pickStoryCaseForDay(dayOfWeek, weekNumber);
  if (storyTemplate) templates.push(storyTemplate);

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

  const kaarten: (string | undefined)[] = [];
  for (const t of templates) {
    const ctx: TemplateCtx = {
      dayName,
      dayShort,
      date: dateLabel,
      realisatie: kiesRealisatie,
    };
    const built = t.build(ctx);
    let finalBody = built.body;

    // AI-mode optionele rewrite
    if (process.env.ANTHROPIC_API_KEY) {
      finalBody = await aiRewrite(built.body, {
        platform: t.platform,
        dayName,
        humeur,
        taal: t.taal ?? "nl",
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
      beeld: built.beeld,
    });
    kaarten.push(built.kaart);
  }

  // 5. Insert in DB (status=klaar zodat ze meteen klaar staan voor review)
  // Story-posts krijgen 'format:story' marker zodat image-route auto-detecteert
  const inserts = posts.map((p, i) => {
    const isStory = p.post_kind === "story";
    return {
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
      attachments_json: p.beeld ? [{ type: "image", src: p.beeld }] : [],
      notes: `🤖 auto-engine · template:${p.templateId} · humeur:${humeur} · dag:${dayName}${kaarten[i] ? ` · kaart:${kaarten[i]}` : ""}${p.beeld ? ` · beeld:${p.beeld}` : ""}${isStory ? " · format:story" : ""}`,
    };
  });

  const { data: inserted, error } = await db
    .from("social_posts")
    .insert(inserts)
    .select("id, title");
  if (error) {
    return {
      generated: 0,
      posts: [],
      skipped: [`DB-fout: ${error.message}`],
    };
  }

  // Match inserted rows met posts via title → vul id in zodat de digest-mail
  // image-URLs kan opbouwen
  const byTitle = new Map(
    ((inserted as Array<{ id: string; title: string }> | null) ?? []).map(
      (r) => [r.title, r.id],
    ),
  );
  const postsWithId = posts.map((p) => ({ ...p, id: byTitle.get(p.title) }));

  return { generated: posts.length, posts: postsWithId, skipped };
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

