import { ImageResponse } from "@vercel/og";
import { getArticleBySlug } from "@/lib/content";
import { bucketName } from "@/lib/buckets";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const article = slug ? await getArticleBySlug(slug) : null;
  const title = article?.frontmatter.title ?? "The Wenest Journal";
  const category = article ? bucketName(article.frontmatter.bucket) : "Wenest";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#1F8A70",
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#6B7A8F",
              fontWeight: 600,
            }}
          >
            {`Wenest · ${category}`}
          </div>
        </div>

        <div
          style={{
            fontSize: 72,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            color: "#0E1B2C",
            fontWeight: 700,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "#6B7A8F",
            borderTop: "1px solid #E5E9EE",
            paddingTop: 28,
          }}
        >
          <span style={{ fontWeight: 600, color: "#0E1B2C" }}>wenest.com.au/blog</span>
          <span>Sydney home concierge</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
