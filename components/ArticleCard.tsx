import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/content";
import { bucketName } from "@/lib/buckets";

export default function ArticleCard({
  article,
  variant = "default",
}: {
  article: Article;
  variant?: "default" | "feature";
}) {
  const { frontmatter: fm, slug, readingMinutes } = article;
  const isFeature = variant === "feature";

  return (
    <article className="group">
      <Link href={`/${slug}`} className="block">
        <div
          className={`relative overflow-hidden rounded-lg bg-rule ${
            isFeature ? "aspect-[2/1]" : "aspect-[16/9]"
          }`}
        >
          <Image
            src={fm.cover_image}
            alt={fm.cover_image_alt}
            fill
            sizes={isFeature ? "100vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
        </div>
        <div className={`mt-5 ${isFeature ? "max-w-3xl" : ""}`}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent font-medium mb-2">
            <span>{bucketName(fm.bucket)}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{readingMinutes} min read</span>
          </div>
          <h3
            className={`text-ink font-bold leading-tight group-hover:text-accent transition-colors ${
              isFeature ? "text-3xl md:text-4xl" : "text-xl"
            }`}
          >
            {fm.title}
          </h3>
          <p className={`text-body mt-2 ${isFeature ? "text-lg" : "text-sm"}`}>
            {fm.description}
          </p>
        </div>
      </Link>
    </article>
  );
}
