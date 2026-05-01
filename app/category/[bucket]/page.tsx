import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticlesByBucket } from "@/lib/content";
import { BUCKETS, BUCKET_SLUGS, bucketName, type BucketSlug } from "@/lib/buckets";
import { absoluteBlogUrl } from "@/lib/site";
import ArticleCard from "@/components/ArticleCard";

export const revalidate = 60;

export async function generateStaticParams() {
  return BUCKET_SLUGS.map((bucket) => ({ bucket }));
}

export async function generateMetadata({
  params,
}: {
  params: { bucket: string };
}): Promise<Metadata> {
  if (!BUCKET_SLUGS.includes(params.bucket as BucketSlug)) return {};
  const name = bucketName(params.bucket);
  const blurb = BUCKETS.find((b) => b.slug === params.bucket)?.blurb || "";
  return {
    title: `${name} articles`,
    description: blurb,
    alternates: { canonical: absoluteBlogUrl(`/category/${params.bucket}`) },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { bucket: string };
}) {
  if (!BUCKET_SLUGS.includes(params.bucket as BucketSlug)) notFound();
  const articles = await getArticlesByBucket(params.bucket);
  const bucket = BUCKETS.find((b) => b.slug === params.bucket)!;

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
