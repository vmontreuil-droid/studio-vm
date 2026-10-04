import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { laadProjectRijen } from "@/lib/projecten-overzicht";
import { dagVan, naarKaartProject } from "@/lib/werfkaart";
import { Werfkaart } from "@/components/admin/werfkaart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Werfkaart — Admin" };

// Alle projecten op één kaart, met filters. De server haalt alles op (klant en
// factuurstatus zoals in de projectenlijst); filteren gebeurt in de browser.
export default async function AdminWerfkaart() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const { rijen, error } = await laadProjectRijen(getSupabaseAdmin());
  // eslint-disable-next-line react-hooks/purity
  const nu = Date.now();

  return <Werfkaart projecten={rijen.map(naarKaartProject)} vandaag={dagVan(nu)} fout={error?.message ?? null} />;
}
