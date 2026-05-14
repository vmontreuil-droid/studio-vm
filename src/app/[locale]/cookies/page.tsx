import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies — Studio VM",
  description: "Welke cookies we gebruiken (en welke niet).",
};

const cookieList = [
  {
    name: "studio-vm-cart",
    purpose: "Onthoudt wat je in de demo-winkelmand zit op /shop.",
    duration: "Tot je 'm leegmaakt",
    type: "Functioneel (localStorage, geen cookie)",
  },
  {
    name: "studio-vm-tickets",
    purpose: "Bewaart de tickets die je aanmaakt op de support-demo.",
    duration: "Tot je 'm reset",
    type: "Functioneel (localStorage, geen cookie)",
  },
  {
    name: "studio-vm-cookie-consent",
    purpose: "Onthoudt of je de cookie-banner gezien hebt.",
    duration: "1 jaar",
    type: "Functioneel (localStorage)",
  },
];

export default function CookiesPage() {
  return (
    <main>
      <article>
        <header className="border-b">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Cookies
            </p>
            <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Cookieverklaring
            </h1>
            <p className="mt-4 text-sm text-muted">
              Laatst bijgewerkt: {new Date().toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </header>
        <div className="mx-auto max-w-3xl space-y-10 px-6 py-16">
          <section>
            <h2 className="text-xl font-semibold tracking-tight">Korte versie</h2>
            <p className="mt-3 leading-relaxed">
              We gebruiken geen tracking-cookies, geen advertentie-cookies, geen
              third-party trackers. Wat we wel gebruiken zijn een paar
              <code className="mx-1 rounded bg-card px-1.5 py-0.5 font-mono text-xs">
                localStorage
              </code>
              -waarden om de demo-functies (shop, support tickets) te laten werken — die
              blijven uitsluitend in jouw browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight">Wat staat er opgeslagen?</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-card">
                  <tr>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                      Naam
                    </th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                      Doel
                    </th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                      Bewaartijd
                    </th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cookieList.map((c) => (
                    <tr key={c.name}>
                      <td className="px-4 py-3 font-mono text-xs">{c.name}</td>
                      <td className="px-4 py-3">{c.purpose}</td>
                      <td className="px-4 py-3 text-muted">{c.duration}</td>
                      <td className="px-4 py-3 text-muted">{c.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              Hoe verwijder ik ze?
            </h2>
            <p className="mt-3 leading-relaxed">
              Open je browser-instellingen → Privacy → Site-data verwijderen voor
              <code className="mx-1 rounded bg-card px-1.5 py-0.5 font-mono text-xs">
                studio-vm.be
              </code>
              . Dat wist alle lokale data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
            <p className="mt-3 leading-relaxed">
              We gebruiken Vercel Analytics. Dit gebruikt geen cookies en bewaart geen
              persoonlijke identificatoren — enkel geanonimiseerde paginabezoeken.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
