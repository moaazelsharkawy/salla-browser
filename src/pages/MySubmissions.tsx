import { Clock3, FileCheck2, Pencil, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { AppSubmission, DirectoryApp } from '../types';

export default function MySubmissions() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [items, setItems] = useState<AppSubmission[]>([]);
  const [apps, setApps] = useState<DirectoryApp[]>([]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    Promise.all([
      supabase.from('app_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('apps').select('*').eq('created_by', user.id).order('updated_at', { ascending: false })
    ]).then(([submissionsResult, appsResult]) => {
      setItems((submissionsResult.data ?? []) as AppSubmission[]);
      setApps((appsResult.data ?? []) as DirectoryApp[]);
    });
  }, [user]);

  const label = (status: AppSubmission['status']) => ({ pending: language === 'ar' ? 'قيد المراجعة' : 'Pending', approved: language === 'ar' ? 'مقبول' : 'Approved', rejected: language === 'ar' ? 'مرفوض' : 'Rejected', changes_requested: language === 'ar' ? 'تعديلات مطلوبة' : 'Changes requested' })[status];
  const appStatus = (status: DirectoryApp['status']) => ({ draft: language === 'ar' ? 'مسودة' : 'Draft', published: language === 'ar' ? 'منشور' : 'Published', suspended: language === 'ar' ? 'موقوف' : 'Suspended' })[status];

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Send} title={language === 'ar' ? 'تطبيقاتي وطلبات المراجعة' : 'My apps and reviews'} description={language === 'ar' ? 'عدل بيانات تطبيقاتك وتابع حالة المراجعة' : 'Update your apps and track review status'} />

    {apps.length > 0 && <section className="mb-6">
      <h2 className="mb-3 text-sm font-black">{language === 'ar' ? 'تطبيقاتي' : 'My apps'}</h2>
      <div className="grid gap-3 md:grid-cols-2">{apps.map((app) => <div key={app.id} className="content-panel p-4 sm:p-5"><div className="flex items-start gap-3"><div className="app-icon h-12 w-12 shrink-0 overflow-hidden rounded-xl">{app.icon_url && <img src={app.icon_url} className="h-full w-full object-cover" alt="" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{app.name}</h3><span className="pill">v{app.version || '1.0.0'}</span><span className="pill">{appStatus(app.status)}</span></div><p className="mt-1 truncate text-[11px] font-semibold text-slate-500" dir="ltr">{app.website_url}</p></div></div><Link to={`/submit?app=${encodeURIComponent(app.id)}`} className="secondary-button mt-4 w-full"><Pencil className="h-4 w-4" />{language === 'ar' ? 'تعديل بيانات التطبيق' : 'Update app details'}</Link></div>)}</div>
    </section>}

    <h2 className="mb-3 text-sm font-black">{language === 'ar' ? 'طلبات المراجعة' : 'Review requests'}</h2>
    {items.length ? <div className="space-y-3">{items.map((item) => <div key={item.id} className="content-panel p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{item.app_name}</h3><span className="pill">v{item.app_version || '1.0.0'}</span><span className="pill">{item.submission_type === 'update' ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'إدراج جديد' : 'New listing')}</span></div><p className="mt-1 text-[11px] font-semibold text-slate-500" dir="ltr">{item.website_url}</p></div><span className="pill"><Clock3 className="h-3.5 w-3.5" />{label(item.status)}</span></div>{item.review_note && <div className="mt-3 rounded-xl bg-white/[0.035] p-3 text-xs font-semibold leading-6 text-slate-300"><FileCheck2 className="mb-2 h-4 w-4 text-cyan-300" />{item.review_note}</div>}</div>)}</div> : <div className="empty-panel">{language === 'ar' ? 'لا توجد طلبات مراجعة حتى الآن' : 'No review requests yet'}</div>}
  </div>;
}
