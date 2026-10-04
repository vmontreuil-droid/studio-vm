"use client";

// Formulier voor een nieuw Support-ticket in het klantportaal: soort (vraag,
// revisie, machineprobleem), optioneel project (verplicht bij een revisie),
// machinesturing, onderwerp, bericht en bijlagen. Wordt ook op de projectpagina
// ingebed (vastProjectId + compact).
//
// Versturen: eerst de bijlagen rechtstreeks naar de opslag (eenmalige links
// van de server), dan maakTicket. Bij een fout blijft alles staan.

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, Info, Loader2, MessageCircleQuestion, PencilRuler, Send } from "lucide-react";
import { Graafkraan } from "@/components/icons/graafkraan";
import type { Locale } from "@/lib/i18n/config";
import { CATEGORIE_LABEL, MERKEN, type ProjectStatus } from "@/lib/projecten";
import { UURTARIEF_CENT, euro, type Categorie } from "@/lib/tarieven";
import {
  KLANT_SOORTEN,
  MAX_BERICHT,
  MAX_ONDERWERP,
  REVISIE_PROJECTSTATUS,
  type GeuploadBestand,
  type KlantSoort,
  type TicketFout,
} from "@/lib/tickets";
import { FOUT_TEKST, REVISIE_AKKOORD, SOORT_LABEL, SOORT_UITLEG, revisieTariefZin } from "@/lib/tickets-teksten";
import { uploadBestanden } from "@/lib/tickets-upload";
import { BestandenKiezer } from "@/components/tickets/bestanden-kiezer";
import { bijlagePlekkenKlant, maakTicket } from "@/app/actions/tickets-klant";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const VELD = `mt-1.5 block w-full min-w-0 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-70 ${FOCUS}`;
const ANDERS = "__anders";
const MAX_SYSTEEM = 80;

const ICOON: Record<KlantSoort, typeof MessageCircleQuestion> = {
  vraag: MessageCircleQuestion,
  revisie: PencilRuler,
  machine: Graafkraan,
};

type Teksten = {
  titel: string;
  belofte: string;
  soort: string;
  revisieNiet: string;
  project: string;
  optioneel: string;
  verplichtRevisie: string;
  geenProject: string;
  nogGeenRevisie: string;
  kiesProjectTarief: string;
  vastProject: (titel: string) => string;
  systeem: string;
  kiesSysteem: string;
  anders: string;
  andersLabel: string;
  onderwerp: string;
  onderwerpPh: string;
  bericht: string;
  hint: Record<KlantSoort, string>;
  hintBijlage: Record<KlantSoort, string>;
  tekens: (n: number, max: number) => string;
  verplicht: string;
  verstuur: string;
  bezig: string;
  opladen: string;
};

const T: Record<Locale, Teksten> = {
  nl: {
    titel: "Nieuw ticket",
    belofte: "Ik antwoord op werkdagen binnen 24 uur. U krijgt een mail zodra mijn antwoord klaarstaat.",
    soort: "Waarover gaat het?",
    revisieNiet: "Een revisie kan pas aangevraagd worden zodra een project in productie of geleverd is.",
    project: "Project",
    optioneel: "(optioneel)",
    verplichtRevisie: "(verplicht bij een revisie)",
    geenProject: "— Geen project —",
    nogGeenRevisie: "nog geen revisie mogelijk",
    kiesProjectTarief: "Kies het project: het uurtarief van dat project geldt voor de revisie.",
    vastProject: (x) => `Project: ${x}`,
    systeem: "Machinesturing",
    kiesSysteem: "— Kies uw machinesturing —",
    anders: "Anders",
    andersLabel: "Welke machinesturing?",
    onderwerp: "Onderwerp",
    onderwerpPh: "Bv. werf of project + korte omschrijving",
    bericht: "Bericht",
    hint: {
      vraag: "Beschrijf uw vraag zo concreet mogelijk.",
      revisie: "Welk plan is gewijzigd en wat moet er in het model aangepast worden?",
      machine: "Welke machinesturing, welke versie van het model, en wat ziet u op het scherm?",
    },
    hintBijlage: {
      vraag: "Voeg gerust een plan of schermafdruk toe.",
      revisie: "Voeg het nieuwe plan toe als bijlage.",
      machine: "Voeg een foto of schermafdruk toe.",
    },
    tekens: (n, m) => `${n} / ${m} tekens`,
    verplicht: "verplicht",
    verstuur: "Ticket versturen",
    bezig: "Bezig met versturen…",
    opladen: "Bijlagen opladen…",
  },
  fr: {
    titel: "Nouveau ticket",
    belofte: "Je réponds sous 24 heures les jours ouvrables. Vous recevrez un e-mail dès que ma réponse sera disponible.",
    soort: "De quoi s'agit-il ?",
    revisieNiet: "Une révision ne peut être demandée qu'une fois un projet en production ou livré.",
    project: "Projet",
    optioneel: "(facultatif)",
    verplichtRevisie: "(obligatoire pour une révision)",
    geenProject: "— Aucun projet —",
    nogGeenRevisie: "pas encore de révision possible",
    kiesProjectTarief: "Choisissez le projet : le tarif horaire de ce projet s'applique à la révision.",
    vastProject: (x) => `Projet : ${x}`,
    systeem: "Système de guidage",
    kiesSysteem: "— Choisissez votre système de guidage —",
    anders: "Autre",
    andersLabel: "Quel système de guidage ?",
    onderwerp: "Sujet",
    onderwerpPh: "P. ex. chantier ou projet + brève description",
    bericht: "Message",
    hint: {
      vraag: "Décrivez votre question aussi concrètement que possible.",
      revisie: "Quel plan a changé et que faut-il adapter dans le modèle ?",
      machine: "Quel système de guidage, quelle version du modèle, et que voyez-vous à l'écran ?",
    },
    hintBijlage: {
      vraag: "N'hésitez pas à joindre un plan ou une capture d'écran.",
      revisie: "Joignez le nouveau plan en pièce jointe.",
      machine: "Joignez une photo ou une capture d'écran.",
    },
    tekens: (n, m) => `${n} / ${m} caractères`,
    verplicht: "obligatoire",
    verstuur: "Envoyer le ticket",
    bezig: "Envoi en cours…",
    opladen: "Envoi des pièces jointes…",
  },
  en: {
    titel: "New ticket",
    belofte: "I reply within 24 hours on working days. You will receive an email as soon as my reply is ready.",
    soort: "What is it about?",
    revisieNiet: "A revision can only be requested once a project is in production or delivered.",
    project: "Project",
    optioneel: "(optional)",
    verplichtRevisie: "(required for a revision)",
    geenProject: "— No project —",
    nogGeenRevisie: "no revision possible yet",
    kiesProjectTarief: "Choose the project: that project's hourly rate applies to the revision.",
    vastProject: (x) => `Project: ${x}`,
    systeem: "Machine control system",
    kiesSysteem: "— Choose your machine control system —",
    anders: "Other",
    andersLabel: "Which machine control system?",
    onderwerp: "Subject",
    onderwerpPh: "E.g. site or project + short description",
    bericht: "Message",
    hint: {
      vraag: "Please describe your question as precisely as possible.",
      revisie: "Which plan has changed and what needs to be updated in the model?",
      machine: "Which machine control system, which model version, and what do you see on the screen?",
    },
    hintBijlage: {
      vraag: "Feel free to attach a plan or screenshot.",
      revisie: "Please attach the new plan.",
      machine: "Please attach a photo or screenshot.",
    },
    tekens: (n, m) => `${n} / ${m} characters`,
    verplicht: "required",
    verstuur: "Send ticket",
    bezig: "Sending…",
    opladen: "Uploading attachments…",
  },
  de: {
    titel: "Neues Ticket",
    belofte: "Ich antworte an Werktagen innerhalb von 24 Stunden. Sie erhalten eine E-Mail, sobald meine Antwort bereitsteht.",
    soort: "Worum geht es?",
    revisieNiet: "Eine Revision kann erst angefragt werden, wenn ein Projekt in Produktion oder geliefert ist.",
    project: "Projekt",
    optioneel: "(optional)",
    verplichtRevisie: "(bei einer Revision erforderlich)",
    geenProject: "— Kein Projekt —",
    nogGeenRevisie: "noch keine Revision möglich",
    kiesProjectTarief: "Wählen Sie das Projekt: Für die Revision gilt der Stundensatz dieses Projekts.",
    vastProject: (x) => `Projekt: ${x}`,
    systeem: "Maschinensteuerung",
    kiesSysteem: "— Wählen Sie Ihre Maschinensteuerung —",
    anders: "Andere",
    andersLabel: "Welche Maschinensteuerung?",
    onderwerp: "Betreff",
    onderwerpPh: "Z. B. Baustelle oder Projekt + kurze Beschreibung",
    bericht: "Nachricht",
    hint: {
      vraag: "Bitte beschreiben Sie Ihre Frage so konkret wie möglich.",
      revisie: "Welcher Plan hat sich geändert und was muss im Modell angepasst werden?",
      machine: "Welche Maschinensteuerung, welche Modellversion, und was sehen Sie auf dem Bildschirm?",
    },
    hintBijlage: {
      vraag: "Gerne können Sie einen Plan oder Screenshot anhängen.",
      revisie: "Bitte hängen Sie den neuen Plan an.",
      machine: "Bitte hängen Sie ein Foto oder einen Screenshot an.",
    },
    tekens: (n, m) => `${n} / ${m} Zeichen`,
    verplicht: "erforderlich",
    verstuur: "Ticket senden",
    bezig: "Wird gesendet…",
    opladen: "Anhänge werden hochgeladen…",
  },
  es: {
    titel: "Nuevo ticket",
    belofte: "Respondo en un plazo de 24 horas en días laborables. Recibirá un correo en cuanto mi respuesta esté lista.",
    soort: "¿De qué se trata?",
    revisieNiet: "Solo se puede solicitar una revisión cuando un proyecto está en producción o entregado.",
    project: "Proyecto",
    optioneel: "(opcional)",
    verplichtRevisie: "(obligatorio para una revisión)",
    geenProject: "— Ningún proyecto —",
    nogGeenRevisie: "todavía no se puede revisar",
    kiesProjectTarief: "Elija el proyecto: a la revisión se le aplica la tarifa por hora de ese proyecto.",
    vastProject: (x) => `Proyecto: ${x}`,
    systeem: "Sistema de control de máquina",
    kiesSysteem: "— Elija su sistema de control de máquina —",
    anders: "Otro",
    andersLabel: "¿Qué sistema de control de máquina?",
    onderwerp: "Asunto",
    onderwerpPh: "P. ej., obra o proyecto + breve descripción",
    bericht: "Mensaje",
    hint: {
      vraag: "Describa su pregunta de la forma más concreta posible.",
      revisie: "¿Qué plano ha cambiado y qué hay que modificar en el modelo?",
      machine: "¿Qué sistema de control de máquina, qué versión del modelo y qué ve en la pantalla?",
    },
    hintBijlage: {
      vraag: "Puede adjuntar un plano o una captura de pantalla.",
      revisie: "Adjunte el nuevo plano.",
      machine: "Adjunte una foto o una captura de pantalla.",
    },
    tekens: (n, m) => `${n} / ${m} caracteres`,
    verplicht: "obligatorio",
    verstuur: "Enviar ticket",
    bezig: "Enviando…",
    opladen: "Subiendo archivos adjuntos…",
  },
};

export type FormulierProject = {
  id: string;
  titel: string;
  status: ProjectStatus;
  categorie: Categorie;
  merken: string[];
};

type Veld = "soort" | "project" | "systeem" | "onderwerp" | "bericht" | "akkoord";

export function NieuwTicketFormulier({
  locale,
  projecten,
  vastProjectId,
  standaardProjectId,
  standaardSoort,
  standaardOnderwerp,
  bijlagenAan,
  compact = false,
}: {
  locale: Locale;
  projecten: FormulierProject[];
  /** Project ligt vast (projectpagina): geen projectkeuze. */
  vastProjectId?: string;
  /** Voorgekozen project dat de klant nog kan wijzigen (bv. ?project= in het adres). */
  standaardProjectId?: string;
  standaardSoort?: KlantSoort;
  standaardOnderwerp?: string;
  /** Bijlagen mogelijk (migratie 0049 gedraaid). */
  bijlagenAan: boolean;
  /** Zonder kader en kop (ingebed in een andere kaart). */
  compact?: boolean;
}) {
  const t = T[locale];
  const router = useRouter();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = {
    project: `nt-project-${uid}`,
    systeem: `nt-systeem-${uid}`,
    anders: `nt-anders-${uid}`,
    onderwerp: `nt-onderwerp-${uid}`,
    bericht: `nt-bericht-${uid}`,
    hint: `nt-hint-${uid}`,
    teller: `nt-teller-${uid}`,
    akkoord: `nt-akkoord-${uid}`,
    fout: `nt-fout-${uid}`,
    bijlagen: `nt-bijlagen-${uid}`,
  };

  const magRevisie = (p: FormulierProject | undefined) => !!p && REVISIE_PROJECTSTATUS.includes(p.status);
  const vastProject = vastProjectId ? projecten.find((p) => p.id === vastProjectId) : undefined;
  const revisieProjecten = vastProjectId
    ? magRevisie(vastProject)
      ? [vastProject as FormulierProject]
      : []
    : projecten.filter(magRevisie);
  const revisieMogelijk = revisieProjecten.length > 0;

  const [soort, setSoort] = useState<KlantSoort>(() =>
    standaardSoort === "revisie" && !revisieMogelijk ? "vraag" : (standaardSoort ?? "vraag"),
  );
  const [projectId, setProjectId] = useState<string>(() => {
    if (vastProjectId) return vastProjectId;
    if (standaardProjectId && projecten.some((p) => p.id === standaardProjectId)) {
      const p = projecten.find((x) => x.id === standaardProjectId);
      if (standaardSoort !== "revisie" || magRevisie(p)) return standaardProjectId;
    }
    if (standaardSoort === "revisie" && revisieProjecten.length === 1) return revisieProjecten[0].id;
    return "";
  });
  const [systeemKeuze, setSysteemKeuze] = useState("");
  const [systeemAnders, setSysteemAnders] = useState("");
  const [onderwerp, setOnderwerp] = useState(() => (standaardOnderwerp ?? "").slice(0, MAX_ONDERWERP));
  const [body, setBody] = useState("");
  const [akkoord, setAkkoord] = useState(false);
  const [bestanden, setBestanden] = useState<File[]>([]);
  const [voortgang, setVoortgang] = useState<number | null>(null);
  const [fout, setFout] = useState<{ code: TicketFout; veld?: Veld } | null>(null);
  const [bezigActie, start] = useTransition();
  // Na succes blijft alles geblokkeerd (met spinner) tot de ticketpagina er is.
  const [verzonden, setVerzonden] = useState(false);
  const bezig = bezigActie || verzonden;
  const loopt = useRef(false);
  const geupload = useRef<{ voor: File[]; items: GeuploadBestand[] } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const project = projecten.find((p) => p.id === projectId);
  const systemen = useMemo(() => {
    const eigen = (project?.merken ?? []).filter(Boolean);
    return eigen.length > 0 ? eigen : MERKEN;
  }, [project]);
  const systeem = systeemKeuze === ANDERS ? systeemAnders.trim() : systeemKeuze;

  function kiesSoort(s: KlantSoort) {
    setSoort(s);
    if (fout?.veld === "soort") setFout(null);
    if (s === "revisie" && !vastProjectId) {
      // Enkel projecten in productie, geleverd of afgesloten komen in aanmerking.
      if (!magRevisie(project)) setProjectId(revisieProjecten.length === 1 ? revisieProjecten[0].id : "");
    }
  }

  function kiesProject(id: string) {
    setProjectId(id);
    if (fout?.veld === "project") setFout(null);
    const p = projecten.find((x) => x.id === id);
    const lijst = (p?.merken ?? []).filter(Boolean);
    const opties = lijst.length > 0 ? lijst : MERKEN;
    if (systeemKeuze && systeemKeuze !== ANDERS && !opties.includes(systeemKeuze)) setSysteemKeuze("");
  }

  function focusVeld(v: Veld | undefined) {
    const el =
      v === "project"
        ? document.getElementById(ids.project)
        : v === "systeem"
          ? document.getElementById(systeemKeuze === ANDERS ? ids.anders : ids.systeem)
          : v === "onderwerp"
            ? document.getElementById(ids.onderwerp)
            : v === "bericht"
              ? document.getElementById(ids.bericht)
              : v === "akkoord"
                ? document.getElementById(ids.akkoord)
                : v === "soort"
                  ? formRef.current?.querySelector<HTMLInputElement>('input[name="soort"]:checked')
                  : null;
    (el as HTMLElement | null)?.focus();
  }

  function controleer(): { code: TicketFout; veld: Veld } | null {
    if (soort === "revisie") {
      if (!revisieMogelijk) return { code: "revisie_niet_mogelijk", veld: "soort" };
      if (!project) return { code: "project", veld: "project" };
      if (!magRevisie(project)) return { code: "revisie_niet_mogelijk", veld: "project" };
    }
    if (soort === "machine" && !systeem) return { code: "leeg", veld: "systeem" };
    if (!onderwerp.trim()) return { code: "leeg", veld: "onderwerp" };
    if (!body.trim()) return { code: "leeg", veld: "bericht" };
    if (soort === "revisie" && !akkoord) return { code: "akkoord", veld: "akkoord" };
    return null;
  }

  function verstuur(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loopt.current) return;
    const f = controleer();
    if (f) {
      setFout(f);
      focusVeld(f.veld);
      return;
    }
    loopt.current = true;
    setFout(null);
    let gelukt = false;
    start(async () => {
      try {
        let items: GeuploadBestand[] = [];
        if (bijlagenAan && bestanden.length > 0) {
          if (geupload.current?.voor === bestanden) {
            items = geupload.current.items;
          } else {
            const p = await bijlagePlekkenKlant(bestanden.map((b) => ({ naam: b.name, grootte: b.size })));
            if (!p.ok) {
              setFout({ code: p.fout });
              return;
            }
            setVoortgang(0);
            items = await uploadBestanden(p.plekken, bestanden, (x) => setVoortgang(x));
            geupload.current = { voor: bestanden, items };
          }
        }
        const fd = new FormData();
        fd.set("locale", locale);
        fd.set("soort", soort);
        fd.set("project_id", projectId);
        fd.set("systeem", soort === "machine" ? systeem.slice(0, MAX_SYSTEEM) : "");
        fd.set("subject", onderwerp);
        fd.set("body", body);
        if (soort === "revisie" && akkoord) fd.set("revisie_akkoord", "1");
        fd.set("bijlagen", JSON.stringify(items));
        const r = await maakTicket(fd);
        if (!r.ok) {
          const veld: Veld | undefined =
            r.fout === "akkoord"
              ? "akkoord"
              : r.fout === "project" || r.fout === "revisie_niet_mogelijk"
                ? "project"
                : undefined;
          setFout({ code: r.fout, veld });
          focusVeld(veld);
          return;
        }
        gelukt = true;
        setVerzonden(true);
        router.push(`/${locale}/portail/dashboard/tickets/${r.id}?nieuw=1`);
      } catch {
        setFout({ code: "opslag" });
      } finally {
        setVoortgang(null);
        // Na succes blijft de knop geblokkeerd tot de nieuwe pagina er is.
        if (!gelukt) loopt.current = false;
      }
    });
  }

  const ongeldig = (v: Veld) => (fout?.veld === v ? true : undefined);
  const beschrijf = (v: Veld, ...extra: string[]) =>
    [...extra, fout?.veld === v ? ids.fout : ""].filter(Boolean).join(" ") || undefined;
  const tarief =
    soort === "revisie" && project && UURTARIEF_CENT[project.categorie]
      ? revisieTariefZin(locale, euro(UURTARIEF_CENT[project.categorie], locale), CATEGORIE_LABEL[project.categorie][locale])
      : null;
  const hint = `${t.hint[soort]}${bijlagenAan ? ` ${t.hintBijlage[soort]}` : ""}`;

  const formulier = (
    <form ref={formRef} onSubmit={verstuur} noValidate aria-busy={bezig} className="space-y-6">
      <fieldset disabled={bezig} className="@container min-w-0">
        <legend className="text-sm font-medium">{t.soort}</legend>
        <div className="mt-2 grid gap-2 @[44rem]:grid-cols-3">
          {KLANT_SOORTEN.map((s) => {
            const Icoon = ICOON[s];
            const uit = s === "revisie" && !revisieMogelijk;
            return (
              <label
                key={s}
                className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border bg-background p-3.5 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                  uit ? "cursor-not-allowed opacity-55" : "hover:border-accent/60"
                }`}
              >
                <input
                  type="radio"
                  name="soort"
                  value={s}
                  checked={soort === s}
                  disabled={uit}
                  onChange={() => kiesSoort(s)}
                  aria-invalid={s === soort ? ongeldig("soort") : undefined}
                  className="mt-1 h-4 w-4 shrink-0 accent-accent focus-visible:outline-none"
                />
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-1.5 break-words text-sm font-semibold">
                    <Icoon className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden />
                    {SOORT_LABEL[s][locale]}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{SOORT_UITLEG[s][locale]}</span>
                </span>
              </label>
            );
          })}
        </div>
        {!revisieMogelijk && <p className="mt-2 text-xs text-muted">{t.revisieNiet}</p>}
      </fieldset>

      {vastProjectId ? (
        !compact && vastProject ? (
          <p className="text-sm text-muted">{t.vastProject(vastProject.titel)}</p>
        ) : null
      ) : projecten.length > 0 || soort === "revisie" ? (
        <div>
          <label htmlFor={ids.project} className="block text-sm font-medium">
            {t.project}{" "}
            <span className="font-normal text-muted">{soort === "revisie" ? t.verplichtRevisie : t.optioneel}</span>
          </label>
          <select
            id={ids.project}
            value={projectId}
            onChange={(e) => kiesProject(e.target.value)}
            disabled={bezig}
            required={soort === "revisie"}
            aria-invalid={ongeldig("project")}
            aria-describedby={beschrijf("project")}
            className={VELD}
          >
            <option value="">{t.geenProject}</option>
            {projecten.map((p) => {
              const nee = soort === "revisie" && !magRevisie(p);
              return (
                <option key={p.id} value={p.id} disabled={nee}>
                  {nee ? `${p.titel} (${t.nogGeenRevisie})` : p.titel}
                </option>
              );
            })}
          </select>
        </div>
      ) : null}

      {soort === "machine" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={ids.systeem} className="block text-sm font-medium">
              {t.systeem} <span className="font-normal text-muted">({t.verplicht})</span>
            </label>
            <select
              id={ids.systeem}
              value={systeemKeuze}
              onChange={(e) => {
                setSysteemKeuze(e.target.value);
                if (fout?.veld === "systeem") setFout(null);
              }}
              disabled={bezig}
              required
              aria-invalid={systeemKeuze !== ANDERS ? ongeldig("systeem") : undefined}
              aria-describedby={systeemKeuze !== ANDERS ? beschrijf("systeem") : undefined}
              className={VELD}
            >
              <option value="">{t.kiesSysteem}</option>
              {systemen.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value={ANDERS}>{t.anders}</option>
            </select>
          </div>
          {systeemKeuze === ANDERS && (
            <div className="min-w-0">
              <label htmlFor={ids.anders} className="block text-sm font-medium">
                {t.andersLabel}
              </label>
              <input
                id={ids.anders}
                type="text"
                value={systeemAnders}
                onChange={(e) => {
                  setSysteemAnders(e.target.value);
                  if (fout?.veld === "systeem") setFout(null);
                }}
                maxLength={MAX_SYSTEEM}
                disabled={bezig}
                required
                autoComplete="off"
                aria-invalid={ongeldig("systeem")}
                aria-describedby={beschrijf("systeem")}
                className={VELD}
              />
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor={ids.onderwerp} className="block text-sm font-medium">
          {t.onderwerp}
        </label>
        <input
          id={ids.onderwerp}
          type="text"
          value={onderwerp}
          onChange={(e) => {
            setOnderwerp(e.target.value);
            if (fout?.veld === "onderwerp") setFout(null);
          }}
          maxLength={MAX_ONDERWERP}
          disabled={bezig}
          required
          placeholder={t.onderwerpPh}
          aria-invalid={ongeldig("onderwerp")}
          aria-describedby={beschrijf("onderwerp")}
          className={VELD}
        />
      </div>

      <div>
        <label htmlFor={ids.bericht} className="block text-sm font-medium">
          {t.bericht}
        </label>
        <p id={ids.hint} className="mt-1 text-xs leading-relaxed text-muted">
          {hint}
        </p>
        <textarea
          id={ids.bericht}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (fout?.veld === "bericht") setFout(null);
          }}
          rows={7}
          maxLength={MAX_BERICHT}
          disabled={bezig}
          required
          aria-invalid={ongeldig("bericht")}
          aria-describedby={beschrijf("bericht", ids.hint, ids.teller)}
          className={`${VELD} leading-relaxed`}
        />
        <p id={ids.teller} className="mt-1 text-right font-mono text-xs text-muted">
          {t.tekens(body.length, MAX_BERICHT)}
        </p>
      </div>

      {bijlagenAan && (
        <BestandenKiezer
          locale={locale}
          bestanden={bestanden}
          onChange={setBestanden}
          disabled={bezig}
          voortgang={voortgang}
          id={ids.bijlagen}
        />
      )}

      {soort === "revisie" && (
        <div className="space-y-3 rounded-2xl border border-accent/40 bg-accent/5 p-4">
          <p className="flex items-start gap-2 text-sm leading-relaxed">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden />
            <span>{tarief ?? t.kiesProjectTarief}</span>
          </p>
          <label htmlFor={ids.akkoord} className="flex cursor-pointer items-start gap-3 text-sm font-medium">
            <input
              id={ids.akkoord}
              type="checkbox"
              checked={akkoord}
              onChange={(e) => {
                setAkkoord(e.target.checked);
                if (fout?.veld === "akkoord") setFout(null);
              }}
              disabled={bezig}
              aria-required="true"
              aria-invalid={ongeldig("akkoord")}
              aria-describedby={beschrijf("akkoord")}
              className={`mt-0.5 h-5 w-5 shrink-0 accent-accent ${FOCUS}`}
            />
            <span>{REVISIE_AKKOORD[locale]}</span>
          </label>
        </div>
      )}

      {fout && (
        <p
          id={ids.fout}
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-400 bg-red-200 p-3 text-sm text-red-950"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="min-w-0 break-words">{FOUT_TEKST[fout.code][locale]}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 items-start gap-2 text-xs leading-relaxed text-muted sm:max-w-md">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2} aria-hidden />
          <span>{t.belofte}</span>
        </p>
        <button
          type="submit"
          disabled={bezig}
          aria-busy={bezig}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60 ${FOCUS}`}
        >
          {bezig ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          )}
          {bezig ? (voortgang != null ? t.opladen : t.bezig) : t.verstuur}
        </button>
      </div>
    </form>
  );

  if (compact) return formulier;
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby={`nt-titel-${uid}`}>
      <h2 id={`nt-titel-${uid}`} className="mb-5 text-lg font-semibold tracking-tight">
        {t.titel}
      </h2>
      {formulier}
    </section>
  );
}
