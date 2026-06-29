// Resend API — email delivery
// Docs: https://resend.com/docs
// Free tier: 3,000 emails/month, 100/day
// We use 1 email/day = ~30/month → 1% of free tier

export async function sendEmail({ to, from, fromName, subject, html, apiKey }) {
  if (!apiKey) throw new Error('RESEND_KEY not set');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${fromName} <${from}>`,
      to: [to],
      subject,
      html
    })
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Resend ${r.status}: ${text.slice(0, 300)}`);
  }
  return await r.json();
}
