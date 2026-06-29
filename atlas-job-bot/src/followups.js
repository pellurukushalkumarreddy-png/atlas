// Follow-up reminders — reads your Atlas Jobs as JSON
// Suggests follow-ups for jobs in 'applied' or 'oa' status that are >N days old

export async function fetchFollowUps(config) {
  if (!config.atlas_jobs_url) return [];

  const r = await fetch(config.atlas_jobs_url);
  if (!r.ok) return [];

  const data = await r.json();
  const jobs = Array.isArray(data) ? data : (data.jobs || []);
  const thresholdMs = (config.follow_up_after_days || 7) * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const suggestions = [];
  for (const j of jobs) {
    if (!['applied', 'oa'].includes(j.status)) continue;
    const applied = parseAppliedDate(j.appliedDate);
    if (!applied) continue;
    const ageMs = now - applied;
    if (ageMs < thresholdMs) continue;

    const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    suggestions.push({
      company: j.company,
      role: j.role,
      reason: `Applied ${days} days ago · status: ${j.status === 'oa' ? 'Awaiting OA' : 'Applied'}. Consider a polite follow-up email.`
    });
  }

  return suggestions.slice(0, 5);
}

function parseAppliedDate(s) {
  // Atlas stores dates like "19 Jun 2026" — fragile but works
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d.getTime();
}
