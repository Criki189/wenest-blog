/**
 * Wenest blog — fully automatic publisher.
 *
 * One run = one article, start to finish, with no human input:
 *   1. Pick a random Wenest service + a weighted-random content bucket.
 *   2. Ask Claude to INVENT the topic (title, keyword, brief…) for that combo,
 *      avoiding anything already published or blacklisted.
 *   3. Generate the full article with the existing system prompt.
 *   4. Force status=published, stamp the date, attach a cover image.
 *   5. Validate against the blog's own Zod schema. Invalid → do NOT publish.
 *   6. Commit + push to main (Vercel redeploys) — only in --publish mode.
 *   7. Telegram a notification (published / failed).
 *
 * Modes:
 *   --dry-run   (default) generate + validate into scripts/.preview/, never git.
 *   --publish   write to content/blog/, commit + push to main.
 *   --notify    in dry-run, still send a (clearly-labelled TEST) Telegram ping.
 *   --service=<id> / --bucket=<slug>   force a choice instead of random.
 *
 * Secrets come from the environment. If ANTHROPIC_API_KEY is not already set,
 * the script loads ../agents/.env (the same file the GTM agents use), so the
 * Telegram bot + Anthropic key are shared and you never re-enter them.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync, execFileSync } from "node:child_process";
import matter from "gray-matter";
import { FrontmatterSchema } from "../lib/content";
import { BUCKETS } from "../lib/buckets";
import { absoluteBlogUrl } from "../lib/site";
import {
  MODEL,
  WORD_COUNT_MIN,
  WORD_COUNT_MAX,
  SERVICES,
  BUCKET_WEIGHTS,
  COVER_POOL,
  type Service,
} from "./auto-blog.config";

const REPO = process.cwd();
const POSTS_DIR = path.join(REPO, "content", "blog");
const PREVIEW_DIR = path.join(REPO, "scripts", ".preview");
const PROMPT_FILE = path.join(REPO, "prompts", "article-system-prompt.md");
const BLACKLIST_FILE = path.join(REPO, "memory", "topic-blacklist.md");

// ---------------------------------------------------------------------------
// args + env
// ---------------------------------------------------------------------------
const ARGV = process.argv.slice(2);
const has = (flag: string) => ARGV.includes(flag);
const opt = (name: string) => {
  const f = `--${name}=`;
  const found = ARGV.find((a) => a.startsWith(f));
  return found ? found.slice(f.length) : undefined;
};
const PUBLISH = has("--publish");
const DRY_RUN = !PUBLISH;
const FORCE_NOTIFY = has("--notify");

function loadAgentsEnv() {
  if (process.env.ANTHROPIC_API_KEY) return; // already provided by the shell
  const envPath = path.join(REPO, "..", "agents", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadAgentsEnv();

const today = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// small utilities
// ---------------------------------------------------------------------------
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function weightedBucket(): string {
  const entries = Object.entries(BUCKET_WEIGHTS);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [slug, w] of entries) {
    r -= w;
    if (r <= 0) return slug;
  }
  return entries[0][0];
}

const bucketName = (slug: string) => BUCKETS.find((b) => b.slug === slug)?.name ?? slug;
const bucketBlurb = (slug: string) => BUCKETS.find((b) => b.slug === slug)?.blurb ?? "";

async function telegram(text: string, level: "ok" | "warn" | "error" | "info" = "info") {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    console.error("[telegram] skipped (no TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)");
    return;
  }
  const icon = { ok: "✅ ", warn: "⚠️ ", error: "🛑 ", info: "" }[level];
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `${icon}${text}`.slice(0, 4096),
        disable_web_page_preview: true,
      }),
    });
    if (!r.ok) console.error(`[telegram] failed: HTTP ${r.status}`);
  } catch (e) {
    console.error(`[telegram] failed (non-fatal): ${(e as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// Claude
// ---------------------------------------------------------------------------
// Sin `temperature`: claude-fable-5 rechaza los parámetros de sampling (HTTP 400).
type ClaudeOpts = { system?: string; user: string; maxTokens: number };

/**
 * Two backends, picked automatically:
 *  - If ANTHROPIC_API_KEY is set → call the Anthropic API directly (model-pinned).
 *  - Otherwise → shell out to the Claude Code CLI (`claude -p`), which uses the
 *    already-authenticated session. No API key required. This is the default
 *    here because agents/.env ships ANTHROPIC_API_KEY empty.
 */
async function claude(opts: ClaudeOpts): Promise<string> {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  return key ? claudeApi(opts, key) : claudeCli(opts);
}

async function claudeApi(opts: ClaudeOpts, key: string): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: opts.maxTokens,
    messages: [{ role: "user", content: opts.user }],
  };
  if (opts.system) body.system = opts.system;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Anthropic API HTTP ${r.status}: ${errText.slice(0, 500)}`);
  }
  const data: any = await r.json();
  const text = (data.content ?? [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("Anthropic returned an empty response");
  return text;
}

function claudeCli(opts: ClaudeOpts): string {
  // Combine system + user into one print-mode prompt fed via stdin (avoids ARG_MAX).
  const prompt = (opts.system ? `${opts.system}\n\n----- TASK -----\n\n` : "") + opts.user;
  try {
    // --mcp-config '{"mcpServers":{}}' + --strict-mcp-config disables every MCP
    // server (their startup made a bare `claude -p` time out). --max-turns 6
    // leaves room for the prompt's built-in self-check/revise step (a cap of 1
    // errors out with "Reached max turns"). cwd=tmp keeps generation isolated
    // from the repo (no project CLAUDE.md, no chance of touching files).
    const out = execFileSync(
      "claude",
      ["-p", "--model", MODEL, "--mcp-config", '{"mcpServers":{}}', "--strict-mcp-config", "--max-turns", "6"],
      {
        input: prompt,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
        timeout: 540_000,
        cwd: os.tmpdir(),
      }
    );
    const text = out.trim();
    if (!text) throw new Error("claude CLI returned empty output");
    return text;
  } catch (e: any) {
    const stderr = e?.stderr ? `\n${String(e.stderr).slice(0, 300)}` : "";
    throw new Error(`claude CLI failed: ${e?.message ?? e}${stderr}`);
  }
}

// ---------------------------------------------------------------------------
// topic generation
// ---------------------------------------------------------------------------
type Topic = {
  title: string;
  slug: string;
  primary_keyword: string;
  secondary_keywords: string[];
  search_intent: "informational" | "commercial";
  target_word_count: number;
  brief: string;
  cover_image_query: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

function existingSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
}

function existingTitles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf8");
      return String(matter(raw).data.title ?? "");
    })
    .filter(Boolean);
}

function extractJson(text: string): any {
  let t = text.trim();
  if (t.startsWith("```")) t = t.replace(/^```[a-z]*\n/i, "").replace(/```\s*$/, "").trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error(`No JSON object found in:\n${text.slice(0, 300)}`);
  return JSON.parse(t.slice(first, last + 1));
}

async function generateTopic(service: Service, bucket: string): Promise<Topic> {
  const wordCount = WORD_COUNT_MIN + Math.round(Math.random() * (WORD_COUNT_MAX - WORD_COUNT_MIN));
  const blacklist = fs.existsSync(BLACKLIST_FILE) ? fs.readFileSync(BLACKLIST_FILE, "utf8") : "";
  const taken = existingTitles();

  const bodyRule = service.personalCare
    ? `Wenest also offers at-home personal-care services (beauty, haircut, massage). For THIS topic, frame everything around the at-home SERVICE — convenience for busy households, what to expect from a mobile visit, how Wenest vets the professional, scheduling — NOT skincare/hair/health tips and NOT medical advice.`
    : `We do HOME operations, never body/wellness.`;
  const system = `You are the SEO content strategist for Wenest, a premium home-maintenance concierge in Sydney, Australia. You pick blog topics that rank on Google AU for busy homeowners (the "Sarah" persona) and build trust toward a Wenest membership. Australian English. ${bodyRule} Never name competitors.`;

  const pcFraming = service.personalCare
    ? `\n\nIMPORTANT framing: ${service.label} is an at-home personal-care SERVICE. The topic must be about the SERVICE experience (booking a mobile ${service.label} in Sydney, what to expect, vetting, convenience for busy people), NOT a wellness/skincare/hair-routine guide and NOT health advice.`
    : "";

  const user = `Propose ONE fresh blog topic.

Service focus: ${service.label} (Wenest service page: ${service.path})${pcFraming}
Content bucket: "${bucket}" — ${bucketName(bucket)} (${bucketBlurb(bucket)})
Target length: about ${wordCount} words.

Already published (do NOT duplicate or closely overlap these titles):
${taken.length ? taken.map((t) => `- ${t}`).join("\n") : "- (none yet)"}

Hard rules (from the editorial blacklist):
${blacklist || "- No pure wellness, no competitor comparisons, no medical/legal advice without disclaimers."}

Return ONLY a JSON object, no prose, with exactly these keys:
{
  "title": "specific, search-led article title (Australian English)",
  "slug": "kebab-case-url-slug-derived-from-the-primary-keyword",
  "primary_keyword": "the single keyword this article targets on Google AU",
  "secondary_keywords": ["2 to 4 related keywords"],
  "search_intent": "informational" | "commercial",
  "target_word_count": ${wordCount},
  "brief": "2-3 sentences: the reader's situation, the angle, and what the article should cover. Concrete and Sydney-specific.",
  "cover_image_query": "3-5 photographic search terms for the cover, no brand names"
}`;

  const raw = await claude({ system, user, maxTokens: 1024 });
  const j = extractJson(raw);
  const topic: Topic = {
    title: String(j.title || "").trim(),
    slug: slugify(String(j.slug || j.primary_keyword || j.title || "")),
    primary_keyword: String(j.primary_keyword || "").trim(),
    secondary_keywords: Array.isArray(j.secondary_keywords) ? j.secondary_keywords.map(String) : [],
    search_intent: j.search_intent === "commercial" ? "commercial" : "informational",
    target_word_count: Number(j.target_word_count) || wordCount,
    brief: String(j.brief || "").trim(),
    cover_image_query: String(j.cover_image_query || service.label).trim(),
  };
  if (!topic.title || !topic.slug || !topic.primary_keyword) {
    throw new Error(`Topic JSON missing required fields: ${JSON.stringify(j).slice(0, 200)}`);
  }
  return topic;
}

async function pickTopic(service: Service, bucket: string): Promise<Topic> {
  const taken = new Set(existingSlugs());
  for (let attempt = 1; attempt <= 3; attempt++) {
    const topic = await generateTopic(service, bucket);
    if (!taken.has(topic.slug)) return topic;
    console.error(`[topic] slug "${topic.slug}" already exists, retrying (${attempt}/3)`);
  }
  throw new Error("Could not produce a non-duplicate topic after 3 attempts");
}

// ---------------------------------------------------------------------------
// cover image
// ---------------------------------------------------------------------------
async function pickCover(service: Service, query: string): Promise<string> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (key) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query + " Sydney home"
      )}&per_page=1&orientation=landscape&content_filter=high`;
      const r = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
      if (r.ok) {
        const data: any = await r.json();
        const first = data?.results?.[0];
        if (first?.urls?.regular) return first.urls.regular;
      }
    } catch (e) {
      console.error(`[cover] Unsplash lookup failed, using fallback: ${(e as Error).message}`);
    }
  }
  const pool = COVER_POOL[service.coverTheme] ?? COVER_POOL.general;
  return pick(pool);
}

// ---------------------------------------------------------------------------
// article generation
// ---------------------------------------------------------------------------
function renderSystemPrompt(topic: Topic, coverUrl: string, coverAlt: string, internalLinks: string[]): string {
  const template = fs.readFileSync(PROMPT_FILE, "utf8");
  const vars: Record<string, string> = {
    TITLE: topic.title,
    SLUG: topic.slug,
    PRIMARY_KEYWORD: topic.primary_keyword,
    SECONDARY_KEYWORDS: topic.secondary_keywords.join("; "),
    BUCKET: "{{BUCKET}}", // replaced below with the real bucket
    TARGET_WORD_COUNT: String(topic.target_word_count),
    SEARCH_INTENT: topic.search_intent,
    BRIEF: topic.brief,
    TODAY_DATE: today,
    AVAILABLE_INTERNAL_LINKS: JSON.stringify(internalLinks),
    COVER_IMAGE_URL: coverUrl,
    COVER_IMAGE_ALT: coverAlt,
  };
  let out = template;
  for (const [k, v] of Object.entries(vars)) out = out.split(`{{${k}}}`).join(v);
  return out;
}

function buildInternalLinks(service: Service): string[] {
  // /membership is a 308 redirect to /pricing, and the landing's /services/*
  // pages (service.path) currently return 404 — only link to live URLs.
  void service;
  const links = ["/", "/pricing"];
  const blogSlugs = existingSlugs();
  // up to 3 existing articles for cross-linking
  for (const slug of blogSlugs.sort(() => Math.random() - 0.5).slice(0, 3)) {
    links.push(`/blog/${slug}`);
  }
  return Array.from(new Set(links));
}

function stripFences(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) t = t.replace(/^```[a-z]*\n/i, "").replace(/```\s*$/, "").trim();
  return t;
}

type BuiltArticle = { markdown: string; data: Record<string, any> };

async function generateArticle(
  topic: Topic,
  service: Service,
  bucket: string,
  coverUrl: string,
  internalLinks: string[]
): Promise<BuiltArticle> {
  const coverAlt = `${topic.primary_keyword} — Sydney home`;
  let system = renderSystemPrompt(topic, coverUrl, coverAlt, internalLinks);
  system = system.split("{{BUCKET}}").join(bucket);
  if (service.personalCare) {
    system += `\n\n## APPROVED CATEGORY OVERRIDE\n${service.label} is an APPROVED Wenest at-home service. Do NOT refuse this topic as off-brand wellness. Write about the at-home SERVICE experience — convenience for busy Sydney households, what to expect from a mobile visit, how Wenest vets and coordinates the professional, scheduling, typical AUD price ranges. Keep Wenest's calm concierge voice. Do NOT give medical, dermatological, cosmetic-health or treatment advice; for anything health-related, defer to a qualified professional.`;
  }

  const raw = await claude({
    system,
    user: "Generate the article now.",
    maxTokens: 8000,
  });
  let article = stripFences(raw);
  // Drop any preamble before the frontmatter, and a stray trailing code fence.
  const fmStart = article.indexOf("---");
  if (fmStart > 0) article = article.slice(fmStart);
  article = article.replace(/\n```\s*$/, "").trim();
  if (article.includes("CLARIFICATION_NEEDED")) {
    throw new Error(`Claude asked for clarification instead of writing: ${article.slice(0, 200)}`);
  }

  const parsed = matter(article);
  const data = parsed.data as Record<string, any>;

  // Force the fields that make this a real, published, valid post.
  data.slug = topic.slug;
  data.bucket = bucket;
  data.status = "published";
  data.published_date = today;
  data.last_updated = today;
  data.author = "Wenest";
  data.cover_image = coverUrl;
  if (!data.cover_image_alt || String(data.cover_image_alt).length < 3) data.cover_image_alt = coverAlt;
  data.target_word_count = Number(data.target_word_count) || topic.target_word_count;
  if (!data.internal_links || !Array.isArray(data.internal_links) || data.internal_links.length === 0) {
    data.internal_links = ["/pricing", "/"];
  }

  const markdown = matter.stringify(parsed.content, data);
  return { markdown, data };
}

// ---------------------------------------------------------------------------
// validate + write
// ---------------------------------------------------------------------------
function validate(data: Record<string, any>, slug: string): string[] {
  const result = FrontmatterSchema.safeParse(data);
  const errors: string[] = [];
  if (!result.success) {
    for (const issue of result.error.issues) errors.push(`${issue.path.join(".")}: ${issue.message}`);
  } else if (result.data.slug !== slug) {
    errors.push(`slug "${result.data.slug}" must match filename "${slug}"`);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// git publish
// ---------------------------------------------------------------------------
// Poll the live URL until the new post answers 200 (Vercel deploy finished).
// Cache-buster query + no-cache header so a CDN-cached 404 can't fool us.
async function waitForLive(url: string, timeoutMs = 10 * 60_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${url}?cb=${Date.now()}`, {
        headers: { "cache-control": "no-cache" },
        redirect: "follow",
      });
      if (r.ok) return true;
    } catch {
      // network blip — keep polling
    }
    await new Promise((res) => setTimeout(res, 15_000));
  }
  return false;
}

function gitPublish(slug: string, title: string) {
  const sh = (cmd: string) => execSync(cmd, { cwd: REPO, stdio: "pipe" }).toString().trim();
  sh("git checkout main");
  sh("git pull --ff-only");
  sh(`git add "content/blog/${slug}.md"`);
  sh(`git commit -m "Auto: ${title.replace(/"/g, "'")}"`);
  sh("git push origin main");
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  // 1. choose service + bucket
  const eligible = SERVICES.filter((s) => s.blogEligible);
  const forcedService = opt("service");
  const service = forcedService ? eligible.find((s) => s.id === forcedService) : pick(eligible);
  if (!service) throw new Error(`Unknown or non-eligible service "${forcedService}"`);
  const bucket = opt("bucket") || weightedBucket();

  console.log(`[plan] service=${service.id} (${service.label}) · bucket=${bucket} · mode=${PUBLISH ? "PUBLISH" : "dry-run"} · model=${MODEL}`);

  // 2. invent the topic
  const topic = await pickTopic(service, bucket);
  console.log(`[topic] "${topic.title}" → ${topic.slug}`);

  // 3. cover + internal links
  const coverUrl = await pickCover(service, topic.cover_image_query);
  const internalLinks = buildInternalLinks(service);

  // 4. write the article (retry once if it fails validation)
  let built: BuiltArticle | null = null;
  let lastErrors: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const candidate = await generateArticle(topic, service, bucket, coverUrl, internalLinks);
    const errors = validate(candidate.data, topic.slug);
    if (errors.length === 0) {
      built = candidate;
      break;
    }
    lastErrors = errors;
    console.error(`[validate] attempt ${attempt} failed:\n  ${errors.join("\n  ")}`);
  }
  if (!built) {
    await telegram(`Blog: generación falló la validación para "${topic.title}". No se publica.\n${lastErrors.join("; ")}`, "error");
    throw new Error(`Validation failed:\n${lastErrors.join("\n")}`);
  }

  // 5. write to disk
  const outDir = PUBLISH ? POSTS_DIR : PREVIEW_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${topic.slug}.md`);
  fs.writeFileSync(outFile, built.markdown, "utf8");
  console.log(`[write] ${outFile}`);

  // 6. publish or stop
  const liveUrl = absoluteBlogUrl(`/${topic.slug}`);
  if (PUBLISH) {
    gitPublish(topic.slug, built.data.title || topic.title);
    // Vercel takes ~1-3 min to build after the push. Notifying immediately
    // hands out a link that 404s until the deploy finishes — wait for the
    // post to answer 200 on the live domain before sending the link.
    console.log(`[deploy] waiting for ${liveUrl} to go live…`);
    const live = await waitForLive(liveUrl);
    if (live) {
      await telegram(`Blog publicado: "${built.data.title}"\n${liveUrl}\nServicio: ${service.label} · ${bucketName(bucket)}`, "ok");
    } else {
      await telegram(`Blog: el post "${built.data.title}" se subió (commit en main) pero ${liveUrl} sigue sin responder tras 10 min. El deploy de Vercel puede haber fallado — revísalo.`, "warn");
    }
    console.log(`[done] published → ${liveUrl}`);
  } else {
    console.log(`[dry-run] article generated + validated. Would publish at: ${liveUrl}`);
    console.log(`[dry-run] preview file: ${outFile}`);
    if (FORCE_NOTIFY) {
      await telegram(`(TEST) Blog dry-run OK: "${built.data.title}"\nSe publicaría en: ${liveUrl}\nServicio: ${service.label} · ${bucketName(bucket)}`, "info");
    }
  }
}

main().catch(async (e) => {
  console.error(e);
  await telegram(`Blog: fallo en la generación automática.\n${(e as Error).message}`.slice(0, 1000), "error");
  process.exit(1);
});
