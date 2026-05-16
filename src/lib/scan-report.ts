import { runScan } from "@/app/actions/scan";
import { sendMail } from "@/lib/monitor";

const esc = (s: unknown) => String(s ?? "").replace(/</g, "&lt;");

// Draait een volledige scan van de opgegeven site en mailt het rapport
// naar info@studio-vm.be. Bewust fail-safe: gooit nooit, blokkeert nooit
// het formulier van de bezoeker (aanroepen via next/after).
export async function scanAndMail(
  rawUrl: string,
  ctx: { source: string; name?: string; email?: string },
): Promise<void> {
  const url = (rawUrl ?? "").trim();
  if (!url || url.length < 4 || !/[a-z0-9][a-z0-9-]*\.[a-z]{2,}/i.test(url)) {
    return;
  }
  const who =
    [ctx.name, ctx.email].filter(Boolean).map(esc).join(" · ") || "—";

  try {
    const r = await runScan(url);

    if (!r.ok) {
      await sendMail("info@studio-vm.be", {
        subject: `Auto-scan mislukt — ${url} (${ctx.source})`,
        html: `<div style="font-family:system-ui,sans-serif;color:#111;line-height:1.6">
<p>Aanvraag via <strong>${esc(ctx.source)}</strong> — ${who}</p>
<p>Scan van <strong>${esc(url)}</strong> mislukte: ${esc(r.error)}</p></div>`,
      });
      return;
    }

    const cat = (c: string) =>
      r.categories.find((x) => x.cat === c)?.score ?? "—";
    const pitfalls =
      r.pitfalls.length > 0
        ? `<ul style="margin:6px 0 0;padding-left:18px">${r.pitfalls
            .map((p) => `<li>${esc(p)}</li>`)
            .join("")}</ul>`
        : "<p style='margin:6px 0 0;color:#16803a'>Geen grote valkuilen.</p>";

    await sendMail("info@studio-vm.be", {
      subject: `Auto-scan — ${r.host} · ${r.grade} ${r.score}/100 (${ctx.source})`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:620px;color:#111;line-height:1.6">
<h2 style="margin:0 0 4px">Automatische site-scan</h2>
<p style="margin:0 0 14px;color:#555">Aangevraagd via <strong>${esc(
        ctx.source,
      )}</strong> — ${who}</p>
<table style="border-collapse:collapse;font-size:14px">
<tr><td style="padding:3px 16px 3px 0;color:#666">Site</td><td><a href="${esc(
        r.finalUrl,
      )}">${esc(r.finalUrl)}</a></td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Score</td><td><strong>${
        r.grade
      } — ${r.score}/100</strong></td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Stack</td><td>${esc(
        r.stack,
      )}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Hosting</td><td>${esc(
        r.hosting ?? "—",
      )}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Gemaakt door</td><td>${esc(
        r.builtBy ?? "—",
      )}</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Reactietijd</td><td>${
        r.responseMs
      } ms · ${r.htmlKb} KB HTML</td></tr>
<tr><td style="padding:3px 16px 3px 0;color:#666">Per categorie</td><td>snelheid ${cat(
        "speed",
      )} · SEO ${cat("seo")} · mobiel ${cat("mobile")} · veiligheid ${cat(
        "security",
      )} · platform ${cat("platform")}</td></tr>
</table>
<h3 style="margin:18px 0 0;font-size:14px">Valkuilen</h3>
${pitfalls}
<p style="margin-top:18px"><a href="https://studio-vm.be/nl/scan" style="color:#b45309">Volledige scanner →</a></p>
</div>`,
    });
  } catch (e) {
    console.error("[scan-report] mislukt:", e);
  }
}
