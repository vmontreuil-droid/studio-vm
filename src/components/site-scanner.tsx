"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Search,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Printer,
  ClipboardCheck,
  Clipboard,
} from "lucide-react";
import { scanSite, type ScanResult } from "@/app/actions/scan";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

const T: Record<
  Locale,
  {
    placeholder: string;
    button: string;
    scanning: string;
    scoreLabel: string;
    stackLabel: string;
    speedLabel: string;
    weightLabel: string;
    verdictGood: string;
    verdictMeh: string;
    verdictBad: string;
    recoTitle: string;
    reco: string;
    ctaButton: string;
    disclaimer: string;
    again: string;
    benchTitle: string;
    benchYou: string;
    benchSvm: string;
    benchNote: string;
    print: string;
    copy: string;
    copied: string;
    copyTpl: (host: string, score: number, stack: string, ms: number, kb: number) => string;
  }
> = {
  nl: {
    placeholder: "jouwhuidigesite.be",
    button: "Scan mijn site",
    scanning: "Bezig met scannen…",
    scoreLabel: "Score",
    stackLabel: "Platform",
    speedLabel: "Reactietijd",
    weightLabel: "HTML",
    verdictGood: "Solide basis. Er valt altijd te optimaliseren, maar dit staat er goed voor.",
    verdictMeh: "Werkt, maar laat punten liggen die bezoekers én Google merken.",
    verdictBad: "Hier ligt duidelijk werk. Elk rood punt is omzet die wegloopt.",
    recoTitle: "Wat ik hieraan zou doen",
    reco: "Op basis van de rode en oranje punten hierboven: een herbouw in Next.js lost snelheid, mobiel en SEO-basis in één keer op — en je houdt de code.",
    ctaButton: "Bespreek mijn site",
    disclaimer:
      "Snelle heuristische check, geen volledige audit. Live opgehaald vanaf onze server. Voor een grondige analyse: stuur een bericht.",
    again: "Andere site scannen",
    benchTitle: "Jouw site vs. een Studio VM-build",
    benchYou: "Jouw site",
    benchSvm: "Studio VM-standaard",
    benchNote:
      "Een Studio VM-build mikt standaard op 100/100 op exact deze punten — snelheid en SEO-basis zijn geen extra, maar het vertrekpunt.",
    print: "Print / bewaar als PDF",
    copy: "Kopieer samenvatting",
    copied: "Gekopieerd",
    copyTpl: (host, score, stack, ms, kb) =>
      `Site-scan van ${host} (via studio-vm.be/scan)\nScore: ${score}/100\nPlatform: ${stack}\nReactietijd: ${ms} ms\nHTML: ${kb} KB\n\nEen Studio VM-build mikt op 100/100. Bespreek: studio-vm.be`,
  },
  fr: {
    placeholder: "votresiteactuel.be",
    button: "Scanner mon site",
    scanning: "Analyse en cours…",
    scoreLabel: "Score",
    stackLabel: "Plateforme",
    speedLabel: "Temps de réponse",
    weightLabel: "HTML",
    verdictGood: "Base solide. Il y a toujours à optimiser, mais c'est bien parti.",
    verdictMeh: "Ça marche, mais laisse des points que visiteurs et Google remarquent.",
    verdictBad: "Il y a clairement du travail. Chaque point rouge, c'est du chiffre qui s'en va.",
    recoTitle: "Ce que je ferais",
    reco: "Sur base des points rouges et oranges ci-dessus : une reconstruction en Next.js règle vitesse, mobile et base SEO d'un coup — et vous gardez le code.",
    ctaButton: "Discuter de mon site",
    disclaimer:
      "Check heuristique rapide, pas un audit complet. Récupéré en direct depuis notre serveur. Pour une analyse approfondie : envoyez un message.",
    again: "Scanner un autre site",
    benchTitle: "Votre site vs. un build Studio VM",
    benchYou: "Votre site",
    benchSvm: "Standard Studio VM",
    benchNote:
      "Un build Studio VM vise par défaut 100/100 sur exactement ces points — vitesse et base SEO ne sont pas un extra, mais le point de départ.",
    print: "Imprimer / enregistrer en PDF",
    copy: "Copier le résumé",
    copied: "Copié",
    copyTpl: (host, score, stack, ms, kb) =>
      `Scan de ${host} (via studio-vm.be/scan)\nScore : ${score}/100\nPlateforme : ${stack}\nTemps de réponse : ${ms} ms\nHTML : ${kb} KB\n\nUn build Studio VM vise 100/100. Discutons : studio-vm.be`,
  },
  en: {
    placeholder: "yourcurrentsite.com",
    button: "Scan my site",
    scanning: "Scanning…",
    scoreLabel: "Score",
    stackLabel: "Platform",
    speedLabel: "Response time",
    weightLabel: "HTML",
    verdictGood: "Solid base. There's always room to optimize, but this is in good shape.",
    verdictMeh: "Works, but leaves points that visitors and Google notice.",
    verdictBad: "There's clearly work here. Every red point is revenue walking away.",
    recoTitle: "What I'd do about this",
    reco: "Based on the red and amber points above: a rebuild in Next.js fixes speed, mobile and SEO basics at once — and you keep the code.",
    ctaButton: "Discuss my site",
    disclaimer:
      "Quick heuristic check, not a full audit. Fetched live from our server. For a thorough analysis: send a message.",
    again: "Scan another site",
    benchTitle: "Your site vs. a Studio VM build",
    benchYou: "Your site",
    benchSvm: "Studio VM standard",
    benchNote:
      "A Studio VM build aims for 100/100 on exactly these points by default — speed and SEO basics aren't an extra, they're the starting point.",
    print: "Print / save as PDF",
    copy: "Copy summary",
    copied: "Copied",
    copyTpl: (host, score, stack, ms, kb) =>
      `Site scan of ${host} (via studio-vm.be/scan)\nScore: ${score}/100\nPlatform: ${stack}\nResponse time: ${ms} ms\nHTML: ${kb} KB\n\nA Studio VM build aims for 100/100. Let's talk: studio-vm.be`,
  },
};

function Ring({ score }: { score: number }) {
  const color =
    score >= 75 ? "#16a34a" : score >= 45 ? "#f59e0b" : "#ef4444";
  const r = 52;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32">
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        className="text-border"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={off}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground"
        style={{ fontSize: 30, fontWeight: 700 }}
      >
        {score}
      </text>
    </svg>
  );
}

function BenchBar({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={accent ? "font-semibold text-accent" : "font-medium"}>
          {label}
        </span>
        <span className="font-mono text-xs text-muted">{value}/100</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: accent
              ? "var(--accent)"
              : value >= 75
                ? "#16a34a"
                : value >= 45
                  ? "#f59e0b"
                  : "#ef4444",
          }}
        />
      </div>
    </div>
  );
}

export function SiteScanner() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = T[locale];

  const [result, setResult] = useState<ScanResult | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const verdict =
    result && result.ok
      ? result.score >= 75
        ? t.verdictGood
        : result.score >= 45
          ? t.verdictMeh
          : t.verdictBad
      : "";

  if (result && result.ok) {
    const host = (() => {
      try {
        return new URL(result.finalUrl).hostname;
      } catch {
        return result.url;
      }
    })();
    const copySummary = async () => {
      try {
        await navigator.clipboard.writeText(
          t.copyTpl(host, result.score, result.stack, result.responseMs, result.htmlKb),
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    };
    return (
      <div id="scan-report" className="space-y-8">
        <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-8 text-center sm:flex-row sm:text-left">
          <Ring score={result.score} />
          <div className="flex-1">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {new URL(result.finalUrl).hostname}
            </p>
            <p className="mt-2 text-lg leading-relaxed">{verdict}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-muted">
              <span>
                {t.stackLabel}: <strong className="text-foreground">{result.stack}</strong>
              </span>
              <span>
                {t.speedLabel}:{" "}
                <strong className="text-foreground">{result.responseMs} ms</strong>
              </span>
              <span>
                {t.weightLabel}:{" "}
                <strong className="text-foreground">{result.htmlKb} KB</strong>
              </span>
            </div>
          </div>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
          {result.signals.map((s) => (
            <li
              key={s.key}
              className="flex items-start gap-3 bg-card p-4"
            >
              {s.ok === true ? (
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" strokeWidth={2.5} />
              ) : s.ok === "warn" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" strokeWidth={2} />
              ) : (
                <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" strokeWidth={2.5} />
              )}
              <div>
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="mt-0.5 text-xs text-muted">{s.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {t.benchTitle}
          </p>
          <div className="mt-5 space-y-3">
            <BenchBar label={t.benchYou} value={result.score} accent={false} />
            <BenchBar label={t.benchSvm} value={100} accent />
          </div>
          <p className="mt-4 text-sm text-muted">{t.benchNote}</p>
        </div>

        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {t.recoTitle}
          </p>
          <p className="mt-3 leading-relaxed">{t.reco}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={localePath(locale, "/#contact")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t.ctaButton}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors hover:bg-card-hover"
            >
              <Printer className="h-4 w-4" strokeWidth={2} />
              {t.print}
            </button>
            <button
              type="button"
              onClick={copySummary}
              className="no-print inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors hover:bg-card-hover"
            >
              {copied ? (
                <ClipboardCheck className="h-4 w-4 text-accent" strokeWidth={2} />
              ) : (
                <Clipboard className="h-4 w-4" strokeWidth={2} />
              )}
              {copied ? t.copied : t.copy}
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="no-print inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors hover:bg-card-hover"
            >
              {t.again}
            </button>
          </div>
        </div>

        <p className="text-center font-mono text-[11px] text-muted">
          {t.disclaimer}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form
        action={(fd) => start(async () => setResult(await scanSite(fd)))}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={2}
          />
          <input
            name="url"
            required
            placeholder={t.placeholder}
            className="w-full rounded-full border bg-background py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Search className="h-4 w-4" strokeWidth={2} />
          )}
          {pending ? t.scanning : t.button}
        </button>
      </form>
      {result && !result.ok && (
        <p className="flex items-center gap-2 text-sm text-red-500">
          <X className="h-4 w-4" strokeWidth={2} />
          {result.error}
        </p>
      )}
      <p className="font-mono text-[11px] text-muted">{t.disclaimer}</p>
    </div>
  );
}
