# Atlas Job Bot

Daily email digest of fresher-friendly tech jobs in India + remote. Runs on Cloudflare Workers (free forever). Sends one email per morning at 7 AM IST.

For full setup including hosting Atlas, see [`../SETUP.md`](../SETUP.md). This README covers just the bot.

## What it does

Every morning at 7 AM IST:
1. Searches Adzuna (India), Remotive (remote), and Jooble (backup)
2. Filters out senior roles and stale postings
3. Deduplicates against jobs already shown (14-day memory)
4. Sends a clean HTML email via Resend
5. Stores results so the Atlas web app can read them via REST API

## Endpoints

| Endpoint | Returns |
|---|---|
| `GET /health` | Bot version + config count |
| `GET /status` | Last run summary + next scheduled run |
| `GET /searches` | Your saved searches (sanitized) |
| `GET /recent-jobs` | Jobs from the most recent digest |
| `GET /run-history` | Last 14 runs |
| `GET /run?token=X` | Manually trigger a run (requires token) |

All endpoints return JSON with CORS headers enabled.

## Deploy

See `../SETUP.md` Phase 3 for the full walkthrough. TL;DR:

```bash
npm install -g wrangler
wrangler login
wrangler kv namespace create JOBS_KV
# Copy ID into wrangler.toml

cp src/config.example.js src/config.js
# Edit src/config.js — your email + searches

wrangler secret put ADZUNA_APP_ID
wrangler secret put ADZUNA_APP_KEY
wrangler secret put JOOBLE_KEY
wrangler secret put RESEND_KEY
wrangler secret put RESEND_FROM       # onboarding@resend.dev
wrangler secret put TRIGGER_TOKEN     # any random string

wrangler deploy
```

## File map

```
atlas-job-bot/
├── src/
│   ├── index.js          ← HTTP + cron entry
│   ├── cron.js           ← Daily orchestrator
│   ├── config.example.js ← Copy → config.js, edit
│   ├── cors.js           ← CORS helpers
│   ├── dedupe.js         ← KV-based seen tracker
│   ├── email.js          ← HTML email template
│   ├── resend.js         ← Resend API wrapper
│   ├── followups.js      ← Reads Atlas data for reminders
│   └── sources/
│       ├── adzuna.js
│       ├── remotive.js
│       └── jooble.js
├── wrangler.toml         ← Cloudflare config
└── package.json
```

## Cost: ₹0/month

| Service | Free limit | Bot usage |
|---|---|---|
| Cloudflare Workers | 100K req/day | ~30/day |
| Cloudflare KV | 1K writes/day | ~20/day |
| Adzuna | 250 calls/month | ~30/month |
| Remotive | Unlimited | ~30/month |
| Jooble | 500 calls/day | ~3/day |
| Resend | 100 emails/day | 1/day |

Stays comfortably within all free tiers even if you scale up searches.

## Limitations to know

- **LinkedIn-only jobs won't appear** — they have no public API. Use LinkedIn's native email alerts in parallel.
- **Naukri jobs partially appear** through Adzuna's index, but not as comprehensively as Naukri's own alerts.
- **Job freshness** — most APIs index 24-72h old postings, not real-time.
- **First week is noisy** — initial digest might be 30+ jobs because everything is "new". Settles to 5-15/day after.
