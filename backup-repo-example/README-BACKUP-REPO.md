# Tours System Setup for Backup Repo

This README explains how to set up the automated tours data generation in your Micro.blog backup repository.

## Overview

The GitHub Action in your backup repo:
1. Scans all markdown files for `{{< tour ... >}}` shortcodes
2. Extracts and validates tour parameters
3. Generates a consolidated `tours.json` file
4. Pushes the file to the plugin repo's `data/tours.json`

This runs daily at 4 AM UTC and can be triggered manually.

## Setup Steps

### 1. Copy Required Files

Copy these files from the plugin repo to your backup repo:

```bash
# From mbplugin-fischr-tours to your-backup-repo

.github/
├── workflows/
│   └── build-tours.yml
└── scripts/
    └── parse-tours.js
```

### 2. Configure Secrets

You need to set up authentication for the GitHub Action to push to the plugin repo.

#### Option A: Deploy Key (Recommended)

**Generate SSH Key:**
```bash
ssh-keygen -t ed25519 -C "github-actions-tours" -f tours-deploy-key -N ""
```

This creates two files:
- `tours-deploy-key` (private key)
- `tours-deploy-key.pub` (public key)

**Add Public Key to Plugin Repo:**
1. Go to plugin repo: `https://github.com/YOUR-USERNAME/mbplugin-fischr-tours`
2. Settings → Deploy keys → **Add deploy key**
3. Title: `GitHub Actions Tours`
4. Key: Paste contents of `tours-deploy-key.pub`
5. ✅ **Allow write access**
6. Click **Add key**

**Add Private Key to Backup Repo:**
1. Go to backup repo: `https://github.com/YOUR-USERNAME/your-backup-repo`
2. Settings → Secrets and variables → Actions → **New repository secret**
3. Name: `PLUGIN_DEPLOY_KEY`
4. Value: Paste entire contents of `tours-deploy-key` (including header/footer)
5. Click **Add secret**

**Clean up:**
```bash
# Securely delete the key files
rm tours-deploy-key tours-deploy-key.pub
```

#### Option B: Personal Access Token

If you prefer using a PAT:

1. GitHub → Settings → Developer settings → Personal access tokens → **Generate new token (classic)**
2. Name: `Tours Plugin Access`
3. Scopes: Select `repo` (full control of private repositories)
4. Click **Generate token** and copy it immediately
5. In backup repo → Settings → Secrets → Actions → **New repository secret**
6. Name: `PLUGIN_PAT`
7. Value: Paste your PAT
8. Click **Add secret**

**Update workflow file:**
```yaml
# In .github/workflows/build-tours.yml, replace:
ssh-key: ${{ secrets.PLUGIN_DEPLOY_KEY }}

# With:
token: ${{ secrets.PLUGIN_PAT }}
```

### 3. Configure Environment Variables

Edit `.github/workflows/build-tours.yml` and update these values:

```yaml
env:
  BLOG_BASE_URL: "https://fischr.org"           # TODO: Your blog URL
  PLUGIN_REPO: "flschr/mbplugin-fischr-tours"   # TODO: Your plugin repo
  CONTENT_DIR: "./content/posts"                # Adjust if different
```

### 4. Verify Directory Structure

Ensure your backup repo has markdown files in the expected location:

```
your-backup-repo/
├── content/
│   └── posts/
│       ├── 2025/
│       │   ├── 11/
│       │   │   └── drei-gipfel.md
│       │   └── 10/
│       │       └── mountain-tour.md
│       └── ...
└── .github/
    ├── workflows/
    │   └── build-tours.yml
    └── scripts/
        └── parse-tours.js
```

If your posts are in a different location (e.g., `./posts` or `./content`), update `CONTENT_DIR` in the workflow.

### 5. Test the Workflow

#### Manual Test Run

1. Go to your backup repo on GitHub
2. Click **Actions** tab
3. Select **Build Tours Data** workflow
4. Click **Run workflow** → **Run workflow**
5. Wait for completion (should take ~30 seconds)

#### Check Results

✅ **Success indicators:**
- Workflow shows green checkmark
- Check workflow summary for "Tours found" count
- Go to plugin repo → `data/tours.json` → verify it's updated

❌ **If it fails:**
- Click on the failed workflow run
- Expand failed step to see error message
- Common issues:
  - `Permission denied`: Check deploy key has write access
  - `No markdown files found`: Check CONTENT_DIR path
  - `No valid tours found`: Add at least one tour shortcode to a post

### 6. Add Tour Shortcodes to Posts

Create or edit a post with a tour shortcode:

```markdown
---
title: "Amazing Mountain Hike"
date: 2025-11-07
---

Today's hike was incredible!

{{< tour
  id="mountain-hike-2025"
  title="Amazing Mountain Hike"
  date="2025-11-07"
  type="hike"
  region="Alps"
  distance_km="12.5"
  elevation_m="800"
  duration_h="5.5"
  gpx="/uploads/2025/mountain-hike.gpx"
>}}

The weather was perfect...
```

**Required fields** (workflow will skip tours missing any of these):
- `id`, `title`, `date`, `type`, `distance_km`, `elevation_m`, `gpx`

**Optional fields:**
- `region`, `duration_h`, `max_alt_m`, `min_alt_m`, `bergfex_url`, `cover_image`

## Workflow Schedule

The workflow runs automatically:
- **Daily**: 4:00 AM UTC
- **On demand**: Manual trigger via Actions tab
- **Optional**: Uncomment `push:` trigger to run on every commit

## Post URL Reconstruction

The parser attempts to reconstruct post URLs from:
1. Frontmatter `url` or `permalink` field
2. File path structure (e.g., `/2025/11/07/post-slug.md`)
3. Frontmatter `date` + file name

If reconstruction fails, `post_url` will be empty (tours will still display on `/tours/` page, just without links).

### Improving URL Reconstruction

Add explicit URLs in frontmatter:

```yaml
---
title: "My Tour"
date: 2025-11-07
url: "/2025/11/07/my-tour/"
---
```

## Customization

### Change Schedule

Edit `.github/workflows/build-tours.yml`:

```yaml
schedule:
  - cron: '0 4 * * *'  # Daily at 4 AM UTC
  # Examples:
  # - cron: '0 */6 * * *'  # Every 6 hours
  # - cron: '0 0 * * 0'    # Weekly on Sunday
```

### Custom Content Directory

If your posts are in a different location:

```yaml
env:
  CONTENT_DIR: "./posts"  # or "./content" or "./blog"
```

### Custom Parser Behavior

Edit `.github/scripts/parse-tours.js` to:
- Change URL reconstruction logic
- Add custom validation rules
- Support additional tour fields
- Modify date parsing

## Monitoring

### Check Workflow Runs

- Backup repo → **Actions** → **Build Tours Data**
- See history of all runs
- Click any run to see logs

### Email Notifications

GitHub sends emails on workflow failures (if enabled in your GitHub notification settings).

### Workflow Badge

Add to your backup repo README:

```markdown
[![Build Tours](https://github.com/YOUR-USERNAME/your-backup-repo/actions/workflows/build-tours.yml/badge.svg)](https://github.com/YOUR-USERNAME/your-backup-repo/actions/workflows/build-tours.yml)
```

## Troubleshooting

### "No markdown files found"
- Check `CONTENT_DIR` path in workflow
- Verify markdown files exist in that directory
- Try alternative paths: `./posts`, `./content`, `.`

### "No valid tours found"
- Ensure tour shortcodes use correct syntax: `{{< tour ... >}}`
- Verify all required fields are present
- Check workflow logs for validation errors

### "Permission denied" on push
- **Deploy key**: Verify "Allow write access" is checked
- **PAT**: Ensure it has `repo` scope
- Check secret name matches workflow file

### Tours JSON not updating
- Verify workflow completed successfully
- Check if tours.json actually changed (no changes = no commit)
- Ensure plugin repo URL is correct in `PLUGIN_REPO`

### Post URLs are empty
- Add explicit `url` in frontmatter
- Check file path structure matches expected format
- Review parser logs for URL reconstruction attempts

## Security Notes

- **Deploy keys** are safer than PATs (scoped to single repo)
- Never commit private keys or tokens to the repository
- Use GitHub Secrets for all sensitive values
- The workflow only modifies `data/tours.json` in the plugin repo

## Example Tours

See `backup-repo-example/fixtures/` for example markdown posts with tour shortcodes.

## Support

For issues with the tours plugin: https://github.com/flschr/mbplugin-fischr-tours/issues

---

Happy touring! 🥾🚵🚴🏃
