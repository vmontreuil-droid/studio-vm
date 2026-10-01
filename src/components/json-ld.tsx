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
            url: "https://www.studio-vm.be/icon",
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

export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((it) => ({
          "@type": "Question",
          name: it.q,
          acceptedAnswer: { "@type": "Answer", text: it.a },
        })),
      }}
    />
  );
}

export function ServiceJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: name,
        name,
        description,
        url,
        provider: {
          "@type": "Organization",
          name: "Studio VM",
          url: "https://www.studio-vm.be",
        },
        areaServed: { "@type": "Place", name: "Europe" },
        availableLanguage: ["nl", "fr", "en", "de", "es"],
      }}
    />
  );
}

export function WebsiteJsonLd({ locale }: { locale: string }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Studio VM",
        alternateName: "studio-vm.be",
        url: `https://www.studio-vm.be/${locale}`,
        inLanguage: locale,
        publisher: { "@type": "Organization", name: "Studio VM" },
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
    url: "https://www.studio-vm.be",
    logo: "https://www.studio-vm.be/icon",
    image: "https://www.studio-vm.be/opengraph-image",
    description:
      "Studio VM modelleert 3D-ontwerpmodellen voor machinebesturing (Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar) voor aannemers in heel Europa.",
    foundingDate: "2024",
    founder: {
      "@type": "Person",
      name: "Vincent Montreuil",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Nieuwpoortstraat 14-301",
      postalCode: "8570",
      addressLocality: "Anzegem",
      addressRegion: "West-Vlaanderen",
      addressCountry: "BE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@studio-vm.be",
      contactType: "Sales",
      areaServed: "Europe",
      availableLanguage: ["nl", "fr", "en", "de", "es"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    },
    sameAs: ["https://www.linkedin.com/in/vincentmontreuil"],
    knowsAbout: [
      "Machine control",
      "3D design models",
      "Digital terrain model",
      "Land surveying",
      "Earthworks",
      "Coordinate reference systems",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
