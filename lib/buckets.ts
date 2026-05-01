export const BUCKETS = [
  { slug: "home-operations", name: "Home Operations", blurb: "Running a household like a system." },
  { slug: "how-to", name: "How-to Guides", blurb: "Practical fixes you can do this weekend." },
  { slug: "problems", name: "Common Problems", blurb: "Real fixes for the stuff that actually breaks." },
  { slug: "transactional", name: "Services", blurb: "When to call a pro, and which one." },
  { slug: "seasonal", name: "Seasonal", blurb: "Sydney-specific seasonal checklists." },
  { slug: "lifestyle", name: "Lifestyle", blurb: "Where home and life intersect." },
] as const;

export type BucketSlug = (typeof BUCKETS)[number]["slug"];

export const BUCKET_SLUGS = BUCKETS.map((b) => b.slug) as [BucketSlug, ...BucketSlug[]];

export const bucketName = (slug: string) =>
  BUCKETS.find((b) => b.slug === slug)?.name ?? slug;
