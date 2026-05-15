import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { postSlugs, getPostBySlug } from "@/lib/posts";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { LOCALES, isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

type Params = { locale: string; slug: string };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    postSlugs.map((slug) => ({ locale, slug })),
  );
}

const ui: Record<
  Locale,
  { back: string; ctaTitle: string; ctaButton: string; localeCode: string }
> = {
  nl: {
    back: "Terug naar journal",
    ctaTitle: "Wil je iets bouwen?",
    ctaButton: "Plan een gesprek",
    localeCode: "nl-BE",
  },
  fr: {
    back: "Retour au journal",
    ctaTitle: "Vous voulez construire quelque chose ?",
    ctaButton: "Planifier un entretien",
    localeCode: "fr-BE",
  },
  en: {
    back: "Back to journal",
    ctaTitle: "Want to build something?",
    ctaButton: "Schedule a chat",
    localeCode: "en-GB",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const post = getPostBySlug(slug, locale);
  if (!post) return {};
  return { title: `${post.title} — Studio VM`, description: post.excerpt };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();
  const t = ui[locale];
  const paragraphs = post.body.split("\n\n");
  const url = `https://studio-vm.be/${locale}/journal/${post.slug}`;

  return (
    <main>
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        url={url}
        datePublished={post.date}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Studio VM", url: `https://studio-vm.be/${locale}` },
          { name: "Journal", url: `https://studio-vm.be/${locale}/journal` },
          { name: post.title, url },
        ]}
      />
      <article>
        <section className="border-b">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <Link
              href={localePath(locale, "/journal")}
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              {t.back}
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <span className="rounded-full bg-card px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                {post.tag}
              </span>
              <time className="font-mono text-xs text-muted">
                {new Date(post.date).toLocaleDateString(t.localeCode, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <span className="font-mono text-xs text-muted">· {post.readMin} min</span>
            </div>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">{post.excerpt}</p>
          </div>
        </section>
        <section className="border-b">
          <div className="prose mx-auto max-w-3xl px-6 py-16 sm:py-20">
            {paragraphs.map((para, i) => {
              if (para.startsWith("**") && para.endsWith("**")) {
                return (
                  <h3
                    key={i}
                    className="mt-10 text-xl font-semibold tracking-tight first:mt-0"
                  >
                    {para.slice(2, -2)}
                  </h3>
                );
              }
              if (para.startsWith("- ")) {
                const items = para.split("\n").map((line) => line.replace(/^-\s*/, ""));
                return (
                  <ul key={i} className="mt-6 list-disc space-y-2 pl-6 text-foreground">
                    {items.map((it, j) => (
                      <li key={j}>{renderInline(it)}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p
                  key={i}
                  className="mt-6 text-lg leading-relaxed text-foreground first:mt-0"
                >
                  {renderInline(para)}
                </p>
              );
            })}
          </div>
        </section>
      </article>
      <section className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.ctaTitle}
          </h2>
          <Link
            href={localePath(locale, "/#contact")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {t.ctaButton}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
