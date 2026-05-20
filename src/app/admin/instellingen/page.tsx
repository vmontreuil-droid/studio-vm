import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getCompanySettings } from "@/lib/admin/settings";
import { getOutreachConfig } from "@/lib/admin/outreach";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminInstellingen() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const [settings, outreach] = await Promise.all([
    getCompanySettings(),
    getOutreachConfig(),
  ]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Instellingen</h1>
        <p className="mt-0.5 text-sm text-muted">
          Firmagegevens, bankrekening, factuurnummering, betaalvoorwaarden
          en outreach-engine — alle automatisering op één plek.
        </p>
      </div>
      <SettingsForm settings={settings} outreach={outreach} />
    </>
  );
}
