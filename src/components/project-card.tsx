import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/werk/${project.slug}`}
      className="group flex h-full flex-col bg-card p-8 transition-colors hover:bg-card-hover"
    >
      <div
        aria-hidden
        className="mb-6 flex h-32 items-center justify-center rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${project.accent}, ${project.accent}cc)`,
        }}
      >
        <span className="font-mono text-xs uppercase tracking-widest text-white/80">
          {project.slug}
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
