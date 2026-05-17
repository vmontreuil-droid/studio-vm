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
  const msg = summarize(clean).slice(0, 8000);
  const minimal = {
    locale: clean.locale,
    name: businessName,
    email,
    message: msg,
  };
  // Drie-traps insert: een builder-aanvraag mag NOOIT verloren gaan,
  // ook al ontbreken nieuwere kolommen (source/snapshot/base/...).
  let ins = await db
    .from("quotes")
    .insert({
      ...minimal,
      base: "builder",
      modules: clean.sections,
      plan: clean.theme,
      source: "builder",
      snapshot: clean,
    })
    .select("id")
    .maybeSingle();
  if (ins.error) {
    ins = await db
      .from("quotes")
      .insert({
        ...minimal,
        base: "builder",
        modules: clean.sections,
        plan: clean.theme,
      })
      .select("id")
      .maybeSingle();
  }
  if (ins.error) {
    ins = await db
      .from("quotes")
      .insert(minimal)
      .select("id")
      .maybeSingle();
  }
  if (ins.error)
    return { ok: false, error: "store", mailto: mailtoFor(clean) };
  const data = ins.data;

  // Gaf de bezoeker een huidige site mee → scan ná de response, resultaat
  // bij déze aanvraag bewaren (geen mail).
  const quoteId = (data as { id?: string } | null)?.id;
  if (quoteId && currentSite) {
    after(() => scanAndStore(currentSite, quoteId));
  }

  const accent = "#e08214";
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const pages = clean.pages.map((p) => p.name).join(" · ");
  const meta = [
    `Thema ${clean.theme} · font ${clean.font} · hoeken ${clean.radius}`,
    clean.colors
      ? `Kleuren: ${clean.colors.bg} / ${clean.colors.fg} / ${clean.colors.accent}`
      : null,
    clean.imageCount ? `${clean.imageCount} foto's aangeleverd` : null,
  ]
    .filter(Boolean)
    .join(" — ");
  await sendMail("info@studio-vm.be", {
    subject: `Nieuw builder-ontwerp — ${businessName}`,
    html: `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-collapse:collapse"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:100%;border-collapse:collapse">
  <tr><td style="background:#ffffff;border:1px solid #e7e5e4;box-shadow:0 1px 3px rgba(0,0,0,0.06);padding:40px 38px">
    <p style="margin:0 0 26px;font:800 66px/1 ${font};letter-spacing:-4px;color:#1c1917">vm<span style="color:${accent}">.</span></p>
    <p style="margin:0 0 6px;font:700 13px/1 ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:${accent}">Builder-ontwerp staat klaar</p>
    <h1 style="margin:10px 0 14px;font:700 22px/1.3 ${font};color:#1c1917">${businessName}</h1>
    <p style="margin:0 0 20px;font:400 15px/1.65 ${font};color:#44403c">Een klant heeft een ontwerp doorgestuurd via de builder — klaar om op verder te werken en met de klant te bespreken.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr><td style="background:#fafaf9;border:1px solid #e7e5e4;padding:18px 22px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tbody>
        <tr><td style="padding:6px 18px 6px 0;font:400 13px/1.5 ${font};color:#78716c">Klant</td><td style="padding:6px 0;font:600 14px/1.5 ${font};color:#1c1917"><a href="mailto:${email}" style="color:${accent}">${email}</a></td></tr>
        <tr><td style="padding:6px 18px 6px 0;font:400 13px/1.5 ${font};color:#78716c">Pagina's</td><td style="padding:6px 0;font:600 14px/1.5 ${font};color:#1c1917">${pages || "—"}</td></tr>
        <tr><td style="padding:6px 18px 6px 0;font:400 13px/1.5 ${font};color:#78716c">Stijl</td><td style="padding:6px 0;font:600 14px/1.5 ${font};color:#1c1917">${meta}</td></tr>
      </tbody></table>
    </td></tr></table>
    <p style="margin:24px 0 10px;font:700 12px/1 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#78716c">Volledige inhoud</p>
    <pre style="white-space:pre-wrap;font:400 12px/1.6 ${font};color:#44403c;background:#fafaf9;border:1px solid #e7e5e4;padding:16px;margin:0">${summarize(
      clean,
    )
      .replace(/</g, "&lt;")
      .slice(0, 6000)}</pre>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;border-collapse:separate"><tr><td bgcolor="${accent}" style="background:${accent}"><a href="${siteUrl}/admin/aanvragen" style="display:inline-block;padding:14px 28px;font:700 14px/1 ${font};color:#ffffff;text-decoration:none">Open in admin &nbsp;→</a></td></tr></table>
  </td></tr>
  <tr><td style="padding:20px 4px 0;text-align:center;font:400 11px/1.6 ${font};color:#57534e">Studio VM · interne melding</td></tr>
</table></td></tr></table></body></html>`,
  });

  return { ok: true, stored: true };
}
