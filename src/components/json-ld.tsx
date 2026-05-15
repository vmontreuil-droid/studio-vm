function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description,
        url,
        datePublished,
        author: { "@type": "Person", name: "Vincent Montreuil" },
        publisher: {
          "@type": "Organization",
          name: "Studio VM",
          logo: {
            "@type": "ImageObject",
            url: "https://studio-vm.be/icon",
          },
        },
        mainEntityOfPage: url,
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: it.url,
        })),
      }}
    />
  );
}

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
