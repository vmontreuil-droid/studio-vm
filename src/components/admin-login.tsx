import Link from "next/link";
import { Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { LoginError } from "@/components/login-error";

export function AdminLogin() {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      {/* === Linkerhelft — gebrande hero === */}
      <div className="relative hidden overflow-hidden bg-foreground lg:block">
        <div className="hero-backdrop absolute inset-0 opacity-90" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/20 to-transparent"
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between p-14 text-background">
          <p className="text-3xl font-extrabold lowercase tracking-tighter">
            vm<span className="text-accent">.</span>
            <span className="ml-3 align-middle font-mono text-[11px] font-normal uppercase tracking-[0.3em] text-background/70">
              admin
            </span>
          </p>

          <div className="animate-fade-up">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-background/60">
              Studio VM
            </p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight">
              Het beheer&shy;centrum van&nbsp;je website.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-background/70">
              Aanvragen, offertes uit de builder en monitoring — alles op één
              plek.
            </p>
          </div>

          <div className="flex items-center gap-2 text-background/50">
            <span className="h-12 w-px bg-current" />
            <span className="h-6 w-px bg-current" />
            <span className="h-3 w-px bg-current" />
          </div>
        </div>
      </div>

      {/* === Rechterhelft — formulier === */}
      <div className="relative flex flex-col px-6 py-10">
        <div className="page-grid absolute inset-0 -z-10 opacity-50" aria-hidden />

        <Link
          href="/"
          className="group inline-flex items-center gap-2 self-start text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2}
          />
          Terug naar website
        </Link>

        <div className="grid flex-1 place-items-center">
          <div className="w-full max-w-sm animate-fade-up">
            {/* Logo + slot-icoon */}
            <div className="mb-8 flex flex-col items-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl border bg-card shadow-sm">
                <Lock className="h-7 w-7 text-accent" strokeWidth={1.75} />
              </span>
              <p className="mt-5 text-2xl font-bold lowercase tracking-tighter">
                vm<span className="text-accent">.</span>
                <span className="ml-2 align-middle font-mono text-[10px] font-normal uppercase tracking-[0.25em] text-muted">
                  admin
                </span>
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
                Aanmelden
              </p>
            </div>

            <div className="mb-7 flex items-center justify-center gap-2 text-accent/50">
              <span className="h-px w-8 bg-current" />
              <span className="h-1 w-1 rounded-full bg-current" />
              <span className="h-px w-8 bg-current" />
            </div>

            <form
              action="/api/admin/login"
              method="post"
              className="space-y-4 rounded-2xl border bg-card p-7 shadow-sm"
            >
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted"
                >
                  <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                  Wachtwoord
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    strokeWidth={1.75}
                  />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoFocus
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-accent"
                  />
                </div>
              </div>

              <LoginError />

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background shadow-sm transition-transform hover:-translate-y-px"
              >
                <span>Inloggen</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted">
              Beveiligde zone · enkel voor beheerders
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} Studio VM
        </p>
      </div>
    </div>
  );
}
