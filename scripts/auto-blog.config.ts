// Auto-blog configuration — the editable knobs.
//
// This file holds everything you might want to tune without touching the
// orchestration logic in auto-publish.ts: which services the blog writes
// about, how often each content bucket comes up, the model, length, and the
// pool of cover images used when no Unsplash key is configured.
//
// Changing anything here is a pure data edit — no need to understand the rest.

import { BUCKETS } from "../lib/buckets";

/** Claude model used for both topic ideation and the article itself. */
export const MODEL = "claude-sonnet-4-6";

/** Target article length is picked at random in this range (words). */
export const WORD_COUNT_MIN = 1200;
export const WORD_COUNT_MAX = 1800;

/** Never publish more than this many articles in a single run. */
export const MAX_ARTICLES_PER_RUN = 1;

/**
 * The Wenest services the blog is allowed to write about.
 *
 * `blogEligible: false` excludes a service from topic generation. The three
 * body/wellness services (haircut, beauty, massage) are excluded by default
 * because the blog's own editorial rule is "we do home, not body" (see the
 * blog CLAUDE.md §4 "Hard out" + memory/topic-blacklist.md). Flip a flag to
 * true if you ever decide to cover one of them.
 *
 * `path` is the live `/services/...` page (all verified to return 200) used as
 * a relevant internal link in the article CTA.
 * `coverTheme` selects a fallback cover image when no Unsplash key is set.
 */
export type Service = {
  id: string;
  label: string;
  path: string;
  blogEligible: boolean;
  coverTheme: CoverTheme;
  /**
   * Personal-care / at-home services (beauty, haircut, massage). When true, the
   * topic + article are framed around the AT-HOME SERVICE EXPERIENCE (convenience,
   * vetting, scheduling, what to expect) rather than wellness/skincare/health tips —
   * so the editorial "we do home, not body" guardrail doesn't refuse them.
   */
  personalCare?: boolean;
};

export type CoverTheme =
  | "plumbing"
  | "electrical"
  | "appliance"
  | "pool"
  | "general";

export const SERVICES: Service[] = [
  // Tier 1 — Core Home Care
  { id: "plumb", label: "plumbing", path: "/services/plumbing", blogEligible: true, coverTheme: "plumbing" },
  { id: "elec", label: "electrical work", path: "/services/electrical", blogEligible: true, coverTheme: "electrical" },
  { id: "hvac", label: "heating, cooling and air conditioning", path: "/services/hvac", blogEligible: true, coverTheme: "general" },
  { id: "handy", label: "handyman jobs", path: "/services/handyman", blogEligible: true, coverTheme: "general" },
  { id: "appl", label: "appliance repair", path: "/services/appliances", blogEligible: true, coverTheme: "appliance" },
  { id: "lock", label: "locksmithing and home security", path: "/services/locksmith", blogEligible: true, coverTheme: "general" },
  { id: "smoke", label: "smoke alarms and home safety", path: "/services/smoke-alarms", blogEligible: true, coverTheme: "electrical" },
  // Tier 2 — Home & Everyday Care
  { id: "clean", label: "house cleaning", path: "/services/cleaning", blogEligible: true, coverTheme: "general" },
  { id: "laundry", label: "laundry and ironing", path: "/services/laundry", blogEligible: true, coverTheme: "general" },
  { id: "garden", label: "gardening and lawn care", path: "/services/gardening", blogEligible: true, coverTheme: "general" },
  { id: "pool", label: "pool maintenance", path: "/services/pool", blogEligible: true, coverTheme: "pool" },
  { id: "pest", label: "pest control", path: "/services/pest-control", blogEligible: true, coverTheme: "general" },
  { id: "gutter", label: "gutter cleaning", path: "/services/gutters", blogEligible: true, coverTheme: "general" },
  { id: "solar", label: "solar panel cleaning", path: "/services/solar", blogEligible: true, coverTheme: "general" },
  // Tier 3 — Life & Convenience (home-adjacent only)
  { id: "moving", label: "moving in and out of a home", path: "/services/moving", blogEligible: true, coverTheme: "general" },
  { id: "pet", label: "pet care at home", path: "/services/pet-care", blogEligible: true, coverTheme: "general" },
  // At-home personal care. Enabled and framed as a SERVICE (convenience / what to
  // expect / vetting), not as wellness tips — see `personalCare` above. To stop
  // covering one, just set its blogEligible to false.
  { id: "haircut", label: "at-home haircuts", path: "/services/haircut", blogEligible: true, coverTheme: "general", personalCare: true },
  { id: "beauty", label: "at-home beauty treatments", path: "/services/beauty", blogEligible: true, coverTheme: "general", personalCare: true },
  { id: "massage", label: "at-home massage", path: "/services/massage", blogEligible: true, coverTheme: "general", personalCare: true },
];

/**
 * How often each content bucket is chosen (weighted random). Mirrors the
 * editorial weights in the blog CLAUDE.md §4. Keys must match bucket slugs.
 */
export const BUCKET_WEIGHTS: Record<string, number> = {
  "home-operations": 30,
  "how-to": 25,
  "problems": 20,
  "transactional": 10,
  "seasonal": 10,
  "lifestyle": 5,
};

// Sanity guard: every weighted bucket must be a real bucket slug.
const BUCKET_SLUGS = new Set(BUCKETS.map((b) => b.slug));
for (const slug of Object.keys(BUCKET_WEIGHTS)) {
  if (!BUCKET_SLUGS.has(slug as never)) {
    throw new Error(`BUCKET_WEIGHTS references unknown bucket "${slug}"`);
  }
}

/**
 * Fallback cover images, grouped by theme. Used when UNSPLASH_ACCESS_KEY is
 * NOT set. Every URL here has been verified to resolve (HTTP 200). If you add
 * a free Unsplash API key to the environment, the script searches Unsplash
 * live with the topic's own image query instead and ignores this pool.
 */
export const COVER_POOL: Record<CoverTheme, string[]> = {
  plumbing: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80"],
  electrical: ["https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1600&q=80"],
  appliance: ["https://images.unsplash.com/photo-1581622558663-b2e33377dfb2?w=1600&q=80"],
  pool: ["https://images.unsplash.com/photo-1569047724922-66ba3037bc7a?w=1600&q=80"],
  general: [
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80",
    "https://images.unsplash.com/photo-1581622558663-b2e33377dfb2?w=1600&q=80",
  ],
};
