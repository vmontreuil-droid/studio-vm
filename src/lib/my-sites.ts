// Alle sites die ik gemaakt heb — bewaakt vanuit de admin (uptime,
// SSL, score, alarmen). Voeg hier gewoon een regel toe voor een
// nieuwe site; de admin pikt 'm automatisch op.
export type MySite = { name: string; url: string };

export const MY_SITES: MySite[] = [
  { name: "Studio VM", url: "https://studio-vm.be" },
  { name: "Cottage Waregem", url: "https://cottage-waregem.vercel.app" },
  { name: "Bar'Botte", url: "https://barbotte.vercel.app" },
  { name: "Montreuil", url: "https://montreuil.be" },
  { name: "Céline Interieur", url: "https://celineinterieur.com" },
  { name: "Allard Philippe", url: "https://allardphilippe.vercel.app" },
  { name: "Favesan", url: "https://favesan.be" },
  { name: "Mari-Lines", url: "https://mari-lines.be" },
];

// E-mail waarop deze admin-monitors geregistreerd staan (zodat de
// bestaande weekcron ze automatisch mee scant).
export const SITES_OWNER_EMAIL = "info@studio-vm.be";
