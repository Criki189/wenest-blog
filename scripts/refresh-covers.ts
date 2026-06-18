/**
 * Wenest blog — cover-image refresher.
 *
 * Re-fetches a topic-specific Unsplash cover for every published article and
 * GUARANTEES no two posts share the same image (global de-dup). Use it whenever
 * covers start repeating (e.g. after a spell where UNSPLASH_ACCESS_KEY was unset
 * and the tiny fallback pool got reused across posts).
 *
 * For each post it searches Unsplash with the post's own photographic query
 * (cover_image_prompt → primary_keyword → title), then picks the first result
 * whose image hasn't already been assigned in this run.
 *
 * Needs UNSPLASH_ACCESS_KEY (read from ../agents/.env if not already in the env).
 *
 *   npx tsx scripts/refresh-covers.ts --dry-run   # show the plan, write nothing
 *   npx tsx scripts/refresh-covers.ts             # rewrite cover_image in place
 *
 * It only edits frontmatter (cover_image, and cover_image_alt when missing).
 * Commit + push afterwards so Vercel redeploys.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const REPO = process.cwd();
const POSTS_DIR = path.join(REPO, "content", "blog");
const DRY_RUN = process.argv.slice(2).includes("--dry-run");

function loadAgentsEnv() {
  if (process.env.UNSPLASH_ACCESS_KEY) return;
  const envPath = path.join(REPO, "..", "agents", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadAgentsEnv();

const KEY = (process.env.UNSPLASH_ACCESS_KEY || "").trim();
if (!KEY) {
  console.error("UNSPLASH_ACCESS_KEY is not set (checked the env and ../agents/.env). Aborting.");
  process.exit(1);
}

// Stable identity of an Unsplash image, shared by saved cover URLs and fresh
// search results — both look like .../photo-1556909114-f6e7ad7d3136?...
const coverKey = (url: string): string => (/photo-[a-zA-Z0-9_-]+/.exec(url || "")?.[0] ?? url ?? "");

type Photo = { urls?: { regular?: string }; alt_description?: string | null };

async function search(query: string): Promise<Photo[]> {
  const url =
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
    `&per_page=15&orientation=landscape&content_filter=high`;
  const r = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } });
  if (!r.ok) {
    console.error(`  [unsplash] HTTP ${r.status} for "${query}"`);
    return [];
  }
  const data: any = await r.json();
  return Array.isArray(data?.results) ? data.results : [];
}

// Queries to try in order: the post's photographic prompt first (best match),
// then progressively simpler fallbacks so a too-specific prompt that returns
// nothing on Unsplash still ends up with a relevant image.
function postQueries(data: Record<string, any>): string[] {
  const out: string[] = [];
  const prompt = String(data.cover_image_prompt || "").trim();
  if (prompt.length > 3) out.push(prompt);
  const kw = String(data.primary_keyword || "").trim();
  if (kw) {
    out.push(`${kw} home`);
    out.push(kw);
  }
  const title = String(data.title || "").trim();
  if (title) out.push(title);
  return out.length ? out : ["Australian home"];
}

async function main() {
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const used = new Set<string>();
  const changes: Array<{ file: string; from: string; to: string; query: string }> = [];

  for (const file of files) {
    const full = path.join(POSTS_DIR, file);
    const parsed = matter(fs.readFileSync(full, "utf8"));
    const data = parsed.data as Record<string, any>;
    const before = String(data.cover_image || "");
    const queries = postQueries(data);

    // Try each query until one yields an image not already taken this run.
    let chosen: Photo | undefined;
    let query = queries[0];
    for (const q of queries) {
      const results = await search(q);
      chosen = results.find((p) => p.urls?.regular && !used.has(coverKey(p.urls.regular)));
      if (chosen) {
        query = q;
        break;
      }
    }
    if (!chosen) {
      console.error(`  [skip] ${file}: no fresh image for "${query}" (keeping ${coverKey(before) || "current"})`);
      if (before) used.add(coverKey(before));
      continue;
    }
    const newUrl = chosen.urls!.regular!;
    used.add(coverKey(newUrl));

    data.cover_image = newUrl;
    if (!data.cover_image_alt || String(data.cover_image_alt).length < 3) {
      data.cover_image_alt =
        (chosen.alt_description && String(chosen.alt_description).trim()) ||
        `${data.primary_keyword || "Wenest"} — Sydney home`;
    }

    changes.push({ file, from: coverKey(before), to: coverKey(newUrl), query });
    if (!DRY_RUN) fs.writeFileSync(full, matter.stringify(parsed.content, data), "utf8");
  }

  console.log(`\n${DRY_RUN ? "[dry-run] " : ""}Cover plan (${changes.length} posts):`);
  for (const c of changes) {
    const same = c.from === c.to ? " (unchanged)" : "";
    console.log(`  ${c.file}\n    query: ${c.query}\n    ${c.from || "(none)"} → ${c.to}${same}`);
  }
  const uniqueAfter = new Set(changes.map((c) => c.to));
  console.log(`\nDistinct covers after run: ${uniqueAfter.size} across ${changes.length} updated posts.`);
  if (DRY_RUN) console.log("[dry-run] nothing was written. Re-run without --dry-run to apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
