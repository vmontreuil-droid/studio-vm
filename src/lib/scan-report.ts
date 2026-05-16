import { runScan } from "@/app/actions/scan";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type StoredScan =
  | { ok: false; at: string; url: string; error: string }
  | {
      ok: true;
      at: string;
      finalUrl: string;
      host: string;
      score: number;
      grade: string;
      stack: string;
      hosting: string | null;
      builtBy: string | null;
      responseMs: number;
      htmlKb: number;
      cwvRisk: string;
      categories: { cat: string; score: number }[];
      pitfalls: string[];
    };

// Draait een volledige scan en bewaart het resultaat op de aanvraag-rij
// (kolom quotes.scan). Géén e-mail. Fail-safe: gooit/blokkeert nooit,
// aan te roepen via next/after ná de response.
export async function scanAndStore(
  rawUrl: string,
  quoteId: string,
): Promise<void> {
  if (!quoteId) return;
  let url = (rawUrl ?? "").trim();
  if (!url || url.length < 4) return;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url.replace(/^\/+/, "");
  if (!/^https?:\/\/[a-z0-9][a-z0-9-]*\.[a-z]{2,}/i.test(url)) return;

  const at = new Date().toISOString();
  try {
    const r = await runScan(url);
    const scan: StoredScan = !r.ok
      ? { ok: false, at, url, error: r.error }
      : {
          ok: true,
          at,
          finalUrl: r.finalUrl,
          host: r.host,
          score: r.score,
          grade: r.grade,
          stack: r.stack,
          hosting: r.hosting,
          builtBy: r.builtBy,
          responseMs: r.responseMs,
          htmlKb: r.htmlKb,
          cwvRisk: r.cwvRisk,
          categories: r.categories.map((c) => ({
            cat: c.cat,
            score: c.score,
          })),
          pitfalls: r.pitfalls,
        };
    await getSupabaseAdmin()
      .from("quotes")
      .update({ scan })
      .eq("id", quoteId);
  } catch (e) {
    console.error("[scan-store] mislukt:", e);
  }
}
