import Link from "next/link";
import {
  Share2,
  Send,
  Sparkles,
  FileText,
  TrendingUp,
  Settings as SettingsIcon,
  Trash2,
  CheckCircle2,
  Link2,
  Activity,
  Plus,
  Archive,
  Globe,
} from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  listSocialPosts,
  listAppSettings,
  createSocialPost,
  setSocialStatus,
  deleteSocialPost,
  setAppSetting,
  updateSocialPost,
  getUtmStats,
  type SocialPost,
} from "@/app/actions/social";
import { BarList, ChartCard } from "@/components/charts";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";

// Lucide-react (huidige versie) heeft geen brand-icons meer voor FB/LinkedIn/IG —
// we renderen letter-tiles met de officiële brand-kleur per platform.
const platformMeta: Record<
  SocialPost["platform"],
  {
    icon: typeof Globe | null;
    letter: string;
    label: string;
    bg: string;
    color: string;
  }
> = {
  facebook: {
    icon: null,
    letter: "f",
    label: "Facebook",
    bg: "bg-[#1877F2]/15",
    color: "text-[#1877F2]",
  },
  linkedin: {
    icon: null,
    letter: "in",
    label: "LinkedIn",
    bg: "bg-[#0A66C2]/15",
    color: "text-[#0A66C2]",
  },
  instagram: {
    icon: null,
    letter: "IG",
    label: "Instagram",
    bg: "bg-pink-500/15",
    color: "text-pink-500",
  },
  x: {
    icon: null,
    letter: "X",
    label: "X",
    bg: "bg-foreground/10",
    color: "text-foreground",
  },
  algemeen: {
    icon: Globe,
    letter: "",
    label: "Algemeen",
    bg: "bg-accent/15",
    color: "text-accent",
  },
};

const statusMeta: Record<
  SocialPost["status"],
  { label: string; bg: string; color: string }
> = {
  idee: {
    label: "Idee",
    bg: "bg-foreground/10",
    color: "text-muted",
  },
  concept: {
    label: "Concept",
    bg: "bg-amber-500/15",
    color: "text-amber-600 dark:text-amber-400",
  },
  klaar: {
    label: "Klaar om te posten",
    bg: "bg-sky-500/15",
    color: "text-sky-600 dark:text-sky-400",
  },
  gepost: {
    label: "Gepost",
    bg: "bg-green-500/15",
    color: "text-green-600 dark:text-green-400",
  },
  gearchiveerd: {
    label: "Gearchiveerd",
    bg: "bg-foreground/5",
    color: "text-muted",
  },
};

function buildUtmLink(p: SocialPost): string {
  const base = "https://studio-vm.be";
  const path = p.target_url || "/";
  const params = new URLSearchParams();
  if (p.utm_source) params.set("utm_source", p.utm_source);
  if (p.utm_medium) params.set("utm_medium", p.utm_medium);
  if (p.utm_campaign) params.set("utm_campaign", p.utm_campaign);
  const qs = params.toString();
  return base + path + (qs ? (path.includes("?") ? "&" : "?") + qs : "");
}

export default async function AdminSocial() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const [posts, settings, utmStats] = await Promise.all([
    listSocialPosts(),
    listAppSettings(),
    getUtmStats(),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayYmd = now.toISOString().slice(0, 10);

  const postsByStatus = {
    idee: posts.filter((p) => p.status === "idee"),
    concept: posts.filter((p) => p.status === "concept"),
    klaar: posts.filter((p) => p.status === "klaar"),
    gepost: posts.filter((p) => p.status === "gepost"),
    gearchiveerd: posts.filter((p) => p.status === "gearchiveerd"),
  };

  const postsThisMonth = posts.filter(
    (p) => new Date(p.created_at).getTime() >= monthStart.getTime(),
  ).length;
  const postedToday = posts.filter(
    (p) => p.posted_at?.slice(0, 10) === todayYmd,
  ).length;
  const totalClicksFromSocial = utmStats
    .filter((s) =>
      ["facebook", "linkedin", "instagram", "x"].includes(s.source),
    )
    .reduce((s, x) => s + x.views, 0);

  const settingsByKey = new Map(settings.map((s) => [s.key, s.value]));
  const pixelKeys: Array<{ key: string; label: string; placeholder: string }> = [
    { key: "fb_pixel_id", label: "Meta Pixel ID (Facebook + Instagram)", placeholder: "1234567890123456" },
    { key: "linkedin_insight_id", label: "LinkedIn Insight Tag", placeholder: "1234567" },
    { key: "instagram_business_id", label: "Instagram Business Account ID", placeholder: "17841405..." },
    { key: "google_analytics_id", label: "Google Analytics 4 Measurement ID", placeholder: "G-XXXXXXXXXX" },
    { key: "tiktok_pixel_id", label: "TikTok Pixel ID", placeholder: "CXXXXXXXXXXXXXXXXXX" },
  ];

  const utmBars = utmStats
    .slice(0, 10)
    .map((s) => ({
      label: `${s.source}${s.campaign ? ` · ${s.campaign}` : ""}`,
      value: s.views,
    }));

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-pink-500/15 text-pink-500">
            <Share2 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Social Media
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Hub voor alle posts, drafts, UTM-links en pixel-tracking — één
              plek voor wat je op Facebook, LinkedIn, Instagram en X plant.
            </p>
          </div>
        </div>
        <Link
          href="/admin/webactiviteit"
          className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:bg-card-hover hover:text-foreground"
        >
          <Activity className="h-3 w-3" strokeWidth={2.5} />
          Webactiviteit
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={FileText}
          label="Posts deze maand"
          value={String(postsThisMonth)}
          hint={`${posts.length} totaal in library`}
        />
        <Kpi
          icon={Send}
          label="Klaar om te posten"
          value={String(postsByStatus.klaar.length)}
          hint={`${postsByStatus.concept.length} nog in concept`}
          tone={postsByStatus.klaar.length > 0 ? "good" : "neutral"}
        />
        <Kpi
          icon={CheckCircle2}
          label="Gepost vandaag"
          value={String(postedToday)}
          hint={`${postsByStatus.gepost.length} totaal gepost`}
        />
        <Kpi
          icon={TrendingUp}
          label="Klikken via social (30d)"
          value={String(totalClicksFromSocial)}
          hint="uit page_views met UTM"
          tone={totalClicksFromSocial > 0 ? "accent" : "neutral"}
        />
      </div>

      {/* === NIEUWE POST === */}
      <details className="mt-4 rounded-2xl bg-card shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-accent">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span>
              <p className="text-sm font-semibold">Nieuwe post toevoegen</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                concept · UTM-link wordt automatisch gegenereerd
              </p>
            </span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            klik om uit te klappen
          </span>
        </summary>
        <form action={createSocialPost} className="border-t px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Titel (intern)">
              <input
                name="title"
                required
                maxLength={200}
                placeholder="bv. Lancering studio-vm op persoonlijk profiel"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Platform">
                <select
                  name="platform"
                  defaultValue="facebook"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                  <option value="x">X (Twitter)</option>
                  <option value="algemeen">Algemeen</option>
                </select>
              </Field>
              <Field label="Soort post">
                <select
                  name="post_kind"
                  defaultValue="persoonlijk"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="persoonlijk">Persoonlijk profiel</option>
                  <option value="page">Business page</option>
                  <option value="group">In groep</option>
                  <option value="ad">Advertentie</option>
                  <option value="story">Story</option>
                  <option value="article">Article</option>
                </select>
              </Field>
            </div>
            <Field label="Tekst van de post (de inhoud die je copy-paste)">
              <textarea
                name="body"
                rows={5}
                maxLength={5000}
                placeholder="De volledige post-tekst zoals je hem op Facebook/LinkedIn wil plakken…"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
            <Field label="Hashtags (los, niet in body)">
              <textarea
                name="hashtags"
                rows={5}
                maxLength={500}
                placeholder="#kmo #vlaanderen #website"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
            <Field label="Landingspagina (pad)">
              <input
                name="target_url"
                defaultValue="/nl/health-check"
                maxLength={500}
                placeholder="/nl/health-check"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
            <Field label="UTM-campagne (optioneel — leeg = auto)">
              <input
                name="utm_campaign"
                maxLength={80}
                placeholder="auto — 202605-lancering-persoonlijk"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-accent/30 transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Concept aanmaken
            </button>
          </div>
        </form>
      </details>

      {/* === POSTS-LIBRARY per status === */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <PostsColumn
          title="Concepts & klaar om te posten"
          icon={FileText}
          posts={[...postsByStatus.idee, ...postsByStatus.concept, ...postsByStatus.klaar]}
          emptyText="Nog geen drafts. Voeg er een toe via 'Nieuwe post'."
        />
        <PostsColumn
          title="Gepost & gearchiveerd"
          icon={CheckCircle2}
          posts={[...postsByStatus.gepost, ...postsByStatus.gearchiveerd]}
          emptyText="Nog niets gepost."
        />
      </div>

      {/* === UTM-STATS === */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Klikken per bron/campagne — laatste 30 dagen">
          {utmBars.length === 0 ? (
            <p className="rounded-xl bg-background/30 p-6 text-center text-sm text-muted">
              Nog geen UTM-traffic. Stuur de gegenereerde links eens uit via
              een post en je ziet de eerste klikken hier verschijnen.
            </p>
          ) : (
            <BarList items={utmBars} color="#a855f7" />
          )}
        </ChartCard>

        <ChartCard title="Pixel-IDs & tracking-codes">
          <form action={setAppSetting} className="space-y-2.5">
            <input type="hidden" name="__multi" value="1" />
            {pixelKeys.map((p) => (
              <div key={p.key} className="grid grid-cols-3 gap-2">
                <label className="col-span-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {p.label}
                </label>
                <input
                  defaultValue={settingsByKey.get(p.key) ?? ""}
                  placeholder={p.placeholder}
                  className="col-span-2 rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:border-accent"
                  readOnly
                />
                <SaveOneSettingForm
                  k={p.key}
                  current={settingsByKey.get(p.key) ?? ""}
                  placeholder={p.placeholder}
                />
              </div>
            ))}
          </form>
          <p className="mt-3 font-mono text-[10px] text-muted">
            Pixel-IDs worden later automatisch geïnjecteerd op alle publieke
            paginas zodra ze hier zijn ingevuld. Nu nog placeholder-bewaring.
          </p>
        </ChartCard>
      </div>
    </>
  );
}

// =====================================================================
// Sub-componenten (server-side)
// =====================================================================
function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "bad" | "accent";
}) {
  const toneCls =
    tone === "good"
      ? "text-green-600 dark:text-green-400"
      : tone === "bad"
        ? "text-red-500"
        : tone === "accent"
          ? "text-accent"
          : "text-foreground";
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted" strokeWidth={2} />
      </div>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${toneCls}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 truncate text-[11px] text-muted">{hint}</p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function PostsColumn({
  title,
  icon: Icon,
  posts,
  emptyText,
}: {
  title: string;
  icon: typeof Activity;
  posts: SocialPost[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
          <Icon className="h-3 w-3" strokeWidth={2.5} />
          {title}
        </p>
        <span className="font-mono text-[10px] text-muted">{posts.length}</span>
      </div>
      {posts.length === 0 ? (
        <p className="rounded-xl bg-background/30 p-6 text-center text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const meta = platformMeta[post.platform];
  const sm = statusMeta[post.status];
  const utmLink = buildUtmLink(post);
  const PIcon = meta.icon;

  return (
    <li className="rounded-xl bg-background/40 p-3">
      {/* Header-rij */}
      <div className="flex items-start gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${meta.bg} ${meta.color}`}
        >
          {PIcon ? (
            <PIcon className="h-4 w-4" strokeWidth={2} />
          ) : (
            <span className="font-mono text-xs font-bold lowercase">
              {meta.letter}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{post.title}</p>
          <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className={`rounded-full ${sm.bg} px-1.5 py-0.5 ${sm.color}`}>
              {sm.label}
            </span>
            <span>·</span>
            <span>{meta.label}</span>
            <span>·</span>
            <span>{post.post_kind ?? "—"}</span>
          </p>
        </div>
      </div>

      {/* Body-preview */}
      {post.body && (
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-[13px] text-foreground/80">
          {post.body}
        </p>
      )}
      {post.hashtags && (
        <p className="mt-1 line-clamp-2 font-mono text-[11px] text-sky-600 dark:text-sky-400">
          {post.hashtags}
        </p>
      )}

      {/* UTM-link */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-foreground/5 p-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} />
        <code className="min-w-0 flex-1 truncate font-mono text-[10px] text-foreground/80">
          {utmLink}
        </code>
        <CopyButton text={utmLink} label="UTM-link" variant="solid" />
        {post.body && (
          <CopyButton
            text={`${post.body}\n\n${post.hashtags ?? ""}\n\n${utmLink}`}
            label="Volledige post"
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {post.status !== "klaar" && post.status !== "gepost" && (
          <StatusBtn
            id={post.id}
            to="klaar"
            label="→ Klaar"
            cls="bg-sky-500/15 text-sky-600 dark:text-sky-400"
          />
        )}
        {post.status !== "gepost" && (
          <StatusBtn
            id={post.id}
            to="gepost"
            label="→ Gepost"
            cls="bg-green-500/15 text-green-600 dark:text-green-400"
            icon={CheckCircle2}
          />
        )}
        {post.status !== "gearchiveerd" && (
          <StatusBtn
            id={post.id}
            to="gearchiveerd"
            label="Archiveer"
            cls="bg-foreground/5 text-muted"
            icon={Archive}
          />
        )}
        {post.status === "gearchiveerd" && (
          <StatusBtn
            id={post.id}
            to="concept"
            label="Herstel"
            cls="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          />
        )}
        <form action={deleteSocialPost} className="ml-auto">
          <input type="hidden" name="id" value={post.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-red-500 transition-colors hover:bg-red-500/20"
          >
            <Trash2 className="h-3 w-3" strokeWidth={2.5} />
            Verwijder
          </button>
        </form>
      </div>

      {/* Editable inline notitie + posted_url + result counts */}
      <details className="mt-2">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-muted hover:text-foreground">
          + bewerken / resultaten
        </summary>
        <form
          action={updateSocialPost}
          className="mt-2 space-y-2 rounded-lg bg-foreground/5 p-2"
        >
          <input type="hidden" name="id" value={post.id} />
          <input
            name="title"
            defaultValue={post.title}
            className="w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <textarea
            name="body"
            rows={4}
            defaultValue={post.body ?? ""}
            placeholder="Tekst van de post"
            className="w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <textarea
            name="hashtags"
            rows={2}
            defaultValue={post.hashtags ?? ""}
            placeholder="#hashtags"
            className="w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="target_url"
              defaultValue={post.target_url ?? "/"}
              placeholder="/nl/health-check"
              className="rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
            />
            <input
              name="utm_campaign"
              defaultValue={post.utm_campaign ?? ""}
              placeholder="utm_campaign"
              className="rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
            />
          </div>
          <input
            name="posted_url"
            defaultValue={post.posted_url ?? ""}
            placeholder="Echte FB/LinkedIn-link na posten (optioneel)"
            className="w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              name="result_likes"
              type="number"
              min={0}
              defaultValue={post.result_likes ?? 0}
              placeholder="likes"
              className="rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
            />
            <input
              name="result_comments"
              type="number"
              min={0}
              defaultValue={post.result_comments ?? 0}
              placeholder="comments"
              className="rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
            />
            <input
              name="result_shares"
              type="number"
              min={0}
              defaultValue={post.result_shares ?? 0}
              placeholder="shares"
              className="rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
            />
          </div>
          <textarea
            name="notes"
            rows={2}
            defaultValue={post.notes ?? ""}
            placeholder="Privé-notities"
            className="w-full rounded border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white hover:opacity-90"
          >
            Opslaan
          </button>
        </form>
      </details>
    </li>
  );
}

function StatusBtn({
  id,
  to,
  label,
  cls,
  icon: Icon,
}: {
  id: string;
  to: SocialPost["status"];
  label: string;
  cls: string;
  icon?: typeof Activity;
}) {
  return (
    <form action={setSocialStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={to} />
      <button
        type="submit"
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-opacity hover:opacity-80 ${cls}`}
      >
        {Icon && <Icon className="h-3 w-3" strokeWidth={2.5} />}
        {label}
      </button>
    </form>
  );
}

function SaveOneSettingForm({
  k,
  current,
  placeholder,
}: {
  k: string;
  current: string;
  placeholder: string;
}) {
  return (
    <form action={setAppSetting} className="contents">
      <input type="hidden" name="key" value={k} />
      <details className="col-span-1">
        <summary className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-foreground/5 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted hover:bg-foreground/10 hover:text-foreground">
          <SettingsIcon className="h-3 w-3" strokeWidth={2.5} />
          {current ? "wijzig" : "vul in"}
        </summary>
        <div className="mt-1 flex gap-1">
          <input
            name="value"
            defaultValue={current}
            placeholder={placeholder}
            className="w-full rounded border bg-background px-2 py-1 text-[10px] outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded bg-accent px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-white hover:opacity-90"
          >
            ok
          </button>
        </div>
      </details>
    </form>
  );
}

// Houd Sparkles + Send-icon refs alive (kunnen weg)
void Sparkles;
void Send;
