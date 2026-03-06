import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/settings/",
          "/dashboard/",
          "/admin/",
          "/blog/admin/",
          "/blueprints/create/",
          "/blueprints/*/edit/",
          "/templates/create/",
          "/teams/*/",
          "/support/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}














