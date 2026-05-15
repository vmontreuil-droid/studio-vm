import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LogOut, FolderKanban, Activity } from "lucide-react";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/portail";
import { PortailLogin } from "@/components/portail-login";
import { isValidLocale, localePath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Studio VM",
  robots: { index: false, follow: false },
};

type ProjectRow = {
  id: string | number;
  name?: string;
  status?: string;
  url?: string;
  updated_at?: string;
};

const T: Record<
  Locale,
  {
    welcome: string;
    yourProjects: string;
    noProjects: string;
    signout: string;
    status: string;
    visit: string;
    updated: string;
    helpTitle: string;
    helpText: string;
    helpCta: string;
  }
> = {
  nl: {
    welcome: "Welkom terug",
    yourProjects: "Jouw projecten",
    noProjects:
      "Nog geen projecten gekoppeld aan dit account. Zodra we starten verschijnt je project hier.",
    signout: "Uitloggen",
    status: "Status",
    visit: "Bezoek site",
    updated: "Bijgewerkt",
    helpTitle: "Iets nodig?",
    helpText:
      "Een wijziging, een vraag, een nieuw idee? Open een ticket of stuur me een bericht.",
    helpCta: "Open een ticket",
  },
  fr: {
    welcome: "Bon retour",
    yourProjects: "Vos projets",
    noProjects:
      "Aucun projet lié à ce compte pour l'instant. Dès qu'on démarre, votre projet apparaît ici.",
    signout: "Déconnexion",
    status: "Statut",
    visit: "Voir le site",
    updated: "Mis à jour",
    helpTitle: "Besoin de quelque chose ?",
    helpText:
      "Une modification, une question, une idée ? Ouvrez un ticket ou envoyez-moi un message.",
    helpCta: "Ouvrir un ticket",
  },
  en: {
    welcome: "Welcome back",
    yourProjects: "Your projects",
    noProjects:
      "No projects linked to this account yet. As soon as we start, your project appears here.",
    signout: "Sign out",
    status: "Status",
    visit: "Visit site",
    updated: "Updated",
    helpTitle: "Need something?",
    helpText:
      "A change, a question, a new idea? Open a ticket or send me a message.",
    helpCta: "Open a ticket",
  },
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  // Geen redirect (kan stale cachen op CDN) — render gewoon de login.
  if (!supabaseConfigured) {
    return (
      <main>
        <PortailLogin locale={locale} />
      </main>
    );
  }

  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return (
      <main>
        <PortailLogin locale={locale} />
      </main>
    );
  }

  const t = T[locale];

  let projects: ProjectRow[] = [];
  try {
    const { data } = await sb
      .from("projects")
      .select("id, name, status, url, updated_at")
      .order("updated_at", { ascending: false });
    if (Array.isArray(data)) projects = data as ProjectRow[];
  } catch {
    // Tabel bestaat (nog) niet — toon nette lege staat i.p.v. een crash.
  }

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-6 py-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {t.welcome}
            </p>
            <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {user.email}
            </h1>
          </div>
          <form action={async () => {
            "use server";
            await signOut();
            redirect(localePath(locale, "/portail"));
          }}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              {t.signout}
            </button>
          </form>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            <FolderKanban className="h-4 w-4" strokeWidth={2} />
            {t.yourProjects}
          </h2>
          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-muted">
              {t.noProjects}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <div key={p.id} className="rounded-2xl border bg-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold tracking-tight">
                      {p.name ?? `Project #${p.id}`}
                    </h3>
                    {p.status && (
                      <span className="rounded-full bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                        {p.status}
                      </span>
                    )}
                  </div>
                  {p.updated_at && (
                    <p className="mt-2 font-mono text-[11px] text-muted">
                      {t.updated}:{" "}
                      {new Date(p.updated_at).toLocaleDateString(
                        locale === "fr" ? "fr-BE" : locale === "en" ? "en-GB" : "nl-BE",
                      )}
                    </p>
                  )}
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-accent hover:underline"
                    >
                      <Activity className="h-3.5 w-3.5" strokeWidth={2} />
                      {t.visit}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {t.helpTitle}
          </h2>
          <p className="mt-3 text-muted">{t.helpText}</p>
          <Link
            href={localePath(locale, "/support")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {t.helpCta}
          </Link>
        </div>
      </section>
    </main>
  );
}
