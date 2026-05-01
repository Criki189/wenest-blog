import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { FrontmatterSchema } from "../lib/content";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log(`[validate-content] no content/blog directory — skipping.`);
    return;
  }
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.log(`[validate-content] no markdown files — skipping.`);
    return;
  }

  let bad = 0;
  for (const file of files) {
    const full = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data } = matter(raw);
    const slugFromFile = file.replace(/\.md$/, "");
    const result = FrontmatterSchema.safeParse(data);
    if (!result.success) {
      bad++;
      console.error(`\n✗ ${file}`);
      for (const issue of result.error.issues) {
        console.error(`   ${issue.path.join(".")}: ${issue.message}`);
      }
      continue;
    }
    if (result.data.slug !== slugFromFile) {
      bad++;
      console.error(
        `\n✗ ${file}\n   slug "${result.data.slug}" must match filename "${slugFromFile}"`
      );
    }
  }

  if (bad > 0) {
    console.error(`\n${bad} invalid file(s).`);
    process.exit(1);
  }
  console.log(`✓ ${files.length} article(s) validated.`);
}

main();
