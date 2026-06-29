// Remotive API — remote-only jobs
// Docs: https://remotive.com/api-documentation
// Free, no API key required

export async function searchRemotive(criteria) {
  // Remotive uses 'category' (we use 'software-dev') + 'search' text
  const search = criteria.keywords.join(' ');
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}&limit=20`;

  const r = await fetch(url, { headers: { 'User-Agent': 'AtlasJobBot/1.0' } });
  if (!r.ok) throw new Error(`Remotive ${r.status}`);

  const data = await r.json();
  const jobs = data.jobs || [];

  // Filter by recency
  const cutoff = Date.now() - (criteria.max_days_old || 7) * 24 * 60 * 60 * 1000;

  return jobs
    .filter(j => {
      // Recency check
      const posted = j.publication_date ? new Date(j.publication_date).getTime() : 0;
      if (posted && posted < cutoff) return false;

      // Entry-level / fresher relevance check
      const text = ((j.title || '') + ' ' + (j.description || '')).toLowerCase();
      // Skip clearly-senior roles
      if (/\b(senior|sr\.|lead|principal|staff|architect|director|head of|vp |10\+ years|7\+ years|5\+ years)\b/.test(text)) {
        // Only skip if also no junior indicators
        if (!/\b(junior|jr\.|entry|graduate|fresher|intern|0-?\d+ years?)\b/.test(text)) return false;
      }
      return true;
    })
    .map(j => ({
      id: hashId('rem_' + (j.url || j.id)),
      source: 'Remotive',
      title: j.title || 'Untitled',
      company: j.company_name || 'Unknown',
      location: j.candidate_required_location || 'Remote',
      salary: j.salary || '',
      description: stripHtml((j.description || '').slice(0, 300)),
      url: j.url,
      posted: j.publication_date,
      is_remote: true
    }));
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function hashId(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'j' + (h >>> 0).toString(36);
}
