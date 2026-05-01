# Decisions log

A running log of architectural, editorial, and process decisions that shape the project. Date every entry. Add the next entry at the **top** (newest first).

---

## 2026-05-01 — Stack: Ghost(Pro) on subdomain

**Decision:** Use Ghost(Pro) Starter at `blog.wenest.com.au` instead of self-hosted Astro at `wenest.com.au/blog`.

**Reasoning:**
- Time-to-launch beats long-term cost optimisation while validating the business.
- Native admin UI, SEO, sitemap, schema, newsletter — removes ~20-30h of setup work.
- $9/mo is trivial relative to the time saved.
- Admin API supports the N8N pipeline cleanly: POST as draft → 1-click publish.
- JSON export available if we ever migrate.

**Trade-offs accepted:**
- Subdomain instead of subdir = small SEO disadvantage (link juice on a separate domain). Mitigation: aggressive internal linking blog ↔ main site, canonical config, consistent branding.
- Moderate vendor lock-in. Acceptable for now.

**Revisit if:** monthly volume passes 30 posts, Ghost limitations surface, or pricing changes materially.

---

## 2026-05-01 — Content positioning: home operations, not wellness

**Decision:** Cap "lifestyle adjacent" content at 5% of the editorial calendar, and only publish lifestyle pieces that intersect directly with running a house (e.g. indoor air quality, decluttering and decision fatigue). Pure wellness (skincare, ice baths, hair, fitness) is a hard out.

**Reasoning:**
- Wenest's positioning is premium home operations, not wellness or lifestyle.
- Diluting into wellness pulls us into a category with massive incumbent competition (BodyAndSoul, Goop-style sites) where we have no authority.
- "Home operations" is a defensible, less-crowded niche.

**Trade-offs accepted:**
- Lower potential reach from broad lifestyle search.
- Some seasonal lifestyle traffic (e.g. Valentine's, gift guides) goes unclaimed.

**Revisit if:** we expand into Tier 3 lifestyle services (cleaning, laundry, pet care) and need to build authority there.

---

## Template for new entries

```
## YYYY-MM-DD — [decision title]

**Decision:** ...

**Reasoning:**
- ...

**Trade-offs accepted:**
- ...

**Revisit if:** ...
```
