"use server";
// Ticket aanmaken namens een klant (bv. na een telefoontje), vanuit
// /admin/tickets/nieuw. Schrijft via de service-role (maakTicketRij), werkt
// ook zonder migratie 0049 (dan zonder projectkoppeling/taal op het ticket),
// en mailt de klant — in zijn taal — enkel als 'Klant verwittigen' aanstaat.

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isEmail } from "@/lib/monitor";
import { ensurePortalUser } from "@/lib/portal-access";
import { klantGegevens } from "@/lib/projecten-admin";
import { herlaadTicket, maakTicketRij } from "@/lib/tickets-server";
import { mailKlantAntwoord, mailKlantOntvangen } from "@/lib/tickets-mail";
import { MAX_BERICHT_STUDIO, MAX_ONDERWERP, isUuid, type Afzender, type TicketSoort } from "@/lib/tickets";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import type { Categorie } from "@/lib/tarieven";

/** Soorten die de admin kan kiezen ('intern' is voor meldingen van de sites). */
const ADMIN_SOORTEN: TicketSoort[] = ["vraag", "revisie", "machine", "afspraak"];
/** Zo lang mag een bericht zijn om het na een fout in het adres terug te geven. */
const TERUG_BERICHT_MAX = 1000;

type ProjectRij = {
  id: string;
  titel: string | null;
  client_email: string | null;
  quote_id: string | null;
  categorie: Categorie | null;
};

const veld = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function maakTicketAdmin(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const email = veld(fd, "email").toLowerCase();
  const projectId = veld(fd, "project_id");
  const soortRuw = veld(fd, "soort");
  const soort: TicketSoort = (ADMIN_SOORTEN as string[]).includes(soortRuw) ? (soortRuw as TicketSoort) : "vraag";
  const afzender: Afzender = veld(fd, "afzender") === "studio" ? "studio" : "klant";
  const onderwerp = veld(fd, "onderwerp").replace(/\s+/g, " ");
  const bericht = String(fd.get("bericht") ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();
  const verwittigen = veld(fd, "verwittigen") === "1";
  // Project uit de cockpit-link waarop het formulier vastlag (verborgen veld).
  const vastId = veld(fd, "vast");

  // Terug naar het formulier met de foutcode en wat er al ingevuld was.
  // '?project=' legt de klant vast (cockpit-link) en wordt enkel doorgegeven als
  // het formulier al vastlag; de gewone projectkeuze gaat als '?kies=' terug
  // (alleen de standaardwaarde van de keuzelijst). Na fout=project vervalt de
  // keuze, zodat het getypte e-mailadres nooit door dat van een andere klant
  // vervangen wordt.
  const terug = (fout: string) => {
    const p = new URLSearchParams({ fout });
    if (email) p.set("email", email.slice(0, 200));
    if (fout !== "project") {
      if (isUuid(vastId)) {
        p.set("project", vastId);
        p.set("kies", isUuid(projectId) ? projectId : "");
      } else if (isUuid(projectId)) {
        p.set("kies", projectId);
      }
    }
    p.set("soort", soort);
    p.set("afzender", afzender);
    if (onderwerp) p.set("onderwerp", onderwerp.slice(0, MAX_ONDERWERP));
    if (bericht && bericht.length <= TERUG_BERICHT_MAX) p.set("bericht", bericht);
    if (!verwittigen) p.set("verwittigen", "0");
    return `/admin/tickets/nieuw?${p.toString()}`;
  };

  if (!isEmail(email)) redirect(terug("email"));
  if (!onderwerp || onderwerp.length > MAX_ONDERWERP) redirect(terug("onderwerp"));
  if (!bericht || bericht.length > MAX_BERICHT_STUDIO) redirect(terug("bericht"));
  if (projectId && !isUuid(projectId)) redirect(terug("project"));

  // Een gekozen project moet van DEZE klant zijn (exacte vergelijking in JS, nooit ilike).
  let project: ProjectRij | null = null;
  if (projectId) {
    let opgehaald: ProjectRij | null = null;
    let leesFout = false;
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("projecten")
        .select("id, titel, client_email, quote_id, categorie")
        .eq("id", projectId)
        .maybeSingle();
      leesFout = !!error;
      opgehaald = (data as ProjectRij | null) ?? null;
    } catch {
      leesFout = true;
    }
    if (leesFout) redirect(terug("opslag"));
    if (!opgehaald || String(opgehaald.client_email ?? "").trim().toLowerCase() !== email) redirect(terug("project"));
    project = opgehaald;
  }

  let taal: Locale = "nl";
  try {
    const t = (await klantGegevens(email, project?.quote_id ?? null)).taal;
    if (isValidLocale(t)) taal = t;
  } catch {
    // 'nl' als terugval
  }

  const r = await maakTicketRij({
    email,
    subject: onderwerp,
    body: bericht,
    soort,
    afzender,
    projectId: project?.id ?? null,
    locale: taal,
    revisieAkkoord: false,
  });
  if (!r.ok) redirect(terug("opslag"));

  try {
    await ensurePortalUser(email);
  } catch {
    // Niet-kritisch: de mail-link werkt na een uitnodiging sowieso.
  }

  // Een dubbel (zelfde ticket net al aangemaakt) krijgt geen tweede mail.
  let mailOk = true;
  if (verwittigen && !r.dubbel) {
    // Zonder 0049 staan taal en project niet op de rij: geef ze mee, zodat de
    // mail zeker in de taal van de klant vertrekt.
    const t = {
      ...r.ticket,
      locale: isValidLocale(r.ticket.locale) ? r.ticket.locale : taal,
      project_id: r.ticket.project_id ?? project?.id ?? null,
    };
    mailOk =
      afzender === "studio"
        ? await mailKlantAntwoord(t, bericht, [])
        : await mailKlantOntvangen(t, { categorie: project?.categorie ?? null });
  }

  herlaadTicket();
  redirect(`/admin/tickets/${r.ticket.id}?melding=aangemaakt${verwittigen && !mailOk ? "&mail=0" : ""}`);
}
