import Link from "next/link";
import { getAllArticles } from "@/lib/content";
import { SITE, absoluteBlogUrl } from "@/lib/site";
import { BUCKETS } from "@/lib/buckets";
import ArticleCard from "@/components/ArticleCard";
import CategoryCard from "@/components/CategoryCard";
import NewsletterSignup from "@/components/NewsletterSignup";

export const revalidate = 60;

export default async function Landing() {
  const articles = await getAllArticles();
  const [feature, ...rest] = articles;
  const latest = rest.slice(0, 6);

  const counts = new Map<string, number>();
  for (const a of articles) {
    counts.set(a.frontmatter.bucket, (counts.get(a.frontmatter.bucket) || 0) + 1);
  }

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The Wenest Journal",
    description: SITE.description,
    url: absoluteBlogUrl(),
    inLanguage: "en-AU",
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.frontmatter.title,
        url: absoluteBlogUrl(`/${a.slug}`),
      })),
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <section className="pt-20 pb-12 max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-5">
          The Wenest Journal
        </p>
        <h1 className="text-ink text-4xl md:text-6xl font-bold leading-heading tracking-tight">
          Practical guides for running a Sydney home.
        </h1>
        <p className="text-xl text-body mt-6 leading-snug">
          From blocked drains to seasonal checklists. Written by the team that
          coordinates trades for hundreds of Sydney households.
        </p>
      </section>

      {feature && (
        <section className="pb-20">
          <ArticleCard article={feature} variant="feature" />
        </section>
      )}

      {latest.length > 0 && (
        <section className="pb-20">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-ink text-2xl font-bold">Latest</h2>
          </div>
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {latest.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}

      <section className="pb-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-ink text-2xl font-bold">Browse by topic</h2>
          <Link
            href="/search"
            className="text-sm text-accent hover:underline underline-offset-4"
          >
            Search all articles →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BUCKETS.map((b) => (
            <CategoryCard
              key={b.slug}
              slug={b.slug}
              name={b.name}
              blurb={b.blurb}
              count={counts.get(b.slug) || 0}
            />
          ))}
        </div>
      </section>

      <NewsletterSignup />
    </div>
  );
}
