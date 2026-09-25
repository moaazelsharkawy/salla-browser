import { Blocks, Download, Globe2, Send, ShieldCheck, ShoppingBag, WalletCards, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePwaInstall } from '../hooks/usePwaInstall';

const SESSION_KEY = 'salla-browser-intro-seen-v2';

export function SessionIntro() {
  const { language } = useLanguage(); const location = useLocation(); const { canInstall, install } = usePwaInstall();
  const [visible,setVisible]=useState(false); const [slide,setSlide]=useState(0);
  useEffect(()=>{if(location.pathname!=='/')return;try{if(sessionStorage.getItem(SESSION_KEY))return;sessionStorage.setItem(SESSION_KEY,'1');setVisible(true);}catch{setVisible(true);}},[location.pathname]);
  if(!visible)return null; const ar=language==='ar'; const close=()=>setVisible(false);
  return <div className="intro-overlay" role="dialog" aria-modal="true" aria-label={ar?'مقدمة Salla Browser':'Salla Browser introduction'}>
    <div className="intro-shell"><button className="intro-close" onClick={close} aria-label={ar?'تخطي':'Skip'}><X className="h-5 w-5"/></button>
      <div className="intro-visual" aria-hidden="true"><img src="/icons/icon-192.png" className="intro-logo" alt=""/><span className="intro-node intro-node-a"><Blocks className="h-5 w-5"/></span><span className="intro-node intro-node-b"><Globe2 className="h-5 w-5"/></span><span className="intro-node intro-node-c telegram-node"><Send className="h-5 w-5"/></span><span className="intro-node intro-node-d"><ShoppingBag className="h-5 w-5"/></span><span className="intro-node intro-node-e"><WalletCards className="h-5 w-5"/></span><span className="intro-node intro-node-f"><ShieldCheck className="h-5 w-5"/></span></div>
      {slide===0?<div className="intro-copy"><span className="intro-kicker">Salla Browser</span><h1>{ar?'اكتشف منظومة Salla بهوية Web3 حديثة':'Discover the Salla ecosystem with a modern Web3 identity'}</h1><p>{ar?'تطبيقات موثوقة فلاتر حسب الدولة تثبيت محلي وبحث ويب مباشر من تجربة سريعة وخفيفة':'Trusted apps, country filters, local pinning, and direct web search in one fast lightweight experience.'}</p><div className="intro-feature-row"><span><ShieldCheck className="h-4 w-4"/>{ar?'مراجعة قبل النشر':'Reviewed apps'}</span><span><Blocks className="h-4 w-4"/>Web3</span><span><Send className="h-4 w-4"/>{ar?'تطبيقات اجتماعية':'Social apps'}</span></div></div>:
      <div className="intro-copy"><span className="intro-kicker">{ar?'اكتشف وثبت':'Discover & pin'}</span><h1>{ar?'المستخدم العادي لا يحتاج حسابا':'Regular users do not need an account'}</h1><p>{ar?'ثبت تطبيقاتك المفضلة على الجهاز وابحث في الدليل والويب الحساب مخصص فقط للمطورين الذين يريدون إدراج تطبيقاتهم ومتابعة المراجعة':'Pin favorite apps on your device and browse freely. Accounts are only for developers submitting and tracking app listings.'}</p><div className="intro-search-demo"><Globe2 className="h-5 w-5"/><span>{ar?'ابحث في التطبيقات أو الويب':'Search apps or the web'}</span></div></div>}
      <div className="intro-footer"><div className="intro-dots" aria-hidden="true"><span className={slide===0?'is-active':''}/><span className={slide===1?'is-active':''}/></div><div className="intro-actions">{slide===0?<button className="primary-button intro-main-button" onClick={()=>setSlide(1)}>{ar?'التالي':'Next'}</button>:<>{canInstall&&<button className="secondary-button" onClick={()=>void install()}><Download className="h-4 w-4"/>{ar?'تثبيت':'Install'}</button>}<button className="primary-button intro-main-button" onClick={close}>{ar?'ابدأ الاستكشاف':'Start exploring'}</button></>}</div></div>
    </div>
  </div>;
}
