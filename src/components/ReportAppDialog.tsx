import { Flag, Send, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function ReportAppDialog({ open, onClose, appId, appName, source = 'details' }: { open:boolean; onClose:()=>void; appId:string; appName:string; source?:string }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const ar = language === 'ar';
  const [reason,setReason]=useState('not_working');
  const [details,setDetails]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<string|null>(null);
  if(!open || typeof document === 'undefined') return null;

  const submit=async()=>{
    if(!isSupabaseConfigured){setMessage(ar?'تعذر إرسال البلاغ حاليا':'Reporting is unavailable right now');return;}
    setBusy(true); setMessage(null);
    const clientInfo={ ua:navigator.userAgent.slice(0,350), language:navigator.language, online:navigator.onLine, path:location.pathname };
    const { error }=await supabase.from('app_reports').insert({user_id:user?.id ?? null,app_id:appId,reason,details:details.trim()||null,source,client_info:clientInfo});
    setBusy(false);
    if(error){setMessage(ar?'تعذر إرسال البلاغ حاول مرة أخرى':'Could not send the report. Please try again.');return;}
    setMessage(ar?'تم إرسال البلاغ للإدارة':'Report sent to the administration');
    window.setTimeout(()=>{setMessage(null);setDetails('');onClose();},1100);
  };

  return createPortal(<div className="account-overlay" onMouseDown={onClose}><section className="account-dialog report-dialog" onMouseDown={(e)=>e.stopPropagation()} role="dialog" aria-modal="true"><div className="account-dialog-head"><div><p className="text-lg font-black">{ar?'الإبلاغ عن مشكلة':'Report an issue'}</p><p className="muted-text mt-1 text-xs font-bold">{appName}</p></div><button className="icon-button h-10 w-10" onClick={onClose}><X/></button></div><div className="mt-4 space-y-4"><label className="field-block"><span>{ar?'نوع المشكلة':'Issue type'}</span><select value={reason} onChange={(e)=>setReason(e.target.value)}><option value="not_working">{ar?'التطبيق لا يعمل':'App not working'}</option><option value="login_problem">{ar?'مشكلة تسجيل الدخول':'Login problem'}</option><option value="unsafe_content">{ar?'محتوى غير مناسب أو مشبوه':'Unsafe or suspicious content'}</option><option value="wrong_info">{ar?'معلومات التطبيق غير صحيحة':'Incorrect app information'}</option><option value="other">{ar?'مشكلة أخرى':'Other issue'}</option></select></label><label className="field-block"><span>{ar?'تفاصيل إضافية':'Additional details'}</span><textarea value={details} onChange={(e)=>setDetails(e.target.value)} maxLength={800} placeholder={ar?'اكتب ما حدث باختصار':'Briefly describe what happened'} /></label>{message&&<div className="form-message">{message}</div>}<button className="primary-button w-full" disabled={busy} onClick={()=>void submit()}>{busy?<span className="button-spinner"/>:<Send/>}{ar?'إرسال البلاغ':'Send report'}</button><p className="muted-text text-center text-[10px] font-bold"><Flag className="me-1 inline h-3.5 w-3.5"/>{ar?'لا يتم إرسال كلمات مرور أو بيانات دفع':'Passwords and payment data are never requested'}</p></div></section></div>,document.body);
}
