import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Briefcase, Lightbulb, Rocket } from "lucide-react";

export const metadata: Metadata = {
  title: "Nu — Studio VM",
  description: "Wat Vincent van Studio VM op dit moment aan het doen is.",
};

const lastUpdate = "2026-05-14";

export default function NowPage() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            /now
          </p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Wat ik nu doe.
          </h1>
          <p className="mt-4 text-muted">
            Dit is een{" "}
            <a
              href="https://nownownow.com/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              now-page
            </a>
            : eerlijk en simpel overzicht van wat me bezighoudt. Bijgewerkt op{" "}
            {formatDate(lastUpdate)}.
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-3xl space-y-8 px-6 py-12">
          <Block icon={Briefcase} title="Werk in uitvoering">
            <ul className="mt-3 list-disc space-y-2 pl-6 text-foreground/90">
              <li>
                Webshop voor <strong>Allard Philippe</strong> (wildlife-fotografie) —
                gift cards en kortingscodes deze sprint.
              </li>
              <li>
                Migratie van <strong>JP Montreuil</strong> van WordPress naar Next.js +
                Supabase admin.
              </li>
              <li>
                Doorbouwen aan <strong>Studio VM</strong> zelf (deze site).
              </li>
            </ul>
          </Block>

          <Block icon={Lightbulb} title="Ideeën die rondzweven">
            <ul className="mt-3 list-disc space-y-2 pl-6 text-foreground/90">
              <li>
                Een templates-marktplaats waar lokale ondernemers op een dag kunnen
                starten — half gebouwd in m'n hoofd.
              </li>
              <li>
                Een mini-CRM bovenop Supabase, geoptimaliseerd voor freelancers.
              </li>
              <li>
                Een Cal.com-achtige booking-widget voor restaurants, in éigen stack.
              </li>
            </ul>
          </Block>

          <Block icon={Rocket} title="Recent gelanceerd">
            <ul className="mt-3 list-disc space-y-2 pl-6 text-foreground/90">
              <li>
                <Link href="/werk/cottage-waregem" className="text-accent hover:underline">
                  cottage-waregem.be
                </Link>{" "}
                — migratie van Squarespace naar Next.js.
              </li>
              <li>
                <Link href="/werk/celine-interieur" className="text-accent hover:underline">
                  celine-interieur.vercel.app
                </Link>{" "}
                — drie installeerbare PWA's.
              </li>
              <li>
                <Link href="/werk/mari-lines" className="text-accent hover:underline">
                  mari-lines.be
                </Link>{" "}
                — schone B2B-positionering.
              </li>
            </ul>
          </Block>

          <Block icon={Clock} title="Bandbreedte">
            <p className="mt-3 text-foreground/90">
              Geen ruimte voor nieuwe grote projecten dit kwartaal. Kleine opdrachten
              (websites tot 5 pagina's, urgent fixes) wel mogelijk.{" "}
              <Link href="/#contact" className="text-accent hover:underline">
                Stuur een bericht
              </Link>{" "}
              om te zien of het past.
            </p>
          </Block>
        </div>
      </section>
    </main>
  );
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
        {title}
      </h2>
      <div className="mt-1 leading-relaxed">{children}</div>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
