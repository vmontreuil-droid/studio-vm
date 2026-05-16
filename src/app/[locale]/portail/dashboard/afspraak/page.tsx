import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Mail, ArrowRight } from "lucide-react";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";
import { PORTAL_T } from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const L: Record<
  Locale,
  { title: string; intro: string; cta: string; mail: string; mailCta: string }
> = {
  nl: {
    title: "Een gesprek inplannen",
    intro:
      "Even bellen of videobellen over je project, een nieuw idee of een vraag? Laat het me weten — ik plan vlot een moment in dat voor jou past.",
    cta: "Vraag een afspraak aan",
    mail: "Liever direct mailen?",
    mailCta: "hallo@studio-vm.be",
  },
  fr: {
    title: "Planifier un échange",
    intro:
      "Un appel ou une visio à propos de votre projet, une idée ou une question ? Dites-le-moi — je trouve vite un moment qui vous convient.",
    cta: "Demander un rendez-vous",
    mail: "Vous préférez écrire ?",
    mailCta: "hallo@studio-vm.be",
  },
  en: {
    title: "Schedule a chat",
    intro:
      "A quick call or video about your project, a new idea or a question? Let me know — I'll find a slot that works for you.",
    cta: "Request an appointment",
    mail: "Rather email directly?",
    mailCta: "hallo@studio-vm.be",
  },
};

export default async function PortalAppointment({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const t = PORTAL_T[locale];
  const l = L[locale];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.appointment}
      </h1>

      <div className="mt-8 rounded-2xl border bg-card p-8">
        <CalendarClock className="h-8 w-8 text-accent" strokeWidth={1.75} />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          {l.title}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {l.intro}
        </p>
        <Link
          href={localePath(locale, "/#contact")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {l.cta}
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted">
          <Mail className="h-4 w-4" strokeWidth={2} />
          {l.mail}{" "}
          <a
            href="mailto:hallo@studio-vm.be"
            className="text-accent hover:underline"
          >
            {l.mailCta}
          </a>
        </p>
      </div>
    </>
  );
}
