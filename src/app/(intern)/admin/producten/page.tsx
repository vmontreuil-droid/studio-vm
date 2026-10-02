import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { ProductManager, type Product } from "@/components/product-manager";
import { Donut, ChartCard } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function AdminProducten() {
  if (!adminConfigured || !(await requireAdmin())) return null;

  const { data } = await getSupabaseAdmin()
    .from("products")
    .select(
      "id, name, description, unit_price_cents, vat_rate, kind, active, sort",
    )
    .order("sort", { ascending: true })
    .order("name", { ascending: true })
    .limit(500);

  const products = ((data as Product[] | null) ?? []) as Product[];

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Producten &amp; diensten
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Catalogus met vaste prijzen en btw — herbruikbaar als lijn op
          offertes en facturen.
        </p>
      </div>
      {products.length > 0 && (
        <div className="mt-5">
          <ChartCard title="Catalogus-verdeling">
            <Donut
              segments={[
                {
                  label: "Diensten",
                  value: products.filter((p) => p.kind === "dienst")
                    .length,
                  color: "var(--accent)",
                },
                {
                  label: "Producten",
                  value: products.filter((p) => p.kind === "product")
                    .length,
                  color: "#0ea5e9",
                },
                {
                  label: "Inactief",
                  value: products.filter((p) => !p.active).length,
                  color: "#64748b",
                },
              ]}
              centerTop={String(products.length)}
              centerSub="items"
            />
          </ChartCard>
        </div>
      )}
      <ProductManager products={products} />
    </>
  );
}
