import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getCompanySettings } from "@/lib/admin/settings";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminInstellingen() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const settings = await getCompanySettings();

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Instellingen</h1>
        <p className="mt-0.5 text-sm text-muted">
          Firmagegevens, bankrekening, factuurnummering en
          betaalvoorwaarden — gebruikt op alle offertes, facturen en
          creditnota&apos;s.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </>
  );
}
