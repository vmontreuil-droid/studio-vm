import { Ban, Clock, LogIn, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  actieveBlokkades,
  logboek,
  tijdstip,
  tweestapsStaat,
  type LogRegel,
} from "@/lib/admin-beveiliging";
import { TweestapsBeheer } from "@/components/admin/tweestaps-beheer";
import { geefAdresVrij } from "@/app/actions/admin-beveiliging";

export const dynamic = "force-dynamic";
export const metadata = { title: "Beveiliging" };

const VIA: Record<string, string> = {
  app: "wachtwoord + code",
  herstel: "wachtwoord + herstelcode",
  wachtwoord: "enkel wachtwoord",
  noodrem: "noodrem (zonder code)",
};

const REDEN: Record<string, string> = {
  wachtwoord: "verkeerd wachtwoord",
  code: "verkeerde code",
  "geen code": "geen code",
};

function Lijst({ regels, leeg, soort }: { regels: LogRegel[]; leeg: string; soort: "ok" | "fout" }) {
  if (!regels.length) return <p className="mt-3 text-muted">{leeg}</p>;
  return (
    <ul className="mt-3 divide-y">
      {regels.map((r, i) => (
        <li key={`${r.t}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
          <span className="font-medium tabular-nums">{tijdstip(r.t)}</span>
          <span className="text-muted">
            {r.plaats} · <span className="font-mono text-xs">{r.ip}</span> · {r.toestel}
          </span>
          <span className={soort === "ok" ? "text-xs text-muted" : "text-xs text-red-600"}>
            {soort === "ok" ? VIA[r.via ?? ""] ?? r.via : REDEN[r.reden ?? ""] ?? r.reden}
            {r.blok ? " → geblokkeerd" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminBeveiliging() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const [staat, blokkades, log] = await Promise.all([tweestapsStaat(), actieveBlokkades(), logboek()]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Beveiliging</h1>
        <p className="mt-0.5 text-sm text-muted">
          Tweestapsverificatie, blokkeren na foute pogingen en wie zich wanneer aanmeldde. Bij elke aanmelding
          krijg je een mail op info@studio-vm.be.
        </p>
      </div>

      {staat.noodrem && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400 bg-amber-200 px-4 py-2 text-sm text-amber-950">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          De noodrem ADMIN_2FA_UIT staat aan in Vercel: aanmelden vraagt nu geen code. Verwijder die variabele
          en herdeploy zodra je weer aan je app kunt.
        </p>
      )}
      {staat.aan === null && (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-100 px-4 py-2 text-sm text-red-900">
          De beveiligingsinstellingen konden niet gelezen worden uit de databank.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TweestapsBeheer aan={staat.aan === true} herstelOver={staat.herstelOver} />
        </div>
        <div className="rounded-xl border bg-background p-5 text-sm shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={2} />
            Altijd actief
          </div>
          <ul className="mt-3 space-y-2.5 text-muted">
            <li className="flex gap-2">
              <Timer className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Na <b className="text-foreground">5 foute pogingen</b> is dat adres 15 minuten geblokkeerd; elke
                volgende keer dubbel zo lang (tot 24 uur).
              </span>
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Een aanmelding blijft <b className="text-foreground">8 uur</b> geldig en is enkel via https
                bruikbaar.
              </span>
            </li>
            <li className="flex gap-2">
              <LogIn className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <b className="text-foreground">Overal afmelden</b>: wijzig ADMIN_PASSWORD (of zet een nieuwe
                ADMIN_SESSION_SECRET) in Vercel en herdeploy.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-background p-5 text-sm shadow-sm">
        <div className="flex items-center gap-2 font-medium">
          <Ban className="h-4 w-4 text-accent" strokeWidth={2} />
          Geblokkeerde adressen
        </div>
        {blokkades.length ? (
          <ul className="mt-3 divide-y">
            {blokkades.map((b) => (
              <li key={b.sleutel} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <span>
                  <span className="font-mono text-xs">{b.ip}</span>
                  {b.plaats && <span className="text-muted"> · {b.plaats}</span>}
                  <span className="text-muted"> · tot {tijdstip(b.tot)}</span>
                </span>
                <form action={geefAdresVrij}>
                  <input type="hidden" name="sleutel" value={b.sleutel} />
                  <button
                    type="submit"
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-card-hover"
                  >
                    Vrijgeven
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted">Geen enkel adres geblokkeerd.</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-background p-5 text-sm shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <LogIn className="h-4 w-4 text-accent" strokeWidth={2} />
            Recente aanmeldingen
          </div>
          <Lijst regels={log.geslaagd} soort="ok" leeg="Nog geen aanmeldingen bijgehouden." />
        </div>
        <div className="rounded-xl border bg-background p-5 text-sm shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="h-4 w-4 text-accent" strokeWidth={2} />
            Mislukte pogingen
          </div>
          <Lijst regels={log.mislukt} soort="fout" leeg="Geen mislukte pogingen." />
        </div>
      </div>
    </>
  );
}
