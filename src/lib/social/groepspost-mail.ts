// Om de twee dagen een mail met de groepspost in de vier talen: tekst, link
// voor de eerste reactie en de vier beelden, plus de groepen waar u nu mag
// posten. Zo kan het rechtstreeks vanaf de gsm (cron groepspost).

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { portalEmailHtml, siteLink } from "@/lib/email";
import { huidigeWeek } from "@/lib/admin/social-generator";
import type { PostRij } from "@/lib/social/publish";
import { GROEP_TALEN, dagenTotVrij, groepsversies, leesGroepen, type FbGroep, type GroepTaal, type Groepspost } from "@/lib/social/groepen";

/** Hoogstens één mail per zoveel uur (de cron loopt dagelijks). */
export const GROEPSPOST_MAIL_UUR = 44;
const SLEUTEL = "groepspost_mail";

const TAAL_NAAM: Record<GroepTaal, string> = { nl: "Nederlands", fr: "Frans", en: "Engels", de: "Duits" };
const FONT = "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Wanneer en welk bericht er laatst gemaild werd. */
export async function laatsteGroepspostMail(): Promise<{ op: string; postId: string } | null> {
  const { data } = await getSupabaseAdmin().from("app_settings").select("value").eq("key", SLEUTEL).maybeSingle();
  try {
    const v = data?.value ? JSON.parse(String(data.value)) : null;
    return v && typeof v.op === "string" && typeof v.postId === "string" ? v : null;
  } catch {
    return null;
  }
}

export async function bewaarGroepspostMail(postId: string, op = new Date()): Promise<void> {
  await getSupabaseAdmin()
    .from("app_settings")
    .upsert(
      { key: SLEUTEL, value: JSON.stringify({ op: op.toISOString(), postId }), updated_at: op.toISOString() },
      { onConflict: "key" },
    );
}

/** Het meest recente paginabericht dat al verscheen (geen story of Google), van de laatste drie dagen. */
export async function recentstePaginapost(nu = new Date()): Promise<PostRij | null> {
  const { data } = await getSupabaseAdmin()
    .from("social_posts")
    .select("*")
    .eq("post_kind", "page")
    .neq("platform", "google")
    .eq("status", "gepubliceerd")
    .gte("scheduled_for", new Date(nu.getTime() - 3 * 86_400_000).toISOString())
    .lte("scheduled_for", nu.toISOString())
    .order("scheduled_for", { ascending: false })
    .limit(1);
  return ((data as PostRij[] | null) ?? [])[0] ?? null;
}

function versieHtml(g: Groepspost): string {
  const beelden = g.beelden
    .map(
      (b) =>
        `<a href="${esc(b.url)}" style="display:inline-block;margin:0 6px 6px 0"><img src="${esc(b.url)}" width="96" height="120" alt="" style="display:block;width:96px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #e7e5e4"></a>`,
    )
    .join("");
  return `<div style="border:1px solid #e7e5e4;border-radius:12px;padding:16px;margin:0 0 14px;font-family:${FONT}">
<div style="font:700 11px/1.3 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;color:#e08214">${esc(TAAL_NAAM[g.taal])}</div>
<div style="margin-top:6px;font-size:16px;font-weight:700;color:#1c1917">${esc(g.titel)}</div>
<div style="margin-top:10px">${beelden}</div>
<div style="margin-top:6px;font-size:12px;color:#78716c">1 · Tekst voor de groep</div>
<div style="margin-top:4px;padding:10px 12px;background:#fafaf9;border-radius:8px;font-size:14px;line-height:1.55;color:#292524;white-space:pre-wrap">${esc(g.tekst).replace(/\n/g, "<br>")}</div>
<div style="margin-top:10px;font-size:12px;color:#78716c">2 · Eerste reactie (de link)</div>
<div style="margin-top:4px;padding:10px 12px;background:#fafaf9;border-radius:8px;font-size:13px;line-height:1.5;color:#292524;word-break:break-all">${esc(g.reactie)}</div>
</div>`;
}

function groepenHtml(groepen: FbGroep[]): string {
  if (!groepen.length) {
    return `<p style="margin:0 0 14px;font:400 14px/1.6 ${FONT};color:#78716c">Nog geen groepen in uw lijst. Voeg ze toe op de groepspagina, dan staat hier telkens waar u mag posten.</p>`;
  }
  const vrij = groepen.filter((g) => dagenTotVrij(g) === 0);
  const lijst = vrij.length
    ? vrij
        .map((g) => `<li style="margin:0 0 4px">${g.url ? `<a href="${esc(g.url)}" style="color:#e08214;text-decoration:none">${esc(g.naam)}</a>` : esc(g.naam)} <span style="color:#a8a29e">(${g.taal.toUpperCase()})</span></li>`)
        .join("")
    : "";
  return vrij.length
    ? `<p style="margin:0 0 6px;font:600 14px/1.6 ${FONT};color:#1c1917">Hier mag u nu posten:</p><ul style="margin:0 0 14px;padding-left:18px;font:400 14px/1.6 ${FONT};color:#44403c">${lijst}</ul>`
    : `<p style="margin:0 0 14px;font:400 14px/1.6 ${FONT};color:#78716c">In al uw groepen werd de laatste 14 dagen al gepost. Reageer vandaag gerust op vragen van anderen; posten kan weer binnenkort.</p>`;
}

export async function groepspostMail(post: PostRij): Promise<{ subject: string; html: string }> {
  const versies = groepsversies(post).sort((a, b) => GROEP_TALEN.indexOf(a.taal) - GROEP_TALEN.indexOf(b.taal));
  const groepen = await leesGroepen();
  const nl = versies.find((v) => v.taal === "nl") ?? versies[0]!;
  const pad = `/admin/social/groepen?week=${huidigeWeek()}&post=${post.id}`;
  return {
    subject: `Groepspost: ${nl.titel}`,
    html: portalEmailHtml({
      locale: "nl",
      eyebrow: "Groepspost",
      title: nl.titel,
      bodyLines: [
        "De groepspost van vandaag, in de vier talen. Download de beelden, kopieer de tekst in de groep en zet de link als eerste reactie. Daarna op de groepspagina op Gepost klikken.",
      ],
      extraHtml: groepenHtml(groepen) + versies.map(versieHtml).join(""),
      ctaLabel: "Open de groepspagina",
      ctaHref: siteLink(pad),
    }),
  };
}
