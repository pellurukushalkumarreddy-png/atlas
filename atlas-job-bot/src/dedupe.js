// Dedupe — remember which jobs we've already shown the user
// Uses Cloudflare KV (free tier: 100K reads, 1K writes per day)
// Each job ID is stored with a 14-day TTL

const TTL_SECONDS = 14 * 24 * 60 * 60;  // 14 days

export async function dedupeAgainstHistory(jobs, env) {
  if (!jobs.length) return [];

  // Bulk-check each job ID against KV
  // KV doesn't have a native batch-get for free tier, so we loop
  // But we can do it in parallel (subject to subrequest limit ~50/req on free)
  const checks = await Promise.all(jobs.map(async (j) => {
    const seen = await env.JOBS_KV.get('seen:' + j.id);
    return seen ? null : j;
  }));

  return checks.filter(Boolean);
}

export async function markJobsSeen(jobs, env) {
  // Write each new job ID with a TTL
  // Free tier has 1K writes/day — we're well under
  await Promise.all(jobs.map(j =>
    env.JOBS_KV.put('seen:' + j.id, '1', { expirationTtl: TTL_SECONDS })
  ));
}
