import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  SupplierManager,
  type Supplier,
} from "@/components/supplier-manager";

export const dynamic = "force-dynamic";

export default async function AdminLeveranciers() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const { data } = await getSupabaseAdmin()
    .from("suppliers")
    .select("id, name, vat_number, email, iban, notes")
    .order("name", { ascending: true })
    .limit(500);

  const suppliers = (data as Supplier[] | null) ?? [];

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Leveranciers
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Wie jij betaalt — gekoppeld aan je aankoopfacturen.
        </p>
      </div>
      <SupplierManager suppliers={suppliers} />
    </>
  );
}
