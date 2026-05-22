// Digest-mail naar Vincent met de posts die de AI Content Engine genereerde.
// Gebruikt resend via /lib/monitor — zelfde from-adres als de rest.

import type { GeneratedPost } from "./social-generator";

// Lokale type-kopie van monitor's Mail-shape (niet ge-exporteerd daar).
type Mail = { subject: string; html: string };

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://studio-vm.be";

const PLATFORM_LABEL: Record<string, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X",
};

export function buildSocialDigestMail(posts: GeneratedPost[]): Mail {
  const dateLabel = new Date().toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const count = posts.length;

  const postsHtml = posts
    .map((p, i) => {
      const platform = PLATFORM_LABEL[p.platform] ?? p.platform;
      const preview = p.body.slice(0, 280).replace(/\n/g, "<br>");
      const more = p.body.length > 280 ? "…" : "";
      return `
        <tr>
          <td style="padding:18px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;margin-bottom:12px;">
            <p style="margin:0 0 6px;font-family:'SF Mono',Menlo,monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#71717a;">
              #${i + 1} · ${platform}
            </p>
            <h3 style="margin:0 0 12px;font-family:'Inter',-apple-system,sans-serif;font-size:16px;font-weight:600;color:#18181b;">
              ${escapeHtml(p.title)}
            </h3>
            <div style="font-family:'Inter',-apple-system,sans-serif;font-size:13px;line-height:1.6;color:#3f3f46;">
              ${preview}${more}
            </div>
            ${
              p.hashtags
                ? `<p style="margin:12px 0 0;font-family:'SF Mono',Menlo,monospace;font-size:11px;color:#0ea5e9;">${escapeHtml(p.hashtags)}</p>`
                : ""
            }
          </td>
        </tr>
        <tr><td style="height:12px;"></td></tr>
      `;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>${count} social posts klaar — ${dateLabel}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#a855f7);color:#fff;padding:6px 12px;border-radius:9999px;font-family:'SF Mono',Menlo,monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;">
                🤖 AI Content Engine
              </div>
              <h1 style="margin:14px 0 6px;font-size:26px;font-weight:700;color:#18181b;letter-spacing:-0.5px;">
                ${count} ${count === 1 ? "post staat" : "posts staan"} klaar
              </h1>
              <p style="margin:0;font-size:14px;color:#71717a;">
                ${dateLabel} — review op studio-vm en post wanneer 't past
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 0 24px;">
              <a href="${SITE_URL}/admin/social" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:14px;">
                Open /admin/social →
              </a>
            </td>
          </tr>

          <!-- Posts -->
          ${postsHtml}

          <!-- Hoe-tip -->
          <tr>
            <td style="padding:24px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:12px;padding:18px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-family:'SF Mono',Menlo,monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#92400e;">
                      💡 Hoe verder
                    </p>
                    <ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#78350f;">
                      <li>Open <a href="${SITE_URL}/admin/social" style="color:#92400e;">/admin/social</a></li>
                      <li>Per post — kijk hem na, eventueel een woord aanpassen via "bewerken"</li>
                      <li>Klik <strong>"Copy volledige post"</strong> — plak op FB/LinkedIn</li>
                      <li>Markeer hier als <strong>"→ Gepost"</strong> + plak optioneel de echte FB/LI-URL</li>
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;text-align:center;">
              <p style="margin:0;font-family:'SF Mono',Menlo,monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#a1a1aa;">
                Studio-vm AI Content Engine · v1 ${process.env.ANTHROPIC_API_KEY ? "(AI-modus actief)" : "(template-modus)"}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: `🤖 ${count} social ${count === 1 ? "post staat" : "posts staan"} klaar — ${dateLabel}`,
    html,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
