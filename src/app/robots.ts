import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://lynxprompt.com";

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












