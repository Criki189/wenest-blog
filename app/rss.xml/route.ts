import { getAllArticles } from "@/lib/content";
import { SITE, absoluteBlogUrl } from "@/lib/site";

export const dynamic = "force-static";

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const articles = (await getAllArticles())
    .filter((a) => a.frontmatter.status === "published")
    .slice(0, 20);

  const items = articles
    .map((a) => {
      const url = absoluteBlogUrl(`/${a.slug}`);
      const pub = a.frontmatter.published_date
        ? new Date(a.frontmatter.published_date).toUTCString()
        : new Date().toUTCString();
      return `
    <item>
      <title>${escape(a.frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escape(a.frontmatter.description)}</description>
      <pubDate>${pub}</pubDate>
      <author>noreply@wenest.com.au (${escape(a.frontmatter.author)})</author>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(SITE.name)} Journal</title>
    <link>${absoluteBlogUrl()}</link>
    <description>${escape(SITE.description)}</description>
    <language>en-AU</language>
    <atom:link href="${SITE.url}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
