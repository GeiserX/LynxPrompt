import { MetadataRoute } from "next";
import { APP_URL } from "@/lib/feature-flags";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = APP_URL;

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














