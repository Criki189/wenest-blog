import fs from "node:fs";
import path from "node:path";
import { BUCKET_SLUGS } from "../lib/buckets";

function arg(name: string) {
  const flag = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(flag));
  return found ? found.slice(flag.length) : undefined;
}

const slug = arg("slug");
const bucket = arg("bucket") || "how-to";

if (!slug) {
  console.error("usage: npm run new-post -- --slug=my-slug --bucket=how-to");
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`slug must be kebab-case (got "${slug}")`);
  process.exit(1);
}
if (!BUCKET_SLUGS.includes(bucket as (typeof BUCKET_SLUGS)[number])) {
  console.error(`bucket must be one of: ${BUCKET_SLUGS.join(", ")}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const title = slug
  .split("-")
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(" ");

const fm = `---
title: "${title}"
slug: "${slug}"
description: "TODO 140-155 character meta description for ${title}, including the primary keyword naturally."
primary_keyword: "TODO"
secondary_keywords: []
bucket: "${bucket}"
status: "draft"
target_word_count: 1500
internal_links: []
schema_type: "Article"
faq: false
faq_items: []
cover_image: "/images/blog/${slug}/cover.jpg"
cover_image_alt: "TODO descriptive alt text"
body_images: []
author: "Wenest"
published_date: ""
last_updated: "${today}"
---

## Hook

TODO write the opening hook — the specific moment the reader is in.

## Promise

TODO one sentence: what they'll know by the end.

## Body

TODO H2 sections.

## The Wenest take

TODO our perspective.
`;

const target = path.join(process.cwd(), "content", "blog", `${slug}.md`);
if (fs.existsSync(target)) {
  console.error(`refusing to overwrite ${target}`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, fm, "utf8");

const imgDir = path.join(process.cwd(), "public", "images", "blog", slug);
fs.mkdirSync(imgDir, { recursive: true });

console.log(`✓ created ${target}`);
console.log(`  cover image expected at public/images/blog/${slug}/cover.jpg`);
