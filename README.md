# wenest-blog

Next.js blog for **Wenest** — published at `wenest.com.au/blog`.

A SEO-first, markdown-driven blog ready to receive automated articles from n8n.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 3** with the Wenest design tokens (Fraunces + Inter, warm beige palette)
- **Markdown** content in `content/blog/` parsed with `gray-matter` + `remark`/`rehype`
- **Vercel** deploy target
- **Dynamic OG images** via `next/og`
- **Sitemap** + **robots.txt** generated automatically

## Routes

| Path | What |
|---|---|
| `/blog` | Article index with featured post + category filter |
| `/blog/[slug]` | Article page with cover image, JSON-LD `Article` schema, related posts |
| `/blog/category/[category]` | Category archive |
| `/sitemap.xml` | Auto-generated sitemap |
| `/robots.txt` | Auto-generated |
| `/api/posts` | `POST` endpoint for n8n to publish new articles |

## Local development

```bash
npm install
cp .env.example .env.local   # set N8N_PUBLISH_TOKEN
npm run dev
```

Visit `http://localhost:3000/blog`.

## Adding articles

Drop a markdown file into `content/blog/<slug>.md` with frontmatter (see `CLAUDE.md` §7). Only `status: approved` or `status: published` are visible in production.

## Automated publishing from n8n

Set `N8N_PUBLISH_TOKEN` in Vercel env vars, then have n8n call:

```http
POST https://wenest.com.au/api/posts
Authorization: Bearer <N8N_PUBLISH_TOKEN>
Content-Type: application/json

{
  "title": "How to unblock a Sydney kitchen sink",
  "slug": "unblock-sink",                          // optional, derived from title
  "description": "Five proven fixes...",
  "frontmatter": {
    "category": "how-to",
    "primary_keyword": "unblock sink",
    "cover_image": "https://.../cover.jpg",
    "cover_image_alt": "Hand using plunger on sink"
  },
  "markdown": "## Step 1\n\nBoil a kettle..."
}
```

The handler writes the file to `content/blog/<slug>.md`, sets `status: approved`, and revalidates `/blog` and `/blog/<slug>`.

> Note: on Vercel, the filesystem is read-only at runtime. For full automation, n8n should commit the markdown to GitHub instead — Vercel auto-deploys on push. The `/api/posts` route is useful for self-hosted deploys or as a webhook trigger.

## Deploying to wenest.com.au/blog

Two options:

**A. Standalone Vercel deploy on `wenest.com.au` apex (Next app owns everything).**
Leave `next.config.ts` `basePath` commented out. The root `/` redirects to `/blog`.

**B. Mount this app under `/blog` of the existing Wenest site.**
Use Vercel's [path-based rewrites](https://vercel.com/docs/edge-network/rewrites) on the parent project to forward `/blog/*` to this deployment. Optionally enable `basePath: "/blog"` in `next.config.ts`.

## SEO checklist (per article)

- ✅ unique `title` + `description` (140-155 chars)
- ✅ `primary_keyword` in title, description, slug, first paragraph
- ✅ canonical URL via `alternates.canonical`
- ✅ JSON-LD `Article` schema injected
- ✅ Open Graph + Twitter card with cover image
- ✅ auto-generated dynamic OG image as fallback
- ✅ included in `sitemap.xml`

## Editorial rules

See `CLAUDE.md`. Tl;dr: trust-first voice, Australian English, six content buckets, FAQ + soft CTA in every piece.

## Owner

Cristian Villalon · christian.villalon.wz@gmail.com
