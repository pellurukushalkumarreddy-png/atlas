// Email HTML builder — Atlas-branded digest
// Designed for clean rendering across Gmail, Outlook, mobile

export function buildEmailHtml({ grouped, followUps, totalCount }) {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  const sections = grouped.map(({ criteria, jobs }) => `
    <tr><td style="padding: 24px 0 8px;">
      <div style="font-family: Georgia, serif; font-size: 18px; font-weight: 600; color: #1a0f3e;">
        ${esc(criteria.label)}
        <span style="font-weight: 400; color: #6b6789; font-size: 14px;"> · ${jobs.length} new</span>
      </div>
    </td></tr>
    ${jobs.map(j => jobCard(j)).join('')}
  `).join('');

  const followUpSection = followUps.length ? `
    <tr><td style="padding: 32px 0 8px;">
      <div style="font-family: Georgia, serif; font-size: 18px; font-weight: 600; color: #854F0B;">
        ⏰ Follow-up reminders <span style="font-weight: 400; color: #6b6789; font-size: 14px;"> · ${followUps.length}</span>
      </div>
    </td></tr>
    ${followUps.map(f => `
      <tr><td style="padding: 10px 0;">
        <div style="background: #FAEEDA; border: 1px solid rgba(133,79,11,0.2); border-radius: 12px; padding: 14px 16px;">
          <div style="font-weight: 600; color: #1a1a1a; font-size: 15px;">${esc(f.company)} — ${esc(f.role)}</div>
          <div style="color: #6b6789; font-size: 13px; margin-top: 4px;">${esc(f.reason)}</div>
        </div>
      </td></tr>
    `).join('')}
  ` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><title>Atlas Digest</title></head>
<body style="margin: 0; padding: 20px 12px; background: #f7f5fa; font-family: -apple-system, 'Segoe UI', sans-serif; color: #1a1a1a;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 640px; width: 100%; background: #ffffff; border-radius: 16px; padding: 28px 28px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">

  <!-- Header -->
  <tr><td>
    <div style="font-size: 11px; color: #a78bfa; letter-spacing: 1px; font-weight: 600;">⬢ ATLAS JOB BOT</div>
    <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 500; color: #1a0f3e; margin: 6px 0 4px; letter-spacing: -0.5px;">
      ${totalCount} new opening${totalCount === 1 ? '' : 's'} <em style="font-weight: 400;">for you.</em>
    </h1>
    <div style="font-size: 13px; color: #6b6789;">${today}</div>
  </td></tr>

  <!-- Sections -->
  ${sections || `<tr><td style="padding: 24px 0;"><div style="text-align: center; color: #6b6789;">No new jobs today, but check back tomorrow!</div></td></tr>`}

  <!-- Follow-ups -->
  ${followUpSection}

  <!-- Footer -->
  <tr><td style="padding-top: 32px; border-top: 1px solid #eeebf7; margin-top: 24px;">
    <div style="font-size: 12px; color: #a8a4c7; text-align: center; line-height: 1.6;">
      Atlas Job Bot · runs daily at 7 AM IST<br/>
      Sources: Adzuna · Remotive · Jooble<br/>
      Need to change your saved searches? Edit <code>src/config.js</code> and redeploy.
    </div>
  </td></tr>

</table>
</body></html>`;
}

function jobCard(j) {
  const sourceColor = {
    'Adzuna':   { bg: '#E6F1FB', fg: '#185FA5' },
    'Remotive': { bg: '#EAF3DE', fg: '#3B6D11' },
    'Jooble':   { bg: '#FAEEDA', fg: '#854F0B' }
  }[j.source] || { bg: '#F1EFE8', fg: '#5F5E5A' };

  const addToAtlasUrl = buildAddToAtlasUrl(j);
  const remoteTag = j.is_remote ? `<span style="background: #EEEDFE; color: #3C3489; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 100px; margin-left: 6px;">🌍 REMOTE</span>` : '';

  return `
    <tr><td style="padding: 8px 0;">
      <div style="background: #fafafa; border: 1px solid #eeebf7; border-radius: 12px; padding: 16px 18px;">
        <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">
          ${esc(j.title)}${remoteTag}
        </div>
        <div style="font-size: 14px; color: #6b6789; margin-bottom: 8px;">
          ${esc(j.company)} · ${esc(j.location)}${j.salary ? ' · ' + esc(j.salary) : ''}
        </div>
        ${j.description ? `<div style="font-size: 13px; color: #6b6789; line-height: 1.5; margin-bottom: 12px;">${esc(j.description.slice(0, 200))}${j.description.length > 200 ? '…' : ''}</div>` : ''}
        <div style="margin-top: 10px;">
          <span style="background: ${sourceColor.bg}; color: ${sourceColor.fg}; font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 100px; letter-spacing: 0.3px;">${j.source}</span>
          &nbsp;
          <a href="${esc(j.url)}" style="display: inline-block; background: #1a0f3e; color: #fff; text-decoration: none; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; margin-right: 4px;">Apply →</a>
          <a href="${esc(addToAtlasUrl)}" style="display: inline-block; background: linear-gradient(135deg, #a78bfa, #f0abfc); color: #1a0f3e; text-decoration: none; padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;">+ Add to Atlas</a>
        </div>
      </div>
    </td></tr>
  `;
}

function buildAddToAtlasUrl(j) {
  // We'll wire this into Atlas itself so when you click it opens Atlas with the job prefilled
  // For now, this is a URL Atlas can read query params from
  // You can host Atlas anywhere — locally with `file://` won't work for URL params,
  // but if you host it on GitHub Pages or Netlify (free), this works.
  const params = new URLSearchParams({
    add_job: '1',
    company: j.company,
    role: j.title,
    location: j.location,
    source: j.source,
    link: j.url
  });
  // CHANGE this to wherever you host Atlas (or leave as a placeholder)
  return `https://YOUR-ATLAS-URL.example/#${params.toString()}`;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
