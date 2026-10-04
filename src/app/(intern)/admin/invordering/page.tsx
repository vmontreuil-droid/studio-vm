import Link from "next/link";
import { Gavel, Scale, TriangleAlert } from "lucide-react";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ARRONDISSEMENTEN } from "@/lib/invordering/arrondissement";
import { arrondissementNaam, deurwaarders, isDeurwaarder } from "@/lib/invordering/dossier";
import { WACHTTIJD_DAGEN } from "@/lib/invordering/klaarzetten";
import { euro } from "@/lib/invordering/teksten";
import { InvorderingStatus } from "@/components/admin/invordering-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invordering" };

type Rij = {
  id: string;
  created_at: string;
  status: string;
  arrondissement: string | null;
  deurwaarder: unknown;
  hoofdsom_cent: number;
  interest_cent: number;
  forfait_cent: number;
  verstuurd_op: string | null;
  invoices: { number: string; client_name: string | null; client_email: string } | null;
};

const MELDING: Record<string, string> = {
  "niet-gevonden": "Dossier niet gevonden.",
  migratie: "Migratie 0052 is nog niet uitgevoerd.",
  betaald: "Die factuur is betaald: geen dossier nodig.",
  fout: "Er ging iets mis. Probeer opnieuw.",
};

export default async function AdminInvordering({ searchParams }: { searchParams: Promise<{ melding?: string }> }) {
  if (!adminConfigured || !(await requireAdmin())) return null;
  const { melding } = await searchParams;

  const [{ data, error }, dws] = await Promise.all([
    getSupabaseAdmin()
      .from("invorderingen")
      .select("id, created_at, status, arrondissement, deurwaarder, hoofdsom_cent, interest_cent, forfait_cent, verstuurd_op, invoices(number, client_name, client_email)")
      .order("created_at", { ascending: false })
      .limit(200),
    deurwaarders(),
  ]);
  const zonderMigratie = !!error;
  const rijen = (data as unknown as Rij[] | null) ?? [];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invordering</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted">
            {WACHTTIJD_DAGEN} dagen na de laatste herinnering zonder betaling staat hier een dossier klaar voor de
            deurwaarder van het arrondissement van de klant: begeleidende brief, factuur en bewijsdossier. Er vertrekt
            niets zonder jouw klik; wordt er intussen betaald, dan gaat het dossier vanzelf dicht.
          </p>
        </div>
        <Link
          href="/admin/deurwaarders"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-card-hover"
        >
          <Scale className="h-4 w-4" />
          Deurwaarders ({dws.size}/{Object.keys(ARRONDISSEMENTEN).length})
        </Link>
      </div>

      {melding && MELDING[melding] && (
        <p className="mt-4 rounded-xl border border-amber-400 bg-amber-200 px-4 py-2 text-sm text-amber-950">{MELDING[melding]}</p>
      )}
      {zonderMigratie && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400 bg-amber-200 px-4 py-2 text-sm text-amber-950">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Migratie 0052 (invordering) is nog niet uitgevoerd: tot dan worden er geen dossiers klaargezet.
        </p>
      )}

      {!zonderMigratie && !rijen.length && (
        <div className="mt-6 rounded-xl border bg-background p-8 text-center text-sm text-muted shadow-sm">
          <Gavel className="mx-auto mb-2 h-6 w-6" />
          Geen dossiers. Zo hoort het.
        </div>
      )}

      {rijen.length > 0 && (
        <ul className="mt-6 divide-y rounded-xl border bg-background shadow-sm">
          {rijen.map((r) => {
            const dw = isDeurwaarder(r.deurwaarder) ? r.deurwaarder : null;
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/invordering/${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm transition-colors hover:bg-card-hover"
                >
                  <span className="min-w-0">
                    <span className="font-semibold">{r.invoices?.number ?? "—"}</span>
                    <span className="text-muted"> · {r.invoices?.client_name || r.invoices?.client_email}</span>
                    <span className="block text-xs text-muted">
                      {arrondissementNaam(r.arrondissement) ?? "geen arrondissement"} ·{" "}
                      {dw ? dw.naam : <span className="text-amber-700 dark:text-amber-400">nog geen deurwaarder</span>}
                      {" · "}klaargezet {r.created_at.slice(0, 10)}
                      {r.verstuurd_op ? ` · verstuurd ${r.verstuurd_op.slice(0, 10)}` : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono tabular-nums">{euro(r.hoofdsom_cent + r.interest_cent + r.forfait_cent, "nl")}</span>
                    <InvorderingStatus status={r.status} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
