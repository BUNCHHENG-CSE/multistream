import type { MetadataRoute } from "next";
import { prisma } from "@/db";
import { siteConfig } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const publicLayouts = await prisma.savedLayout.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const layoutRoutes: MetadataRoute.Sitemap = publicLayouts.map((layout) => ({
      url: `${baseUrl}/watch/${layout.id}`,
      lastModified: layout.createdAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...layoutRoutes];
  } catch (error) {
    console.error("[sitemap] Failed to query dynamic public layouts:", error);
    return staticRoutes;
  }
}
