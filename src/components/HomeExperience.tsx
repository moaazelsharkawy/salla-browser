import { Clock3, Flame, Layers3, Pin, Rocket } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCountry } from '../contexts/CountryContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getQuickAppIds } from '../lib/quickApps';
import { getRecentApps } from '../lib/recent';
import type { DirectoryApp } from '../types';

function Mini({app}:{app:DirectoryApp}){return <Link to={`/browse?app=${encodeURIComponent(app.slug)}`} className="experience-mini-app"><div className="experience-mini-icon">{app.icon_url?<img src={app.icon_url} alt=""/>:<Rocket/>}</div><span>{app.name}</span></Link>}

export function HomeExperience({ apps, quiet }: { apps:DirectoryApp[]; quiet:boolean }) {
  const { language }=useLanguage(); const { country }=useCountry(); const ar=language==='ar';
  const [tick,setTick]=useState(0);
  useEffect(()=>{const f=()=>setTick((x)=>x+1);window.addEventListener('salla-quick-apps-updated',f);window.addEventListener('salla-recent-updated',f);return()=>{window.removeEventListener('salla-quick-apps-updated',f);window.removeEventListener('salla-recent-updated',f)}},[]);
  const quickIds=useMemo(()=>getQuickAppIds(),[tick]);
  const recent=useMemo(()=>getRecentApps(),[tick]);
  const quick=quickIds.map(id=>apps.find(a=>a.id===id)).filter(Boolean).slice(0,6) as DirectoryApp[];
  const counts=new Map(recent.map(r=>[r.id,r.open_count||1]));
  const mostUsed=[...apps].filter(a=>counts.has(a.id)).sort((a,b)=>(counts.get(b.id)||0)-(counts.get(a.id)||0)).slice(0,4);
  const newest=[...apps].sort((a,b)=>new Date(b.published_at||b.created_at).getTime()-new Date(a.published_at||a.created_at).getTime()).slice(0,4);
  const countryApps=apps.filter(a=>country==='ALL'||a.supported_countries.includes('ALL')||a.supported_countries.includes(country)).slice(0,4);
  if(quiet)return null;
  return <section className="experience-hub mt-8"><div className="experience-hub-head"><div><h2>{ar?'الوصول الذكي':'Smart access'}</h2><p>{ar?'اختصارات مبنية على استخدامك ودولتك بدون الحاجة إلى حساب':'Shortcuts based on your device usage and country — no account required.'}</p></div><Link to="/history" className="secondary-button compact-action"><Clock3/>{ar?'السجل':'History'}</Link></div>{quick.length>0&&<div className="experience-strip"><div className="experience-label"><Pin/>{ar?'الوصول السريع':'Quick apps'}</div><div className="experience-mini-grid">{quick.map(a=><Mini key={a.id} app={a}/>)}</div></div>}<div className="experience-collections"><div><div className="experience-label"><Flame/>{ar?'الأكثر استخداما لديك':'Your most used'}</div><div className="experience-mini-grid">{mostUsed.length?mostUsed.map(a=><Mini key={a.id} app={a}/>):<span className="experience-empty">{ar?'سيظهر هنا بعد استخدام بعض التطبيقات':'Appears after you use some apps'}</span>}</div></div><div><div className="experience-label"><Layers3/>{ar?'جديد في الدليل':'New in directory'}</div><div className="experience-mini-grid">{newest.map(a=><Mini key={a.id} app={a}/>)}</div></div><div><div className="experience-label"><Rocket/>{ar?'مناسب لدولتك':'Available for your country'}</div><div className="experience-mini-grid">{countryApps.map(a=><Mini key={a.id} app={a}/>)}</div></div></div></section>;
}
