import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Download,
  FolderKanban,
  MessageSquare,
  Paperclip,
  Receipt,
  Reply,
  StickyNote,
  Tags,
  Timer,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { CATEGORIE_LABEL, STATUS_LABEL, grootteTekst, type Project } from "@/lib/projecten";
import { MINIMUM_UREN, UURTARIEF_CENT, euro, type Categorie } from "@/lib/tarieven";
import { TAAL_NAAM } from "@/lib/projecten-teksten";
import { klantGegevens, type KlantGegevens } from "@/lib/projecten-admin";
import {
  MAX_NOTITIE,
  PREFIX_REVISIE,
  TICKET_SOORTEN,
  afgeleid,
  datumTijd,
  isUuid,
  soortVan,
  ticketRef,
  toonOnderwerp,
  wachtKort,
  wachtUren,
  type BerichtRij,
  type BijlageRij,
  type NotitieRij,
  type TicketSoort,
  type UrenRij,
} from "@/lib/tickets";
import { SOORT_LABEL, TICKET_MAIL } from "@/lib/tickets-teksten";
import { laadBerichten, laadBijlagen, laadTicket, ticketSchema } from "@/lib/tickets-server";
import { bijlageLink } from "@/lib/tickets-bijlagen";
import {
  bijlageNaarPlan,
  boekUren,
  factureerRevisie,
  koppelProject,
  notitieToevoegen,
  notitieVerwijderen,
  snelUren,
  urenNaarProject,
  verwijderUren,
  zetSoort,
  zetStatusAdmin,
} from "@/app/actions/tickets-admin";
import { SubmitButton } from "@/components/submit-button";
import { BevestigKnop } from "@/components/admin/project-cockpit";
import { CategorieBadge, Kaart, StatusBadge, VELD } from "@/components/admin/project-ui";
import { TicketAntwoord } from "@/components/admin/ticket-antwoord";
import { TicketGelezen } from "@/components/admin/ticket-gelezen";

export const dynamic = "force-dynamic";

type ProjectRij = Pick<
  Project,
  | "id"
  | "client_email"
  | "titel"
  | "status"
  | "categorie"
  | "quote_id"
  | "offer_id"
  | "invoice_id"
  | "plannen"
  | "created_at"
  | "gewerkte_uren"
  | "geschatte_uren"
>;
type Factuur = {
  id: string;
  number: string;
  status: string;
  amount_cents: number;
  due_at: string | null;
  vat_reverse?: boolean | null;
};

const PROJECT_KOLOMMEN =
  "id, client_email, titel, status, categorie, quote_id, offer_id, invoice_id, plannen, created_at, gewerkte_uren, geschatte_uren";
const FACTUUR_KOLOMMEN = "id, number, status, amount_cents, due_at";
const CATEGORIEEN: Categorie[] = ["vroegtijdig", "normaal", "last-minute"];

// `zonderMail`: tekst als de mail niet vertrok (&mail=0), zodat er geen "klant gemaild" boven de waarschuwing staat.
const MELDING: Record<string, { ok: boolean; tekst: string; zonderMail?: string }> = {
  aangemaakt: { ok: true, tekst: "Ticket aangemaakt." },
  plan: { ok: true, tekst: "Bijlage als plan aan het project toegevoegd — ze staat in de cockpit en in het portaal van de klant." },
  "plan-bestaat": { ok: false, tekst: "Dit bestand staat al bij de plannen van het project." },
  "plan-fout": { ok: false, tekst: "Kopiëren naar de projectplannen mislukte." },
  "geen-project": { ok: false, tekst: "Koppel eerst een project (van deze klant) aan dit ticket." },
  notitie: { ok: true, tekst: "Interne notitie bewaard." },
  "notitie-weg": { ok: true, tekst: "Notitie verwijderd." },
  "notitie-fout": { ok: false, tekst: `Notitie niet bewaard: leeg of langer dan ${MAX_NOTITIE} tekens.` },
  gesloten: { ok: true, tekst: "Ticket gesloten en de klant is gemaild.", zonderMail: "Ticket gesloten." },
  "gesloten-stil": { ok: true, tekst: "Ticket gesloten (zonder mail aan de klant)." },
  heropend: { ok: true, tekst: "Ticket heropend." },
  "al-gesloten": { ok: true, tekst: "Dit ticket was al gesloten — er is niets gewijzigd en geen mail verstuurd." },
  "al-open": { ok: true, tekst: "Dit ticket stond al open — er is niets gewijzigd." },
  soort: { ok: true, tekst: "Soort aangepast." },
  project: { ok: true, tekst: "Project gekoppeld." },
  "project-los": { ok: true, tekst: "Project losgekoppeld." },
  "project-fout": { ok: false, tekst: "Dat project hoort niet bij deze klant." },
  uren: { ok: true, tekst: "Uren geboekt." },
  "uren-weg": { ok: true, tekst: "Uren verwijderd." },
  "uren-fout": { ok: false, tekst: "Ongeldig aantal uren: per kwartier, van 0,25 tot 99 u." },
  "uren-vast": { ok: false, tekst: "Gefactureerde of bij het project gevoegde uren kunnen niet meer verwijderd worden." },
  "geen-uren": { ok: false, tekst: "Er zijn geen open revisie-uren." },
  factuur: { ok: true, tekst: "Revisiefactuur aangemaakt en de klant is gemaild.", zonderMail: "Revisiefactuur aangemaakt." },
  "factuur-fout": { ok: false, tekst: "Revisiefactuur opslaan mislukte." },
  "factuur-nul": { ok: false, tekst: "Het factuurbedrag is € 0." },
  "factuur-dubbel": { ok: false, tekst: "Deze uren werden intussen al gefactureerd of bij het project gevoegd — er is geen tweede factuur gemaakt." },
  "factuur-bestaat": { ok: false, tekst: "Het project heeft al een lopende factuur — maak een aparte revisiefactuur." },
  "naar-project": { ok: true, tekst: "Uren bij de gewerkte uren van het project gevoegd." },
  migratie: { ok: false, tekst: "Dat kan pas nadat migratie 0049 gedraaid is." },
  fout: { ok: false, tekst: "Er ging iets mis bij het opslaan." },
};

// Labels en meldingen: solide achtergrond met donkere tekst, leesbaar in het
// lichte én het donkere thema (dark: volgt hier enkel de systeemvoorkeur,
// niet de themakeuze van de site).
const SOORT_KLEUR: Record<TicketSoort, string> = {
  vraag: "bg-sky-300 text-stone-950",
  revisie: "bg-amber-300 text-stone-950",
  machine: "bg-red-300 text-stone-950",
  afspraak: "bg-emerald-300 text-stone-950",
  intern: "bg-stone-300 text-stone-950",
};

const KNOP =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const HOOFDKNOP =
  "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";
const PIL = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-xs";
const uurTekst = (u: number) => `${String(Math.round(u * 100) / 100).replace(".", ",")} u`;

const FACTUUR_KLEUR = (s: string) =>
  s === "betaald"
    ? "bg-emerald-300 text-stone-950"
    : s === "vervallen"
      ? "bg-red-300 text-stone-950"
      : "bg-amber-300 text-stone-950";
/** Factuurstatus in woorden ('open' zou verwarren met open, nog niet gefactureerde uren). */
const factuurLabel = (s: string) => (s === "open" ? "onbetaald" : s);

export default async function AdminTicketDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ melding?: string; mail?: string }>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const [schema, t] = await Promise.all([ticketSchema(), laadTicket(id)]);
  if (!t) notFound();

  const db = getSupabaseAdmin();
  const email = t.client_email.trim().toLowerCase();
  const leeg = Promise.resolve({ data: [] as unknown[], error: null });

  const [berichten, bijlagen, notR, urenR, projR, facTicketR] = await Promise.all([
    laadBerichten(t.id),
    schema.bijlagen ? laadBijlagen([t.id]) : Promise.resolve([] as BijlageRij[]),
    schema.notities
      ? db.from("ticket_notities").select("*").eq("ticket_id", t.id).order("created_at", { ascending: true }).limit(500)
      : leeg,
    schema.uren
      ? db.from("ticket_uren").select("*").eq("ticket_id", t.id).order("created_at", { ascending: true }).limit(500)
      : leeg,
    // Enkel om te tonen; eigendom wordt hieronder exact (kleine letters) gecontroleerd.
    db.from("projecten").select(PROJECT_KOLOMMEN).ilike("client_email", email).order("created_at", { ascending: false }).limit(200),
    schema.factuurKoppeling
      ? db.from("invoices").select(`${FACTUUR_KOLOMMEN}, vat_reverse`).eq("ticket_id", t.id).order("created_at", { ascending: true })
      : leeg,
  ]);
  const notities = (notR.data as NotitieRij[] | null) ?? [];
  const uren = ((urenR.data as UrenRij[] | null) ?? []).map((r) => ({
    ...r,
    uren: Number(r.uren),
    tarief_cent: Number(r.tarief_cent),
  }));
  const klantProjecten = ((projR.data as ProjectRij[] | null) ?? []).filter(
    (p) => (p.client_email ?? "").trim().toLowerCase() === email,
  );

  // Gekoppeld project (ook als het onverwacht van een andere klant is: dan tonen we een waarschuwing).
  let project: ProjectRij | null = null;
  let projectVanAnder = false;
  if (isUuid(t.project_id)) {
    project = klantProjecten.find((p) => p.id === t.project_id) ?? null;
    if (!project) {
      const { data } = await db.from("projecten").select(PROJECT_KOLOMMEN).eq("id", t.project_id).maybeSingle();
      project = (data as ProjectRij | null) ?? null;
      projectVanAnder = !!project;
    }
  }
  // Basisstand: een revisie 'Revisie — <titel>' wijst vermoedelijk naar dat project
  // (oude code kortte af op 160 tekens, de basisstand nu op 200).
  const vermoedelijk =
    !schema.v2 && soortVan(t) === "revisie"
      ? (klantProjecten.find((p) =>
          [160, 200].some((n) => t.subject === `${PREFIX_REVISIE}${p.titel}`.slice(0, n)),
        ) ?? null)
      : null;

  // Enkel een project van DEZE klant levert tarief, titel, offerte en klantgegevens;
  // dat van een andere klant tonen we alleen (met waarschuwing), net als de acties.
  const projectOk = !!project && !projectVanAnder;
  const eigenProject = projectOk ? project : null;

  const factuurIds = [...new Set(uren.map((r) => r.invoice_id).filter((x): x is string => isUuid(x)))];
  const facTicket = (facTicketR.data as Factuur[] | null) ?? [];
  const ontbrekend = factuurIds.filter((x) => !facTicket.some((f) => f.id === x));

  const [klant, facUrenR, projFacR, offR, links] = await Promise.all([
    klantGegevens(email, eigenProject?.quote_id ?? null).catch((): KlantGegevens | null => null),
    ontbrekend.length ? db.from("invoices").select(FACTUUR_KOLOMMEN).in("id", ontbrekend) : leeg,
    eigenProject?.invoice_id
      ? db.from("invoices").select(FACTUUR_KOLOMMEN).eq("id", eigenProject.invoice_id).maybeSingle()
      : Promise.resolve({ data: null }),
    eigenProject?.offer_id
      ? db.from("offers").select("vat_reverse").eq("id", eigenProject.offer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    Promise.all(bijlagen.map(async (b) => [b.id, await bijlageLink(b.pad, b.naam, 3600)] as const)),
  ]);
  const facturen = new Map<string, Factuur>();
  for (const f of [...facTicket, ...((facUrenR.data as Factuur[] | null) ?? [])]) facturen.set(f.id, f);
  const projectFactuur = (projFacR.data as Factuur | null) ?? null;
  const offerteVerlegd = !!(offR.data as { vat_reverse?: boolean | null } | null)?.vat_reverse;
  const link = new Map(links);

  // ── Afgeleide toestand ────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/purity
  const nu = Date.now();
  const a = afgeleid(t, berichten);
  const soort = soortVan(t);
  const taal: Locale = isValidLocale(t.locale) ? t.locale : (klant?.taal ?? "nl");
  const aanMij = !a.gesloten && a.wachtOp === "studio";
  const wacht = aanMij ? wachtUren(a.laatsteOp, nu) : null;
  const eersteAntwoord =
    t.eerste_antwoord_op ?? berichten.find((b) => b.sender === "studio")?.created_at ?? null;
  const reactietijd = eersteAntwoord ? wachtKort(wachtUren(t.created_at, Date.parse(eersteAntwoord))) : null;
  const klantNaam = klant?.naam || klant?.bedrijf || null;
  // Object.hasOwn: ?melding=constructor / __proto__ / toString mogen niets van Object.prototype oppikken.
  const melding = typeof sp.melding === "string" && Object.hasOwn(MELDING, sp.melding) ? MELDING[sp.melding] : undefined;
  const migratieOpen = !schema.v2 || !schema.bijlagen || !schema.notities || !schema.uren;

  // Plannen die al bij het project staan (zelfde naam en grootte): geen tweede kopie aanbieden.
  const alsPlan = (b: BijlageRij) =>
    (project?.plannen ?? []).some((x) => x.naam === b.naam && b.grootte != null && Number(x.grootte) === Number(b.grootte));

  // Draad: berichten en interne notities op tijd.
  type Item = { soort: "bericht"; b: BerichtRij; op: number } | { soort: "notitie"; n: NotitieRij; op: number };
  const draad: Item[] = [
    ...berichten.map((b): Item => ({ soort: "bericht", b, op: Date.parse(b.created_at) })),
    ...notities.map((n): Item => ({ soort: "notitie", n, op: Date.parse(n.created_at) })),
  ].sort((x, y) => x.op - y.op);
  const perBericht = new Map<string, BijlageRij[]>();
  for (const b of bijlagen) {
    if (!b.message_id) continue;
    (perBericht.get(b.message_id) ?? perBericht.set(b.message_id, []).get(b.message_id)!).push(b);
  }
  const berichtIds = new Set(berichten.map((b) => b.id));
  const losseBijlagen = bijlagen.filter((b) => !b.message_id || !berichtIds.has(b.message_id));

  // Revisie-uren.
  const open = uren.filter((r) => !r.invoice_id && !r.naar_project_op);
  const openTotaal = Math.round(open.reduce((x, r) => x + r.uren, 0) * 100) / 100;
  const openMinimum = openTotaal > 0 && openTotaal < MINIMUM_UREN;
  const openBedrag =
    open.reduce((x, r) => x + Math.round(r.uren * r.tarief_cent), 0) +
    (openMinimum ? Math.round((MINIMUM_UREN - openTotaal) * open[0].tarief_cent) : 0);
  const openAangerekend = Math.max(openTotaal, MINIMUM_UREN);
  const tarieven = [...new Set(open.map((r) => r.tarief_cent))];
  const openTarief = tarieven.length === 1 ? tarieven[0] : Math.round(openBedrag / Math.max(openAangerekend, 0.01));
  const nieuwTarief = eigenProject ? UURTARIEF_CENT[eigenProject.categorie] : null;
  const titelVoorFactuur = eigenProject?.titel ?? toonOnderwerp(t);
  const autoOmschrijving = open.length ? TICKET_MAIL[taal].revisieOmschrijving(titelVoorFactuur, openAangerekend, openTarief) : "";
  const projectGefactureerd = !!projectFactuur && projectFactuur.status !== "vervallen";
  const btwBuitenland = !!klant?.btw && /^[A-Z]{2}/i.test(klant.btw.trim()) && !/^BE/i.test(klant.btw.trim());
  // 'Bij projecturen voegen' telt op bij wat de projectfactuur nu zou aanrekenen:
  // gewerkte uren, of zolang die leeg zijn de geschatte (zoals urenNaarProject).
  const projGewerkt = eigenProject?.gewerkte_uren != null ? Number(eigenProject.gewerkte_uren) : null;
  const projGeschat = eigenProject?.geschatte_uren != null ? Number(eigenProject.geschatte_uren) : null;
  const projBasis = projGewerkt ?? projGeschat ?? 0;
  const naarProjectSom =
    projGewerkt != null
      ? `${uurTekst(projGewerkt)} gewerkt + ${uurTekst(openTotaal)} revisie = ${uurTekst(projBasis + openTotaal)}`
      : projGeschat != null
        ? `${uurTekst(projGeschat)} geschat + ${uurTekst(openTotaal)} revisie = ${uurTekst(projBasis + openTotaal)}`
        : `nog geen uren op het project → ${uurTekst(openTotaal)}`;

  return (
    <>
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
        Terug naar tickets
      </Link>

      {migratieOpen && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-medium text-stone-950">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>Migratie 0049 nog niet gedraaid — bijlagen, notities, uren en projectkoppeling staan uit.</span>
        </p>
      )}

      {melding && (
        <p
          role="status"
          className={`mt-4 rounded-xl px-4 py-2 text-sm font-medium text-stone-950 ${
            !melding.ok ? "bg-red-400" : sp.mail === "0" ? "bg-amber-400" : "bg-emerald-400"
          }`}
        >
          {sp.mail === "0" && melding.zonderMail ? melding.zonderMail : melding.tekst}
          {melding.ok && sp.mail === "0" && (
            <span className="block font-normal">
              Let op: de mail is niet vertrokken (geen RESEND_API_KEY of verzendfout) — enkel gelogd.
            </span>
          )}
        </p>
      )}

      {/* Kop */}
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted">{ticketRef(t)}</span>
          <span className={`${PIL} ${SOORT_KLEUR[soort]}`}>{SOORT_LABEL[soort].nl}</span>
          <span
            className={`${PIL} ${
              a.gesloten
                ? "bg-stone-300 text-stone-950"
                : aanMij
                  ? "bg-amber-400 font-semibold text-stone-950"
                  : "bg-sky-300 text-stone-950"
            }`}
          >
            {a.gesloten ? "Gesloten" : aanMij ? "Aan mij" : "Wacht op klant"}
          </span>
          {wacht != null && (
            <span
              className={`${PIL} font-semibold ${
                wacht > 48 ? "bg-red-600 text-white" : wacht > 24 ? "bg-amber-400 text-stone-950" : "bg-card-hover text-foreground"
              }`}
              title="Wachttijd sinds het laatste bericht van de klant"
            >
              wacht {wachtKort(wacht)}
            </span>
          )}
        </div>
        <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight">{toonOnderwerp(t) || t.subject}</h1>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt className="text-muted">Klant</dt>
            <dd className="min-w-0 break-words">
              <Link href={`/admin/klanten/${encodeURIComponent(email)}`} className="font-medium hover:text-accent">
                {klantNaam ?? email}
              </Link>
              {klant?.bedrijf && klant?.naam && <span className="text-muted"> · {klant.bedrijf}</span>}
              {klantNaam && <span className="block font-mono text-xs text-muted">{email}</span>}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">Taal</dt>
            <dd>
              {TAAL_NAAM[taal]}
              {!isValidLocale(t.locale) && <span className="text-xs text-muted"> (van de klant)</span>}
            </dd>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <dt className="text-muted">Project</dt>
            <dd className="flex min-w-0 flex-wrap items-center gap-2">
              {project ? (
                <>
                  <Link href={`/admin/projecten/${project.id}`} className="break-words font-medium hover:text-accent">
                    {project.titel}
                  </Link>
                  <CategorieBadge c={project.categorie} />
                  <StatusBadge s={project.status} />
                  {projectVanAnder && (
                    <span className={`${PIL} bg-red-400 font-semibold text-stone-950`}>hoort bij een andere klant!</span>
                  )}
                </>
              ) : vermoedelijk ? (
                <>
                  <Link href={`/admin/projecten/${vermoedelijk.id}`} className="break-words hover:text-accent">
                    {vermoedelijk.titel}
                  </Link>
                  <span className="text-xs text-muted">(vermoedelijk, uit het onderwerp)</span>
                </>
              ) : (
                <span className="text-muted">—</span>
              )}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">Aangemaakt</dt>
            <dd>
              <time dateTime={t.created_at}>{datumTijd(t.created_at, "nl")}</time>
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted">Eerste antwoord</dt>
            <dd>{reactietijd ? `na ${reactietijd}` : <span className="text-muted">nog niet</span>}</dd>
          </div>
          {t.systeem && (
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted">Machinesturing</dt>
              <dd className="break-words">{t.systeem}</dd>
            </div>
          )}
          {soort === "revisie" && (
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted">Akkoord facturatie</dt>
              <dd>
                {t.revisie_akkoord_op ? (
                  datumTijd(t.revisie_akkoord_op, "nl")
                ) : (
                  <span className="text-muted">{schema.v2 ? "niet gegeven (of door u aangemaakt)" : "—"}</span>
                )}
              </dd>
            </div>
          )}
        </dl>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* ── Hoofdkolom: gesprek, antwoord, notitie ── */}
        <div className="min-w-0 space-y-6">
          <Kaart titel={`Gesprek (${berichten.length})`} icoon={MessageSquare}>
            {draad.length === 0 ? (
              <p className="text-sm text-muted">Nog geen berichten.</p>
            ) : (
              <ol className="space-y-3">
                {draad.map((it) =>
                  it.soort === "notitie" ? (
                    <li
                      key={`n-${it.n.id}`}
                      className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-400/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 font-semibold text-stone-950">
                          <StickyNote className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                          Intern — niet zichtbaar voor klant
                        </span>
                        <span className="flex items-center gap-2 text-muted">
                          <time dateTime={it.n.created_at}>{datumTijd(it.n.created_at, "nl")}</time>
                          <form action={notitieVerwijderen}>
                            <input type="hidden" name="ticket_id" value={t.id} />
                            <input type="hidden" name="notitie_id" value={it.n.id} />
                            <BevestigKnop
                              vraag="Deze interne notitie verwijderen?"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                              <span className="sr-only">Notitie verwijderen</span>
                            </BevestigKnop>
                          </form>
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{it.n.body}</p>
                    </li>
                  ) : (
                    <li
                      key={`b-${it.b.id}`}
                      className={`max-w-[94%] rounded-2xl p-4 ${
                        it.b.sender === "studio" ? "ml-auto border border-accent/30 bg-accent/10" : "mr-auto border bg-background"
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted">
                        <span className="font-medium text-foreground">
                          {it.b.sender === "studio" ? "Studio VM" : `Klant${klantNaam ? ` · ${klantNaam}` : ""}`}
                        </span>
                        <time dateTime={it.b.created_at}>{datumTijd(it.b.created_at, "nl")}</time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{it.b.body}</p>
                      {(perBericht.get(it.b.id) ?? []).length > 0 && (
                        <ul className="mt-3 space-y-1.5 border-t pt-3">
                          {(perBericht.get(it.b.id) ?? []).map((b) => (
                            <BijlageRegel
                              key={b.id}
                              b={b}
                              href={link.get(b.id) ?? null}
                              alsPlan={projectOk ? (alsPlan(b) ? "staat" : "kan") : null}
                            />
                          ))}
                        </ul>
                      )}
                    </li>
                  ),
                )}
              </ol>
            )}
            {losseBijlagen.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted">Bijlagen zonder bericht</p>
                <ul className="mt-1.5 space-y-1.5">
                  {losseBijlagen.map((b) => (
                    <BijlageRegel
                      key={b.id}
                      b={b}
                      href={link.get(b.id) ?? null}
                      alsPlan={projectOk ? (alsPlan(b) ? "staat" : "kan") : null}
                    />
                  ))}
                </ul>
              </div>
            )}
          </Kaart>

          <Kaart titel="Antwoorden" icoon={Reply}>
            <TicketAntwoord ticketId={t.id} bijlagen={schema.bijlagen} gesloten={a.gesloten} />
          </Kaart>

          {schema.notities && (
            <Kaart titel="Interne notitie" icoon={StickyNote}>
              <form action={notitieToevoegen} className="space-y-2">
                <input type="hidden" name="ticket_id" value={t.id} />
                <label htmlFor="notitie" className="block text-sm font-medium">
                  Notitie voor uzelf
                </label>
                <textarea
                  id="notitie"
                  name="body"
                  rows={3}
                  maxLength={MAX_NOTITIE}
                  required
                  aria-describedby="notitie-uitleg"
                  className={`${VELD} border-amber-400/60`}
                />
                <p id="notitie-uitleg" className="text-xs text-muted">
                  De klant ziet dit nooit — niet in het portaal en niet in mails.
                </p>
                <SubmitButton pendingLabel="Bewaren…" className={KNOP}>
                  Notitie bewaren
                </SubmitButton>
              </form>
            </Kaart>
          )}
        </div>

        {/* ── Zijkolom ── */}
        <div className="min-w-0 space-y-6">
          <Kaart titel="Status" icoon={Clock}>
            <p className="text-sm">
              {a.gesloten ? (
                <>
                  Gesloten
                  {(t.gesloten_op ?? t.updated_at) && (
                    <span className="text-muted"> sinds {datumTijd(t.gesloten_op ?? t.updated_at, "nl")}</span>
                  )}
                </>
              ) : aanMij ? (
                <>De klant wacht op uw antwoord.</>
              ) : (
                <>U wacht op de klant.</>
              )}
            </p>
            {a.laatsteOp && (
              <p className="mt-1 text-xs text-muted">
                Laatste bericht {a.laatsteAfzender === "studio" ? "van u" : a.laatsteAfzender === "klant" ? "van de klant" : ""}{" "}
                {datumTijd(a.laatsteOp, "nl")}
              </p>
            )}
            {a.gesloten ? (
              <form action={zetStatusAdmin} className="mt-3">
                <input type="hidden" name="ticket_id" value={t.id} />
                <input type="hidden" name="status" value="open" />
                <SubmitButton pendingLabel="Heropenen…" className={KNOP}>
                  Heropenen
                </SubmitButton>
              </form>
            ) : (
              <form action={zetStatusAdmin} className="mt-3 flex flex-wrap items-center gap-3">
                <input type="hidden" name="ticket_id" value={t.id} />
                <input type="hidden" name="status" value="gesloten" />
                <label className="inline-flex min-h-9 items-center gap-2 text-sm">
                  <input type="checkbox" name="mail" value="1" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
                  Klant mailen
                </label>
                <SubmitButton pendingLabel="Sluiten…" className={KNOP}>
                  Ticket sluiten
                </SubmitButton>
              </form>
            )}
          </Kaart>

          <Kaart titel="Soort & project" icoon={Tags}>
            {schema.v2 ? (
              <div className="space-y-4">
                <form action={zetSoort} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="ticket_id" value={t.id} />
                  <label className="min-w-0 flex-1 text-xs text-muted">
                    Soort
                    <select name="soort" defaultValue={soort} className={VELD}>
                      {TICKET_SOORTEN.map((x) => (
                        <option key={x} value={x}>
                          {SOORT_LABEL[x].nl}
                        </option>
                      ))}
                    </select>
                  </label>
                  <SubmitButton className={KNOP}>Bewaren</SubmitButton>
                </form>
                <form action={koppelProject} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="ticket_id" value={t.id} />
                  <label className="min-w-0 flex-1 text-xs text-muted">
                    Project van deze klant
                    <select name="project_id" defaultValue={projectOk ? (project?.id ?? "") : ""} className={VELD}>
                      <option value="">— geen project —</option>
                      {klantProjecten.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titel} · {STATUS_LABEL[p.status].nl}
                        </option>
                      ))}
                    </select>
                  </label>
                  <SubmitButton className={KNOP}>Koppelen</SubmitButton>
                </form>
                {klantProjecten.length === 0 && <p className="text-xs text-muted">Deze klant heeft (nog) geen projecten.</p>}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Soort: <span className="text-foreground">{SOORT_LABEL[soort].nl}</span> (afgeleid uit het onderwerp). Soort
                en project aanpassen kan na migratie 0049.
              </p>
            )}
          </Kaart>

          {schema.uren && (
            <Kaart titel="Revisie-uren" icoon={Timer}>
              <p className="text-xs text-muted">
                {eigenProject && nieuwTarief != null
                  ? `Aan ${euro(nieuwTarief)}/u (${CATEGORIE_LABEL[eigenProject.categorie].nl}, tarief van het project).`
                  : projectVanAnder
                    ? "Het gekoppelde project hoort bij een andere klant en telt niet mee: tarief van de vorige boeking, anders Normaal — of kies een categorie hieronder."
                    : "Zonder project: tarief van de vorige boeking, anders Normaal — of kies een categorie hieronder."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {[0.25, 0.5, 1].map((d) => (
                  <form key={d} action={snelUren.bind(null, t.id, d)}>
                    <SubmitButton className={KNOP} ariaLabel={`${uurTekst(d)} boeken`}>
                      +{String(d).replace(".", ",")} u
                    </SubmitButton>
                  </form>
                ))}
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted hover:text-foreground">Ander aantal of met omschrijving</summary>
                <form action={boekUren} className="mt-2 space-y-2">
                  <input type="hidden" name="ticket_id" value={t.id} />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-muted">
                      Uren
                      <input name="uren" inputMode="decimal" required placeholder="1,5" className={VELD} />
                    </label>
                    {!eigenProject && (
                      <label className="text-xs text-muted">
                        Categorie
                        <select name="categorie" defaultValue="normaal" className={VELD}>
                          {CATEGORIEEN.map((c) => (
                            <option key={c} value={c}>
                              {CATEGORIE_LABEL[c].nl} ({euro(UURTARIEF_CENT[c])})
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <label className="block text-xs text-muted">
                    Omschrijving (optioneel)
                    <input name="omschrijving" maxLength={300} className={VELD} />
                  </label>
                  <SubmitButton className={KNOP}>Uren boeken</SubmitButton>
                </form>
              </details>

              {uren.length > 0 && (
                <ul className="mt-4 divide-y rounded-xl border">
                  {uren.map((r) => {
                    const f = r.invoice_id ? facturen.get(r.invoice_id) : undefined;
                    return (
                      <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                        <span className="font-mono text-xs text-muted">{datumTijd(r.created_at, "nl")}</span>
                        <span className="font-medium">{uurTekst(r.uren)}</span>
                        <span className="text-xs text-muted">× {euro(r.tarief_cent)}</span>
                        {r.omschrijving && <span className="min-w-0 basis-full break-words text-xs">{r.omschrijving}</span>}
                        <span className="ml-auto flex items-center gap-2 text-xs">
                          {r.invoice_id ? (
                            <Link href={`/admin/facturen/${r.invoice_id}`} className="inline-flex items-center gap-1.5 hover:text-accent">
                              gefactureerd {f?.number ?? ""}
                              {f && <span className={`${PIL} py-0.5 ${FACTUUR_KLEUR(f.status)}`}>{factuurLabel(f.status)}</span>}
                            </Link>
                          ) : r.naar_project_op ? (
                            <span className="text-muted">bij project</span>
                          ) : (
                            <>
                              <span className={`${PIL} py-0.5 bg-amber-300 text-stone-950`}>te factureren</span>
                              <form action={verwijderUren}>
                                <input type="hidden" name="ticket_id" value={t.id} />
                                <input type="hidden" name="uren_id" value={r.id} />
                                <BevestigKnop
                                  vraag={`${uurTekst(r.uren)} verwijderen?`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                                  <span className="sr-only">Uren verwijderen</span>
                                </BevestigKnop>
                              </form>
                            </>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {open.length > 0 ? (
                <>
                  <p className="mt-3 rounded-xl border bg-background px-3 py-2 font-mono text-xs">
                    {uurTekst(openTotaal)}
                    {openMinimum && ` → min. ${uurTekst(MINIMUM_UREN)}`} ×{" "}
                    {tarieven.length === 1 ? euro(openTarief) : "gemengd tarief"} = {euro(openBedrag)} excl. btw
                    {!openMinimum && ` (min. ${uurTekst(MINIMUM_UREN)})`}
                  </p>

                  {schema.factuurKoppeling ? (
                    <form action={factureerRevisie} className="mt-4 space-y-3 rounded-xl border bg-background p-4">
                      <input type="hidden" name="ticket_id" value={t.id} />
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <Receipt className="h-4 w-4 text-accent" strokeWidth={2} aria-hidden />
                        Aparte revisiefactuur maken
                      </p>
                      <label className="block text-xs text-muted">
                        Betaaltermijn
                        <select name="termijn" defaultValue="14" className={VELD}>
                          <option value="14">14 dagen</option>
                          <option value="30">30 dagen</option>
                        </select>
                      </label>
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="btw_verlegd"
                          value="1"
                          defaultChecked={offerteVerlegd}
                          className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                        />
                        <span>
                          Btw verlegd
                          <span className="block text-xs text-muted">
                            {eigenProject?.offer_id
                              ? `Overgenomen van de offerte van het project (${offerteVerlegd ? "verlegd" : "21 %"}).`
                              : btwBuitenland
                                ? `Buitenlands btw-nummer (${klant?.btw}) — controleer de verlegging.`
                                : "Geen offerte gekoppeld — standaard 21 %."}
                          </span>
                        </span>
                      </label>
                      <label className="block text-xs text-muted">
                        Omschrijving (leeg = automatisch, in de taal van de klant)
                        <input name="omschrijving" maxLength={300} placeholder={autoOmschrijving} className={VELD} />
                      </label>
                      <p className="font-mono text-xs text-muted">
                        {euro(openBedrag)} excl. · {euro(Math.round(openBedrag * 1.21))} incl. 21 % btw · verlegd {euro(openBedrag)}
                      </p>
                      <SubmitButton pendingLabel="Aanmaken…" className={HOOFDKNOP}>
                        Revisiefactuur maken &amp; klant mailen
                      </SubmitButton>
                    </form>
                  ) : (
                    <p className="mt-3 text-xs text-muted">Revisiefacturen kunnen pas na migratie 0049.</p>
                  )}

                  {eigenProject && !projectGefactureerd ? (
                    <form action={urenNaarProject} className="mt-3">
                      <input type="hidden" name="ticket_id" value={t.id} />
                      <BevestigKnop
                        vraag={`${uurTekst(openTotaal)} bij de gewerkte uren van “${eigenProject.titel}” voegen (${naarProjectSom})? Ze komen dan op de projectfactuur.`}
                        className={KNOP}
                      >
                        <FolderKanban className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        Bij projecturen voegen
                      </BevestigKnop>
                    </form>
                  ) : (
                    <p className="mt-3 text-xs text-muted">
                      {!eigenProject
                        ? "Bij projecturen voegen: koppel eerst een project van deze klant."
                        : `Bij projecturen voegen kan niet meer: het project is al gefactureerd (${projectFactuur?.number}, ${factuurLabel(projectFactuur?.status ?? "")}).`}
                    </p>
                  )}
                </>
              ) : (
                uren.length === 0 && <p className="mt-3 text-xs text-muted">Nog geen uren geboekt op dit ticket.</p>
              )}

              {facturen.size > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted">Revisiefacturen</p>
                  <ul className="mt-1.5 divide-y rounded-xl border">
                    {[...facturen.values()].map((f) => (
                      <li key={f.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                        <Link href={`/admin/facturen/${f.id}`} className="font-medium hover:text-accent">
                          {f.number}
                        </Link>
                        <span className={`${PIL} py-0.5 ${FACTUUR_KLEUR(f.status)}`}>{factuurLabel(f.status)}</span>
                        <span className="ml-auto font-mono text-xs text-muted">
                          {euro(f.amount_cents)} excl.{f.vat_reverse ? " · verlegd" : ""}
                          {f.due_at ? ` · vervalt ${f.due_at}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Kaart>
          )}

          {schema.bijlagen && (
            <Kaart titel={`Bijlagen (${bijlagen.length})`} icoon={Paperclip}>
              {bijlagen.length === 0 ? (
                <p className="text-sm text-muted">Geen bijlagen.</p>
              ) : (
                <ul className="space-y-2">
                  {bijlagen.map((b) => (
                    <BijlageRegel
                      key={b.id}
                      b={b}
                      href={link.get(b.id) ?? null}
                      alsPlan={projectOk ? (alsPlan(b) ? "staat" : "kan") : null}
                      metAfzender
                    />
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted">Downloadlinks zijn 1 uur geldig — herlaad de pagina voor nieuwe.</p>
            </Kaart>
          )}
        </div>
      </div>

      {a.studioOngelezen && <TicketGelezen ticketId={t.id} />}
    </>
  );
}

/** Eén bijlage: downloadlink (1 u), grootte en eventueel 'Als plan aan project'. */
function BijlageRegel({
  b,
  href,
  alsPlan,
  metAfzender = false,
}: {
  b: BijlageRij;
  href: string | null;
  /** null = geen (geldig) project; 'staat' = al bij de plannen; 'kan' = knop tonen. */
  alsPlan: "kan" | "staat" | null;
  metAfzender?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} aria-hidden />
      {href ? (
        <a href={href} download={b.naam} className="inline-flex min-w-0 items-center gap-1 break-all hover:text-accent">
          {b.naam}
          <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        </a>
      ) : (
        <span className="min-w-0 break-all text-muted" title="Downloadlink niet beschikbaar">
          {b.naam}
        </span>
      )}
      <span className="font-mono text-xs text-muted">
        {grootteTekst(b.grootte)}
        {metAfzender && ` · ${b.door === "studio" ? "van u" : "van de klant"} · ${datumTijd(b.created_at, "nl")}`}
      </span>
      {alsPlan === "staat" && <span className={`${PIL} py-0.5 bg-emerald-300 text-stone-950`}>bij plannen</span>}
      {alsPlan === "kan" && (
        <form action={bijlageNaarPlan}>
          <input type="hidden" name="bijlage_id" value={b.id} />
          <SubmitButton pendingLabel="Kopiëren…" className={KNOP}>
            Als plan aan project
          </SubmitButton>
        </form>
      )}
    </li>
  );
}
