import type { Article } from "@/lib/content";
import ArticleCard from "./ArticleCard";

export default function RelatedPosts({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  return (
    <section className="mt-24 border-t border-rule pt-16">
      <h2 className="text-2xl font-bold text-ink mb-8">Keep reading</h2>
      <div className="grid gap-10 md:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}
