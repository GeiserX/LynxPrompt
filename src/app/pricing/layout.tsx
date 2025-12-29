import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for LynxPrompt. Start free, upgrade as you grow. Pro from €5/month, Max from €20/month. 10% off annual plans.",
  keywords: [
    "LynxPrompt pricing",
    "AI IDE pricing",
    "Cursor rules pricing",
    "developer tools pricing",
    "subscription plans",
  ],
  openGraph: {
    title: "Pricing - LynxPrompt",
    description:
      "Simple, transparent pricing. Start free, upgrade as you grow. Pro, Max, and Teams plans available.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pricing - LynxPrompt",
    description:
      "Simple, transparent pricing. Start free, upgrade as you grow.",
  },
  alternates: {
    canonical: "https://lynxprompt.com/pricing",
  },
};

// JSON-LD for pricing page (SoftwareApplication with offers)
const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "LynxPrompt Pricing",
  description: "Pricing plans for LynxPrompt AI IDE configuration generator",
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "LynxPrompt",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "EUR",
        description: "Basic wizards, download configs, browse free blueprints",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "5",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "5",
          priceCurrency: "EUR",
          unitCode: "MON",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitCode: "MON",
          },
        },
        description: "Intermediate wizards, sell blueprints, priority support",
      },
      {
        "@type": "Offer",
        name: "Max",
        price: "20",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "20",
          priceCurrency: "EUR",
          unitCode: "MON",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitCode: "MON",
          },
        },
        description: "Advanced wizards, AI editing, 10% off paid blueprints",
      },
      {
        "@type": "Offer",
        name: "Teams",
        price: "30",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "30",
          priceCurrency: "EUR",
          unitCode: "MON",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitCode: "MON",
          },
        },
        description: "Team blueprints, SSO, centralized billing, per-seat pricing",
      },
    ],
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      {children}
    </>
  );
}






