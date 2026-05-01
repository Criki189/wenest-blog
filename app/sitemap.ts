import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";
import { BUCKETS } from "@/lib/buckets";
import { absoluteBlogUrl } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();
  const published = articles.filter((a) => a.frontmatter.status === "published");

  return [
    {
      url: absoluteBlogUrl(),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...BUCKETS.map((b) => ({
      url: absoluteBlogUrl(`/category/${b.slug}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...published.map((a) => ({
      url: absoluteBlogUrl(`/${a.slug}`),
      lastModified: new Date(
        a.frontmatter.last_updated || a.frontmatter.published_date || Date.now()
      ),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
