import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import { z } from "zod";
import { BUCKET_SLUGS } from "./buckets";

export const POSTS_DIR = path.join(process.cwd(), "content", "blog");

const isoString = z
  .string()
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), {
    message: "must be ISO date string or empty",
  });

export const FaqItemSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(3),
});

export const BodyImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
});

export const FrontmatterSchema = z
  .object({
    title: z.string().min(5),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be kebab-case"),
    description: z
      .string()
      .min(120)
      .max(165, "description should be 140-155 chars (max 165)"),
    primary_keyword: z.string().min(2),
    secondary_keywords: z.array(z.string()).default([]),
    bucket: z.enum(BUCKET_SLUGS),
    status: z.enum(["draft", "review", "approved", "published"]),
    target_word_count: z.number().int().positive(),
    internal_links: z.array(z.string()).default([]),
    schema_type: z.string().default("Article"),
    faq: z.boolean().default(false),
    faq_items: z.array(FaqItemSchema).default([]),
    cover_image: z
      .string()
      .min(1)
      .default("https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80"),
    cover_image_alt: z.string().min(3).default("Sydney home interior"),
    body_images: z.array(BodyImageSchema).default([]),
    author: z.string().default("Wenest"),
    published_date: isoString.default(""),
    last_updated: isoString.default(""),
  })
  .superRefine((d, ctx) => {
    if (d.faq && d.faq_items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "faq_items is required when faq=true",
        path: ["faq_items"],
      });
    }
    if (d.status === "published" && !d.published_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "published_date required when status=published",
        path: ["published_date"],
      });
    }
  });

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

export type Article = {
  frontmatter: Frontmatter;
  slug: string;
  html: string;
  readingMinutes: number;
  toc: { id: string; text: string }[];
};

const SHOW_DRAFTS =
  process.env.NEXT_PUBLIC_SHOW_DRAFTS === "1" ||
  process.env.NODE_ENV !== "production";

const ensureDir = () => {
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
};

export function getAllSlugs(): string[] {
  ensureDir();
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

async function renderMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["heading-anchor"], ariaLabel: "Permalink" },
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(file);
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

function extractToc(markdown: string) {
  const lines = markdown.split("\n");
  const out: { id: string; text: string }[] = [];
  for (const line of lines) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) out.push({ id: slugify(m[1]), text: m[1] });
  }
  return out;
}

function isVisible(fm: Frontmatter) {
  if (SHOW_DRAFTS) return true;
  return fm.status === "published";
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  ensureDir();
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const parsed = FrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[content] Invalid frontmatter in ${slug}.md`, parsed.error.format());
    }
    return null;
  }
  if (!isVisible(parsed.data)) return null;
  const html = await renderMarkdown(content);
  const stats = readingTime(content);
  return {
    frontmatter: parsed.data,
    slug: parsed.data.slug,
    html,
    readingMinutes: Math.max(1, Math.round(stats.minutes)),
    toc: extractToc(content),
  };
}

export async function getAllArticles(): Promise<Article[]> {
  const slugs = getAllSlugs();
  const all = await Promise.all(slugs.map((s) => getArticleBySlug(s)));
  return all
    .filter((a): a is Article => !!a)
    .sort((a, b) => {
      const da = a.frontmatter.published_date || a.frontmatter.last_updated;
      const db = b.frontmatter.published_date || b.frontmatter.last_updated;
      return db.localeCompare(da);
    });
}

export async function getArticlesByBucket(bucket: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all.filter((a) => a.frontmatter.bucket === bucket);
}

export async function getRelatedArticles(
  current: Article,
  limit = 3
): Promise<Article[]> {
  const all = await getAllArticles();
  return all
    .filter(
      (a) =>
        a.slug !== current.slug &&
        a.frontmatter.bucket === current.frontmatter.bucket
    )
    .slice(0, limit);
}

export async function getSearchIndex() {
  const all = await getAllArticles();
  return all.map((a) => ({
    slug: a.slug,
    title: a.frontmatter.title,
    description: a.frontmatter.description,
    bucket: a.frontmatter.bucket,
  }));
}
