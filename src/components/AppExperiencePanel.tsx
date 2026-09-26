import { Activity, BadgeCheck, ExternalLink, Flag, Globe2, Link2, Pin, PinOff, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { probeAppHealth, type ProbeResult } from '../lib/health';
import { getQuickAppIds, toggleQuickApp } from '../lib/quickApps';
import { safeHostname } from '../lib/url';
import type { DirectoryApp } from '../types';
import { ReportAppDialog } from './ReportAppDialog';

export function AppExperiencePanel({ app }: { app: DirectoryApp }) {
  const { language }=useLanguage(); const ar=language==='ar';
  const [quick,setQuick]=useState(()=>getQuickAppIds().includes(app.id));
  const [reportOpen,setReportOpen]=useState(false);
  const [probe,setProbe]=useState<ProbeResult|null>(app.health_probe_status?{app_id:app.id,probe_status:app.health_probe_status,http_status:app.health_last_http_status??null,latency_ms:app.health_latency_ms??null,checked_at:app.health_checked_at??null}:null);
  const [checking,setChecking]=useState(false); const [linkCopied,setLinkCopied]=useState(false);
  useEffect(()=>{const f=()=>setQuick(getQuickAppIds().includes(app.id));window.addEventListener('salla-quick-apps-updated',f);return()=>window.removeEventListener('salla-quick-apps-updated',f)},[app.id]);
  const check=async()=>{setChecking(true);try{const result=await probeAppHealth(app.id);if(result)setProbe(result);}catch{/* non-blocking */}finally{setChecking(false)}};
  const checked=probe?.checked_at?new Intl.DateTimeFormat(ar?'ar-EG':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(probe.checked_at)):ar?'لم يتم التحقق بعد':'Not checked yet';
  const mode=app.embed_mode==='external'?(ar?'يفتح خارجيا':'External'):app.embed_mode==='limited'?(ar?'توافق محدود':'Limited compatibility'):(ar?'داخل Salla Browser':'Inside Salla Browser');
  return <>
    <section className="content-panel mt-5 p-5 sm:p-7"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-cyan-500"/><h2 className="text-lg font-black">{ar?'مركز الثقة والتوافق':'Trust & compatibility'}</h2></div><p className="muted-text mt-2 text-xs font-bold leading-6">{ar?'معلومات تساعدك على معرفة طريقة فتح التطبيق وحالته قبل الاستخدام':'Useful information about how this app opens and its current availability.'}</p></div><div className="flex flex-wrap gap-2"><button className="secondary-button" onClick={()=>{setQuick(toggleQuickApp(app.id))}}>{quick?<PinOff/>:<Pin/>}{ar?(quick?'إزالة من الوصول السريع':'إضافة للوصول السريع'):(quick?'Remove quick app':'Add to quick apps')}</button><button className="secondary-button" onClick={async()=>{const link=`${window.location.origin}/open/${encodeURIComponent(app.slug)}`;try{await navigator.clipboard.writeText(link);setLinkCopied(true);window.setTimeout(()=>setLinkCopied(false),1800)}catch{window.prompt(ar?'انسخ رابط الفتح المباشر':'Copy direct open link',link)}}}><Link2/>{linkCopied?(ar?'تم النسخ':'Copied'):(ar?'رابط فتح مباشر':'Direct open link')}</button><button className="secondary-button" onClick={()=>setReportOpen(true)}><Flag/>{ar?'إبلاغ عن مشكلة':'Report issue'}</button></div></div><div className="trust-grid mt-5"><div className="trust-item"><BadgeCheck/><div><strong>{ar?'المراجعة':'Review'}</strong><span>{app.verified?(ar?'موثق من الإدارة':'Verified by administration'):(ar?'مدرج بدون شارة توثيق':'Listed without verification badge')}</span></div></div><div className="trust-item"><Globe2/><div><strong>{ar?'النطاق':'Domain'}</strong><span dir="ltr">{safeHostname(app.website_url)}</span></div></div><div className="trust-item"><ExternalLink/><div><strong>{ar?'طريقة الفتح':'Open mode'}</strong><span>{mode}</span></div></div><div className="trust-item"><Activity/><div><strong>{ar?'التحقق من الاتصال':'Connectivity check'}</strong><span>{probe?.probe_status==='online'?(ar?'متصل':'Reachable'):probe?.probe_status==='offline'?(ar?'غير متصل':'Unreachable'):(ar?'غير معروف':'Unknown')} · {checked}</span></div></div></div><div className="mt-4 flex flex-wrap items-center gap-2"><button className="secondary-button compact-action" disabled={checking} onClick={()=>void check()}>{checking?<span className="button-spinner"/>:<RefreshCw/>}{ar?'تحقق الآن':'Check now'}</button>{probe?.latency_ms!=null&&<span className="pill">{probe.latency_ms} ms</span>}{probe?.http_status!=null&&<span className="pill">HTTP {probe.http_status}</span>}</div></section>
    <ReportAppDialog open={reportOpen} onClose={()=>setReportOpen(false)} appId={app.id} appName={app.name}/>
  </>;
}
