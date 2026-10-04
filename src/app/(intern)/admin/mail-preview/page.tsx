import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getOutreachConfig,
  langVoorProspect,
  signalenUitRij,
} from "@/lib/admin/outreach";
import { getCompanySettings } from "@/lib/admin/settings";
import { TestMailButton } from "@/components/test-mail-button";
import {
  bedrijfVoorMail,
  buildOutreachMail,
  buildOutreachSamples,
} from "@/lib/admin/outreach-mail";
import { GRADE_LABEL, isAannemerGrade } from "@/lib/admin/aannemers";
import { sourceFromLand, type Land } from "@/lib/admin/prospect-source";
import { klantMailVoorbeelden } from "@/lib/klant-mails";
import { LOCALES, isValidLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

type Categorie = "Outreach" | "Klant" | "Support" | "Archief websites";

type Preview = {
  id: string;
  title: string;
  category: Categorie;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

// Outreach-voorbeelden + ELKE klantmail, gebouwd door de echte bouwers uit
// src/lib/klant-mails.ts in de gekozen taal (id = "<mail>.<taal>").
function buildPreviews(
  outreach: ReturnType<typeof buildOutreachSamples>,
  taal: Locale,
): Preview[] {
  const out: Preview[] = outreach.map((s) => ({
    id: s.id,
    title: s.title,
    category: "Outreach",
    subject: s.mail.subject,
    html: s.mail.html,
    text: s.mail.text,
    from: s.mail.from,
  }));
  for (const v of klantMailVoorbeelden(taal)) {
    out.push({
      id: `${v.id}.${taal}`,
      title: v.titel,
      category: v.groep,
      subject: v.mail.subject,
      html: v.mail.html,
      replyTo: v.mail.replyTo,
    });
  }
  return out;
}

type EchteRij = {
  land: string;
  prospect_id: string;
  website: string | null;
  scan_score: number | null;
  scan_grade: string | null;
  scan_stack: string | null;
  scan_issues: string[] | null;
  scan_token: string | null;
  mail_to: string | null;
  status: string;
};

export default async function MailPreview({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; land?: string; pid?: string; v?: string; taal?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const [cfg, settings] = await Promise.all([
    getOutreachConfig(),
    getCompanySettings(),
  ]);
  const bedrijf = bedrijfVoorMail(settings);
  // Taal van de klantmails: ?taal=…, anders die van de gekozen mail-id.
  const idTaal = /\.(nl|fr|en|de|es)$/.exec(sp.id ?? "")?.[1];
  const taal: Locale = isValidLocale(sp.taal) ? sp.taal : isValidLocale(idTaal) ? idTaal : "nl";
  const previews = buildPreviews(buildOutreachSamples(cfg, bedrijf), taal);
  const db = getSupabaseAdmin();

  // Echte prospects met de hoogste prioriteit — om de mail te zien zoals
  // hij écht zou vertrekken (er wordt hier niets verstuurd).
  const { data: topData } = await db
    .from("prospect_outreach")
    .select("land, prospect_id, website, scan_score, scan_grade, mail_to, status")
    .like("scan_grade", "3D:%")
    .eq("status", "gescand")
    .is("mail_sent_at", null)
    .order("scan_score", { ascending: false })
    .limit(10);
  const top =
    (topData as Pick<
      EchteRij,
      "land" | "prospect_id" | "website" | "scan_score" | "scan_grade" | "mail_to" | "status"
    >[] | null) ?? [];

  // Gekozen echte prospect?
  let echt: {
    rij: EchteRij;
    naam: string | null;
    preview: Preview;
  } | null = null;
  let echtFout: string | null = null;
  if (sp.land && sp.pid) {
    const land = sourceFromLand(sp.land).land as Land;
    const { data } = await db
      .from("prospect_outreach")
      .select(
        "land, prospect_id, website, scan_score, scan_grade, scan_stack, scan_issues, scan_token, mail_to, status",
      )
      .eq("land", land)
      .eq("prospect_id", sp.pid)
      .maybeSingle();
    const rij = data as EchteRij | null;
    if (!rij) {
      echtFout = "Geen outreach-rij gevonden voor deze prospect.";
    } else {
      const src = sourceFromLand(land);
      const { data: pr } = await db
        .from(src.table)
        .select("name")
        .eq(src.idCol, rij.prospect_id)
        .maybeSingle();
      const signalen = signalenUitRij(rij);
      const lang = await langVoorProspect(land, rij.prospect_id, signalen);
      const variant = sp.v === "followup" ? "followup" : "first";
      const m = buildOutreachMail(
        { land, website: rij.website, signalen, token: rij.scan_token ?? "voorbeeld-token" },
        cfg,
        bedrijf,
        lang,
        variant,
      );
      echt = {
        rij,
        naam: (pr as { name: string | null } | null)?.name ?? null,
        preview: {
          id: `echt-${land}-${rij.prospect_id}`,
          title: `${variant === "first" ? "Eerste mail" : "Opvolgmail"} (${lang.toUpperCase()})`,
          category: "Outreach",
          subject: m.subject,
          html: m.html,
          text: m.text,
          from: m.from,
        },
      };
      if (!isAannemerGrade(rij.scan_grade)) {
        echtFout =
          "Deze rij komt uit de oude website-campagne (score A–F) en wordt door de aannemers-engine nooit gemaild. Zo zou de mail eruitzien als ze opnieuw gekwalificeerd wordt.";
      }
    }
  }

  const selected: Preview =
    echt?.preview ?? previews.find((p) => p.id === sp.id) ?? previews[0];
  const isSample = !echt;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mail-preview</h1>
          <p className="mt-0.5 max-w-3xl text-sm text-muted">
            De automatische mails van Studio VM in echte HTML-rendering. De
            klantmails komen rechtstreeks uit de bouwers die ook versturen
            (<code>src/lib/klant-mails.ts</code>), in de taal hiernaast. De
            outreach-mails gaan naar aannemers (3D-modellen voor
            machinesturing) in het Nederlands, Frans, Engels en Duits.
            Teksten: <code>src/lib/admin/outreach-mail.ts</code>.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {LOCALES.map((l) => {
              const basis = selected.id.replace(/\.(nl|fr|en|de|es)$/, "");
              const heeftTaal = /\.(nl|fr|en|de|es)$/.test(selected.id);
              return (
                <Link
                  key={l}
                  href={`/admin/mail-preview?taal=${l}${isSample && heeftTaal ? `&id=${basis}.${l}` : ""}`}
                  className={`rounded-full border px-3 py-1 font-mono text-xs uppercase ${
                    l === taal ? "border-accent bg-accent/15 font-semibold text-accent" : "text-muted hover:bg-card-hover"
                  }`}
                >
                  {l}
                </Link>
              );
            })}
          </div>
        </div>
        {cfg.paused ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-950">
            <Pause className="h-3.5 w-3.5" strokeWidth={2.5} /> Outreach gepauzeerd
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-green-950">
            <Play className="h-3.5 w-3.5" strokeWidth={2.5} /> Outreach actief
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Lijst */}
        <aside className="space-y-3">
          <div className="rounded-2xl bg-card p-3 shadow-sm">
            {(["Klant", "Support", "Archief websites", "Outreach"] as const).map(
              (cat) => (
                <div key={cat} className="mb-3 last:mb-0">
                  <p className="px-2 pb-1 font-mono text-[10px] font-medium uppercase tracking-widest text-muted">
                    {cat === "Outreach"
                      ? "Outreach — aannemers (voorbeelden)"
                      : cat === "Klant"
                        ? `Klantmails (${taal.toUpperCase()})`
                        : cat === "Support"
                          ? `Support — tickets (${taal.toUpperCase()})`
                          : `Archief websites (${taal.toUpperCase()})`}
                  </p>
                  <ul className="space-y-1">
                    {previews
                      .filter((p) => p.category === cat)
                      .map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/admin/mail-preview?id=${p.id}`}
                            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                              isSample && selected.id === p.id
                                ? "bg-accent/15 font-medium text-accent"
                                : "text-muted hover:bg-card-hover hover:text-foreground"
                            }`}
                          >
                            {p.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ),
            )}
          </div>

          <div className="rounded-2xl bg-card p-3 shadow-sm">
            <p className="px-2 pb-1 font-mono text-[10px] font-medium uppercase tracking-widest text-muted">
              Echte prospects — hoogste prioriteit
            </p>
            {top.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted">
                Nog geen gekwalificeerde aannemers. Die verschijnen na de
                eerste kwalificatie-run (outreach-prescan), die enkel loopt
                als de engine niet gepauzeerd is.
              </p>
            ) : (
              <ul className="space-y-1">
                {top.map((t) => (
                  <li key={`${t.land}-${t.prospect_id}`}>
                    <Link
                      href={`/admin/mail-preview?land=${t.land}&pid=${encodeURIComponent(t.prospect_id)}`}
                      className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                        echt?.rij.prospect_id === t.prospect_id && echt?.rij.land === t.land
                          ? "bg-accent/15 font-medium text-accent"
                          : "text-muted hover:bg-card-hover hover:text-foreground"
                      }`}
                    >
                      <span className="block truncate font-medium">
                        {(t.website ?? t.mail_to ?? t.prospect_id).replace(/^https?:\/\//, "")}
                      </span>
                      <span className="font-mono text-[10px]">
                        {t.land.toUpperCase()} · prio {t.scan_score ?? "—"} ·{" "}
                        {isAannemerGrade(t.scan_grade) ? GRADE_LABEL[t.scan_grade] : t.scan_grade}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <form action="/admin/mail-preview" className="mt-3 grid grid-cols-[70px_1fr] gap-2 border-t px-1 pt-3">
              <select
                name="land"
                defaultValue={sp.land ?? "be"}
                className="rounded-lg border bg-background px-2 py-1.5 text-xs outline-none focus:border-accent"
              >
                <option value="be">BE</option>
                <option value="fr">FR</option>
                <option value="uk">UK</option>
              </select>
              <input
                name="pid"
                defaultValue={sp.pid ?? ""}
                placeholder="ondernemingsnr. / siret"
                className="rounded-lg border bg-background px-2 py-1.5 text-xs outline-none focus:border-accent"
              />
              <button className="col-span-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-card-hover">
                Toon mail voor deze prospect
              </button>
            </form>
          </div>
        </aside>

        {/* Detail */}
        <section className="space-y-3">
          {echtFout && (
            <div className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-medium text-amber-950">
              {echtFout}
            </div>
          )}
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            {echt && (
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4 text-xs">
                <span className="font-medium">{echt.naam ?? echt.rij.prospect_id}</span>
                <span className="font-mono text-muted">
                  {echt.rij.land.toUpperCase()} · {echt.rij.prospect_id} · prio {echt.rij.scan_score ?? "—"} · {echt.rij.status}
                </span>
                {(echt.rij.scan_issues ?? []).map((s) => (
                  <span key={s} className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">
                    {s}
                  </span>
                ))}
                <span className="ml-auto flex gap-1.5">
                  <Link
                    href={`/admin/mail-preview?land=${echt.rij.land}&pid=${encodeURIComponent(echt.rij.prospect_id)}`}
                    className={`rounded-full border px-2.5 py-1 ${sp.v !== "followup" ? "border-accent text-accent" : ""}`}
                  >
                    Eerste mail
                  </Link>
                  <Link
                    href={`/admin/mail-preview?land=${echt.rij.land}&pid=${encodeURIComponent(echt.rij.prospect_id)}&v=followup`}
                    className={`rounded-full border px-2.5 py-1 ${sp.v === "followup" ? "border-accent text-accent" : ""}`}
                  >
                    Opvolgmail
                  </Link>
                </span>
              </div>
            )}
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Onderwerp
            </p>
            <p className="mt-1 font-medium">{selected.subject}</p>
            {selected.from && (
              <>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                  Van
                </p>
                <p className="mt-1 font-mono text-sm">{selected.from}</p>
              </>
            )}
            {selected.replyTo && (
              <>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                  Antwoorden naar
                </p>
                <p className="mt-1 font-mono text-sm">{selected.replyTo}</p>
              </>
            )}
            {echt?.rij.mail_to && (
              <>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                  Aan (wordt hier niet verstuurd)
                </p>
                <p className="mt-1 font-mono text-sm">{echt.rij.mail_to}</p>
              </>
            )}
            {isSample && (
              <div className="mt-4 border-t pt-4">
                <TestMailButton id={selected.id} to={cfg.senderEmail} />
                <p className="mt-2 text-xs text-muted">
                  Verstuurt enkel dit voorbeeld naar jouw eigen afzender-adres
                  (met <code>[TEST]</code> in het onderwerp), om de weergave
                  in Gmail/Outlook te controleren. Nooit naar een prospect.
                </p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
            <div className="border-b px-5 py-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                HTML-weergave (zoals in de mailbox)
              </p>
            </div>
            <iframe
              srcDoc={selected.html}
              sandbox=""
              className="block h-[760px] w-full bg-white"
              title={selected.title}
            />
          </div>

          {selected.text && (
            <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
              <div className="border-b px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Platte tekst-versie (voor mailclients zonder HTML)
                </p>
              </div>
              <pre className="overflow-auto whitespace-pre-wrap p-5 font-mono text-xs leading-relaxed">
                {selected.text}
              </pre>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
