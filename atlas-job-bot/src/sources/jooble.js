// Jooble API — general aggregator
// Docs: https://jooble.org/api/about
// Free tier: 500 calls/day after registration
// Decent India coverage as a backup source

export async function searchJooble(criteria, env) {
  const url = `https://jooble.org/api/${env.JOOBLE_KEY}`;
  const body = {
    keywords: criteria.keywords.join(' '),
    location: criteria.location || 'India',
    radius: '50',
    page: 1,
    ResultOnPage: 15
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Jooble ${r.status}`);

  const data = await r.json();
  const jobs = data.jobs || [];
  const cutoff = Date.now() - (criteria.max_days_old || 7) * 24 * 60 * 60 * 1000;

  return jobs
    .filter(j => {
      // Recency
      const posted = j.updated ? new Date(j.updated).getTime() : Date.now();
      if (posted < cutoff) return false;

      // Filter clearly-senior listings
      const text = ((j.title || '') + ' ' + (j.snippet || '')).toLowerCase();
      if (/\b(senior|sr\.|lead|principal|staff|architect|director|head of|vp |10\+ years|7\+ years|5\+ years)\b/.test(text)) {
        if (!/\b(junior|jr\.|entry|graduate|fresher|intern|0-?\d+ years?)\b/.test(text)) return false;
      }
      return true;
    })
    .map(j => ({
      id: hashId('joo_' + (j.link || j.id)),
      source: 'Jooble',
      title: j.title || 'Untitled',
      company: j.company || 'Unknown',
      location: j.location || criteria.location || 'India',
      salary: j.salary || '',
      description: stripHtml((j.snippet || '').slice(0, 300)),
      url: j.link,
      posted: j.updated,
      is_remote: /\bremote\b/i.test((j.title || '') + (j.location || ''))
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
