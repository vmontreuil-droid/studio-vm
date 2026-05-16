import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensurePortalUser } from "@/lib/portal-access";
import { isValidLocale, localePath } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// De duurzame scan-link logt de klant meteen in en stuurt door naar het
// volledige klantenportaal (dashboard) — geen tussenpagina meer. De link
// blijft geldig: bij elk bezoek wordt een verse magic-token aangemaakt
// en via de /auth/confirm-tussenpagina (Outlook-veilig) ingewisseld.
export default async function PortalTokenEntry({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isValidLocale(locale)) notFound();

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("scan_requests")
    .select("email, scan")
    .eq("token", token)
    .maybeSingle();
  const row = data as
    | { email: string; scan: { ok?: boolean } | null }
    | null;
  if (!row || !row.scan || row.scan.ok === false) notFound();

  await ensurePortalUser(row.email);

  let dest = localePath(locale, "/portail");
  try {
    const gen = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: row.email,
    });
    const hashed = gen.data?.properties?.hashed_token;
    if (!gen.error && hashed) {
      dest = `/auth/confirm?token_hash=${encodeURIComponent(
        hashed,
      )}&type=magiclink&next=${encodeURIComponent(
        `/${locale}/portail/dashboard`,
      )}`;
    }
  } catch {
    // Val terug op de portaal-login (magic link aanvragen).
  }

  redirect(dest);
}
