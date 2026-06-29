// Adzuna API — Indian job aggregator
// Docs: https://developer.adzuna.com/
// Free tier: 250 calls/month
// Returns: Indeed + several other Indian sources

export async function searchAdzuna(criteria, env) {
  const country = (criteria.country || 'in').toLowerCase();
  const whatPhrase = criteria.keywords.join(' OR ');

  const params = new URLSearchParams({
    app_id: env.ADZUNA_APP_ID,
    app_key: env.ADZUNA_APP_KEY,
    results_per_page: '15',
    'what_or': whatPhrase,
    'where': criteria.location || '',
    'max_days_old': String(criteria.max_days_old || 7),
    'sort_by': 'date',
    'content-type': 'application/json'
  });

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Adzuna ${r.status}: ${await r.text().then(t => t.slice(0, 200))}`);

  const data = await r.json();
  const results = data.results || [];

  return results.map(j => ({
    id: hashId('adz_' + (j.redirect_url || j.id)),
    source: 'Adzuna',
    title: j.title || 'Untitled',
    company: (j.company && j.company.display_name) || 'Unknown',
    location: (j.location && j.location.display_name) || criteria.location || 'India',
    salary: formatSalary(j.salary_min, j.salary_max, 'INR'),
    description: stripHtml((j.description || '').slice(0, 300)),
    url: j.redirect_url,
    posted: j.created,
    is_remote: detectRemote(j.title, j.description, j.location && j.location.display_name)
  }));
}

function formatSalary(min, max, currency) {
  if (!min && !max) return '';
  const fmt = (n) => {
    if (!n) return '';
    if (n >= 100000) return (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return String(n);
  };
  if (min && max) return `${currency} ${fmt(min)}-${fmt(max)}`;
  return `${currency} ${fmt(min || max)}+`;
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function detectRemote(title, desc, loc) {
  const s = ((title || '') + ' ' + (desc || '') + ' ' + (loc || '')).toLowerCase();
  return /\b(remote|wfh|work from home|anywhere)\b/.test(s);
}

function hashId(s) {
  // Simple stable string hash (FNV-1a)
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'j' + (h >>> 0).toString(36);
}
