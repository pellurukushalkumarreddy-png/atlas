# Atlas — A Personal Learning & Career Platform for Freshers

Atlas is a self-hosted productivity hub for early-career developers. It combines a learning tracker, job application tracker, curated resource library, structured study plans, and a daily job-listing email bot — all powered by a built-in AI mentor named **Sage**.

Built as a side project for the chaotic stretch between "I just graduated" and "I have an offer."

---

## ✨ What it does

**Atlas Web App** (`atlas-web/`)
- 📚 **Learning tracker** — log topics, courses, books with progress bars
- 💼 **Jobs tracker** — log every application with status (Applied → OA → Interview → Offer/Rejected/Ghosted)
- 📖 **Library** — curated YouTube channels, docs, and courses for 25+ in-demand tools
- 🗓️ **Plans** — AI-generated multi-week curricula with daily targets and end-of-week quizzes that auto-boost topic progress
- ✦ **Sage** — AI mentor with vision (reads job description screenshots), tool use (auto-adds jobs and learning topics), and full memory of your tracker data
- 🤖 **Bot dashboard** — live status, recent jobs, and one-click trigger for the job bot

**Atlas Job Bot** (`atlas-job-bot/`)
- Runs on Cloudflare Workers (free forever)
- Searches Adzuna, Remotive, and Jooble every morning at 7 AM IST
- Filters for fresher-friendly entry-level roles
- Deduplicates against jobs already shown (14-day memory)
- Sends a clean HTML digest email via Resend
- Exposes a JSON API that Atlas reads to show live status

---

## 🏗️ Architecture

```
┌────────────────────────┐        ┌────────────────────────┐
│  Atlas Web App         │        │  Atlas Job Bot         │
│  (Browser, static)     │        │  (Cloudflare Worker)   │
│                        │  CORS  │                        │
│  • Learning tracker    │ ◄────► │  • Daily cron @ 7AM    │
│  • Jobs tracker        │  JSON  │  • Adzuna + Remotive   │
│  • Library             │        │    + Jooble APIs       │
│  • Plans + quizzes     │        │  • Resend email send   │
│  • Sage (Gemini API)   │        │  • KV dedupe store     │
│  • Bot dashboard       │        │  • REST endpoints      │
└────────────────────────┘        └────────────────────────┘
```

Both are independent — Atlas works without the bot, and the bot works without Atlas. They integrate via a few JSON endpoints when both are deployed.

---

## 💰 Cost

**Free.** Everything stays inside the free tiers of:

| Service | Used for | Free tier limit | Atlas usage |
|---|---|---|---|
| Cloudflare Workers | Bot hosting | 100K req/day | ~30/day |
| Cloudflare KV | Dedupe storage | 1K writes/day | ~20/day |
| Adzuna | Job listings (India) | 250 calls/month | ~30/month |
| Remotive | Remote tech jobs | Unlimited | ~30/month |
| Jooble | Job listings (backup) | 500 calls/day | ~3/day |
| Resend | Email delivery | 100 emails/day | 1/day |
| Google Gemini | Sage AI brain | Generous free tier | varies |
| GitHub Pages | Atlas web hosting | Free | static HTML |

**Total: ₹0/month.**

---

## 🚀 Getting Started

This repo has **two separate projects** that can be deployed independently.

### Option A — Just the web app (5 minutes)

Atlas web works standalone with everything except Sage and the Bot tab:

1. Open `atlas-web/index.html` in any browser
2. Use the Learning, Jobs, Library, and Plans tabs
3. Data is saved in your browser's localStorage

For full functionality, host it free via GitHub Pages (see the `atlas-web/` folder for steps).

### Option B — Just the bot (30 minutes)

Daily email digest without the web app:

1. Follow `atlas-job-bot/README.md`
2. Deploy to Cloudflare Workers
3. Get daily emails at 7 AM

### Option C — The full system (~1 hour)

1. Deploy the bot (per `atlas-job-bot/README.md`)
2. Host Atlas on GitHub Pages
3. Connect them in Atlas's "🤖 Bot" tab — paste your bot URL
4. Configure Sage with a Google Gemini API key (free)

A guided walkthrough is in `SETUP.md`.

---

## 🗂️ Repo structure

```
atlas/
├── atlas-web/
│   └── index.html          ← The Atlas web app (single-file)
├── atlas-job-bot/
│   ├── src/
│   │   ├── index.js        ← HTTP + cron entry
│   │   ├── cron.js         ← Daily orchestrator
│   │   ├── config.example.js ← Copy → config.js, edit
│   │   ├── cors.js         ← CORS helper
│   │   ├── dedupe.js       ← Seen-jobs tracker
│   │   ├── email.js        ← HTML template
│   │   ├── resend.js       ← Email sender
│   │   ├── followups.js    ← Reminder logic
│   │   └── sources/
│   │       ├── adzuna.js
│   │       ├── remotive.js
│   │       └── jooble.js
│   ├── wrangler.toml       ← Cloudflare config
│   ├── package.json
│   └── README.md
├── SETUP.md                ← Full setup walkthrough
├── LICENSE
└── README.md               ← This file
```

---

## 🛡️ Privacy

- All your data lives in **your** browser (localStorage) or **your** Cloudflare account
- The bot only contacts public job APIs and your chosen email service
- Sage uses Google's Gemini API — chat content goes to Google subject to their privacy policy
- No analytics, no tracking, no telemetry

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 🌱 Built with

- Vanilla HTML/CSS/JavaScript (no build step for the web app)
- Cloudflare Workers (serverless compute)
- Google Gemini API (AI mentor)
- Resend (email delivery)
- Job APIs: Adzuna, Remotive, Jooble

No frameworks, no node_modules in the web app, no server-side dependencies beyond the worker runtime.
