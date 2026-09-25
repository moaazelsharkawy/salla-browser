function firstPublicValue(names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function buildConfig() {
  return {
    SUPABASE_URL: firstPublicValue([
      'SUPABASE_URL',
      'VITE_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
    ]),
    SUPABASE_ANON_KEY: firstPublicValue([
      'SUPABASE_ANON_KEY',
      'SUPABASE_PUBLISHABLE_KEY',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    ]),
    SITE_URL: firstPublicValue([
      'SITE_URL',
      'VITE_SITE_URL',
      'NEXT_PUBLIC_SITE_URL',
    ]) || 'https://browser.salla-shop.com',
  };
}

export default function handler(req, res) {
  const config = buildConfig();
  const wantsJson = req.query?.format === 'json' || String(req.headers.accept || '').includes('application/json');

  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (wantsJson) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json(config);
  }

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  return res.status(200).send(`window.__SALLA_RUNTIME_CONFIG__=${JSON.stringify(config)};`);
}
