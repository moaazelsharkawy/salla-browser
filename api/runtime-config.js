function publicValue(primary, fallback) {
  const value = process.env[primary] || process.env[fallback] || '';
  return typeof value === 'string' ? value.trim() : '';
}

export default function handler(_req, res) {
  const config = {
    SUPABASE_URL: publicValue('SUPABASE_URL', 'VITE_SUPABASE_URL'),
    SUPABASE_ANON_KEY: publicValue('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'),
    SITE_URL: publicValue('SITE_URL', 'VITE_SITE_URL') || 'https://browser.salla-shop.com'
  };

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(`window.__SALLA_RUNTIME_CONFIG__=${JSON.stringify(config)};`);
}
