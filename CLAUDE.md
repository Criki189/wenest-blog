# Wenest Blog — Project Instructions

> **CORRECTION (2026-06-04):** §10 below is **stale**. The live blog is **NOT
> Ghost** — `blog.wenest.com.au` returns 404. The live blog is **this Next.js
> app on Vercel**, served at `www.wenest.com.au/blog`. **Publishing = commit the
> markdown with `status: published` to `main`; Vercel redeploys.** No Ghost
> Admin API is involved. The fully-automatic publisher lives in
> `scripts/auto-publish.ts` (see `scripts/README-auto-publish.md`).

## Purpose

This folder is the source-of-truth repo for the Wenest blog **and** the deployed blog itself: a Next.js app on Vercel served at `www.wenest.com.au/blog`. (Earlier plans targeted Ghost at `blog.wenest.com.au` — that path was abandoned; see the correction note above and §10.)

What lives here:
- `CLAUDE.md` — this file. Read first by any Claude instance entering the project.
- `README.md` — short orientation for any human (or LLM) opening the repo.
- `memory/` — persistent learnings (keyword performance, brief refinements, decisions).
- `content/` — markdown source of articles (drafts + published).
- (later) `prompts/`, `seo/`, `calendar/`.

## Parent context

This project is a sub-project of **Wenest**, a home maintenance concierge service operating in Australia. Before doing any content work, read the master brief at `/Users/cristianvwz/BusinessAI/WeNest/CLAUDE.md` to understand the business model, positioning, and ideal customer (Sarah persona).

Non-negotiable from the parent doc:
- Brand: **Wenest** (one word, lowercase 'n'). Never "WeNest" or "WENEST" in customer-facing copy.
- Positioning: **Premium concierge / home operations**. NOT a marketplace, NOT a cleaning company, NOT a gig platform.
- Geography: Australia (Sydney first). Currency: AUD. Spelling: Australian English.
- Customer: busy homeowner (30-60), 3+ bedroom home, high time value, family or dual-income, comfortable with tech.

## 1. Editorial mission

> Wenest's blog turns search traffic into trust, and trust into memberships.

Three jobs every article must do:
1. **Rank** — capture organic search intent the Sarah persona has.
2. **Build trust** — make the reader believe Wenest is the most reliable home operator in their suburb.
3. **Educate toward booking** — every article ends with a soft CTA toward a free consult or membership.

If an article doesn't do at least two of these three, kill it.

## 2. Brand voice

**Tone:** Trust-first. Practical. Honest. No hype. Calm authority. Like talking to a senior tradesperson who has been in 1000 Sydney homes and seen everything.

**We sound like:**
- "We've vetted them so you don't have to."
- "Most pool pumps fail in the same three ways. Here's how to spot it before it costs you."
- "Don't pay for emergency callouts you could have avoided."

**We do NOT sound like:**
- Hypey marketing ("revolutionary!", "game-changer!")
- Clickbait ("You won't believe...")
- Wellness influencer ("manifest the home of your dreams")
- AI-generic ("In today's fast-paced world...", "Let's dive in", "navigating the complexities of")

**Style rules:**
- Australian English (organise, optimise, colour, neighbour, tradie).
- Active voice. Short sentences. Cut adverbs.
- Concrete numbers and timeframes, not vague claims.
- Use "we" (Wenest) and "you" (reader). Never "one" or third-person abstract.
- No emojis in body copy.

## 3. Audience

Primary persona is **Sarah, 42, Sydney executive, 4-bedroom home, two kids, husband, travels 2 weeks/month**. Full persona in parent CLAUDE.md §2.

Secondary audiences:
- Younger professionals buying their first house (25-35).
- Older homeowners who have stopped DIYing (60+).
- Homeowners preparing to sell.

If you cannot picture which of these you are writing for in the first paragraph, the article is not focused enough.

## 4. Content buckets

Six buckets, with target weights for the editorial calendar:

| Bucket | Weight | Examples |
|---|---|---|
| **Home operations** (signature) | 30% | "The hidden mental load of running a household", "Home systems for high-performing families", "Tradie red flags Australians should know" |
| **How-to / practical guides** | 25% | "How to unblock a sink without calling a plumber", "Spring HVAC checklist for Sydney homes" |
| **Concrete home problems** | 20% | "Why your dishwasher smells", "Removing red wine from grout" |
| **Transactional / service-aware** | 10% | "What is actually included in a Wenest membership", "Plumber vs handyman: who do you call?" |
| **Seasonal** | 10% | "Spring cleaning checklist Sydney", "Pool prep for summer" |
| **Lifestyle adjacent (narrow)** | 5% | Only intersections with home ops: "Indoor air quality and sleep", "Decluttering and decision fatigue" |

**Hard out:** Pure wellness (skincare, ice baths, hair trends, fitness routines). That is Wecasa territory, not Wenest. We do home, not body. If a topic does not connect back to running a house, it does not belong here.

## 5. Article structure

Every article follows this skeleton unless there is a specific reason not to:

1. **Hook** (1-2 sentences) — the specific pain or moment the reader is in.
2. **Promise** (1 sentence) — what they will know by the end.
3. **Body** — H2 sections, scannable. Each H2 answers one question or covers one step.
4. **The Wenest take** (1 paragraph, optional) — what we would do differently, or what we see in real homes.
5. **FAQ** (3-5 Q&As, marked up with FAQPage schema).
6. **CTA** — soft, contextual. Example: "If you'd rather not deal with this yourself, that is literally what we do." Link to `/` or `/membership`.

**Length targets:**
- How-to / problem articles: 1200-1800 words.
- Signature home-ops thought pieces: 1500-2200 words.
- Seasonal / list posts: 800-1500 words.

## 6. SEO rules (non-negotiable)

Every article must:

- Have **one** primary keyword decided up front and recorded in the frontmatter.
- Include the primary keyword in: H1, first 100 words, meta description, slug, image alt text.
- Use 2-4 secondary keywords across H2s naturally — keyword density 0.8-1.5%, no stuffing.
- Include 2-3 **internal links** to other Wenest articles or service pages (build the topic cluster).
- Include 1-2 **external links** to high-authority sources (gov.au, edu.au, ACCC, Choice, BoM).
- Include FAQ section with FAQPage schema.
- Have a meta description 140-155 characters, with primary keyword.
- Have a slug that is keyword-led, kebab-case, no stopwords if avoidable.
- Have alt text on every image describing the actual subject, not stuffed with keywords.

## 7. Frontmatter spec

Every `.md` file in `content/` starts with this YAML block:

```yaml
---
title: "How to Unblock a Sink Without Calling a Plumber"
slug: "unblock-sink-without-plumber"
description: "Five proven ways to clear a blocked sink yourself, plus when to actually call someone. From a Sydney concierge that handles 200+ blocked drains a year."
primary_keyword: "unblock sink"
secondary_keywords: ["blocked sink drain", "kitchen sink not draining", "DIY sink unblocking"]
bucket: "how-to"
status: "draft"          # draft | review | approved | published
target_word_count: 1500
internal_links: ["/blog/plumber-vs-handyman", "/membership"]
schema_type: "Article"
faq: true
cover_image: "/images/blog/unblock-sink-cover.jpg"
cover_image_alt: "Hand using plunger on stainless steel kitchen sink"
author: "Wenest"
published_date: ""
last_updated: ""
---
```

`status` workflow: `draft` → `review` → `approved` → `published`.

## 8. What we don't publish

- Anything off-brand for home operations (see §4 wellness rule).
- Generic top-10 lists with no Sydney/Australian specificity.
- AI-obvious filler ("In today's fast-paced world...", "Let's dive in", "navigating the complexities of").
- Articles without a primary keyword and a clear search intent.
- Pieces that recommend competitors or marketplace platforms (TaskRabbit, Airtasker, hipages) as the answer. We can mention them for context, never as the recommended solution.
- Articles that name specific tradies, suburbs, or providers we have not verified.
- Anything that promises outcomes we cannot deliver ("guaranteed same-day", "cheapest in Sydney").
- Translated/spun content from other blogs. Original or do not publish.
- Anything legally risky: medical, electrical wiring instructions beyond changing a globe, gas work, structural advice. Always defer to a licensed professional in copy.

## 9. Workflow (draft → published)

The pipeline runs in five stages. Each stage has a clear hand-off and a clear owner (Christian or Claude).

1. **Topic + brief** — Claude proposes a topic from the calendar, fills out the frontmatter, and produces a one-page brief: primary intent, target reader, outline, internal/external links, FAQ questions. Owner: Claude. Approval: Christian.
2. **Draft** — Claude writes the full article in `content/<slug>.md` with `status: draft`. Owner: Claude.
3. **Review** — Christian reads, marks edits inline or as comments. Status flips to `review`. SEO checks (skill: `searchfit-seo:seo-check`) run here. Owner: Christian.
4. **Approval** — Edits applied, frontmatter updated (`last_updated`, internal links verified), images sourced and alt-tagged. Status: `approved`. Owner: Claude, signed off by Christian.
5. **Publish** — Push to Ghost via the publishing automation (see §10). `status: published`, `published_date` set. Owner: automation.

Rules:
- Never skip review. No article goes from `draft` to `published` without Christian approving.
- Once `published`, edits go through a new commit and re-trigger the publish step (Ghost update, not duplicate post).
- Learnings (what ranked, what flopped, what got edited heavily) get logged in `memory/` so the next brief is better.

## 10. Deploy target — Ghost

The blog is published at **`blog.wenest.com.au`**, hosted on **Ghost**. This repo is not the live blog; it is the source of truth for content before it lands in Ghost.

- Publishing is done via the Ghost Admin API. The automation reads approved markdown from `content/`, converts it to Ghost's Lexical/HTML format, uploads cover images, sets tags + meta + canonical URL, and creates or updates the post.
- Tags in Ghost map 1:1 to `bucket` in the frontmatter.
- Canonical URLs always point at `blog.wenest.com.au/<slug>`.
- Internal links in the markdown using `/blog/...` or `/membership` get rewritten to absolute Wenest URLs at publish time.
- Drafts can be pushed to Ghost as Ghost-side drafts for preview, but only `status: approved` triggers a public publish.

Secrets (Ghost Admin API key, integration ID) live in `.env` locally and in the automation runner — never committed.

## 11. Memory and learning

`memory/` is where the project gets smarter over time. Write here when:

- A keyword ranked or flopped — record the URL, target keyword, position after 30/60/90 days.
- A brief structure worked unusually well (or badly) — capture what to repeat or avoid.
- Christian gave editorial feedback that should apply to all future articles, not just one piece.
- A topic was killed and why — so we don't re-pitch it in three months.

Do not put one-off task state here. Use it for durable, cross-article learning only.

## 12. Open questions

- [ ] Cadence — how many posts per week at MVP? (Default assumption: 1-2/week.)
- [ ] Who sources cover images, and from where? (Unsplash + brand overlay vs. custom photography later.)
- [ ] When do we add a newsletter capture, and on which articles?
- [ ] Do we localise to other Australian cities (Melbourne, Brisbane) before or after we hit 50 Sydney posts?
- [ ] Is there a separate "case study" content type once we have real customer stories?

---

**Document version:** v1 — 2026-05-01. Owner: Christian. Next review: after first 5 articles published.
