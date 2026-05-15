import Link from "next/link";
import { Mail } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { getMessages } from "@/lib/i18n";
import { localePath, type Locale } from "@/lib/i18n/config";

function brandIconBase(props: { className?: string }) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: props.className,
    "aria-hidden": true,
  };
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg {...brandIconBase({ className })}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg {...brandIconBase({ className })}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getMessages(locale);

  const sections = [
    {
      title: t.footer.sections.studio,
      links: [
        { href: localePath(locale, "/#werk"), label: t.nav.werk },
        { href: localePath(locale, "/mogelijkheden"), label: t.nav.mogelijkheden },
        { href: localePath(locale, "/pricing"), label: t.nav.pricing },
        { href: localePath(locale, "/journal"), label: "Journal" },
      ],
    },
    {
      title: t.footer.sections.diensten,
      links: [
        { href: localePath(locale, "/diensten"), label: "Diensten" },
        { href: localePath(locale, "/scan"), label: "Gratis site-scan" },
        { href: localePath(locale, "/roi"), label: "ROI-calculator" },
        { href: localePath(locale, "/aanpak"), label: "Aanpak" },
        { href: localePath(locale, "/vergelijking"), label: "Vergelijking" },
        { href: localePath(locale, "/offerte"), label: "Offerte-calculator" },
        { href: localePath(locale, "/shop"), label: "Templates shop" },
        { href: localePath(locale, "/builder"), label: "Site builder demo" },
        { href: localePath(locale, "/faq"), label: "FAQ" },
        { href: localePath(locale, "/woordenboek"), label: "Woordenboek" },
      ],
    },
    {
      title: t.footer.sections.klanten,
      links: [
        { href: localePath(locale, "/portail"), label: "Klantportaal" },
        { href: localePath(locale, "/support"), label: "Support tickets" },
        { href: localePath(locale, "/status"), label: "Status" },
        { href: localePath(locale, "/#contact"), label: t.nav.contact },
      ],
    },
    {
      title: t.footer.sections.vincent,
      links: [
        { href: localePath(locale, "/over"), label: t.footer.sections.vincent },
        { href: localePath(locale, "/now"), label: "Wat ik nu doe" },
        { href: localePath(locale, "/uses"), label: "Tools die ik gebruik" },
        { href: localePath(locale, "/pers"), label: "Pers & brand kit" },
        { href: localePath(locale, "/changelog"), label: "Changelog" },
        { href: localePath(locale, "/journal"), label: "Journal" },
      ],
    },
    {
      title: t.footer.sections.legal,
      links: [
        { href: localePath(locale, "/privacy"), label: "Privacy" },
        { href: localePath(locale, "/cookies"), label: "Cookies" },
        { href: localePath(locale, "/voorwaarden"), label: "Algemene voorwaarden" },
      ],
    },
  ];

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <p
              aria-label="Studio VM"
              className="font-mono text-base font-semibold tracking-tight"
            >
              <span className="text-accent">&lt;</span>
              vm
              <span className="text-accent">/&gt;</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t.footer.tagline}
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="mailto:info@studio-vm.be"
                aria-label="E-mail"
                className="rounded-full border p-2 text-muted transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <a
                href="https://github.com/vmontreuil-droid"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="rounded-full border p-2 text-muted transition-colors hover:text-foreground"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/vincentmontreuil"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="rounded-full border p-2 text-muted transition-colors hover:text-foreground"
              >
                <LinkedInIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="font-mono text-xs uppercase tracking-widest text-muted">
                {section.title}
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-foreground transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 border-t pt-8 lg:grid-cols-2">
          <NewsletterForm />
          <div className="flex flex-wrap items-end justify-end gap-4 text-xs">
            <p className="font-mono text-muted">
              © {new Date().getFullYear()} Studio VM · BE 0672.960.066
            </p>
            <p className="font-mono text-muted">{t.footer.built}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
