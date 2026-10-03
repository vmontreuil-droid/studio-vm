"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from "lucide-react";
import {
  beginTweestaps,
  maakNieuweHerstelcodes,
  rondTweestapsAf,
  schakelTweestapsUit,
} from "@/app/actions/admin-beveiliging";

type Stand = "rust" | "scan" | "codes" | "uit" | "nieuw";

const knop =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50";
const hoofdknop = `${knop} bg-foreground text-background`;
const tweedeknop = `${knop} border bg-background hover:bg-card-hover`;
const invoer =
  "w-full rounded-xl border bg-background px-4 py-3 font-mono text-base tracking-[0.3em] outline-none transition-colors focus:border-accent sm:w-56";

function Fout({ tekst }: { tekst: string }) {
  return (
    <p role="alert" className="mt-3 rounded-xl border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-900">
      {tekst}
    </p>
  );
}

function CodeVeld({
  waarde,
  zet,
  herstelOok,
}: {
  waarde: string;
  zet: (v: string) => void;
  herstelOok?: boolean;
}) {
  return (
    <input
      value={waarde}
      onChange={(e) => zet(e.target.value)}
      inputMode={herstelOok ? "text" : "numeric"}
      autoComplete="one-time-code"
      autoCapitalize="none"
      spellCheck={false}
      maxLength={herstelOok ? 12 : 7}
      placeholder={herstelOok ? "123456 of xxxx-xxxx" : "123456"}
      className={invoer}
      autoFocus
    />
  );
}

export function TweestapsBeheer(props: { aan: boolean; herstelOver: number }) {
  const router = useRouter();
  // Meteen de nieuwe stand tonen, zonder op router.refresh() te wachten. Die
  // geldt tot de server iets anders doorgeeft dan wat er bij de klik was.
  const [lokaal, setLokaal] = useState<{ basis: string; aan: boolean; herstelOver: number } | null>(null);
  const basis = `${props.aan}|${props.herstelOver}`;
  const { aan, herstelOver } = lokaal && lokaal.basis === basis ? lokaal : props;
  const [stand, setStand] = useState<Stand>("rust");
  const [bezig, start] = useTransition();
  const [fout, setFout] = useState("");
  const [code, setCode] = useState("");
  const [scan, setScan] = useState<{ geheim: string; qr: string } | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [bewaard, setBewaard] = useState(false);
  const [gekopieerd, setGekopieerd] = useState("");

  const opnieuw = (s: Stand) => {
    setStand(s);
    setFout("");
    setCode("");
  };

  const kopieer = async (tekst: string, wat: string) => {
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(wat);
      setTimeout(() => setGekopieerd(""), 1800);
    } catch {}
  };

  const download = () => {
    const tekst = [
      "Studio VM — herstelcodes voor het beheer",
      `Aangemaakt: ${new Date().toLocaleString("nl-BE")}`,
      "Elke code werkt één keer, in plaats van de code uit de app.",
      "",
      ...codes,
      "",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([tekst], { type: "text/plain" }));
    a.download = "studio-vm-herstelcodes.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ---------- herstelcodes tonen (na inschakelen of vernieuwen) ---------- */
  if (stand === "codes") {
    return (
      <div className="rounded-xl border bg-background p-5 text-sm shadow-sm">
        <div className="flex items-center gap-2 font-medium">
          <KeyRound className="h-4 w-4 text-accent" strokeWidth={2} />
          Je herstelcodes
        </div>
        <p className="mt-1 text-muted">
          Telefoon kwijt of stuk? Dan meld je je aan met één van deze codes in plaats van de code uit de app.
          Elke code werkt één keer. <b className="text-foreground">Ze worden maar nu getoond</b> — bewaar ze
          buiten deze computer (wachtwoordbeheerder, of afgedrukt in een lade).
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-[15px] tracking-wider sm:grid-cols-4">
          {codes.map((c) => (
            <li key={c} className="rounded-lg border bg-card px-3 py-2 text-center">
              {c}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={tweedeknop} onClick={() => kopieer(codes.join("\n"), "codes")}>
            {gekopieerd === "codes" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {gekopieerd === "codes" ? "Gekopieerd" : "Kopiëren"}
          </button>
          <button type="button" className={tweedeknop} onClick={download}>
            <Download className="h-4 w-4" />
            Downloaden (.txt)
          </button>
        </div>
        <label className="mt-5 flex items-center gap-2">
          <input type="checkbox" checked={bewaard} onChange={(e) => setBewaard(e.target.checked)} className="h-4 w-4" />
          Ik heb de codes veilig bewaard
        </label>
        <button
          type="button"
          disabled={!bewaard}
          className={`${hoofdknop} mt-3`}
          onClick={() => {
            setCodes([]);
            setBewaard(false);
            opnieuw("rust");
            router.refresh();
          }}
        >
          <Check className="h-4 w-4" />
          Klaar
        </button>
      </div>
    );
  }

  /* ---------- inschakelen: scannen + eerste code ---------- */
  if (stand === "scan" && scan) {
    const groepen = scan.geheim.match(/.{1,4}/g)?.join(" ") ?? scan.geheim;
    return (
      <div className="rounded-xl border bg-background p-5 text-sm shadow-sm">
        <div className="flex items-center gap-2 font-medium">
          <QrCode className="h-4 w-4 text-accent" strokeWidth={2} />
          Tweestapsverificatie inschakelen
        </div>
        <ol className="mt-4 grid gap-6 lg:grid-cols-[auto_1fr]">
          <li className="flex flex-col items-center gap-2">
            <div
              className="h-52 w-52 rounded-xl border bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: scan.qr }}
              aria-label="QR-code voor je authenticator-app"
              role="img"
            />
          </li>
          <li className="space-y-4">
            <div>
              <p className="font-medium">1. Open je authenticator-app</p>
              <p className="text-muted">
                Google Authenticator, Microsoft Authenticator, 1Password, Authy… Tik op <b>+</b> en kies{" "}
                <b>QR-code scannen</b>.
              </p>
            </div>
            <div>
              <p className="font-medium">2. Scan de code hiernaast</p>
              <p className="text-muted">Lukt scannen niet? Kies „sleutel invoeren” en typ deze sleutel over:</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-lg border bg-card px-3 py-2 font-mono text-[13px] tracking-wider">
                  {groepen}
                </code>
                <button type="button" className={tweedeknop} onClick={() => kopieer(scan.geheim, "sleutel")}>
                  {gekopieerd === "sleutel" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {gekopieerd === "sleutel" ? "Gekopieerd" : "Kopiëren"}
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await rondTweestapsAf(code);
                  if (!r.ok) return setFout(r.fout);
                  setCodes(r.codes);
                  setLokaal({ basis, aan: true, herstelOver: r.codes.length });
                  setScan(null);
                  opnieuw("codes");
                });
              }}
            >
              <p className="font-medium">3. Typ de code van 6 cijfers die de app nu toont</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <CodeVeld waarde={code} zet={setCode} />
                <button type="submit" disabled={bezig || code.replace(/\D/g, "").length !== 6} className={hoofdknop}>
                  {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Bevestigen en inschakelen
                </button>
                <button type="button" className={tweedeknop} onClick={() => opnieuw("rust")}>
                  Annuleren
                </button>
              </div>
              {fout && <Fout tekst={fout} />}
            </form>
          </li>
        </ol>
      </div>
    );
  }

  /* ---------- code vragen voor uitschakelen of nieuwe herstelcodes ---------- */
  if (stand === "uit" || stand === "nieuw") {
    const uit = stand === "uit";
    return (
      <div className="rounded-xl border bg-background p-5 text-sm shadow-sm">
        <div className="flex items-center gap-2 font-medium">
          {uit ? <ShieldOff className="h-4 w-4 text-red-600" /> : <RefreshCw className="h-4 w-4 text-accent" />}
          {uit ? "Tweestapsverificatie uitschakelen" : "Nieuwe herstelcodes maken"}
        </div>
        <p className="mt-1 text-muted">
          {uit
            ? "Bevestig met een code uit je app (of een herstelcode). Daarna volstaat het wachtwoord weer om aan te melden."
            : "Bevestig met een code uit je app. De oude herstelcodes werken daarna niet meer."}
        </p>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              if (uit) {
                const r = await schakelTweestapsUit(code);
                if (!r.ok) return setFout(r.fout);
                setLokaal({ basis, aan: false, herstelOver: 0 });
                opnieuw("rust");
                router.refresh();
              } else {
                const r = await maakNieuweHerstelcodes(code);
                if (!r.ok) return setFout(r.fout);
                setCodes(r.codes);
                setLokaal({ basis, aan: true, herstelOver: r.codes.length });
                opnieuw("codes");
              }
            });
          }}
        >
          <CodeVeld waarde={code} zet={setCode} herstelOok={uit} />
          <button
            type="submit"
            disabled={bezig || code.trim().length < 6}
            className={uit ? `${knop} bg-red-600 text-white` : hoofdknop}
          >
            {bezig && <Loader2 className="h-4 w-4 animate-spin" />}
            {uit ? "Uitschakelen" : "Nieuwe codes maken"}
          </button>
          <button type="button" className={tweedeknop} onClick={() => opnieuw("rust")}>
            Annuleren
          </button>
        </form>
        {fout && <Fout tekst={fout} />}
      </div>
    );
  }

  /* ---------- rust ---------- */
  return (
    <div className="rounded-xl border bg-background p-5 text-sm shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          <Smartphone className="h-4 w-4 text-accent" strokeWidth={2} />
          Tweestapsverificatie
        </div>
        {aan ? (
          <span className="rounded-full border border-emerald-400 bg-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-950">
            Staat aan
          </span>
        ) : (
          <span className="rounded-full border border-amber-400 bg-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-950">
            Staat uit
          </span>
        )}
      </div>
      <p className="mt-1 text-muted">
        {aan
          ? `Bij elke aanmelding vraagt het beheer naast het wachtwoord ook de code uit je authenticator-app. Nog ${herstelOver} herstelcode${herstelOver === 1 ? "" : "s"} over.`
          : "Nu volstaat het wachtwoord. Met tweestapsverificatie heeft iemand die je wachtwoord kent nog altijd je telefoon nodig."}
      </p>
      {aan && herstelOver <= 2 && (
        <p className="mt-3 rounded-xl border border-amber-400 bg-amber-200 px-3 py-2 text-amber-950">
          Bijna geen herstelcodes meer. Maak nieuwe aan.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {aan ? (
          <>
            <button type="button" className={tweedeknop} onClick={() => opnieuw("nieuw")}>
              <RefreshCw className="h-4 w-4" />
              Nieuwe herstelcodes
            </button>
            <button type="button" className={`${tweedeknop} text-red-600`} onClick={() => opnieuw("uit")}>
              <ShieldOff className="h-4 w-4" />
              Uitschakelen
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={bezig}
            className={hoofdknop}
            onClick={() =>
              start(async () => {
                const r = await beginTweestaps();
                if (!r.ok) return setFout(r.fout);
                setScan({ geheim: r.geheim, qr: r.qr });
                opnieuw("scan");
              })
            }
          >
            {bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Inschakelen
          </button>
        )}
      </div>
      {fout && <Fout tekst={fout} />}
    </div>
  );
}
