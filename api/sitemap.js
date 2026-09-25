const ORIGIN = 'https://browser.salla-shop.com';
function escapeXml(value=''){return String(value).replace(/[<>&'\"]/g,(ch)=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[ch]));}
export default async function handler(_req,res){
  const fixed=[['/','2026-09-25','1.0'],['/explore','2026-09-25','0.9']];
  let apps=[];
  const url=process.env.VITE_SUPABASE_URL; const key=process.env.VITE_SUPABASE_ANON_KEY;
  if(url&&key){try{const response=await fetch(`${url}/rest/v1/apps?select=slug,updated_at&status=eq.published&order=updated_at.desc`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});if(response.ok)apps=await response.json();}catch(error){console.error('[SITEMAP][FETCH]',error);}}
  const rows=[...fixed.map(([path,lastmod,priority])=>({loc:`${ORIGIN}${path}`,lastmod,priority})),...apps.map((app)=>({loc:`${ORIGIN}/apps/${encodeURIComponent(app.slug)}`,lastmod:app.updated_at||new Date().toISOString(),priority:'0.8'}))];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.map((row)=>`  <url><loc>${escapeXml(row.loc)}</loc><lastmod>${escapeXml(row.lastmod)}</lastmod><changefreq>weekly</changefreq><priority>${row.priority}</priority></url>`).join('\n')}\n</urlset>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8'); res.setHeader('Cache-Control','public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'); return res.status(200).send(xml);
}
