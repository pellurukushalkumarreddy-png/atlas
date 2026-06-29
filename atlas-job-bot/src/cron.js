// Daily orchestrator — runs once per day
import { CONFIG } from './config.js';
import { searchAdzuna } from './sources/adzuna.js';
import { searchRemotive } from './sources/remotive.js';
import { searchJooble } from './sources/jooble.js';
import { dedupeAgainstHistory, markJobsSeen } from './dedupe.js';
import { buildEmailHtml } from './email.js';
import { sendEmail } from './resend.js';
import { fetchFollowUps } from './followups.js';

export async function runDailyDigest(env) {
  const startTime = Date.now();
  const summary = { searches: [], total_new: 0, sent: false, errors: [] };

  // Step 1: For each saved search, query all sources
  const allJobs = [];
  for (const criteria of CONFIG.criteria) {
    const sectionJobs = [];

    // Adzuna (India-focused, requires API key)
    if (env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY && !criteria.remote_only) {
      try {
        const adzJobs = await searchAdzuna(criteria, env);
        sectionJobs.push(...adzJobs);
      } catch (e) { summary.errors.push('Adzuna: ' + e.message); }
    }

    // Remotive (remote-only, no key needed)
    if (criteria.include_remote || criteria.remote_only) {
      try {
        const remJobs = await searchRemotive(criteria);
        sectionJobs.push(...remJobs);
      } catch (e) { summary.errors.push('Remotive: ' + e.message); }
    }

    // Jooble (general aggregator, requires API key)
    if (env.JOOBLE_KEY && !criteria.remote_only) {
      try {
        const jobJobs = await searchJooble(criteria, env);
        sectionJobs.push(...jobJobs);
      } catch (e) { summary.errors.push('Jooble: ' + e.message); }
    }

    // Dedupe within this section (same job from multiple sources)
    const sectionUnique = dedupeByUrl(sectionJobs);

    // Limit per search
    const limited = sectionUnique.slice(0, CONFIG.max_results_per_search);

    allJobs.push({ criteria, jobs: limited });
    summary.searches.push({ label: criteria.label, found: limited.length });
  }

  // Step 2: Filter out jobs we've already shown the user in the last 14 days
  const flatJobs = allJobs.flatMap(s => s.jobs);
  const newJobs = await dedupeAgainstHistory(flatJobs, env);
  const newJobIds = new Set(newJobs.map(j => j.id));

  // Re-group new-only jobs by section
  const grouped = allJobs.map(section => ({
    ...section,
    jobs: section.jobs.filter(j => newJobIds.has(j.id))
  })).filter(s => s.jobs.length > 0);

  summary.total_new = newJobs.length;

  // Step 3: Fetch follow-up reminders from Atlas (if URL configured)
  let followUps = [];
  if (CONFIG.atlas_jobs_url) {
    try {
      followUps = await fetchFollowUps(CONFIG);
    } catch (e) { summary.errors.push('Follow-ups: ' + e.message); }
  }

  // Step 4: If there's nothing new and no follow-ups, skip the email
  if (newJobs.length === 0 && followUps.length === 0) {
    summary.skipped = 'No new jobs or follow-ups today';
    return summary;
  }

  // Step 5: Build the email
  const html = buildEmailHtml({ grouped, followUps, totalCount: newJobs.length });
  const subject = `🎯 Atlas Job Digest — ${newJobs.length} new opening${newJobs.length === 1 ? '' : 's'}`;

  // Step 6: Send the email
  try {
    await sendEmail({
      to: CONFIG.your_email,
      from: env.RESEND_FROM || 'onboarding@resend.dev',
      fromName: CONFIG.bot_name,
      subject,
      html,
      apiKey: env.RESEND_KEY
    });
    summary.sent = true;
  } catch (e) {
    summary.errors.push('Email send: ' + e.message);
  }

  // Step 7: Remember which jobs we've shown so we don't repeat
  await markJobsSeen(newJobs, env);

  // Step 8: Store the latest jobs so Atlas can pull them via /recent-jobs
  await env.JOBS_KV.put('last_digest_jobs', JSON.stringify(newJobs), {
    expirationTtl: 60 * 60 * 24 * 7  // 7 days
  });

  summary.elapsed_ms = Date.now() - startTime;
  summary.timestamp = new Date().toISOString();

  // Save last-run summary (quick access for /status)
  await env.JOBS_KV.put('last_run_summary', JSON.stringify(summary), {
    expirationTtl: 60 * 60 * 24 * 14  // 14 days
  });

  // Append to run history (keep last 14 entries)
  try {
    const existing = await env.JOBS_KV.get('run_history', { type: 'json' }) || [];
    const lightweight = {
      timestamp: summary.timestamp,
      total_new: summary.total_new,
      sent: summary.sent,
      errors: summary.errors,
      elapsed_ms: summary.elapsed_ms,
      searches: summary.searches
    };
    const updated = [lightweight, ...existing].slice(0, 14);
    await env.JOBS_KV.put('run_history', JSON.stringify(updated), {
      expirationTtl: 60 * 60 * 24 * 30  // 30 days
    });
  } catch (e) {
    // history is non-critical — don't fail the run
  }

  return summary;
}

function dedupeByUrl(jobs) {
  const seen = new Set();
  const result = [];
  for (const job of jobs) {
    const key = job.url || (job.company + '|' + job.title);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(job);
  }
  return result;
}
