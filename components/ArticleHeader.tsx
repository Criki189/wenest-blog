import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/content";
import { bucketName } from "@/lib/buckets";

export default function ArticleHeader({ article }: { article: Article }) {
  const { frontmatter: fm, readingMinutes } = article;
  const date = fm.published_date || fm.last_updated;

  return (
    <header>
      <div className="relative w-full aspect-[21/9] bg-rule">
        <Image
          src={fm.cover_image}
          alt={fm.cover_image_alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="max-w-reading mx-auto px-6 pt-12">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-accent font-medium mb-5">
          <Link
            href={`/${fm.bucket}`}
            className="hover:underline underline-offset-4"
          >
            {bucketName(fm.bucket)}
          </Link>
          <span className="text-muted">·</span>
          <span className="text-muted">{readingMinutes} min read</span>
          {date && (
            <>
              <span className="text-muted">·</span>
              <time className="text-muted" dateTime={date}>
                {new Date(date).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </>
          )}
        </div>
        <h1 className="text-ink font-bold text-4xl md:text-5xl leading-heading tracking-tight">
          {fm.title}
        </h1>
        <p className="text-xl text-body mt-5 leading-snug">{fm.description}</p>
        <p className="text-sm text-muted mt-6">By {fm.author}</p>
      </div>
    </header>
  );
}
