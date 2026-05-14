import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Studio VM",
  description:
    "Hoe Studio VM met je persoonsgegevens omgaat. GDPR-conform, transparant, kort.",
};

export default function PrivacyPage() {
  return (
    <main>
      <article>
        <header className="border-b">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Privacy
            </p>
            <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Privacyverklaring
            </h1>
            <p className="mt-4 text-sm text-muted">
              Laatst bijgewerkt: {new Date().toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-3xl space-y-8 px-6 py-16 text-foreground">
          <Block title="Wie zijn we?">
            <p>
              Studio VM is een eenmanszaak van Vincent Montreuil, gevestigd in
              West-Vlaanderen, België. Voor vragen kan je terecht op{" "}
              <a href="mailto:vmontreuil@outlook.be" className="text-accent underline">
                vmontreuil@outlook.be
              </a>
              .
            </p>
          </Block>

          <Block title="Welke gegevens verzamelen we?">
            <p>
              We proberen zo min mogelijk te verzamelen. Concreet:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Contactformulier:</strong> naam, e-mail, bericht — gebruikt om je
                vraag te beantwoorden.
              </li>
              <li>
                <strong>Tickets in de demo:</strong> blijven uitsluitend in je eigen
                browser (localStorage). Wij zien ze niet.
              </li>
              <li>
                <strong>Analytics:</strong> we gebruiken Vercel Analytics — een
                privacy-vriendelijke tool zonder cookies en zonder persoonlijke
                identificatoren.
              </li>
            </ul>
          </Block>

          <Block title="Hoelang bewaren we ze?">
            <p>
              Contactberichten bewaren we maximaal 2 jaar. Als we een offerte sturen die
              niet wordt aanvaard, verwijderen we je gegevens na 6 maanden.
            </p>
          </Block>

          <Block title="Met wie delen we je gegevens?">
            <p>Met niemand, tenzij wettelijk verplicht. Geen marketing, geen verkoop.</p>
            <p className="mt-3">
              Voor hosting werken we met Vercel (EU regio) en Supabase (EU regio). Voor
              e-mail eventueel Resend. Allemaal partijen met een eigen GDPR-conformiteit.
            </p>
          </Block>

          <Block title="Welke rechten heb je?">
            <ul className="list-disc space-y-2 pl-6">
              <li>Je gegevens inzien</li>
              <li>Ze laten verbeteren</li>
              <li>Ze laten verwijderen ("recht om vergeten te worden")</li>
              <li>Een kopie krijgen (data-export)</li>
              <li>Een klacht indienen bij de Gegevensbeschermingsautoriteit</li>
            </ul>
            <p className="mt-3">
              Stuur je vraag naar{" "}
              <a href="mailto:vmontreuil@outlook.be" className="text-accent underline">
                vmontreuil@outlook.be
              </a>
              . We antwoorden binnen 30 dagen.
            </p>
          </Block>

          <Block title="Cookies">
            <p>
              We gebruiken alleen functionele cookies. Geen tracking-, marketing- of
              advertentie-cookies. Lees meer in onze{" "}
              <a href="/cookies" className="text-accent underline">
                cookieverklaring
              </a>
              .
            </p>
          </Block>
        </div>
      </article>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}
