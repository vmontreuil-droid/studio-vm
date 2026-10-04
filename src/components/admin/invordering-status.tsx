// Statusbadge van een invorderingsdossier (lijst en detail).

const STIJL: Record<string, { label: string; klasse: string }> = {
  klaar: { label: "Wacht op jou", klasse: "border-amber-400 bg-amber-200 text-amber-950" },
  verstuurd: { label: "Bij de deurwaarder", klasse: "border-sky-300 bg-sky-100 text-sky-900" },
  gepauzeerd: { label: "Gepauzeerd", klasse: "border-stone-300 bg-stone-100 text-stone-800" },
  afgesloten: { label: "Afgesloten", klasse: "border-emerald-300 bg-emerald-100 text-emerald-900" },
};

export function InvorderingStatus({ status }: { status: string }) {
  const st = STIJL[status] ?? { label: status, klasse: "border-stone-300 bg-stone-100 text-stone-800" };
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.klasse}`}>{st.label}</span>;
}
