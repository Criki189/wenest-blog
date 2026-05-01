export const SITE = {
  name: "Wenest",
  tagline: "Home operations for busy Sydney homeowners.",
  description:
    "Practical, no-hype guides on running a Sydney home — from the Wenest concierge team that coordinates trades, vetting, and scheduling for members.",
  // Public-facing URL (rewritten by the landing project to /blog).
  url: "https://wenest.com.au",
  blogPath: "/blog",
  locale: "en_AU",
  twitter: "@wenestau",
};

export const absoluteBlogUrl = (path = "") =>
  `${SITE.url}${SITE.blogPath}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/$/, "") || `${SITE.url}${SITE.blogPath}`;
