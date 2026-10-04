import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { maakTicketAdmin } from "@/app/actions/tickets-admin-nieuw";
import { SubmitButton } from "@/components/submit-button";
import { VELD } from "@/components/admin/project-ui";
import { STATUS_LABEL, type ProjectStatus } from "@/lib/projecten";
import { ticketSchema } from "@/lib/tickets-server";
import { MAX_BERICHT_STUDIO, MAX_ONDERWERP, isUuid, type TicketSoort } from "@/lib/tickets";
import { SOORT_LABEL } from "@/lib/tickets-teksten";

export const dynamic = "force-dynamic";

// Ticket aanmaken namens een klant, bv. na een telefoontje. Met ?project=<id>
// (cockpit) ligt de klant vast (die van het project); met ?email=… is die al
// ingevuld. Na een fout komt de projectkeuze terug als ?kies=<id> (niet vastgelegd).

const SOORTEN: TicketSoort[] = ["vraag", "revisie", "machine", "afspraak"];

const FOUT: Record<string, string> = {
  email: "Geef een geldig e-mailadres van de klant op.",
  project: "Dat project hoort niet bij dit e-mailadres. Kies een project van deze klant of geen project.",
  onderwerp: `Geef een onderwerp op (max. ${MAX_ONDERWERP} tekens).`,
  bericht: `Schrijf een bericht (max. ${MAX_BERICHT_STUDIO} tekens).`,
  opslag: "Opslaan mislukte — probeer opnieuw.",
};

type ProjectRij = {
  id: string;
  titel: string | null;
  client_email: string | null;
  status: ProjectStatus | null;
  created_at: string;
};

export default async function NieuwTicketAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  const db = getSupabaseAdmin();
  const [schema, projR, quoteR, offerR, ticketR] = await Promise.all([
    ticketSchema(),
    db.from("projecten").select("id, titel, client_email, status, created_at").order("created_at", { ascending: false }).limit(2000),
    db.from("quotes").select("email").in("source", ["3d-model", "contact"]).limit(2000),
    db.from("offers").select("client_email").limit(2000),
    db.from("tickets").select("client_email").limit(2000),
  ]);

  const projecten = (projR.data as ProjectRij[] | null) ?? [];
  const klein = (e: string | null | undefined) => String(e ?? "").trim().toLowerCase();

  // Gekozen project (uit de cockpit): klant ligt vast — maar enkel als het project
  // een klant heeft en de link geen ander e-mailadres meegeeft. Een getypt adres
  // wordt nooit stil door dat van de projecteigenaar vervangen.
  const projectParam = isUuid(pick("project")) ? pick("project") : "";
  const emailParam = klein(pick("email")).slice(0, 200);
  let linkProject: ProjectRij | null = projectParam ? (projecten.find((p) => p.id === projectParam) ?? null) : null;
  if (projectParam && !linkProject) {
    const { data } = await db
      .from("projecten")
      .select("id, titel, client_email, status, created_at")
      .eq("id", projectParam)
      .maybeSingle();
    linkProject = (data as ProjectRij | null) ?? null;
    if (linkProject) projecten.push(linkProject);
  }
  const linkEmail = linkProject ? klein(linkProject.client_email) : "";
  const vast = linkProject && linkEmail.includes("@") && (!emailParam || emailParam === linkEmail) ? linkProject : null;
  const vastEmail = vast ? linkEmail : "";
  const email = vastEmail || emailParam;

  // Gekende klant-e-mails voor de keuzelijst (klein, ontdubbeld, alfabetisch).
  const emails = [
    ...new Set(
      [
        ...projecten.map((p) => p.client_email),
        ...((quoteR.data as { email: string | null }[] | null) ?? []).map((r) => r.email),
        ...((offerR.data as { client_email: string | null }[] | null) ?? []).map((r) => r.client_email),
        ...((ticketR.data as { client_email: string | null }[] | null) ?? []).map((r) => r.client_email),
      ]
        .map(klein)
        .filter((e) => e.includes("@") && e !== "info@studio-vm.be"),
    ),
  ].sort((a, b) => a.localeCompare(b, "nl"));

  // Projecten per klant (optgroup); met een gekozen klant die bovenaan, met een vast project enkel die klant.
  const perKlant = new Map<string, ProjectRij[]>();
  for (const p of projecten) {
    const e = klein(p.client_email);
    if (!e || (vastEmail && e !== vastEmail)) continue;
    const lijst = perKlant.get(e) ?? [];
    if (!lijst.some((x) => x.id === p.id)) lijst.push(p);
    perKlant.set(e, lijst);
  }
  const groepen = [...perKlant.entries()].sort(([a], [b]) => (a === email ? -1 : b === email ? 1 : a.localeCompare(b, "nl")));

  const soort = SOORTEN.includes(pick("soort") as TicketSoort) ? pick("soort") : "vraag";
  const afzender = pick("afzender") === "studio" ? "studio" : "klant";
  const verwittigen = pick("verwittigen") !== "0";
  // Eigen sleutel opzoeken: ?fout=__proto__ / constructor mag niets van Object.prototype opleveren.
  const foutCode = pick("fout");
  const fout = Object.hasOwn(FOUT, foutCode) ? FOUT[foutCode] : undefined;
  // ?kies= is de projectkeuze na een fout (enkel standaardwaarde, ook "" = geen project);
  // zonder kies het vaste project uit de cockpit-link.
  const projectWaarde = typeof sp.kies === "string" ? (isUuid(sp.kies) ? sp.kies : "") : (vast?.id ?? "");
  const terugHref = vast ? `/admin/projecten/${vast.id}` : "/admin/tickets";

  return (
    <>
      <Link
        href={terugHref}
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        {vast ? "Terug naar het project" : "Terug naar tickets"}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Nieuw ticket</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Namens een klant, bijvoorbeeld na een telefoontje. De klant krijgt portaaltoegang en ziet het ticket in zijn portaal. Met
        &lsquo;Klant verwittigen&rsquo; krijgt hij een mail in zijn taal: een ontvangstbevestiging als het bericht van de klant komt, of uw
        bericht met een knop naar het ticket.
      </p>

      {fout && (
        <p role="alert" className="mt-4 rounded-xl border border-red-400 bg-red-200 px-4 py-2 text-sm text-red-950">
          {fout}
        </p>
      )}
      {projectParam && !vast && (
        <p role="alert" className="mt-4 rounded-xl border border-amber-400 bg-amber-200 px-4 py-2 text-sm text-amber-950">
          {!linkProject
            ? "Het project uit de link bestaat niet (meer). Kies hieronder de klant."
            : !linkEmail.includes("@")
              ? "Het project uit de link heeft geen klant-e-mail. Vul hieronder de klant in."
              : "Het project uit de link hoort bij een andere klant dan dit e-mailadres. Controleer de klant en kies het project opnieuw."}
        </p>
      )}
      {!schema.v2 && (
        <p className="mt-4 rounded-xl border border-amber-400 bg-amber-200 px-4 py-2 text-sm text-amber-950">
          Migratie 0049 nog niet gedraaid — het ticket wordt aangemaakt, maar zonder projectkoppeling, soort-kolom of taal op het ticket.
        </p>
      )}

      <form action={maakTicketAdmin} className="mt-6 space-y-6">
        <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">Klant en project</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {vast ? (
              <div className="text-xs text-muted">
                E-mail van de klant
                <p className="mt-1 break-all rounded-lg border bg-background px-3 py-2 text-sm text-foreground">{vastEmail || "—"}</p>
                <input type="hidden" name="email" value={vastEmail} />
                <input type="hidden" name="vast" value={vast.id} />
              </div>
            ) : (
              <label className="text-xs text-muted">
                E-mail van de klant *
                <input
                  name="email"
                  type="email"
                  required
                  list="klant-emails"
                  autoComplete="off"
                  maxLength={200}
                  defaultValue={email}
                  className={`${VELD} focus-visible:ring-2 focus-visible:ring-accent`}
                />
                <datalist id="klant-emails">
                  {emails.map((e) => (
                    <option key={e} value={e} />
                  ))}
                </datalist>
              </label>
            )}
            <label className="text-xs text-muted">
              Project (optioneel)
              <select
                name="project_id"
                defaultValue={projectWaarde}
                className={`${VELD} focus-visible:ring-2 focus-visible:ring-accent`}
              >
                <option value="">Geen project</option>
                {groepen.map(([e, lijst]) => (
                  <optgroup key={e} label={e}>
                    {lijst.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titel || "(zonder titel)"}
                        {p.status && STATUS_LABEL[p.status] ? ` — ${STATUS_LABEL[p.status].nl}` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="mt-1 block">Het project moet van deze klant zijn.</span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-sm sm:p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">Ticket</h2>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <label className="text-xs text-muted">
              Soort
              <select name="soort" defaultValue={soort} className={`${VELD} focus-visible:ring-2 focus-visible:ring-accent`}>
                {SOORTEN.map((s) => (
                  <option key={s} value={s}>
                    {SOORT_LABEL[s].nl}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted">
              Onderwerp *
              <input
                name="onderwerp"
                required
                maxLength={MAX_ONDERWERP}
                defaultValue={pick("onderwerp").slice(0, MAX_ONDERWERP)}
                placeholder="bv. Hoogte talud klopt niet op de machine"
                className={`${VELD} focus-visible:ring-2 focus-visible:ring-accent`}
              />
            </label>
            <label className="text-xs text-muted sm:col-span-2">
              Bericht *
              <textarea
                name="bericht"
                required
                rows={8}
                maxLength={MAX_BERICHT_STUDIO}
                defaultValue={pick("bericht").slice(0, MAX_BERICHT_STUDIO)}
                className={`${VELD} focus-visible:ring-2 focus-visible:ring-accent`}
              />
            </label>
          </div>

          <fieldset className="mt-5">
            <legend className="text-xs text-muted">Afzender van dit eerste bericht</legend>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
                <input type="radio" name="afzender" value="klant" defaultChecked={afzender === "klant"} className="accent-[var(--accent)]" />
                Namens de klant (bv. na een telefoontje)
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
                <input type="radio" name="afzender" value="studio" defaultChecked={afzender === "studio"} className="accent-[var(--accent)]" />
                Bericht van mij aan de klant
              </label>
            </div>
          </fieldset>

          <label className="mt-5 inline-flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="verwittigen"
              value="1"
              defaultChecked={verwittigen}
              className="mt-0.5 accent-[var(--accent)] focus-visible:ring-2 focus-visible:ring-accent"
            />
            <span>
              Klant verwittigen per mail
              <span className="block text-xs text-muted">In de taal van de klant, met een knop die rechtstreeks naar het ticket gaat.</span>
            </span>
          </label>
        </section>

        <SubmitButton
          pendingLabel="Aanmaken…"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Ticket aanmaken
        </SubmitButton>
      </form>
    </>
  );
}
