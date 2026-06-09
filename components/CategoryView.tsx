import { notFound } from "next/navigation";
import { getArticlesByBucket } from "@/lib/content";
import { BUCKETS, BUCKET_SLUGS } from "@/lib/buckets";
import ArticleCard from "@/components/ArticleCard";

/**
 * Category archive, rendered by the flat `/[slug]` route when the slug matches
 * one of the fixed BUCKET_SLUGS. Category URLs are `/blog/<bucket>` (no
 * `/category/` segment) — see app/[slug]/page.tsx for the routing.
 */
export default async function CategoryView({ slug }: { slug: string }) {
  if (!(BUCKET_SLUGS as readonly string[]).includes(slug)) notFound();
  const articles = await getArticlesByBucket(slug);
  const bucket = BUCKETS.find((b) => b.slug === slug)!;

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-4">
        Category
      </p>
      <h1 className="text-ink text-4xl md:text-5xl font-bold leading-heading">
        {bucket.name}
      </h1>
      <p className="text-xl text-body mt-4 max-w-2xl">{bucket.blurb}</p>

      {articles.length === 0 ? (
        <p className="text-muted mt-16">
          No articles in this category yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3 mt-16">
          {articles.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
