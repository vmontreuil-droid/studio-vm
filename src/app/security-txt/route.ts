// Geserveerd op /.well-known/security.txt via rewrite in next.config.ts
// (dotfolders in /public worden door Vercel niet geserveerd).
const body = `# RFC 9116 — https://securitytxt.org
Contact: mailto:info@studio-vm.be
Expires: 2027-05-15T00:00:00.000Z
Preferred-Languages: nl, fr, en, de, es
Canonical: https://www.studio-vm.be/.well-known/security.txt

# Vond u iets? Meld het gerust, vriendelijk en verantwoord.
# Geen bug-bounty, wel oprechte dank.
`;

// Vaste tekst: bij de build één keer opbouwen.
export const dynamic = "force-static";

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
