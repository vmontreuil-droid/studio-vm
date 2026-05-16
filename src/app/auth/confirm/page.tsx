import type { Metadata } from "next";
import { confirmLogin } from "@/app/actions/portail";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Inloggen — Studio VM",
  robots: { index: false, follow: false },
};

const C: Record<string, { eyebrow: string; title: string; intro: string; cta: string; expired: string }> = {
  nl: {
    eyebrow: "Klantportaal",
    title: "Bevestig je login",
    intro:
      "Klik op de knop om veilig in te loggen op je klantenportaal. (Deze tussenstap beschermt je login tegen automatische e-mailscanners.)",
    cta: "Inloggen op mijn portaal",
    expired: "Geen geldige link. Vraag een nieuwe login-link aan.",
  },
  fr: {
    eyebrow: "Espace client",
    title: "Confirmez votre connexion",
    intro:
      "Cliquez sur le bouton pour vous connecter en toute sécurité à votre portail client.",
    cta: "Me connecter à mon portail",
    expired: "Lien invalide. Demandez un nouveau lien de connexion.",
  },
  en: {
    eyebrow: "Client portal",
    title: "Confirm your login",
    intro:
      "Click the button to securely log in to your client portal.",
    cta: "Log in to my portal",
    expired: "Invalid link. Request a new login link.",
  },
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) =>
    typeof sp[k] === "string" ? (sp[k] as string) : "";
  const tokenHash = get("token_hash");
  const type = get("type") || "magiclink";
  const next = get("next") || "/nl/portail/dashboard";
  const locale = next.split("/")[1];
  const c = C[["nl", "fr", "en"].includes(locale) ? locale : "nl"];

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          {c.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {c.title}
        </h1>
        {tokenHash ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {c.intro}
            </p>
            <form action={confirmLogin} className="mt-8">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {c.cta} →
              </button>
            </form>
          </>
        ) : (
          <p className="mt-4 text-sm text-red-500">{c.expired}</p>
        )}
      </div>
    </main>
  );
}
