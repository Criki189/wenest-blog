# Auto-publisher — the fully automatic blog

This turns the Wenest blog from "n8n drafts a PR, Cristian reviews + merges by
hand" into **one command that invents a topic, writes the article, and publishes
it live** — with a Telegram ping every time, and a hard stop if anything looks
wrong. No Airtable, no manual topic list, no PR review.

## What one run does

1. **Picks a service at random** from `auto-blog.config.ts` (all 16 home
   services — plumbing, electrical, cleaning, pool, gardening, moving, pet care…).
   Body/wellness services (haircut, beauty, massage) are excluded by default
   because the blog's rule is "we do home, not body".
2. **Picks a content bucket** (how-to, problems, seasonal…) by weighted random,
   matching the editorial mix in the blog `CLAUDE.md` §4.
3. **Asks Claude to invent the topic** (title, keyword, brief) for that combo,
   avoiding anything already published or on the topic blacklist.
4. **Writes the full article** using the existing `prompts/article-system-prompt.md`.
5. **Forces** `status: published` + today's date + a working cover image.
6. **Validates** against the blog's own Zod schema (`lib/content.ts`).
   If it fails, **nothing is published** — you just get a Telegram alert.
7. **Commits + pushes to `main`** → Vercel redeploys → the post is live at
   `https://www.wenest.com.au/blog/<slug>` within a minute.
8. **Telegram**: "Blog publicado: …" with the live link (or an error alert).

## Try it without publishing

```bash
cd wenest-blog
bash scripts/run-auto-publish.sh --dry-run          # generate + validate only
# or, to also get a TEST Telegram message:
npx tsx scripts/auto-publish.ts --dry-run --notify
```

The generated article lands in `scripts/.preview/<slug>.md` (git-ignored) so you
can read it. Nothing touches `content/blog/` or git.

Force a specific service/bucket while testing:

```bash
npx tsx scripts/auto-publish.ts --dry-run --service=pool --bucket=seasonal
```

## Go live (publish for real)

```bash
bash scripts/run-auto-publish.sh        # writes to content/blog, commits, pushes main
```

## Put it on a schedule (Mon/Wed/Fri, 10:00 local)

Only after you're happy with a few dry-runs:

```bash
cp scripts/com.wenest.blog.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.wenest.blog.plist
```

To stop it: `launchctl unload ~/Library/LaunchAgents/com.wenest.blog.plist`.
Logs: `/tmp/wenest-blog.log` and `/tmp/wenest-blog.err`. The Mac must be on at
that time (same model as the GTM agents' `com.wenest.agents` job).

## How articles get written (two backends, picked automatically)

- **Default — the Claude Code CLI.** If no `ANTHROPIC_API_KEY` is set, the
  script shells out to `claude -p` (using your already-authenticated Claude Code
  session). No API key, no extra cost beyond your Claude subscription. It runs
  the CLI with MCP servers disabled and a single turn, so it's fast (~2-3 min for
  a full article) and headless-safe.
- **Optional — the Anthropic API.** If you paste a real key into `../agents/.env`
  as `ANTHROPIC_API_KEY=sk-ant-…`, the script uses the API instead (model pinned
  to `claude-sonnet-4-6`, ~$0.05–$0.15/article). Slightly faster and fully
  deterministic — nice-to-have, not required.

## Where the keys come from

The script reads `../agents/.env` (the same file the GTM agents use) for:

- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — the same bot you already use (required for alerts).
- `ANTHROPIC_API_KEY` — **optional** (see above; empty by default → CLI is used).
- `UNSPLASH_ACCESS_KEY` — **optional**. If absent, covers come from a small
  pool of verified images in `auto-blog.config.ts`. Add a free Unsplash key and
  covers become topic-specific automatically.

## Tuning (pure data edits, no code)

Everything you'd want to change lives in `auto-blog.config.ts`:

- **Which services** the blog covers (and the off-by-default wellness ones).
- **Bucket mix** (`BUCKET_WEIGHTS`).
- **Model** (`MODEL`), **length** (`WORD_COUNT_MIN/MAX`).
- **Cover image pool**.

Cadence (how often) lives in `com.wenest.blog.plist` — add/remove
`<dict>` blocks for more or fewer days.

## Relationship to the old n8n flow

`n8n/wenest-blog-publisher.json` is the previous semi-automatic pipeline
(Airtable → Claude → GitHub **PR** for manual review). It still works if you
ever want a human-in-the-loop draft, but this script is the fully automatic
replacement and does **not** need n8n, Airtable, or a Ghost API key.

> Note: older docs (`CLAUDE.md` §10, `memory/decisions.md`) say the live blog is
> Ghost at `blog.wenest.com.au`. That is **stale** — `blog.wenest.com.au` returns
> 404. The live blog is this Next.js app on Vercel, served at
> `www.wenest.com.au/blog`. Publishing = commit to `main`.
