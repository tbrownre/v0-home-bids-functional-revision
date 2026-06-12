import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin-demo/",
          "/api/",
          "/auth/",
          "/contractors/dashboard/",
          "/contractors/jobs/",
          "/inbox/",
          "/jobs/",
          "/new-job/",
          "/subscribe/",
        ],
      },
    ],
    sitemap: "https://homebids.ai/sitemap.xml",
  };
}
