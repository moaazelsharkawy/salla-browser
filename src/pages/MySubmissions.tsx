import { Clock3, FileCheck2, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { AppSubmission } from '../types';

export default function MySubmissions() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [items, setItems] = useState<AppSubmission[]>([]);
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    supabase.from('app_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setItems((data ?? []) as AppSubmission[]));
  }, [user]);
  const label = (status: AppSubmission['status']) => ({ pending: language === 'ar' ? 'قيد المراجعة' : 'Pending', approved: language === 'ar' ? 'مقبول' : 'Approved', rejected: language === 'ar' ? 'مرفوض' : 'Rejected', changes_requested: language === 'ar' ? 'تعديلات مطلوبة' : 'Changes requested' })[status];
  return <div className="page-container py-7 sm:py-10"><SectionTitle icon={Send} title={language === 'ar' ? 'طلبات الإدراج' : 'My submissions'} description={language === 'ar' ? 'تابع حالة التطبيقات التي أرسلتها' : 'Track the apps you submitted'} />{items.length ? <div className="space-y-3">{items.map((item) => <div key={item.id} className="content-panel p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{item.app_name}</h3><p className="mt-1 text-[11px] font-semibold text-slate-500" dir="ltr">{item.website_url}</p></div><span className="pill"><Clock3 className="h-3.5 w-3.5" />{label(item.status)}</span></div>{item.review_note && <div className="mt-3 rounded-xl bg-white/[0.035] p-3 text-xs font-semibold leading-6 text-slate-300"><FileCheck2 className="mb-2 h-4 w-4 text-cyan-300" />{item.review_note}</div>}</div>)}</div> : <div className="empty-panel">{language === 'ar' ? 'لا توجد طلبات إدراج حتى الآن.' : 'No submissions yet.'}</div>}</div>;
}
