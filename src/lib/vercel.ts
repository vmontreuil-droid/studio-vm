import "server-only";

// Subdomein automatisch koppelen aan het Vercel-project zodra een klant
// publiceert. Best-effort: zonder env-vars (VERCEL_TOKEN / _PROJECT_ID /
// _TEAM_ID) doet dit niets en faalt er niets — de site werkt dan zodra
// het domein handmatig in Vercel staat (DNS wijst via wildcard al goed).

const TOKEN = process.env.VERCEL_TOKEN ?? "";
const PROJECT = process.env.VERCEL_PROJECT_ID ?? "";
const TEAM = process.env.VERCEL_TEAM_ID ?? "";

export const vercelConfigured = !!(TOKEN && PROJECT);

function teamQs(): string {
  return TEAM ? `?teamId=${encodeURIComponent(TEAM)}` : "";
}

// Voegt <name> toe als domein op het project. 409 = bestaat al → ok.
export async function vercelAddDomain(
  name: string,
): Promise<{ ok: boolean; detail?: string }> {
  if (!vercelConfigured) return { ok: false, detail: "not-configured" };
  try {
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(
        PROJECT,
      )}/domains${teamQs()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      },
    );
    if (res.ok || res.status === 409) return { ok: true };
    const detail = await res.text();
    console.error("[vercel] addDomain faalde:", res.status, detail);
    return { ok: false, detail };
  } catch (e) {
    console.error("[vercel] addDomain netwerk-error:", e);
    return { ok: false, detail: "network" };
  }
}

export async function vercelRemoveDomain(name: string): Promise<void> {
  if (!vercelConfigured) return;
  try {
    await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(
        PROJECT,
      )}/domains/${encodeURIComponent(name)}${teamQs()}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      },
    );
  } catch (e) {
    console.error("[vercel] removeDomain error:", e);
  }
}
