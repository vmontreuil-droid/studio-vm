"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leadsConfigured, siteUrl } from "@/lib/supabase/config";
import { isEmail, sendMail } from "@/lib/monitor";
import { after } from "next/server";
import { scanAndStore } from "@/lib/scan-report";

export type BuildState =
  | { ok: true; stored: boolean }
  | { ok: false; error: string; mailto?: string };

export type Block = { kind: string; data: Record<string, unknown> };
export type PageSnap = { name: string; blocks: Block[] };

type Cfg = {
  businessName: string;
  email: string;
  locale: string;
  theme: string;
  font: string;
  radius: string;
  colors?: { bg: string; fg: string; accent: string };
  sections: string[];
  pages: PageSnap[];
  imageCount: number;
  currentSite?: string;
};

function val(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v))
    return v
      .map((x) =>
        x && typeof x === "object"
          ? Object.values(x as Record<string, unknown>)
              .filter(Boolean)
              .join(" — ")
          : String(x),
      )
      .filter(Boolean)
      .join(" | ");
  return String(v);
}

function summarizeBlock(b: Block): string {
  const lines = Object.entries(b.data)
    .map(([k, v]) => {
      const s = val(v).trim();
      return s ? `   • ${k}: ${s}` : null;
    })
    .filter(Boolean);
  return [`[${b.kind}]`, ...lines].join("\n");
}

function summarize(c: Cfg): string {
  const pageBlocks = c.pages.flatMap((pg) => [
    "",
    `── Pagina: ${pg.name} ──`,
    ...pg.blocks.map(summarizeBlock),
  ]);
  return [
    `Zaak: ${c.businessName}`,
    `Stijl: thema ${c.theme} · font ${c.font} · hoeken ${c.radius}`,
    c.colors
      ? `Kleuren: bg ${c.colors.bg} · tekst ${c.colors.fg} · accent ${c.colors.accent}`
      : null,
    c.imageCount ? `${c.imageCount} foto's aangeleverd` : null,
    `Menu: ${c.pages.map((p) => p.name).join(" · ")}`,
    ...pageBlocks,
  ]
    .filter((x) => x !== null)
    .join("\n");
}

function mailtoFor(c: Cfg): string {
  const body = `Hoi Vincent,\n\nMijn builder-ontwerp:\n\n${summarize(
    c,
  )}\n\nKan je dit uitwerken?\n\n${c.businessName}`;
  return `mailto:info@studio-vm.be?subject=${encodeURIComponent(
    `Builder-ontwerp — ${c.businessName}`,
  )}&body=${encodeURIComponent(body.slice(0, 1800))}`;
}

export async function submitBuild(cfg: Cfg): Promise<BuildState> {
  const businessName = cfg.businessName.trim().slice(0, 120) || "Naamloos";
  const email = cfg.email.trim().toLowerCase().slice(0, 160);
  if (!isEmail(email)) return { ok: false, error: "email" };

  const currentSite = (cfg.currentSite ?? "").trim();

  const clean: Cfg = {
    ...cfg,
    businessName,
    email,
    sections: cfg.sections.slice(0, 60),
    pages: cfg.pages.slice(0, 20).map((p) => ({
      name: p.name,
      blocks: p.blocks.slice(0, 40),
    })),
  };

  if (!leadsConfigured)
    return { ok: false, error: "not_configured", mailto: mailtoFor(clean) };

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("quotes")
    .insert({
      locale: clean.locale,
      name: businessName,
      email,
      message: summarize(clean).slice(0, 8000),
      base: "builder",
      modules: clean.sections,
      plan: clean.theme,
      source: "builder",
      snapshot: clean,
    })
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "store", mailto: mailtoFor(clean) };

  // Gaf de bezoeker een huidige site mee → scan ná de response, resultaat
  // bij déze aanvraag bewaren (geen mail).
  const quoteId = (data as { id?: string } | null)?.id;
  if (quoteId && currentSite) {
    after(() => scanAndStore(currentSite, quoteId));
  }

  await sendMail("info@studio-vm.be", {
    subject: `Nieuw builder-ontwerp — ${businessName}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;color:#111;line-height:1.6">
<h2 style="margin:0 0 12px">Builder-ontwerp</h2>
<p><strong>${businessName}</strong> · <a href="mailto:${email}">${email}</a></p>
<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;background:#faf9f7;border-radius:8px;padding:12px">${summarize(
      clean,
    )
      .replace(/</g, "&lt;")
      .slice(0, 6000)}</pre>
<p style="margin-top:16px"><a href="${siteUrl}/admin/aanvragen" style="color:#b45309">Open in admin →</a></p>
</div>`,
  });

  return { ok: true, stored: true };
}
