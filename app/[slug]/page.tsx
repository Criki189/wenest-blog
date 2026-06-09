import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllSlugs,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/content";
import { SITE, absoluteBlogUrl } from "@/lib/site";
import { bucketName, BUCKETS, BUCKET_SLUGS } from "@/lib/buckets";
import CategoryView from "@/components/CategoryView";
import ArticleHeader from "@/components/ArticleHeader";
import TableOfContents from "@/components/TableOfContents";
import FAQAccordion from "@/components/FAQAccordion";
import CTABox from "@/components/CTABox";
import RelatedPosts from "@/components/RelatedPosts";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Posts and the fixed category buckets share this flat `/[slug]` route, so
  // category URLs are `/blog/<bucket>` (no `/category/` segment).
  return [...getAllSlugs(), ...BUCKET_SLUGS].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // Category bucket → category archive metadata.
  if ((BUCKET_SLUGS as readonly string[]).includes(params.slug)) {
    const name = bucketName(params.slug);
    const blurb = BUCKETS.find((b) => b.slug === params.slug)?.blurb || "";
    return {
      title: `${name} articles`,
      description: blurb,
      alternates: { canonical: absoluteBlogUrl(`/${params.slug}`) },
    };
  }
  const a = await getArticleBySlug(params.slug);
  if (!a) return {};
  const fm = a.frontmatter;
  const url = absoluteBlogUrl(`/${a.slug}`);
  const ogImage = `${SITE.url}/blog/api/og?slug=${a.slug}`;

  return {
    title: fm.title,
    description: fm.description,
    alternates: { canonical: url },
    keywords: [fm.primary_keyword, ...fm.secondary_keywords],
    authors: [{ name: fm.author }],
    openGraph: {
      type: "article",
      url,
      title: fm.title,
      description: fm.description,
      publishedTime: fm.published_date || undefined,
      modifiedTime: fm.last_updated || fm.published_date || undefined,
      authors: [fm.author],
      images: [{ url: ogImage, width: 1200, height: 630, alt: fm.cover_image_alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: fm.title,
      description: fm.description,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  // Category bucket → render the category archive instead of an article.
  if ((BUCKET_SLUGS as readonly string[]).includes(params.slug)) {
    return <CategoryView slug={params.slug} />;
  }
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();
  const related = await getRelatedArticles(article);
  const fm = article.frontmatter;
  const url = absoluteBlogUrl(`/${article.slug}`);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": fm.schema_type || "Article",
    headline: fm.title,
    description: fm.description,
    image: [`${SITE.url}/blog/api/og?slug=${article.slug}`],
    datePublished: fm.published_date || undefined,
    dateModified: fm.last_updated || fm.published_date || undefined,
    author: { "@type": "Organization", name: fm.author },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` },
    },
    mainEntityOfPage: url,
    keywords: [fm.primary_keyword, ...fm.secondary_keywords].join(", "),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Journal", item: absoluteBlogUrl() },
      {
        "@type": "ListItem",
        position: 2,
        name: bucketName(fm.bucket),
        item: absoluteBlogUrl(`/${fm.bucket}`),
      },
      { "@type": "ListItem", position: 3, name: fm.title, item: url },
    ],
  };

  const faqSchema =
    fm.faq && fm.faq_items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: fm.faq_items.map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: { "@type": "Answer", text: q.answer },
          })),
        }
      : null;

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <ArticleHeader article={article} />

      <div className="max-w-6xl mx-auto px-6 mt-12 grid gap-12 lg:grid-cols-[1fr_220px]">
        <div className="max-w-reading w-full mx-auto lg:mx-0">
          <div
            className="prose prose-wenest max-w-none"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
          {fm.faq && <FAQAccordion items={fm.faq_items} />}
          <CTABox />
        </div>
        <TableOfContents items={article.toc} />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <RelatedPosts articles={related} />
      </div>
    </article>
  );
}
