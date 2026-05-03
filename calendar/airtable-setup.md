# Airtable setup — editorial calendar

This doc walks through setting up the Wenest editorial calendar in Airtable, importing the seed xlsx, configuring views, and connecting n8n. Follow it once at project start. Total time: ~30 minutes.

---

## Why Airtable

For our use case (80-row queue read by n8n on a cron, hand-edited by Cristian, eventually grows to ~500 rows), Airtable hits the right balance:

- **Free tier covers us comfortably** — 1,000 records per base, 1 GB attachments. We will use ~80-300 records and zero attachments.
- **Native n8n connector** with strong support: list, get, create, update, delete, plus filterByFormula and sort.
- **Typed fields** (Number, Single select, Date, Checkbox) catch input errors that a raw Google Sheet would let slip.
- **Views** let us define exactly the slice n8n reads, without n8n needing to filter.
- **Audit-friendly** — every record edit is timestamped and undoable.

We considered Google Sheets (too loose), Notion (slower API, weaker filters), and a markdown file in the repo (parsing overhead in n8n). Airtable is the standard pick for this pattern.

---

## 1. Create the Airtable account and base

1. Sign up at [airtable.com](https://airtable.com) using your work email. Free plan is fine.
2. From the home dashboard, click **Add a base** → **Start from scratch**.
3. Rename the workspace to **Wenest** (top-left dropdown → Workspace settings).
4. Rename the base to **Wenest Blog**.
5. Rename the default table to **Editorial Calendar** (right-click the table tab → Rename).

Leave the default fields for now — we will replace them when we import the xlsx.

---

## 2. Import the seed xlsx

1. Inside the **Editorial Calendar** table, click the **+** at the right of the field row → **Import data** → **Microsoft Excel (.xlsx)**.
2. Upload `wenest-blog/calendar/editorial-calendar.xlsx`.
3. In the import dialog:
   - **Sheet to import**: `Editorial Calendar`.
   - **First row contains field names**: ✓ checked.
   - **Existing table**: select **Editorial Calendar** (it will replace the default fields with the imported headers).
4. Click **Import**.

Airtable will infer field types from the data — most will be wrong on first pass. Fix them in the next step.

---

## 3. Set field types correctly

Airtable's auto-detection turns most columns into **Single line text**. We want stricter typing so n8n and humans cannot insert bad data.

Click the dropdown arrow on each column header → **Customise field type** → set as below.

| Field | Type | Configuration |
|---|---|---|
| `topic_id` | **Single line text** | Primary field. Format: `T001`-`T999`. |
| `cluster` | **Number** | Integer. Allowed values 1-8. |
| `cluster_name` | **Single line text** | Display only — derived from cluster. |
| `bucket` | **Single select** | Options: `home-operations`, `how-to`, `problems`, `transactional`, `seasonal`, `lifestyle`. Use the brand green `#1F8A70` for `home-operations`, soft greys for the others. |
| `title` | **Single line text** | |
| `slug` | **Single line text** | Validate manually: kebab-case, no stop-words. |
| `primary_keyword` | **Single line text** | |
| `secondary_keywords` | **Long text** | Semicolon-separated; n8n splits on import. |
| `search_intent` | **Single select** | Options: `informational`, `commercial`, `transactional`. |
| `target_word_count` | **Number** | Integer, 800-2500 typical range. |
| `priority` | **Single select** | Options: `1`, `2`, `3`. (Use Number if you prefer arithmetic; Single select gives nicer colour coding.) |
| `seed_batch` | **Checkbox** | Default off. The 16 highlighted rows from the xlsx import as TRUE. |
| `brief` | **Long text** | |
| `status` | **Single select** | Options in this order: `queued` (grey), `drafted` (blue), `review` (amber), `approved` (cyan), `published` (green), `dropped` (red). |
| `date_drafted` | **Date** | ISO format. Disable time of day. |
| `date_published` | **Date** | ISO format. Disable time of day. |
| `notes` | **Long text** | |

**After fixing types**, spot-check one row from each cluster to verify the import didn't garble anything (especially `bucket` and `status` — Single select fields fail silently if the import value doesn't match an option).

---

## 4. Create the views

Views are saved filters and sorts. n8n reads from a specific view, so this step matters.

Click **+ Create…** at the bottom-left of the table → **Grid view**, then configure each:

### View 1 — `All topics` (default)
The default view that loads when you open the base. No filters. Sort by `topic_id` ascending. Hide nothing.

### View 2 — `Seed batch`
- **Filter**: `seed_batch = checked`.
- **Sort**: `cluster` asc, then `priority` asc, then `topic_id` asc.
- **Hide fields**: `notes`.
- **Use this** when generating the first 16 articles by hand or in a burst.

### View 3 — `Queue (n8n reads this)` ← **the one n8n consumes**
- **Filter**: `status = queued`.
- **Sort**: `priority` asc, then `cluster` asc, then `topic_id` asc.
- **Hide fields**: `notes`, `secondary_keywords` (n8n still receives them via the API; this is purely a display choice).
- Pin this view at the top of the sidebar.

### View 4 — `In progress`
- **Filter**: `status` is any of `drafted`, `review`, `approved`.
- **Sort**: `date_drafted` desc.
- **Use this** for your morning review of pending PRs.

### View 5 — `Published`
- **Filter**: `status = published`.
- **Sort**: `date_published` desc.
- **Hide fields**: `brief`, `notes`, `secondary_keywords`.

### View 6 — `By cluster` (Kanban)
- View type: **Kanban** (not Grid).
- **Stack by**: `cluster_name`.
- **Card fields**: `title`, `bucket`, `status`, `priority`.

### View 7 — `Dropped`
- **Filter**: `status = dropped`.
- Audit trail of topics we killed and why.

---

## 5. Generate the API credentials

Airtable retired the old API keys in February 2024. We use **Personal Access Tokens (PATs)** now.

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens).
2. Click **Create new token**.
3. Name: `n8n-wenest-blog`.
4. **Scopes** — add exactly these:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. **Access** — add the **Wenest Blog** base.
6. Click **Create token**. Airtable shows the token **once** — copy it immediately. It starts with `pat...` and is ~80 characters long.
7. Store it in your password manager. We will paste it into n8n in the next phase.

You also need the **Base ID**:

1. Open the **Wenest Blog** base.
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXX/...`. The `appXXXXXXXXXXXX` segment is your Base ID. Copy it.
3. Or visit [airtable.com/developers/web/api/introduction](https://airtable.com/developers/web/api/introduction) and click your base — the docs page shows the Base ID prominently.

You will need three values total to wire up n8n:

| Value | What it looks like | Where to find it |
|---|---|---|
| **Personal Access Token** | `pat...` (~80 chars) | airtable.com/create/tokens |
| **Base ID** | `appXXXXXXXXXXXX` (17 chars) | base URL or API docs |
| **Table name** | `Editorial Calendar` | the table tab itself |

---

## 6. n8n connection (preview)

Full n8n configuration is in the next deliverable. For reference, here's what the read step looks like:

**Node**: Airtable → **List records**
- Authentication: **Personal Access Token**
- Token: `pat...` (from above)
- Base: `appXXXXXXXXXXXX`
- Table: `Editorial Calendar`
- View: `Queue (n8n reads this)`
- Additional Options:
  - `Sort`: `[{ field: "priority", direction: "asc" }, { field: "cluster", direction: "asc" }, { field: "topic_id", direction: "asc" }]`
  - `Limit`: `1`

That returns the single next topic for the cron run.

After Claude generates the article and the PR is open, n8n updates the same row:

**Node**: Airtable → **Update record**
- Record ID: from the previous step's output
- Fields to update:
  - `status` → `review`
  - `date_drafted` → `{{ $now.format("yyyy-MM-dd") }}`

When the PR is merged in GitHub (i.e. published), a separate webhook from GitHub Actions can update the same row:
- `status` → `published`
- `date_published` → today's date

For v1, we'll handle the publish update manually (one click in Airtable) and only automate the draft step. Auto-publish-on-merge is a Phase 2 nicety.

---

## 7. Daily and weekly maintenance

**Daily** (~1 minute):
- Open the **In progress** view. If a row is in `drafted` or `review` status, the corresponding GitHub PR is waiting for you. Review and merge or comment.

**Weekly** (~5 minutes):
- Open the **Queue** view. Verify the next 4-5 rows look right (correct cluster, sensible brief). Edit titles or briefs if anything has gone stale.
- Update **published_date** for any articles whose PRs were merged this week (until the auto-publish hook is added).

**Monthly** (~15 minutes):
- Pull rankings for published articles into `memory/keyword-performance.md`.
- Mark any priority-3 topics that no longer fit as `dropped` in Airtable, with a one-line `notes` explaining why.

---

## 8. Backups

Airtable's free plan does not include automatic backups beyond 7-day undo. For an editorial calendar, that's fine, but worth a habit:

- **Weekly**: Airtable → table menu (`...`) → **Download CSV**. Save to `wenest-blog/calendar/backups/YYYY-MM-DD.csv`. Commit to the repo.
- **Quarterly**: re-export the full base as JSON via the Airtable API and archive in `calendar/backups/`.

---

## 9. Costs

| Plan | Monthly cost (AUD) | What we use of it |
|---|---|---|
| Free | $0 | 1,000 records, 1 GB attachments. We have ~80-300 records, zero attachments. |
| Team | ~$30/user/mo | Not needed unless we add seats with edit access. |

Stay on Free until at least 800 records OR multiple editors are needed.

---

## 10. Troubleshooting

**n8n returns zero records.** Check the view filter. The `Queue` view filters by `status = queued` — if every row's status got changed during testing, the queue is empty.

**Airtable rejects an update from n8n.** Most likely cause: trying to write a string to a Single select field with a value that doesn't exist as an option. Single select is strict — add the option to Airtable first.

**Field name mismatch errors.** Airtable's API uses the field name as it appears in the UI. Renaming `Title` to `title` (case change) breaks the n8n binding. Always check exact casing.

**`INVALID_API_KEY` despite a fresh PAT.** PATs are scoped to specific bases. Verify the **Wenest Blog** base is in the token's Access list.

**Rate limits.** Airtable allows 5 requests per second per base. n8n's default settings stay well under this for our 4/week cadence. No action needed.

---

## 11. Definition of done

You're done with the Airtable setup when:

- [ ] Base **Wenest Blog** exists with table **Editorial Calendar**.
- [ ] All 80 rows imported with correct field types.
- [ ] All 7 views configured.
- [ ] `Queue (n8n reads this)` view shows the rows currently with `status = queued`, sorted by priority then cluster then topic_id.
- [ ] Personal Access Token created with the right scopes and base access.
- [ ] Base ID copied.
- [ ] Backup of the seed state saved as `backups/2026-05-02-seed.csv` in the repo.

When the box above is fully checked, we're ready for the n8n workflow build.
