"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { leadsConfigured, siteUrl } from "@/lib/supabase/config";
import { isEmail, sendMail } from "@/lib/monitor";

export type BuildState =
  | { ok: true; stored: boolean }
  | { ok: false; error: string; mailto?: string };

type Cfg = {
  businessName: string;
  email: string;
  locale: string;
  theme: string;
  font: string;
  radius: string;
  tagline: string;
  aboutText: string;
  ctaText: string;
  sections: string[];
  imageCount: number;
};

function summarize(c: Cfg): string {
  return [
    `Zaak: ${c.businessName}`,
    `Thema: ${c.theme} · Font: ${c.font} · Hoeken: ${c.radius}`,
    c.tagline && `Slogan: ${c.tagline}`,
    `Secties: ${c.sections.join(", ")}`,
    c.aboutText && `Over: ${c.aboutText}`,
    c.ctaText && `Oproep: ${c.ctaText}`,
    c.imageCount ? `${c.imageCount} foto's aangeleverd` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function mailtoFor(c: Cfg): string {
  const body = `Hoi Vincent,\n\nMijn builder-ontwerp:\n\n${summarize(
    c,
  )}\n\nKan je dit uitwerken?\n\n${c.businessName}`;
  return `mailto:info@studio-vm.be?subject=${encodeURIComponent(
    `Builder-ontwerp — ${c.businessName}`,
  )}&body=${encodeURIComponent(body)}`;
}

export async function submitBuild(cfg: Cfg): Promise<BuildState> {
  const businessName = cfg.businessName.trim().slice(0, 120) || "Naamloos";
  const email = cfg.email.trim().toLowerCase().slice(0, 160);
  if (!isEmail(email))
    return { ok: false, error: "email" };

  const clean: Cfg = {
    ...cfg,
    businessName,
    email,
    tagline: cfg.tagline.slice(0, 300),
    aboutText: cfg.aboutText.slice(0, 1200),
    ctaText: cfg.ctaText.slice(0, 400),
    sections: cfg.sections.slice(0, 40),
  };

  if (!leadsConfigured)
    return { ok: false, error: "not_configured", mailto: mailtoFor(clean) };

  const db = getSupabaseAdmin();
  const { error } = await db.from("quotes").insert({
    locale: clean.locale,
    name: businessName,
    email,
    message: summarize(clean),
    base: "builder",
    modules: clean.sections,
    plan: clean.theme,
    source: "builder",
    snapshot: clean,
  });
  if (error)
    return { ok: false, error: "store", mailto: mailtoFor(clean) };

  await sendMail("info@studio-vm.be", {
    subject: `Nieuw builder-ontwerp — ${businessName}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;color:#111;line-height:1.6">
<h2 style="margin:0 0 12px">Builder-ontwerp</h2>
<p><strong>${businessName}</strong> · <a href="mailto:${email}">${email}</a></p>
<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;background:#faf9f7;border-radius:8px;padding:12px">${summarize(
      clean,
    ).replace(/</g, "&lt;")}</pre>
<p style="margin-top:16px"><a href="${siteUrl}/admin/aanvragen" style="color:#b45309">Open in admin →</a></p>
</div>`,
  });

  return { ok: true, stored: true };
}
