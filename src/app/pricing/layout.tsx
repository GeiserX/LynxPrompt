import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for LynxPrompt. Free for individuals with full access. Teams plan for organizations with AI features, SSO, and shared blueprints.",
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
        description: "Full wizard, download configs for 30+ platforms, create and sell blueprints, API access",
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
        description: "Everything in Free, plus AI features, team blueprints, SSO, centralized billing",
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








