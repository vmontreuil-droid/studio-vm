import type { Locale } from "@/lib/i18n/config";

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  initials: string;
};

// Vervang deze placeholders door echte citaten zodra je ze verzameld hebt.
const data: Record<Locale, Testimonial[]> = {
  nl: [
    {
      quote:
        "Onze nieuwe site laadt drie keer sneller dan de vorige. En ik kan eindelijk zelf het menu aanpassen, zonder mailtje te sturen.",
      author: "Sofie",
      role: "restaurantuitbater, Waregem",
      initials: "SV",
    },
    {
      quote:
        "Vincent denkt mee, niet enkel voor zichzelf. Hij zei me letterlijk: 'dat heb je niet nodig'. Dat verkort mijn factuur en mijn lijst van zorgen.",
      author: "Pieter",
      role: "fotograaf, Brugge",
      initials: "PA",
    },
    {
      quote:
        "De admin werkt zo simpel dat ik er onderweg op de werf op kan inloggen. Foto's uploaden vanop mijn telefoon — onmiddellijk online.",
      author: "Céline",
      role: "interieurstyliste, West-Vlaanderen",
      initials: "CM",
    },
  ],
  fr: [
    {
      quote:
        "Notre nouveau site charge trois fois plus vite que l'ancien. Et je peux enfin adapter la carte moi-même, sans envoyer d'e-mail.",
      author: "Sofie",
      role: "restauratrice, Waregem",
      initials: "SV",
    },
    {
      quote:
        "Vincent réfléchit avec vous, pas seulement pour lui. Il m'a dit littéralement : « ça, vous n'en avez pas besoin ». Ça raccourcit ma facture et ma liste de soucis.",
      author: "Pieter",
      role: "photographe, Bruges",
      initials: "PA",
    },
    {
      quote:
        "L'admin est si simple que je peux me connecter depuis le chantier. Uploader des photos depuis mon téléphone — en ligne immédiatement.",
      author: "Céline",
      role: "décoratrice d'intérieur, Flandre-Occidentale",
      initials: "CM",
    },
  ],
  en: [
    {
      quote:
        "Our new site loads three times faster than the old one. And I can finally update the menu myself, without sending an email.",
      author: "Sofie",
      role: "restaurant owner, Waregem",
      initials: "SV",
    },
    {
      quote:
        "Vincent thinks along with you, not just for himself. He literally told me: 'you don't need that'. That shortens both my invoice and my list of worries.",
      author: "Pieter",
      role: "photographer, Bruges",
      initials: "PA",
    },
    {
      quote:
        "The admin is so simple I can log in from the building site. Uploading photos from my phone — online immediately.",
      author: "Céline",
      role: "interior stylist, West Flanders",
      initials: "CM",
    },
  ],
};

export function getTestimonials(locale: Locale): Testimonial[] {
  return data[locale];
}
