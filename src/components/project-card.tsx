import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";
import { localePath, type Locale } from "@/lib/i18n/config";

export function ProjectCard({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  return (
    <Link
      href={localePath(locale, `/werk/${project.slug}`)}
      className="group flex h-full flex-col bg-card p-8 transition-colors hover:bg-card-hover"
    >
      <div
        aria-hidden
        className="relative mb-6 h-40 overflow-hidden rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${project.accent}, color-mix(in oklab, ${project.accent} 65%, #0c0a09))`,
        }}
      >
        {project.image ? (
          <>
            <Image
              src={project.image}
              alt={`${project.name} — voorpagina`}
              fill
              sizes="(max-width: 768px) 100vw, 620px"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/25" />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.65) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
                WebkitMaskImage:
                  "linear-gradient(135deg, #000, transparent 72%)",
                maskImage: "linear-gradient(135deg, #000, transparent 72%)",
              }}
            />
            <div
              className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.7), transparent 65%)",
              }}
            />
          </>
        )}
        <span className="absolute left-5 top-5 font-mono text-[10px] uppercase tracking-widest text-white/70">
          {project.slug}
        </span>
        <span className="absolute bottom-5 left-5 right-5 text-2xl font-semibold tracking-tight text-white">
          {project.name}
        </span>
      </div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {project.tagline}
      </p>
      <h3 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        {project.name}
        <ArrowUpRight
          className="h-5 w-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          strokeWidth={1.5}
        />
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {project.description}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {project.stack.map((s) => (
          <span
            key={s}
            className="rounded-full bg-background px-3 py-1 font-mono text-xs text-muted"
          >
            {s}
          </span>
        ))}
      </div>
    </Link>
  );
}
