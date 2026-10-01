"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Building2,
  MapPin,
  Cpu,
  ClipboardList,
  FileUp,
  X,
  Check,
  AlertCircle,
  Loader2,
  Send,
  Crosshair,
} from "lucide-react";
import { uploadPlekken, dienAanvraagIn } from "@/app/actions/offerte-3d";
import { LANDEN, stelselVoor, isLand } from "@/lib/stelsel";
import type { Locale } from "@/lib/i18n/config";

const MERKEN = ["Trimble", "Topcon", "Leica", "Unicontrol", "CHCNAV", "Komatsu", "Caterpillar"];

const L = {
  nl: {
    bedrijfKop: "Uw bedrijf",
    bedrijf: "Bedrijf",
    naam: "Naam",
    email: "E-mail",
    telefoon: "Telefoon",
    btw: "Btw-nummer",
    optioneel: "optioneel",
    werfKop: "De werf",
    werfUitleg: "Het adres van de werf bepaalt het coördinatenstelsel en de hoogtereferentie.",
    straat: "Straat en nummer",
    postcode: "Postcode",
    gemeente: "Gemeente",
    land: "Land",
    kiesLand: "Kies een land",
    voorstel: "Voorgesteld stelsel",
    eigenStelsel: "Werkt u met een eigen of lokaal werfstelsel / kalibratie?",
    eigenStelselPh: "Bv. lokaal stelsel van de landmeter, kalibratiebestand…",
    machineKop: "Uw machinesturing",
    merk: "Merk",
    merkUitleg: "Kies één of meerdere systemen — u krijgt het model in elk gekozen formaat.",
    merkNodig: "Kies minstens één machinesturing.",
    categorie: "Wanneer hebt u het model nodig?",
    categorieen: [
      { id: "vroegtijdig", titel: "Vroegtijdig", tekst: "Meer dan 3 weken op voorhand" },
      { id: "normaal", titel: "Normaal", tekst: "Binnen 1 à 3 weken" },
      { id: "last-minute", titel: "Last-minute", tekst: "Binnen 5 werkdagen" },
    ],
    verantwoordelijk: "Ik begrijp dat Studio VM enkel het 3D-model levert. De werking, instelling en kalibratie van mijn machinesturing en de controle op de werf blijven mijn verantwoordelijkheid.",
    verantwoordelijkNodig: "Bevestig dat u verantwoordelijk blijft voor uw eigen systeem.",
    kiesMerk: "Kies een merk",
    anders: "Ander merk",
    andersPh: "Welk systeem?",
    machines: "Machines",
    machineTypes: ["Graafmachine", "Grader", "Dozer", "Wals", "Asfaltmachine"],
    projectKop: "Het project",
    werk: "Soort werk",
    werkTypes: ["Grondwerk / platform", "Wegenis", "Riolering", "Bouwput", "Parking / verharding", "Sportterrein", "Anders"],
    kiesWerk: "Kies…",
    leverdatum: "Gewenste leverdatum",
    omschrijving: "Toelichting",
    omschrijvingPh: "Wat moet er gemodelleerd worden? Welke fase? Bijzonderheden?",
    plannenKop: "Plannen",
    plannenUitleg: "PDF, DWG, DXF, LandXML of een zip — max. 50 MB per bestand, 15 bestanden.",
    sleep: "Sleep uw plannen hierheen of klik om te kiezen",
    verplicht: "Velden met * zijn verplicht.",
    verzend: "Offerte aanvragen",
    bezig: "Plannen opladen…",
    bezigVerzend: "Aanvraag versturen…",
    ok: "Bedankt! Uw aanvraag is goed ontvangen. U krijgt meteen een bevestiging per mail, en ik bezorg u zo snel mogelijk een offerte op maat.",
    fout: "Er ging iets mis bij het versturen. Probeer opnieuw, of mail uw plannen naar info@studio-vm.be.",
    ongeldig: "Vul alle verplichte velden in (met *).",
    teGroot: "Een bestand is groter dan 50 MB. Stuur het als zip of via een downloadlink in de toelichting.",
    type: "Dit bestandstype wordt niet aanvaard. Zip het eventueel.",
    teVeel: "Maximaal 15 bestanden.",
  },
  fr: {
    bedrijfKop: "Votre entreprise",
    bedrijf: "Entreprise",
    naam: "Nom",
    email: "E-mail",
    telefoon: "Téléphone",
    btw: "Numéro de TVA",
    optioneel: "facultatif",
    werfKop: "Le chantier",
    werfUitleg: "L'adresse du chantier détermine le système de coordonnées et la référence altimétrique.",
    straat: "Rue et numéro",
    postcode: "Code postal",
    gemeente: "Commune",
    land: "Pays",
    kiesLand: "Choisissez un pays",
    voorstel: "Système proposé",
    eigenStelsel: "Travaillez-vous avec un système local / une calibration propre ?",
    eigenStelselPh: "P. ex. système local du géomètre, fichier de calibration…",
    machineKop: "Votre guidage",
    merk: "Marque",
    merkUitleg: "Choisissez un ou plusieurs systèmes — vous recevez le modèle dans chaque format choisi.",
    merkNodig: "Choisissez au moins un système de guidage.",
    categorie: "Pour quand vous faut-il le modèle ?",
    categorieen: [
      { id: "vroegtijdig", titel: "Anticipé", tekst: "Plus de 3 semaines à l'avance" },
      { id: "normaal", titel: "Normal", tekst: "Dans 1 à 3 semaines" },
      { id: "last-minute", titel: "Urgent", tekst: "Dans les 5 jours ouvrables" },
    ],
    verantwoordelijk: "Je comprends que Studio VM livre uniquement le modèle 3D. Le fonctionnement, le réglage et la calibration de mon système de guidage ainsi que le contrôle sur chantier restent sous ma responsabilité.",
    verantwoordelijkNodig: "Confirmez que vous restez responsable de votre propre système.",
    kiesMerk: "Choisissez une marque",
    anders: "Autre marque",
    andersPh: "Quel système ?",
    machines: "Machines",
    machineTypes: ["Pelle", "Niveleuse", "Bouteur", "Compacteur", "Finisseur"],
    projectKop: "Le projet",
    werk: "Type de travaux",
    werkTypes: ["Terrassement / plateforme", "Voirie", "Égouttage", "Fouille", "Parking / revêtement", "Terrain de sport", "Autre"],
    kiesWerk: "Choisir…",
    leverdatum: "Date de livraison souhaitée",
    omschrijving: "Précisions",
    omschrijvingPh: "Que faut-il modéliser ? Quelle phase ? Particularités ?",
    plannenKop: "Plans",
    plannenUitleg: "PDF, DWG, DXF, LandXML ou un zip — max. 50 Mo par fichier, 15 fichiers.",
    sleep: "Glissez vos plans ici ou cliquez pour choisir",
    verplicht: "Les champs marqués * sont obligatoires.",
    verzend: "Demander un devis",
    bezig: "Envoi des plans…",
    bezigVerzend: "Envoi de la demande…",
    ok: "Merci ! Votre demande est bien reçue. Vous recevez une confirmation par mail, et je vous envoie au plus vite un devis sur mesure.",
    fout: "Un problème est survenu. Réessayez, ou envoyez vos plans à info@studio-vm.be.",
    ongeldig: "Veuillez remplir tous les champs obligatoires (*).",
    teGroot: "Un fichier dépasse 50 Mo. Envoyez-le en zip ou via un lien de téléchargement dans les précisions.",
    type: "Ce type de fichier n'est pas accepté. Zippez-le éventuellement.",
    teVeel: "Maximum 15 fichiers.",
  },
  en: {
    bedrijfKop: "Your company",
    bedrijf: "Company",
    naam: "Name",
    email: "Email",
    telefoon: "Phone",
    btw: "VAT number",
    optioneel: "optional",
    werfKop: "The site",
    werfUitleg: "The site address determines the coordinate system and height datum.",
    straat: "Street and number",
    postcode: "Postcode",
    gemeente: "Town / city",
    land: "Country",
    kiesLand: "Choose a country",
    voorstel: "Proposed system",
    eigenStelsel: "Do you work with a local site system or your own calibration?",
    eigenStelselPh: "E.g. surveyor's local grid, calibration file…",
    machineKop: "Your machine control",
    merk: "Brand",
    merkUitleg: "Choose one or more systems — you get the model in every format you pick.",
    merkNodig: "Choose at least one machine control system.",
    categorie: "When do you need the model?",
    categorieen: [
      { id: "vroegtijdig", titel: "Early", tekst: "More than 3 weeks ahead" },
      { id: "normaal", titel: "Standard", tekst: "Within 1 to 3 weeks" },
      { id: "last-minute", titel: "Last-minute", tekst: "Within 5 working days" },
    ],
    verantwoordelijk: "I understand that Studio VM only delivers the 3D model. The operation, setup and calibration of my machine control system and the checks on site remain my responsibility.",
    verantwoordelijkNodig: "Please confirm that you remain responsible for your own system.",
    kiesMerk: "Choose a brand",
    anders: "Other brand",
    andersPh: "Which system?",
    machines: "Machines",
    machineTypes: ["Excavator", "Grader", "Dozer", "Roller", "Paver"],
    projectKop: "The project",
    werk: "Type of work",
    werkTypes: ["Earthworks / platform", "Roads", "Sewerage", "Excavation", "Car park / paving", "Sports field", "Other"],
    kiesWerk: "Choose…",
    leverdatum: "Desired delivery date",
    omschrijving: "Details",
    omschrijvingPh: "What needs to be modelled? Which phase? Anything special?",
    plannenKop: "Plans",
    plannenUitleg: "PDF, DWG, DXF, LandXML or a zip — max. 50 MB per file, 15 files.",
    sleep: "Drop your plans here or click to choose",
    verplicht: "Fields marked * are required.",
    verzend: "Request a quote",
    bezig: "Uploading plans…",
    bezigVerzend: "Sending request…",
    ok: "Thank you! Your request has been received. You will get a confirmation by email, and I will send you a tailored quote as soon as possible.",
    fout: "Something went wrong. Please try again, or email your plans to info@studio-vm.be.",
    ongeldig: "Please fill in all required fields (*).",
    teGroot: "A file is larger than 50 MB. Send it zipped or as a download link in the details.",
    type: "This file type is not accepted. You may zip it.",
    teVeel: "Maximum 15 files.",
  },
};

type Status = { soort: "ok" | "fout"; tekst: string } | null;

export function Offerte3dFormulier({ locale }: { locale: Locale }) {
  const t = L[locale];
  const [land, setLand] = useState("");
  const [merken, setMerken] = useState<string[]>([]);
  const [bestanden, setBestanden] = useState<File[]>([]);
  const [fase, setFase] = useState<"" | "upload" | "verzend">("");
  const [status, setStatus] = useState<Status>(null);
  const [, startTransition] = useTransition();
  const kiezer = useRef<HTMLInputElement>(null);

  const landNamen = useMemo(() => {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return [...LANDEN]
      .map((c) => ({ code: c, naam: dn.of(c) ?? c }))
      .sort((a, b) => a.naam.localeCompare(b.naam, locale));
  }, [locale]);

  const voorstel = isLand(land) ? stelselVoor(land, null, null) : null;

  function voegToe(lijst: FileList | null) {
    if (!lijst) return;
    // Meteen kopiëren: een FileList is "live" en wordt leeg zodra het
    // invoerveld gereset wordt — vóór React deze updater uitvoert.
    const gekozen = Array.from(lijst);
    setBestanden((oud) => {
      const nieuw = [...oud];
      for (const f of gekozen) if (!nieuw.some((x) => x.name === f.name && x.size === f.size)) nieuw.push(f);
      return nieuw.slice(0, 15);
    });
  }

  async function verstuur(fd: FormData) {
    setStatus(null);
    if (merken.length === 0) {
      setStatus({ soort: "fout", tekst: t.merkNodig });
      return;
    }
    try {
      let geupload: { naam: string; pad: string; grootte: number }[] = [];
      if (bestanden.length) {
        setFase("upload");
        const r = await uploadPlekken(bestanden.map((f) => ({ naam: f.name, grootte: f.size })));
        if (!r.ok) {
          const tekst = r.fout === "te_groot" ? t.teGroot : r.fout === "type" ? t.type : r.fout === "te_veel" ? t.teVeel : t.fout;
          setStatus({ soort: "fout", tekst });
          setFase("");
          return;
        }
        for (let i = 0; i < r.plekken.length; i++) {
          const p = r.plekken[i];
          const f = bestanden[i];
          // Eenmalige, getekende upload-link: geen sleutel nodig in de browser.
          const up = await fetch(p.url, {
            method: "PUT",
            headers: { "content-type": f.type || "application/octet-stream", "x-upsert": "false" },
            body: f,
          });
          if (!up.ok) throw new Error("upload " + up.status);
          geupload.push({ naam: f.name, pad: p.pad, grootte: f.size });
        }
      }
      setFase("verzend");
      fd.set("bestanden", JSON.stringify(geupload));
      fd.set("locale", locale);
      const res = await dienAanvraagIn(fd);
      if (res.ok) {
        setStatus({ soort: "ok", tekst: t.ok });
        setBestanden([]);
        geupload = [];
      } else {
        setStatus({ soort: "fout", tekst: res.fout === "ongeldig" ? t.ongeldig : t.fout });
      }
    } catch {
      setStatus({ soort: "fout", tekst: t.fout });
    }
    setFase("");
  }

  if (status?.soort === "ok") {
    return (
      <div className="rounded-3xl border bg-card p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <Check className="h-7 w-7 text-accent" strokeWidth={2} />
        </span>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed">{status.tekst}</p>
      </div>
    );
  }

  const bezig = fase !== "";

  return (
    <form
      action={(fd) => startTransition(() => verstuur(fd))}
      className="space-y-8"
    >
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <Blok icoon={Building2} titel={t.bedrijfKop}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Veld naam="bedrijf" label={t.bedrijf} verplicht autoComplete="organization" />
          <Veld naam="naam" label={t.naam} verplicht autoComplete="name" />
          <Veld naam="email" label={t.email} type="email" verplicht autoComplete="email" />
          <Veld naam="telefoon" label={t.telefoon} type="tel" verplicht autoComplete="tel" />
          <Veld naam="btw" label={`${t.btw} (${t.optioneel})`} />
        </div>
      </Blok>

      <Blok icoon={MapPin} titel={t.werfKop} uitleg={t.werfUitleg}>
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <Veld naam="werf_straat" label={`${t.straat} (${t.optioneel})`} autoComplete="street-address" />
          </div>
          <div className="sm:col-span-2">
            <Veld naam="werf_postcode" label={t.postcode} verplicht autoComplete="postal-code" />
          </div>
          <div className="sm:col-span-4">
            <Veld naam="werf_gemeente" label={t.gemeente} verplicht autoComplete="address-level2" />
          </div>
          <div className="sm:col-span-6">
            <Label label={t.land} verplicht htmlFor="werf_land" />
            <select
              id="werf_land"
              name="werf_land"
              required
              value={land}
              onChange={(e) => setLand(e.target.value)}
              className={INPUT}
            >
              <option value="">{t.kiesLand}</option>
              {landNamen.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.naam}
                </option>
              ))}
            </select>
          </div>
        </div>
        {voorstel && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
            <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{t.voorstel}</p>
              <p className="mt-1 font-medium">
                {voorstel.stelsel} <span className="font-mono text-xs text-muted">({voorstel.epsg})</span>
              </p>
              <p className="text-muted">{voorstel.hoogte}</p>
            </div>
          </div>
        )}
        <div className="mt-4">
          <Veld naam="eigen_stelsel" label={`${t.eigenStelsel} (${t.optioneel})`} placeholder={t.eigenStelselPh} />
        </div>
      </Blok>

      <Blok icoon={Cpu} titel={t.machineKop}>
        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-widest text-muted">
            {t.merk}
            <span className="ml-1 text-accent">*</span>
          </legend>
          <p className="mt-1 text-sm text-muted">{t.merkUitleg}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...MERKEN, "anders"].map((m) => (
              <label
                key={m}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10"
              >
                <input
                  type="checkbox"
                  name="merken"
                  value={m}
                  checked={merken.includes(m)}
                  onChange={(ev) =>
                    setMerken((oud) => (ev.target.checked ? [...oud, m] : oud.filter((x) => x !== m)))
                  }
                  className="accent-[var(--accent)]"
                />
                {m === "anders" ? t.anders : m}
              </label>
            ))}
          </div>
          {merken.includes("anders") && (
            <div className="mt-4 sm:max-w-sm">
              <Veld naam="merk_anders" label={t.anders} placeholder={t.andersPh} />
            </div>
          )}
        </fieldset>
        <fieldset className="mt-5">
          <legend className="font-mono text-xs uppercase tracking-widest text-muted">{t.machines}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {t.machineTypes.map((m) => (
              <label
                key={m}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10"
              >
                <input type="checkbox" name="machines" value={m} className="accent-[var(--accent)]" />
                {m}
              </label>
            ))}
          </div>
        </fieldset>
      </Blok>

      <Blok icoon={ClipboardList} titel={t.projectKop}>
        <fieldset className="mb-6">
          <legend className="font-mono text-xs uppercase tracking-widest text-muted">
            {t.categorie}
            <span className="ml-1 text-accent">*</span>
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {t.categorieen.map((c, i) => (
              <label
                key={c.id}
                className="cursor-pointer rounded-2xl border p-4 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/10"
              >
                <input type="radio" name="categorie" value={c.id} defaultChecked={i === 1} required className="sr-only" />
                <span className="block font-semibold tracking-tight">{c.titel}</span>
                <span className="mt-1 block text-sm text-muted">{c.tekst}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label label={t.werk} htmlFor="werk" />
            <select id="werk" name="werk" className={INPUT} defaultValue="">
              <option value="">{t.kiesWerk}</option>
              {t.werkTypes.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <Veld naam="leverdatum" label={`${t.leverdatum} (${t.optioneel})`} type="date" />
        </div>
        <div className="mt-4">
          <Label label={t.omschrijving} htmlFor="omschrijving" />
          <textarea id="omschrijving" name="omschrijving" rows={4} placeholder={t.omschrijvingPh} className={INPUT} />
        </div>
      </Blok>

      <Blok icoon={FileUp} titel={t.plannenKop} uitleg={t.plannenUitleg}>
        <button
          type="button"
          onClick={() => kiezer.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            voegToe(e.dataTransfer.files);
          }}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
        >
          <FileUp className="h-8 w-8 text-accent" strokeWidth={1.5} />
          {t.sleep}
        </button>
        <input
          ref={kiezer}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            voegToe(e.target.files);
            e.target.value = "";
          }}
        />
        {bestanden.length > 0 && (
          <ul className="mt-4 divide-y rounded-xl border">
            {bestanden.map((f) => (
              <li key={f.name + f.size} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="truncate">{f.name}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs text-muted">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button
                    type="button"
                    aria-label="×"
                    onClick={() => setBestanden((b) => b.filter((x) => x !== f))}
                    className="rounded-full p-1 text-muted hover:bg-card-hover hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Blok>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-card p-5 text-sm leading-relaxed">
        <input type="checkbox" name="verantwoordelijk" value="ja" required className="mt-1 accent-[var(--accent)]" />
        <span>
          {t.verantwoordelijk}
          <span className="ml-1 text-accent">*</span>
        </span>
      </label>

      {status?.soort === "fout" && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" strokeWidth={2} />
          {status.tekst}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted">{t.verplicht}</p>
        <button
          type="submit"
          disabled={bezig}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={2} />}
          {fase === "upload" ? t.bezig : fase === "verzend" ? t.bezigVerzend : t.verzend}
        </button>
      </div>
    </form>
  );
}

const INPUT =
  "mt-2 w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";

function Blok({
  icoon: Icoon,
  titel,
  uitleg,
  children,
}: {
  icoon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titel: string;
  uitleg?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-card p-6 sm:p-8">
      <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight">
        <Icoon className="h-5 w-5 text-accent" strokeWidth={1.5} />
        {titel}
      </h2>
      {uitleg && <p className="mt-1 text-sm text-muted">{uitleg}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Label({ label, verplicht, htmlFor }: { label: string; verplicht?: boolean; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="block font-mono text-xs uppercase tracking-widest text-muted">
      {label}
      {verplicht && <span className="ml-1 text-accent">*</span>}
    </label>
  );
}

function Veld({
  naam,
  label,
  type = "text",
  verplicht,
  placeholder,
  autoComplete,
}: {
  naam: string;
  label: string;
  type?: string;
  verplicht?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <Label label={label} verplicht={verplicht} htmlFor={naam} />
      <input
        id={naam}
        name={naam}
        type={type}
        required={verplicht}
        placeholder={placeholder}
        autoComplete={autoComplete ?? "off"}
        className={INPUT}
      />
    </div>
  );
}
