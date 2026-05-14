import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algemene voorwaarden — Studio VM",
  description:
    "Algemene voorwaarden voor opdrachten en abonnementen via Studio VM (Vincent Montreuil).",
};

export default function VoorwaardenPage() {
  return (
    <main>
      <article>
        <header className="border-b">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Voorwaarden
            </p>
            <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Algemene voorwaarden
            </h1>
            <p className="mt-4 text-sm text-muted">
              Laatst bijgewerkt: {new Date().toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-10 px-6 py-16">
          <Section n="1" title="Toepassing">
            Deze voorwaarden gelden voor elke offerte, opdracht en abonnement uitgevoerd
            door Studio VM (Vincent Montreuil), tenzij schriftelijk anders overeengekomen.
          </Section>

          <Section n="2" title="Offertes">
            Offertes blijven 30 dagen geldig. Een opdracht is bevestigd na schriftelijke
            akkoordverklaring + betaling van het voorschot (30%).
          </Section>

          <Section n="3" title="Doorlooptijd">
            Geschatte doorlooptijden zijn richtinggevend, niet bindend, tenzij anders
            schriftelijk overeengekomen. Vertraging door de klant (input, content,
            goedkeuring) verschuift de levertermijn evenredig.
          </Section>

          <Section n="4" title="Betaling">
            Eenmalige opdrachten worden gefactureerd in drie schijven: 30% bij start, 40%
            halverwege, 30% bij oplevering. Abonnementen worden maandelijks gefactureerd
            via SEPA. Facturen zijn betaalbaar binnen 14 dagen.
          </Section>

          <Section n="5" title="Eigendom en code">
            De code wordt overgedragen aan de klant via een GitHub-repo. De klant blijft
            eigenaar van zijn eigen content (teksten, foto's, logo). Studio VM behoudt
            het recht om het project te tonen in zijn portfolio (tenzij schriftelijk
            anders).
          </Section>

          <Section n="6" title="Hosting en derde partijen">
            Hosting verloopt via Vercel + Supabase (EU regio's). Kosten van deze partijen
            zijn ten laste van de klant, tenzij inbegrepen in een Care/Plus/Scale
            abonnement.
          </Section>

          <Section n="7" title="Garantie en bug-fix">
            Bugs die binnen 30 dagen na lancering worden gemeld en aantoonbaar door
            Studio VM zijn veroorzaakt, worden gratis verholpen. Daarna geldt het
            abonnement of een uurtarief.
          </Section>

          <Section n="8" title="Aansprakelijkheid">
            Studio VM is enkel aansprakelijk voor directe schade die rechtstreeks en
            uitsluitend voortvloeit uit een bewezen fout. Indirecte schade (omzetverlies,
            reputatieschade, verloren data) is uitgesloten. De totale aansprakelijkheid
            is in elk geval beperkt tot het bedrag van de opdracht.
          </Section>

          <Section n="9" title="Opzegging abonnement">
            Maandabonnementen kunnen schriftelijk worden opgezegd met opzegtermijn van 1
            maand. Reeds gefactureerde periodes worden niet terugbetaald.
          </Section>

          <Section n="10" title="Toepasselijk recht">
            Op elke overeenkomst is het Belgisch recht van toepassing. Bij geschillen
            zijn de rechtbanken van Kortrijk bevoegd.
          </Section>

          <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
            Studio VM · Vincent Montreuil · West-Vlaanderen, België ·{" "}
            <a href="mailto:vmontreuil@outlook.be" className="text-accent underline">
              vmontreuil@outlook.be
            </a>{" "}
            · BE 0xxx.xxx.xxx
          </p>
        </div>
      </article>
    </main>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight">
        <span className="font-mono text-sm text-accent">{n}.</span>
        {title}
      </h2>
      <p className="mt-3 leading-relaxed text-foreground/90">{children}</p>
    </section>
  );
}
