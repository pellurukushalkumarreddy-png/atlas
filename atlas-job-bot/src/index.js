// Atlas Job Bot — main entry
// Runs on Cloudflare Workers (free tier)
// Triggered by cron daily at 7 AM IST (01:30 UTC)

import { runDailyDigest } from './cron.js';
import { CONFIG } from './config.js';
import { jsonResponse, handleCorsPreflightRequest } from './cors.js';

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailyDigest(env));
  },

  async fetch(request, env, ctx) {
    const preflight = handleCorsPreflightRequest(request);
    if (preflight) return preflight;

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/' || path === '/health') {
        return jsonResponse({
          status: 'ok',
          bot: 'Atlas Job Bot',
          version: '1.1',
          next_run_cron: '30 1 * * * (UTC) = 7:00 AM IST',
          searches_configured: CONFIG.criteria.length
        });
      }

      if (path === '/status') {
        const lastRun = await env.JOBS_KV.get('last_run_summary', { type: 'json' });
        return jsonResponse({
          bot_alive: true,
          email: maskEmail(CONFIG.your_email),
          searches_count: CONFIG.criteria.length,
          last_run: lastRun,
          next_run_estimate: estimateNextRun()
        });
      }

      if (path === '/recent-jobs') {
        const jobs = await env.JOBS_KV.get('last_digest_jobs', { type: 'json' });
        return jsonResponse(jobs || []);
      }

      if (path === '/run-history') {
        const history = await env.JOBS_KV.get('run_history', { type: 'json' });
        return jsonResponse(history || []);
      }

      if (path === '/searches') {
        return jsonResponse(CONFIG.criteria.map(c => ({
          label: c.label,
          keywords: c.keywords,
          location: c.location || 'Any',
          country: c.country,
          include_remote: !!c.include_remote,
          remote_only: !!c.remote_only,
          max_days_old: c.max_days_old || 7
        })));
      }

      if (path === '/run') {
        const token = url.searchParams.get('token');
        if (token !== env.TRIGGER_TOKEN) {
          return jsonResponse({ error: 'Unauthorized. Provide ?token=YOUR_TRIGGER_TOKEN' }, 401);
        }
        const result = await runDailyDigest(env);
        return jsonResponse(result);
      }

      return jsonResponse({
        error: 'Not found',
        available_endpoints: ['/health', '/status', '/recent-jobs', '/run-history', '/searches', '/run?token=X']
      }, 404);
    } catch (err) {
      return jsonResponse({ error: err.message, stack: err.stack }, 500);
    }
  }
};

function maskEmail(e) {
  if (!e) return '';
  return e.replace(/(.{2}).+(@.+)/, '$1***$2');
}

function estimateNextRun() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 1, 30, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString();
}
