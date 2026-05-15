import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getPosts } from "@/lib/posts";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

const copy: Record<
  Locale,
  { metaTitle: string; eyebrow: string; title: string; intro: string; localeCode: string }
> = {
  nl: {
    metaTitle: "Journal — Studio VM",
    eyebrow: "Journal",
    title: "Notities tussen twee projecten door.",
    intro:
      "Korte stukjes over de keuzes die ik maak, de tools die ik gebruik en de zaken die ik leer terwijl ik bouw.",
    localeCode: "nl-BE",
  },
  fr: {
    metaTitle: "Journal — Studio VM",
    eyebrow: "Journal",
    title: "Des notes entre deux projets.",
    intro:
      "De courts textes sur les choix que je fais, les outils que j'utilise et ce que j'apprends en construisant.",
    localeCode: "fr-BE",
  },
  en: {
    metaTitle: "Journal — Studio VM",
    eyebrow: "Journal",
    title: "Notes between two projects.",
    intro:
      "Short pieces about the choices I make, the tools I use and the things I learn while building.",
    localeCode: "en-GB",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return {
    title: copy[locale].metaTitle,
    alternates: {
      types: {
        "application/rss+xml": `https://studio-vm.be/${locale}/journal/rss.xml`,
      },
    },
  };
}

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const c = copy[locale];
  const posts = getPosts(locale);

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            {c.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {c.intro}
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={localePath(locale, `/journal/${post.slug}`)}
                  className="group flex flex-col gap-4 py-8 transition-colors sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-card px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                        {post.tag}
                      </span>
                      <time className="font-mono text-xs text-muted">
                        {new Date(post.date).toLocaleDateString(c.localeCode, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                      <span className="font-mono text-xs text-muted">
                        · {post.readMin} min
                      </span>
                    </div>
                    <h2 className="mt-3 flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
                      {post.title}
                      <ArrowUpRight
                        className="h-5 w-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                        strokeWidth={1.5}
                      />
                    </h2>
                    <p className="mt-2 max-w-2xl text-muted">{post.excerpt}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
