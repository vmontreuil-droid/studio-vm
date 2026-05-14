import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { posts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Journal — Studio VM",
  description:
    "Notities over webdevelopment, lokale ondernemers en de stack achter Studio VM.",
};

export default function JournalPage() {
  return (
    <main>
      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            Journal
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Notities tussen twee projecten door.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Korte stukjes over de keuzes die ik maak, de tools die ik gebruik en de zaken
            die ik leer terwijl ik bouw.
          </p>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/journal/${post.slug}`}
                  className="group flex flex-col gap-4 py-8 transition-colors sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-card px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                        {post.tag}
                      </span>
                      <time className="font-mono text-xs text-muted">
                        {formatDate(post.date)}
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
