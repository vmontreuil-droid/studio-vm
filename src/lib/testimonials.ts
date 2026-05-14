export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  initials: string;
};

// Vervang deze placeholders door echte citaten zodra je ze hebt verzameld
// (bv. via een korte LinkedIn-vraag of na project-oplevering).
export const testimonials: Testimonial[] = [
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
];
