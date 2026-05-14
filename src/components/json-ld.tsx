export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Studio VM",
    legalName: "Studio VM (Vincent Montreuil)",
    url: "https://studio-vm.be",
    logo: "https://studio-vm.be/icon",
    image: "https://studio-vm.be/opengraph-image",
    description:
      "Studio VM bouwt websites, webshops en admins voor lokale ondernemers in Vlaanderen — gebouwd met Next.js en Supabase.",
    foundingDate: "2024",
    founder: {
      "@type": "Person",
      name: "Vincent Montreuil",
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: "West-Vlaanderen",
      addressCountry: "BE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@studio-vm.be",
      contactType: "Sales",
      areaServed: "BE",
      availableLanguage: ["nl", "fr", "en"],
    },
    sameAs: ["https://github.com/vmontreuil-droid"],
    knowsAbout: [
      "Next.js",
      "Supabase",
      "React",
      "Web development",
      "E-commerce",
      "Progressive Web Apps",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
