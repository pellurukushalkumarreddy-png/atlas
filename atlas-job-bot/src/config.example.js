// Atlas Job Bot — example configuration
// Copy this file to `config.js` and edit with your real values:
//   cp src/config.example.js src/config.js
// (`config.js` is gitignored so your email won't be public)

export const CONFIG = {
  // Where to send the daily digest
  your_email: 'YOUR_EMAIL_HERE@gmail.com',

  // Name shown in the email's "from" field
  bot_name: 'Atlas Job Bot',

  // Your saved searches. Each one runs every morning.
  criteria: [
    {
      label: '🤖 AI / ML — Entry Level',
      keywords: ['machine learning', 'AI engineer', 'ML engineer', 'data scientist'],
      location: 'Bangalore',
      country: 'in',
      max_days_old: 7,
      include_remote: true
    },
    {
      label: '💻 Software — Entry Level Bangalore',
      keywords: ['software engineer', 'SDE', 'developer', 'fresher'],
      location: 'Bangalore',
      country: 'in',
      max_days_old: 7,
      include_remote: false
    },
    {
      label: '🇮🇳 Software — Anywhere in India',
      keywords: ['software engineer', 'SDE 1', 'junior developer', 'graduate engineer'],
      location: 'India',
      country: 'in',
      max_days_old: 7,
      include_remote: false
    },
    {
      label: '🌍 Remote — Entry Level Tech',
      keywords: ['junior', 'entry level', 'intern', 'graduate'],
      location: '',
      country: 'in',
      max_days_old: 5,
      include_remote: true,
      remote_only: true
    }
  ],

  // Atlas URL — fill this after hosting Atlas (GitHub Pages, Netlify, etc.)
  atlas_jobs_url: '',
  follow_up_after_days: 7,

  max_results_per_search: 10,
  max_total_jobs_in_email: 30
};
