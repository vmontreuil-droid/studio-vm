import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { posts, getPostBySlug } from "@/lib/posts";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Studio VM`,
    description: post.excerpt,
  };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const paragraphs = post.body.split("\n\n");

  return (
    <main>
      <article>
        <section className="border-b">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Terug naar journal
            </Link>
            <div className="mt-8 flex items-center gap-3">
              <span className="rounded-full bg-card px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                {post.tag}
              </span>
              <time className="font-mono text-xs text-muted">{formatDate(post.date)}</time>
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
            Wil je iets bouwen?
          </h2>
          <Link
            href="/#contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Plan een gesprek
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
