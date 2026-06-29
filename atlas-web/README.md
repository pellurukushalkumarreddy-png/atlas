# Atlas Web App

The single-file HTML web app — learning tracker, jobs tracker, library, plans, and Sage AI mentor.

## Quick start

### Run locally (no internet hosting)
```bash
# From the repo root, just open the file
open atlas-web/index.html      # macOS
xdg-open atlas-web/index.html  # Linux
start atlas-web/index.html     # Windows
```

Works fully offline for: Learning, Jobs, Library, Plans (existing plans).
Won't work locally: Sage (needs hosted URL for API access), Bot tab (needs HTTPS for CORS).

### Host on GitHub Pages (free, public)
1. Push this repo to GitHub
2. Repo → Settings → Pages
3. Source: `Deploy from a branch`, Branch: `main`, Folder: `/atlas-web`
4. Save
5. Atlas is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`

### Host on Netlify or Cloudflare Pages (free, faster CDN)
- Drag `atlas-web/index.html` into Netlify's deploy page
- Or connect this repo to Cloudflare Pages with the build output set to `atlas-web/`

## Configuration

All configuration is done in-app at runtime — no build step.

- **Sage API key** — set in Sage's settings when prompted
- **Bot URL & token** — set in the 🤖 Bot tab
- **Everything else** — saved to your browser's localStorage

## Privacy

All data is stored in your browser. Nothing is sent to a server unless you explicitly:
- Use Sage (sends chat to the AI provider)
- Use the 🤖 Bot tab (reads from your own Cloudflare Worker)

## Browser support

Modern browsers (Chrome, Safari, Firefox, Edge). No IE. Mobile browsers work but are best for read-only use.
