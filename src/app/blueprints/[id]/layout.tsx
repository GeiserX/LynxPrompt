import type { Metadata } from "next";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";

// Helper to parse blueprint ID
function parseBlueprintId(id: string): { type: "user" | "system"; realId: string } {
  // Handle both bp_ (current) and usr_ (legacy) prefixes for user blueprints
  if (id.startsWith("bp_") || id.startsWith("usr_")) {
    return { type: "user", realId: id.replace(/^(bp_|usr_)/, "") };
  }
  return { type: "system", realId: id };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { type, realId } = parseBlueprintId(id);

  let blueprint: {
    name: string;
    description: string | null;
    tags: string[];
    category: string | null;
    price: number | null;
    downloads: number;
    favorites: number;
  } | null = null;

  let authorName: string | null = null;

  try {
    if (type === "user") {
      const userTemplate = await prismaUsers.userTemplate.findUnique({
        where: { id: realId },
        select: {
          name: true,
          description: true,
          tags: true,
          category: true,
          price: true,
          downloads: true,
          favorites: true,
          userId: true,
          visibility: true,
          isPublic: true,
        },
      });

      if (userTemplate && (userTemplate.visibility === "PUBLIC" || userTemplate.isPublic)) {
        blueprint = userTemplate;
        // Get author name
        const author = await prismaUsers.user.findUnique({
          where: { id: userTemplate.userId },
          select: { displayName: true, name: true },
        });
        authorName = author?.displayName || author?.name || null;
      }
    } else {
      const systemTemplate = await prismaApp.systemTemplate.findUnique({
        where: { id: realId },
        select: {
          name: true,
          description: true,
          tags: true,
          category: true,
          downloads: true,
          favorites: true,
        },
      });

      if (systemTemplate) {
        blueprint = { ...systemTemplate, price: null };
        authorName = "LynxPrompt";
      }
    }
  } catch (error) {
    console.error("Error fetching blueprint for metadata:", error);
  }

  if (!blueprint) {
    return {
      title: "Blueprint Not Found",
      description: "The blueprint you're looking for doesn't exist.",
    };
  }

  const description =
    blueprint.description ||
    `AI configuration blueprint for ${blueprint.category || "developers"}. ${blueprint.downloads} downloads.`;

  const priceText =
    blueprint.price && blueprint.price > 0
      ? ` - €${(blueprint.price / 100).toFixed(2)}`
      : " - Free";

  return {
    title: `${blueprint.name}${priceText}`,
    description,
    keywords: blueprint.tags.length > 0 ? blueprint.tags : undefined,
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      title: blueprint.name,
      description,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          alt: blueprint.name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: blueprint.name,
      description,
    },
    alternates: {
      canonical: `https://lynxprompt.com/blueprints/${id}`,
    },
  };
}

// Generate JSON-LD for blueprint (Product schema)
async function getBlueprintJsonLd(id: string) {
  const { type, realId } = parseBlueprintId(id);

  let blueprint: {
    name: string;
    description: string | null;
    price: number | null;
    downloads: number;
    favorites: number;
    category: string | null;
  } | null = null;

  let authorName: string | null = null;

  try {
    if (type === "user") {
      const userTemplate = await prismaUsers.userTemplate.findUnique({
        where: { id: realId },
        select: {
          name: true,
          description: true,
          price: true,
          downloads: true,
          favorites: true,
          category: true,
          userId: true,
          visibility: true,
          isPublic: true,
        },
      });

      if (userTemplate && (userTemplate.visibility === "PUBLIC" || userTemplate.isPublic)) {
        blueprint = userTemplate;
        const author = await prismaUsers.user.findUnique({
          where: { id: userTemplate.userId },
          select: { displayName: true, name: true },
        });
        authorName = author?.displayName || author?.name || "LynxPrompt User";
      }
    } else {
      const systemTemplate = await prismaApp.systemTemplate.findUnique({
        where: { id: realId },
        select: {
          name: true,
          description: true,
          downloads: true,
          favorites: true,
          category: true,
        },
      });

      if (systemTemplate) {
        blueprint = { ...systemTemplate, price: null };
        authorName = "LynxPrompt";
      }
    }
  } catch {
    return null;
  }

  if (!blueprint) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: blueprint.name,
    description: blueprint.description || `AI configuration blueprint for ${blueprint.category || "developers"}`,
    image: "https://lynxprompt.com/og-image.png",
    brand: {
      "@type": "Brand",
      name: "LynxPrompt",
    },
    author: {
      "@type": "Person",
      name: authorName,
    },
    offers: {
      "@type": "Offer",
      price: blueprint.price ? (blueprint.price / 100).toFixed(2) : "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `https://lynxprompt.com/blueprints/${id}`,
    },
    aggregateRating:
      blueprint.favorites > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Math.min(5, 4 + blueprint.favorites / 100).toFixed(1),
            reviewCount: blueprint.favorites,
          }
        : undefined,
    category: blueprint.category || "AI Configuration",
  };
}

export default async function BlueprintLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jsonLd = await getBlueprintJsonLd(id);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}

