// JSON-LD structured data rendered server-side on every page.
// Data is static/hardcoded — dangerouslySetInnerHTML is safe here.
export default function SiteStructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sneak N' Drip",
    url: "https://sneakndrip.ph",
    logo: "https://sneakndrip.ph/sneakndrip-logo.png",
    description:
      "100% Authentic Sneakers. On Hand & Pre-Order. Nike, Jordan, Adidas, Vans, New Balance and more. Ships Philippines-wide.",
    foundingDate: "2023",
    address: { "@type": "PostalAddress", addressCountry: "PH" },
    areaServed: "PH",
    sameAs: [
      "https://www.facebook.com/SneakNDrip/",
      "https://www.instagram.com/sneakndripph/",
      "https://www.tiktok.com/@sneakyjuls",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: "https://sneakndrip.ph/contact",
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sneak N' Drip",
    url: "https://sneakndrip.ph",
    description: "100% Authentic Sneakers. On Hand & Pre-Order. Ships Philippines-wide.",
    inLanguage: "en-PH",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://sneakndrip.ph/shop?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
