"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Lock,
  Check,
  AlertCircle,
  Mail,
  ArrowLeft,
  Layers,
  Download,
  FileText,
  FolderOpen,
  RefreshCw,
  LifeBuoy,
} from "lucide-react";
import { sendMagicLink, type AuthState } from "@/app/actions/portail";
import { localePath, type Locale } from "@/lib/i18n/config";

const T: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    email: string;
    placeholder: string;
    button: string;
    sending: string;
    note: string;
    back: string;
    panelEyebrow: string;
    panelTitle: string;
    features: { t: string; d: string }[];
  }
> = {
  nl: {
    eyebrow: "Klantenportaal",
    title: "Inloggen",
    intro: "Geen wachtwoord nodig — u ontvangt een veilige inloglink in uw mailbox.",
    email: "E-mail",
    placeholder: "u@bedrijf.be",
    button: "Stuur inloglink",
    sending: "Versturen…",
    note: "Toegang voor klanten met een aanvraag of project. Twijfelt u? Mail naar info@studio-vm.be.",
    back: "Terug naar de website",
    panelEyebrow: "Uw portaal",
    panelTitle: "Al uw 3D-modellen en projecten op één plek.",
    features: [
      { t: "Uw projecten", d: "Status, leverdatum, werf en coördinatenstelsel per project." },
      { t: "Modellen downloaden", d: "Per machinesturing en per versie, zodra de factuur betaald is." },
      { t: "Offertes & facturen", d: "Bekijken, aanvaarden en online betalen." },
      { t: "Plannen & documenten", d: "Wat u aanleverde en wat wij opleverden, netjes bij elkaar." },
      { t: "Revisies", d: "Plan gewijzigd? Vraag een revisie aan en volg ze op." },
      { t: "Support", d: "Een vraag over uw model of uw sturing? Open een ticket." },
    ],
  },
  fr: {
    eyebrow: "Espace client",
    title: "Connexion",
    intro: "Pas de mot de passe — vous recevez un lien de connexion sécurisé par e-mail.",
    email: "E-mail",
    placeholder: "vous@entreprise.fr",
    button: "Envoyer le lien",
    sending: "Envoi…",
    note: "Accès réservé aux clients ayant une demande ou un projet. En cas de doute : info@studio-vm.be.",
    back: "Retour au site",
    panelEyebrow: "Votre espace",
    panelTitle: "Tous vos modèles 3D et projets au même endroit.",
    features: [
      { t: "Vos projets", d: "Statut, date de livraison, chantier et système de coordonnées." },
      { t: "Télécharger les modèles", d: "Par système de guidage et par version, dès que la facture est réglée." },
      { t: "Devis & factures", d: "Consulter, accepter et payer en ligne." },
      { t: "Plans & documents", d: "Ce que vous avez fourni et ce que nous avons livré, réunis." },
      { t: "Révisions", d: "Plan modifié ? Demandez une révision et suivez-la." },
      { t: "Support", d: "Une question sur votre modèle ou votre guidage ? Ouvrez un ticket." },
    ],
  },
  en: {
    eyebrow: "Client portal",
    title: "Sign in",
    intro: "No password needed — you receive a secure login link by email.",
    email: "Email",
    placeholder: "you@company.com",
    button: "Send login link",
    sending: "Sending…",
    note: "Access for clients with a request or project. Unsure? Email info@studio-vm.be.",
    back: "Back to the website",
    panelEyebrow: "Your portal",
    panelTitle: "All your 3D models and projects in one place.",
    features: [
      { t: "Your projects", d: "Status, delivery date, site and coordinate system per project." },
      { t: "Download models", d: "Per machine-control system and version, once the invoice is paid." },
      { t: "Quotes & invoices", d: "Review, accept and pay online." },
      { t: "Plans & documents", d: "What you supplied and what we delivered, kept together." },
      { t: "Revisions", d: "Plan changed? Request a revision and follow it up." },
      { t: "Support", d: "A question about your model or your system? Open a ticket." },
    ],
  },
  de: {
    eyebrow: "Kundenportal",
    title: "Anmelden",
    intro: "Kein Passwort nötig — Sie erhalten einen sicheren Anmeldelink per E-Mail.",
    email: "E-Mail",
    placeholder: "sie@firma.de",
    button: "Anmeldelink senden",
    sending: "Wird gesendet…",
    note: "Zugang für Kunden mit einer Anfrage oder einem Projekt. Unsicher? Schreiben Sie an info@studio-vm.be.",
    back: "Zurück zur Website",
    panelEyebrow: "Ihr Portal",
    panelTitle: "Alle Ihre 3D-Modelle und Projekte an einem Ort.",
    features: [
      { t: "Ihre Projekte", d: "Status, Liefertermin, Baustelle und Koordinatensystem je Projekt." },
      { t: "Modelle herunterladen", d: "Je Maschinensteuerung und Version, sobald die Rechnung bezahlt ist." },
      { t: "Angebote & Rechnungen", d: "Ansehen, annehmen und online bezahlen." },
      { t: "Pläne & Dokumente", d: "Was Sie geliefert haben und was wir geliefert haben, gebündelt." },
      { t: "Revisionen", d: "Plan geändert? Fordern Sie eine Revision an und verfolgen Sie sie." },
      { t: "Support", d: "Eine Frage zu Ihrem Modell oder Ihrer Steuerung? Eröffnen Sie ein Ticket." },
    ],
  },
  es: {
    eyebrow: "Portal de clientes",
    title: "Iniciar sesión",
    intro: "Sin contraseña — recibirá un enlace de acceso seguro por correo electrónico.",
    email: "Correo electrónico",
    placeholder: "usted@empresa.es",
    button: "Enviar enlace de acceso",
    sending: "Enviando…",
    note: "Acceso para clientes con una solicitud o un proyecto. ¿Dudas? Escriba a info@studio-vm.be.",
    back: "Volver al sitio web",
    panelEyebrow: "Su portal",
    panelTitle: "Todos sus modelos 3D y proyectos en un solo lugar.",
    features: [
      { t: "Sus proyectos", d: "Estado, fecha de entrega, obra y sistema de coordenadas por proyecto." },
      { t: "Descargar modelos", d: "Por sistema de control de maquinaria y por versión, una vez pagada la factura." },
      { t: "Presupuestos y facturas", d: "Consultar, aceptar y pagar en línea." },
      { t: "Planos y documentos", d: "Lo que usted aportó y lo que entregamos, todo junto." },
      { t: "Revisiones", d: "¿Ha cambiado el plano? Solicite una revisión y siga su estado." },
      { t: "Soporte", d: "¿Una pregunta sobre su modelo o su sistema? Abra un ticket." },
    ],
  },
};

const ICONS = [Layers, Download, FileText, FolderOpen, RefreshCw, LifeBuoy];
const initial: AuthState = { ok: false, message: "" };

export function PortailLogin({
  locale,
  next,
}: {
  locale: Locale;
  next?: string;
}) {
  const t = T[locale];
  const [state, setState] = useState<AuthState>(initial);
  const [pending, start] = useTransition();

  return (
    <div className="flex min-h-dvh">
      {/* Linkerpaneel — wat het portaal kan */}
      <div className="hidden w-1/2 flex-col justify-between border-r bg-card p-12 lg:flex">
        <p className="text-4xl font-extrabold lowercase tracking-tighter sm:text-5xl">
          vm<span className="text-accent">.</span>
          <span className="ml-3 align-middle font-mono text-xs font-normal uppercase tracking-widest text-muted">
            {t.panelEyebrow}
          </span>
        </p>
        <div className="max-w-md">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">
            {t.panelTitle}
          </h2>
          <ul className="mt-8 space-y-5">
            {t.features.map((f, i) => {
              const Icon = ICONS[i] ?? Layers;
              return (
                <li key={f.t} className="flex gap-4">
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    strokeWidth={1.75}
                  />
                  <div>
                    <p className="font-medium tracking-tight">{f.t}</p>
                    <p className="mt-0.5 text-sm text-muted">{f.d}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="font-mono text-[11px] text-muted">
          © {new Date().getFullYear()} Studio VM
        </p>
      </div>

      {/* Rechterpaneel — login */}
      <div className="flex w-full flex-col px-6 py-10 lg:w-1/2">
        <Link
          href={localePath(locale, "/")}
          className="inline-flex items-center gap-2 self-start text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          {t.back}
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {t.eyebrow}
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {t.title}
            </h1>
            <p className="mt-4 text-muted">{t.intro}</p>

            <form
              action={(fd) =>
                start(async () => setState(await sendMagicLink(fd)))
              }
              className="mt-8 space-y-4 rounded-2xl border bg-card p-6"
            >
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden
              />
              <input type="hidden" name="locale" value={locale} />
              {next ? (
                <input type="hidden" name="next" value={next} />
              ) : null}
              <div>
                <label
                  htmlFor="email"
                  className="block font-mono text-xs uppercase tracking-widest text-muted"
                >
                  {t.email}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t.placeholder}
                  className="mt-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {pending ? (
                  <Mail className="h-4 w-4 animate-pulse" strokeWidth={2} />
                ) : (
                  <Lock className="h-4 w-4" strokeWidth={2} />
                )}
                {pending ? t.sending : t.button}
              </button>
              {state.message && (
                <p
                  className={`flex items-center gap-2 text-sm ${
                    state.ok ? "text-accent" : "text-red-500"
                  }`}
                >
                  {state.ok ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <AlertCircle className="h-4 w-4" strokeWidth={2} />
                  )}
                  {state.message}
                </p>
              )}
            </form>
            <p className="mt-6 text-xs text-muted">{t.note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
