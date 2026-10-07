// Gedeelde stukken van /admin/social en /admin/social/wachtrij (server).
//
// Statuspillen en meldingen: effen achtergrond met donkere tekst (leesbaar in
// licht én donker thema). Geen Tailwind-opaciteit op de thema-kleuren
// (bg-accent/15 werkt niet op var-kleuren): color-mix() waar nodig.

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Link2,
  Pencil,
  RotateCcw,
  RotateCw,
  SkipForward,
  Trash2,
} from "lucide-react";
import {
  deleteSocialPost,
  probeerOpnieuw,
  setSocialStatus,
  updateSocialPost,
  zetAllesAutomatisch,
  type SocialPost,
} from "@/app/actions/social";
import { leesPublicatie, type KanaalPublicatie } from "@/lib/social/publish";
import {
  KANAAL_LABEL,
  POST_TYPES,
  POST_TYPE_LABEL,
  TALEN,
  kanalenVoorPlaats,
  nieuweStatus,
  plaatsSoort,
  tekstProblemen,
  type NieuweStatus,
  type PostType,
} from "@/lib/admin/social-templates";
import { LINK_BUDGET_PER_MAAND, datumVeld, socialUtmLink, type MigratieStand } from "@/lib/admin/social-generator";
import { socialBeeldPad, type SocialFormaat } from "@/lib/social/beeld-url";
import { CopyButton } from "./copy-button";
import { VoorbeeldBeeld } from "./voorbeeld-beeld";

// =====================================================================
// Kleine stukken
// =====================================================================

const KANAAL_TEGEL: Record<string, { letter: string; cls: string }> = {
  facebook: { letter: "f", cls: "bg-[#1877F2] text-white" },
  instagram: { letter: "IG", cls: "bg-[#D62976] text-white" },
  google: { letter: "G", cls: "bg-[#1A73E8] text-white" },
  youtube: { letter: "YT", cls: "bg-[#FF0000] text-white" },
  tiktok: { letter: "TT", cls: "bg-[#010101] text-white ring-1 ring-inset ring-white/25" },
  pinterest: { letter: "P", cls: "bg-[#E60023] text-white" },
  x: { letter: "X", cls: "bg-[#0F1419] text-white ring-1 ring-inset ring-white/25" },
  threads: { letter: "@", cls: "bg-[#101010] text-white ring-1 ring-inset ring-white/25" },
  bluesky: { letter: "B", cls: "bg-[#1185FE] text-white" },
  algemeen: { letter: "•", cls: "bg-stone-300 text-stone-900" },
  linkedin: { letter: "in", cls: "bg-stone-300 text-stone-900" },
};

export function KanaalTegel({ kanaal, groot = false }: { kanaal: string; groot?: boolean }) {
  const t = KANAAL_TEGEL[kanaal] ?? { letter: kanaal.charAt(0).toUpperCase(), cls: "bg-stone-300 text-stone-900" };
  return (
    <span
      title={KANAAL_LABEL[kanaal] ?? kanaal}
      className={`inline-grid shrink-0 place-items-center rounded-md font-mono font-bold ${groot ? "h-7 w-7 text-[11px]" : "h-5 w-5 text-[9px]"} ${t.cls}`}
    >
      {t.letter}
    </span>
  );
}

export function kanalenVan(p: Pick<SocialPost, "kanalen" | "platform">): string[] {
  return Array.isArray(p.kanalen) && p.kanalen.length ? p.kanalen : [p.platform];
}

export function KanaalRij({ post }: { post: Pick<SocialPost, "kanalen" | "platform"> }) {
  const k = kanalenVan(post);
  return (
    <span className="flex flex-wrap items-center gap-1" aria-label={`Kanalen: ${k.map((x) => KANAAL_LABEL[x] ?? x).join(", ")}`}>
      {k.map((x) => (
        <KanaalTegel key={x} kanaal={x} />
      ))}
    </span>
  );
}

const STATUS_STIJL: Record<NieuweStatus | "wacht", { label: string; cls: string }> = {
  wacht: { label: "Wacht op akkoord", cls: "bg-amber-300 text-stone-950" },
  concept: { label: "Concept", cls: "bg-stone-300 text-stone-950" },
  goedgekeurd: { label: "Goedgekeurd", cls: "bg-emerald-300 text-stone-950" },
  gepland: { label: "Gepland bij kanaal", cls: "bg-sky-300 text-stone-950" },
  gepubliceerd: { label: "Gepubliceerd", cls: "bg-emerald-500 text-stone-950" },
  mislukt: { label: "Mislukt", cls: "bg-rose-300 text-stone-950" },
  overgeslagen: { label: "Overgeslagen", cls: "bg-stone-200 text-stone-700" },
};

export function statusSleutel(p: Pick<SocialPost, "status" | "goedkeuring_nodig">): NieuweStatus | "wacht" {
  const s = nieuweStatus(p.status);
  return s === "concept" && p.goedkeuring_nodig ? "wacht" : s;
}

export function StatusPil({ post }: { post: Pick<SocialPost, "status" | "goedkeuring_nodig"> }) {
  const s = STATUS_STIJL[statusSleutel(post)];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

export const STATUS_KLEUR: Record<NieuweStatus | "wacht", string> = {
  wacht: "#fcd34d",
  concept: "#d6d3d1",
  goedgekeurd: "#6ee7b7",
  gepland: "#7dd3fc",
  gepubliceerd: "#10b981",
  mislukt: "#fda4af",
  overgeslagen: "#78716c",
};
export const STATUS_LABEL = Object.fromEntries(Object.entries(STATUS_STIJL).map(([k, v]) => [k, v.label])) as Record<
  NieuweStatus | "wacht",
  string
>;

export function Pil({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
      {children}
    </span>
  );
}

export function plaatsVan(p: Pick<SocialPost, "post_kind" | "platform">): { formaat: SocialFormaat; label: string; ratio: string } {
  if (p.post_kind === "reel") return { formaat: "story", label: "Reel", ratio: "9 / 16" };
  if (p.post_kind === "story") return { formaat: "story", label: "Story", ratio: "9 / 16" };
  if (p.platform === "google" || p.platform === "algemeen") return { formaat: "gbp", label: "Google-bericht", ratio: "4 / 3" };
  return { formaat: "portrait", label: "Bericht", ratio: "4 / 5" };
}

/** Beeldbronnen: JPEG-route, oude kaartroute, bronbeeld. */
export function beeldBronnen(p: SocialPost, formaat: SocialFormaat): string[] {
  const v = p.media?.v ?? (p.updated_at ? Date.parse(p.updated_at).toString(36) : undefined);
  const nieuw = p.media?.beelden?.[formaat] ?? socialBeeldPad(p.id, formaat, v);
  const oud = `/api/social-image/${p.id}${formaat === "story" ? "?format=story" : ""}`;
  const kaart = p.media?.kaart ?? p.notes?.match(/kaart:(\/3d\/[^\s·]+)/)?.[1];
  return [nieuw, oud, ...(kaart ? [kaart] : [])];
}

export function wanneerKort(iso: string | null): string {
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

// =====================================================================
// Banners
// =====================================================================

export function Banner({ toon = "amber", children }: { toon?: "amber" | "groen" | "rood" | "blauw"; children: React.ReactNode }) {
  const cls =
    toon === "groen"
      ? "border-emerald-400 bg-emerald-200 text-emerald-950"
      : toon === "rood"
        ? "border-rose-400 bg-rose-200 text-rose-950"
        : toon === "blauw"
          ? "border-sky-400 bg-sky-200 text-sky-950"
          : "border-amber-400 bg-amber-200 text-amber-950";
  return <div className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-sm ${cls}`}>{children}</div>;
}

export function MigratieBanner({ migratie }: { migratie: MigratieStand }) {
  if (migratie.kolommen && migratie.tokens) return null;
  return (
    <Banner>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
      <span>
        <strong>Migratie 0050 nog draaien</strong>{" "}
        <code className="break-all font-mono text-[12px]">supabase/migrations/0050_social_automatisch.sql</code>. Tot dan plant de
        contentmachine niets, kan er niets goedgekeurd worden (ook niet via de mail) en kunnen kanalen per bericht niet gekozen
        worden. Bestaande berichten blijven gewoon zichtbaar.
      </span>
    </Banner>
  );
}

const MELDINGEN: Record<string, { toon: "amber" | "groen" | "rood" | "blauw"; tekst: string }> = {
  opgeslagen: { toon: "groen", tekst: "Opgeslagen." },
  aangemaakt: { toon: "groen", tekst: "Nieuw concept aangemaakt." },
  goedgekeurd: { toon: "groen", tekst: "Goedgekeurd: het bericht gaat uit op het geplande tijdstip." },
  overgeslagen: { toon: "blauw", tekst: "Overgeslagen: dit bericht wordt niet gepubliceerd." },
  status: { toon: "groen", tekst: "Status aangepast." },
  verwijderd: { toon: "blauw", tekst: "Bericht verwijderd." },
  linkbudget: {
    toon: "amber",
    tekst: `Niet als linkbericht gezet: er staan deze maand al ${LINK_BUDGET_PER_MAAND} linkberichten gepland (Facebook beperkt links per maand).`,
  },
  "auto-aan": { toon: "amber", tekst: "Alles automatisch staat aan: ook realisaties gaan voortaan zonder akkoord uit." },
  "auto-uit": { toon: "groen", tekst: "Alles automatisch staat uit: realisaties wachten weer op uw akkoord." },
  planfout: { toon: "rood", tekst: "Plannen lukte niet. Is migratie 0050 gedraaid?" },
  "migratie-nodig": {
    toon: "amber",
    tekst: "Niet aangepast: goedkeuren en plannen kan pas na migratie 0050. Overslaan en als gepubliceerd markeren gaan wel.",
  },
  "geen-kanaal": {
    toon: "amber",
    tekst: "Kanalen niet aangepast: een bericht heeft minstens één kanaal nodig. Wilt u het niet publiceren, kies dan Overslaan.",
  },
  "niets-te-plannen": { toon: "blauw", tekst: "Niets te plannen: elke plaats van die week staat al gepland of is voorbij." },
  opnieuw: {
    toon: "groen",
    tekst: "Opnieuw goedgekeurd: de publisher probeert de mislukte kanalen bij de volgende run (binnen het half uur). Wat al gelukt is, gaat niet opnieuw uit.",
  },
  "kanalen-geen-sleutel": { toon: "amber", tekst: "Nog geen BUFFER_API_KEY: zet de sleutel in Vercel (Production) en deploy opnieuw." },
  "kanalen-sleutel": { toon: "rood", tekst: "Buffer weigert de API-sleutel. Maak in Buffer een nieuwe sleutel, vervang ze in Vercel en deploy opnieuw." },
  "kanalen-limiet": { toon: "amber", tekst: "Buffer laat even geen verzoeken meer toe (limiet). Probeer het over een kwartier opnieuw." },
  "kanalen-fout": { toon: "rood", tekst: "Buffer was niet bereikbaar of gaf een fout. Probeer het zo meteen opnieuw." },
  "kanaal-opgeslagen": { toon: "groen", tekst: "Kanaal aangepast." },
  "kanaal-onbekend": { toon: "amber", tekst: "Dat kanaal staat niet (meer) in de lijst. Druk op Verbinding testen om ze opnieuw op te halen." },
  "groep-toegevoegd": { toon: "groen", tekst: "Groep toegevoegd." },
  "groep-verwijderd": { toon: "blauw", tekst: "Groep verwijderd." },
  "groep-gepost": { toon: "groen", tekst: "Genoteerd: in die groep kan u over twee weken weer posten." },
  "groep-terug": { toon: "blauw", tekst: "Teruggezet." },
  "groep-fout": { toon: "amber", tekst: "Niet toegevoegd: geef een naam en (optioneel) het adres van de groep op facebook.com." },
};

export function Melding({ code }: { code?: string }) {
  if (!code) return null;
  const gepland = code.match(/^gepland-(\d+)$/);
  const kanalen = code.match(/^kanalen-ok-(\d+)$/);
  const m = gepland
    ? { toon: "groen" as const, tekst: `${gepland[1]} ${gepland[1] === "1" ? "bericht" : "berichten"} gepland. Het weekoverzicht is gemaild.` }
    : kanalen
      ? {
          toon: (kanalen[1] === "0" ? "amber" : "groen") as "amber" | "groen",
          tekst:
            kanalen[1] === "0"
              ? "De sleutel werkt, maar er is nog geen kanaal verbonden in Buffer."
              : `Verbinding in orde: ${kanalen[1]} ${kanalen[1] === "1" ? "kanaal" : "kanalen"} gevonden.`,
        }
      : MELDINGEN[code];
  if (!m) return null;
  return (
    <div role="status">
      <Banner toon={m.toon}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
        <span>{m.tekst}</span>
      </Banner>
    </div>
  );
}

// =====================================================================
// Schakelaar "alles automatisch"
// =====================================================================

export function AutoSchakelaar({ aan, terug }: { aan: boolean; terug: string }) {
  return (
    <form action={zetAllesAutomatisch} className="flex items-start gap-3">
      <input type="hidden" name="terug" value={terug} />
      <input type="hidden" name="aan" value={aan ? "nee" : "ja"} />
      <button
        type="submit"
        role="switch"
        aria-checked={aan}
        className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
          aan ? "border-amber-500 bg-amber-400" : "border-border bg-card-hover"
        }`}
        title={aan ? "Uitzetten: realisaties wachten weer op akkoord" : "Aanzetten: alles gaat zonder akkoord uit"}
      >
        <span className="sr-only">Alles automatisch</span>
        <span
          className={`inline-block h-5 w-5 rounded-full shadow-sm transition-transform ${
            aan ? "translate-x-6 bg-stone-950" : "translate-x-1 bg-stone-400"
          }`}
        />
      </button>
      <span className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">Alles automatisch</span>
        <span className="block text-xs text-muted">
          {aan
            ? "Aan: ook realisaties gaan zonder akkoord uit."
            : "Uit: tips, vragen, carrousels, aanbod en video's gaan vanzelf uit; realisaties wachten op uw akkoord."}
        </span>
      </span>
    </form>
  );
}

// =====================================================================
// Resultaat van de publisher per kanaal
// =====================================================================

const PUBLICATIE_STIJL: Record<KanaalPublicatie["status"], { label: string; cls: string }> = {
  gepubliceerd: { label: "", cls: "bg-emerald-300 text-stone-950" },
  verzonden: { label: "verzonden", cls: "bg-sky-300 text-stone-950" },
  bezig: { label: "bezig", cls: "bg-amber-300 text-stone-950" },
  opnieuw: { label: "volgende run", cls: "bg-amber-300 text-stone-950" },
  mislukt: { label: "mislukt", cls: "bg-rose-300 text-stone-950" },
  overgeslagen: { label: "overgeslagen", cls: "bg-stone-200 text-stone-700" },
};

/** Per kanaal: gelukt (met link), verzonden, mislukt (met reden) of overgeslagen (met reden). */
export function PublicatieRij({ post }: { post: Pick<SocialPost, "publicatie"> }) {
  const p = leesPublicatie(post.publicatie);
  const lijst = Object.entries(p.kanalen);
  if (!lijst.length && !p.reden) return null;
  const toelichting = lijst.filter(([, e]) => (e.status === "mislukt" && e.fout) || (e.status === "overgeslagen" && e.reden));
  return (
    <div className="mt-3 rounded-xl border border-border p-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Publicatie</p>
      {p.reden && <p className="mt-1.5 text-[13px] text-muted">{p.reden}</p>}
      {lijst.length > 0 && (
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          {lijst.map(([k, e]) => {
            const s = PUBLICATIE_STIJL[e.status] ?? PUBLICATIE_STIJL.bezig;
            const inhoud = (
              <>
                <KanaalTegel kanaal={e.kanaal} />
                {KANAAL_LABEL[e.kanaal] ?? e.kanaal}
                {s.label && <span className="font-normal">· {s.label}</span>}
                {e.url && <ExternalLink className="h-3 w-3" strokeWidth={2.5} />}
              </>
            );
            const cls = `inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 text-[11px] font-semibold ${s.cls}`;
            return e.url ? (
              <a key={k} href={e.url} target="_blank" rel="noreferrer" className={`${cls} hover:opacity-90`} title="Bekijken op het kanaal">
                {inhoud}
              </a>
            ) : (
              <span key={k} className={cls} title={e.fout ?? e.reden ?? undefined}>
                {inhoud}
              </span>
            );
          })}
        </p>
      )}
      {toelichting.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[12px] text-muted">
          {toelichting.map(([k, e]) => (
            <li key={k}>
              <span className="font-medium text-foreground">{KANAAL_LABEL[e.kanaal] ?? e.kanaal}:</span> {e.status === "mislukt" ? e.fout : e.reden}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function heeftMislukteKanalen(p: Pick<SocialPost, "publicatie">): boolean {
  return Object.values(leesPublicatie(p.publicatie).kanalen).some((e) => e.status === "mislukt");
}

// =====================================================================
// Eén bericht in de wachtrij
// =====================================================================

function ActieKnop({
  id,
  naar,
  label,
  terug,
  cls,
  icon: Icon,
}: {
  id: string;
  naar: NieuweStatus;
  label: string;
  terug: string;
  cls: string;
  icon: typeof Clock;
}) {
  return (
    <form action={setSocialStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={naar} />
      <input type="hidden" name="terug" value={terug} />
      <button
        type="submit"
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-90 ${cls}`}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
        {label}
      </button>
    </form>
  );
}

const veld =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function BerichtKaart({
  post,
  migratie,
  terug,
  linkTelling,
}: {
  post: SocialPost;
  migratie: MigratieStand;
  terug: string;
  /** Linkberichten in de maand van dit bericht (zonder dit bericht). */
  linkTelling?: number;
}) {
  const plaats = plaatsVan(post);
  const sleutel = statusSleutel(post);
  const s = nieuweStatus(post.status);
  const problemen = tekstProblemen(post);
  const type = post.post_type && post.post_type in POST_TYPE_LABEL ? POST_TYPE_LABEL[post.post_type as PostType] : null;
  const anker = `b-${post.id.slice(0, 8)}`;
  const terugHier = `${terug.split("#")[0]}#${anker}`;
  const kanEen = migratie.kolommen;
  const isFeed = plaats.formaat === "portrait";
  const kanaalKeuze = kanalenVoorPlaats(plaatsSoort(post));
  const volledigeTekst = [post.body ?? "", post.hashtags ?? ""].filter(Boolean).join("\n\n");
  const doorgegeven = s === "gepland" || s === "gepubliceerd";

  return (
    <article id={anker} className="scroll-mt-24 rounded-2xl bg-card p-4 shadow-sm sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <a
          href={beeldBronnen(post, plaats.formaat)[0]}
          target="_blank"
          rel="noreferrer"
          className={`shrink-0 ${plaats.formaat === "story" ? "w-16 sm:w-20" : plaats.formaat === "gbp" ? "w-24 sm:w-32" : "w-20 sm:w-28"}`}
          title="Beeld in volle grootte"
        >
          <VoorbeeldBeeld bronnen={beeldBronnen(post, plaats.formaat)} alt={post.title} ratio={plaats.ratio} className="w-full" />
        </a>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {wanneerKort(post.scheduled_for)} · {plaats.label}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold leading-snug sm:text-base">{post.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusPil post={post} />
            {type && <Pil>{type}</Pil>}
            {post.taal && <Pil title="Taal">{post.taal.toUpperCase()}</Pil>}
            {post.link_post && (
              <Pil title="Dit bericht gebruikt één van de linkberichten van de maand">
                <Link2 className="h-3 w-3" strokeWidth={2.5} /> linkbericht
              </Pil>
            )}
          </div>
          <div className="mt-2">
            <KanaalRij post={post} />
          </div>
        </div>
      </div>

      {post.body && (
        <p className="mt-3 line-clamp-4 whitespace-pre-line text-[13px] leading-relaxed text-muted">
          {post.body.replace(/\n\s*\n+/g, "\n")}
        </p>
      )}
      {post.hashtags && <p className="mt-1 text-[12px] text-muted">{post.hashtags}</p>}

      {problemen.length > 0 && (
        <div className="mt-3">
          <Banner>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
            <span>
              <strong>Niet automatisch:</strong> {problemen.join(", ")}.
            </span>
          </Banner>
        </div>
      )}

      <PublicatieRij post={post} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {kanEen && (sleutel === "wacht" || s === "concept" || s === "overgeslagen") && (
          <ActieKnop id={post.id} naar="goedgekeurd" label="Goedkeuren" terug={terugHier} icon={CheckCircle2} cls="bg-emerald-300 text-stone-950" />
        )}
        {kanEen && (s === "mislukt" || (s === "gepubliceerd" && heeftMislukteKanalen(post))) && (
          <form action={probeerOpnieuw}>
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="terug" value={terugHier} />
            <button
              type="submit"
              title="Enkel de kanalen die mislukten; wat al gelukt is, gaat niet opnieuw uit"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-300 px-3 py-1.5 text-[13px] font-semibold text-stone-950 transition-opacity hover:opacity-90"
            >
              <RotateCw className="h-3.5 w-3.5" strokeWidth={2.5} />
              Opnieuw proberen
            </button>
          </form>
        )}
        {!doorgegeven && s !== "overgeslagen" && (
          <ActieKnop id={post.id} naar="overgeslagen" label="Overslaan" terug={terugHier} icon={SkipForward} cls="bg-stone-300 text-stone-950" />
        )}
        {kanEen && s === "goedgekeurd" && (
          <ActieKnop id={post.id} naar="concept" label="Tegenhouden" terug={terugHier} icon={RotateCcw} cls="bg-amber-300 text-stone-950" />
        )}
        {volledigeTekst && <CopyButton text={volledigeTekst} label="Tekst" />}
        {!kanEen && !doorgegeven && s !== "overgeslagen" && (
          <span className="text-xs text-muted">Goedkeuren kan na migratie 0050.</span>
        )}
      </div>

      <details className="group mt-3 rounded-xl border border-border">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[13px] font-medium text-muted hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
          Aanpassen
          <span className="ml-auto font-mono text-[10px] uppercase tracking-widest group-open:hidden">openen</span>
        </summary>
        <form action={updateSocialPost} className="space-y-3 border-t border-border p-3">
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="terug" value={terugHier} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Label tekst="Tijdstip (Belgische tijd)">
              <input type="datetime-local" name="datum" defaultValue={datumVeld(post.scheduled_for)} className={veld} />
            </Label>
            <Label tekst="Kop op het beeld">
              <input name="title" defaultValue={post.title} maxLength={200} required className={veld} />
            </Label>
          </div>
          {kanEen && kanaalKeuze.length > 1 && (
            <fieldset>
              <legend className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">Kanalen</legend>
              <input type="hidden" name="kanalen_getoond" value="1" />
              <div className="flex flex-wrap gap-1.5">
                {kanaalKeuze.map((k) => (
                  <label
                    key={k}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-[12px] has-[:checked]:border-accent has-[:checked]:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                  >
                    <input type="checkbox" name="kanalen" value={k} defaultChecked={kanalenVan(post).includes(k)} className="accent-[var(--accent)]" />
                    <KanaalTegel kanaal={k} />
                    {KANAAL_LABEL[k]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {kanEen && isFeed && (
            <label className="flex items-start gap-2 text-[13px]">
              <input type="hidden" name="link_getoond" value="1" />
              <input type="checkbox" name="link_post" defaultChecked={!!post.link_post} className="mt-1 accent-[var(--accent)]" />
              <span>
                Linkbericht (de link met UTM gaat mee naar de kanalen)
                <span className="block text-xs text-muted">
                  Facebook beperkt links tot ±{LINK_BUDGET_PER_MAAND} per maand.
                  {typeof linkTelling === "number" && ` Deze maand al ${linkTelling} van ${LINK_BUDGET_PER_MAAND} gepland.`}
                </span>
              </span>
            </label>
          )}
          <Label tekst="Bijschrift (zonder link)">
            <textarea name="body" rows={6} defaultValue={post.body ?? ""} maxLength={5000} className={veld} />
          </Label>
          {kanEen && (
            <Label tekst="Korte tekst voor X en Bluesky (± 200 tekens)">
              <textarea name="tekst_kort" rows={2} defaultValue={post.tekst_kort ?? ""} maxLength={300} className={veld} />
            </Label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Label tekst="Hashtags (hoogstens 5)">
              <input name="hashtags" defaultValue={post.hashtags ?? ""} maxLength={500} className={veld} />
            </Label>
            <Label tekst="Doelpagina (voor knop, bio en linkbericht)">
              <input name="target_url" defaultValue={post.target_url ?? ""} maxLength={500} placeholder="/nl/offerte" className={veld} />
            </Label>
          </div>
          {kanEen && (
            <div className="grid grid-cols-2 gap-3">
              <Label tekst="Taal">
                <select name="taal" defaultValue={post.taal ?? "nl"} className={veld}>
                  {TALEN.map((t) => (
                    <option key={t} value={t}>
                      {t.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Label>
              <Label tekst="Soort">
                <select name="post_type" defaultValue={post.post_type ?? "tip"} className={veld}>
                  {POST_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {POST_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </Label>
            </div>
          )}
          {s === "gepubliceerd" && (
            <div className="grid grid-cols-3 gap-2">
              <Label tekst="Likes">
                <input name="result_likes" type="number" min={0} defaultValue={post.result_likes ?? 0} className={veld} />
              </Label>
              <Label tekst="Reacties">
                <input name="result_comments" type="number" min={0} defaultValue={post.result_comments ?? 0} className={veld} />
              </Label>
              <Label tekst="Gedeeld">
                <input name="result_shares" type="number" min={0} defaultValue={post.result_shares ?? 0} className={veld} />
              </Label>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="submit" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-[13px] font-semibold text-white hover:opacity-90 [.theme-dark_&]:text-stone-950">
              Opslaan
            </button>
            <CopyButton text={socialUtmLink(post, kanalenVan(post)[0] ?? "facebook")} label="Link met UTM" />
          </div>
        </form>
        <form action={deleteSocialPost} className="flex justify-end border-t border-border px-3 py-2">
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="terug" value={terug.split("#")[0]} />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-medium text-muted hover:bg-rose-200 hover:text-rose-950"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            Verwijderen
          </button>
        </form>
      </details>
    </article>
  );
}

export function Label({ tekst, children }: { tekst: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted">{tekst}</span>
      {children}
    </label>
  );
}

/** Compacte regel (dashboard, bibliotheek). */
export function BerichtRegel({
  post,
  href,
  bronnen,
  pil,
  verbonden,
}: {
  post: SocialPost;
  href?: string;
  bronnen?: string[];
  /** Vervangt de statuspil (bv. bij een voorstel). */
  pil?: React.ReactNode;
  /** Verbonden en actieve kanalen: dan telt de regel enkel die (de rest wordt overgeslagen). */
  verbonden?: Set<string>;
}) {
  const plaats = plaatsVan(post);
  const aantalKanalen = kanalenVan(post).filter((k) => !verbonden || verbonden.has(k)).length;
  const inhoud = (
    <>
      <span className={`shrink-0 ${plaats.formaat === "story" ? "w-8" : plaats.formaat === "gbp" ? "w-14" : "w-11"}`}>
        <VoorbeeldBeeld bronnen={bronnen ?? beeldBronnen(post, plaats.formaat)} alt="" ratio={plaats.ratio} className="w-full rounded-md" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{post.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-muted">
          <span>{wanneerKort(post.scheduled_for ?? post.created_at)}</span>
          <span>{plaats.label}</span>
          {post.taal && <span>{post.taal}</span>}
          <span>
            {aantalKanalen} {aantalKanalen === 1 ? "kanaal" : "kanalen"}
          </span>
        </span>
        <span className="mt-1.5 block sm:hidden">{pil ?? <StatusPil post={post} />}</span>
      </span>
      <span className="hidden shrink-0 sm:block">{pil ?? <StatusPil post={post} />}</span>
    </>
  );
  return href ? (
    <a href={href} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-card-hover">
      {inhoud}
    </a>
  ) : (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2">{inhoud}</div>
  );
}
