# Atlas — Full Setup Walkthrough

This guide takes you from zero to a fully working Atlas + Job Bot, all on free tiers, in about 1 hour split across phases. Stop after any phase — each one delivers something useful on its own.

---

## Prerequisites

- A personal laptop (Mac, Linux, or Windows with WSL) — **not a corporate machine** (corp networks block npm and Cloudflare deploys)
- Node.js 18+ ([download](https://nodejs.org/))
- A Google account (for Gemini API + GitHub)
- ~1 hour of focused time

---

## Phase 1 — Sign up for free accounts (20 min)

Sign up at all of these. No credit card needed anywhere.

1. **GitHub** — https://github.com/signup
2. **Cloudflare** — https://dash.cloudflare.com/sign-up
3. **Adzuna Developer** — https://developer.adzuna.com/signup
   - Application: "Personal or academic research"
   - Save the **App ID** and **App Key**
4. **Resend** — https://resend.com/signup
   - Create an API Key with "Sending access"
   - Save the `re_...` key
5. **Jooble** — https://jooble.org/api/about
   - Request API key (email arrives in minutes)
6. **Google AI Studio (Gemini)** — https://aistudio.google.com/apikey
   - Click "Create API key"
   - Save the `AIza...` key

Keep all keys in a password manager or a private note. They're like passwords — don't paste them anywhere public.

---

## Phase 2 — Clone the repo (5 min)

```bash
# Pick a folder where you want the project
cd ~/Documents
git clone https://github.com/YOUR-USERNAME/atlas.git
cd atlas
```

(If you forked from someone else's repo, change the URL accordingly.)

---

## Phase 3 — Deploy the bot (25 min)

### 3.1 — Install the Cloudflare CLI

```bash
npm install -g wrangler
wrangler --version  # Should print 3.x.x
```

If permission errors, use `sudo npm install -g wrangler`.

### 3.2 — Log into Cloudflare

```bash
cd atlas-job-bot
wrangler login
```

This opens a browser → authorize → close the browser when done.

### 3.3 — Create the KV namespace

```bash
wrangler kv namespace create JOBS_KV
```

Output looks like:
```
🌀 Creating namespace with title "atlas-job-bot-JOBS_KV"
✨ Success!
[[kv_namespaces]]
binding = "JOBS_KV"
id = "abc123def456..."
```

**Copy that `id` value.** Open `wrangler.toml` and paste it where it says `REPLACE_WITH_KV_ID_FROM_WRANGLER_OUTPUT`.

### 3.4 — Create your local config

```bash
cp src/config.example.js src/config.js
```

Open `src/config.js` and:
- Change `your_email` to your real email
- Edit the `criteria` array if you want different keywords / locations

### 3.5 — Set your secrets

Run each command and paste the value when prompted:

```bash
wrangler secret put ADZUNA_APP_ID       # from Adzuna
wrangler secret put ADZUNA_APP_KEY      # from Adzuna
wrangler secret put JOOBLE_KEY          # from Jooble
wrangler secret put RESEND_KEY          # from Resend (starts with re_)
wrangler secret put RESEND_FROM         # use: onboarding@resend.dev
wrangler secret put TRIGGER_TOKEN       # any random string, like: my-bot-123
```

⚠️ **Save your TRIGGER_TOKEN somewhere** — you'll need it later to manually trigger runs from Atlas.

### 3.6 — Deploy

```bash
wrangler deploy
```

Output looks like:
```
✨ Successfully published to
   https://atlas-job-bot.YOUR-SUBDOMAIN.workers.dev
✨ Cron triggers scheduled: 30 1 * * *
```

**Save that URL** — that's your bot's address. You'll paste it into Atlas.

### 3.7 — Test it now

```bash
curl "https://atlas-job-bot.YOUR-SUBDOMAIN.workers.dev/run?token=YOUR_TRIGGER_TOKEN"
```

Within ~10 seconds you should:
- See a JSON response showing how many jobs were found
- Get an email in your inbox (check spam folder!)

If the email arrives, **🎉 the bot works.**

---

## Phase 4 — Host Atlas on GitHub Pages (10 min)

This puts your Atlas web app at a real URL so the Bot tab can talk to your bot.

### 4.1 — Push the repo to GitHub

If you haven't already:

```bash
cd ..  # back to atlas root
git add .
git commit -m "Initial Atlas setup"
git push
```

### 4.2 — Enable GitHub Pages

1. On github.com, open your repo
2. Click **Settings** → **Pages** in the sidebar
3. Under "Build and deployment":
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or `master`)
   - **Folder:** `/atlas-web`
4. Click **Save**
5. Wait ~30 seconds, then your Atlas is live at:
   ```
   https://YOUR-USERNAME.github.io/atlas/
   ```

### 4.3 — Open Atlas

Visit `https://YOUR-USERNAME.github.io/atlas/` — Atlas should load.

---

## Phase 5 — Connect Atlas to the bot (5 min)

1. In Atlas, click the **🤖 Bot** tab
2. Paste your bot URL: `https://atlas-job-bot.YOUR-SUBDOMAIN.workers.dev`
3. Paste your `TRIGGER_TOKEN`
4. Click **Test connection** — should show "✓ Bot is alive"
5. Click **Connect**
6. The Bot tab now shows live status, your saved searches, and recent jobs
7. Click **▶ Run Now** to trigger a fresh digest

---

## Phase 6 — Add Gemini to Sage (10 min)

*(Coming once you've reached this far — ask in the project for the latest Gemini wiring.)*

The web app currently uses the Anthropic API which only works inside Claude.ai. We'll swap it to Gemini so it works from your hosted Atlas.

---

## You're done! 🎉

Tomorrow at 7 AM IST:
- Your bot wakes up in Cloudflare
- Searches Adzuna + Remotive + Jooble
- Sends you a clean email with new fresher openings
- Stores results so Atlas Bot tab shows them too

Each morning, you:
- Glance at the email
- Click "+ Add to Atlas" on interesting ones
- Apply via Atlas with Sage's help
- Track progress in the Jobs tab

---

## Troubleshooting

**"wrangler login fails / hangs"** — Try a different browser. Make sure popups aren't blocked.

**"Adzuna 401 Unauthorized"** — Wrong App ID/Key. Re-run `wrangler secret put`.

**"Resend 401"** — Wrong API key. Or you forgot to set `RESEND_FROM` to `onboarding@resend.dev`.

**"Email went to spam"** — Mark it as not-spam once. Resend's default sender has weaker deliverability. To fix permanently, verify a domain in Resend (free if you own a domain).

**"Cron isn't running"** — Check the Cloudflare dashboard → your worker → Triggers tab. Make sure the cron trigger is listed.

**"Bot tab in Atlas shows 'Unreachable'"** — Either the bot URL is wrong, your bot crashed, or CORS is misconfigured. Visit the bot URL directly in a browser — if you see JSON, it's alive.

**"I want to change my saved searches"** — Edit `atlas-job-bot/src/config.js` and run `wrangler deploy` again. Changes apply to the next run.

---

## Going further

- **Add more job sources** — see `atlas-job-bot/src/sources/` for the pattern; add a new file, import it in `cron.js`
- **Customize the email design** — edit `atlas-job-bot/src/email.js`
- **Add your own AI capabilities** — Sage's tools are defined in `atlas-web/index.html` (search for `SAGE_TOOLS`)
- **Tell recruiters** — this whole project is a great portfolio piece. "I built a serverless job aggregator on Cloudflare Workers that emails me curated openings daily."
