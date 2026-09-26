import { CircleDollarSign, Clock3, FileCheck2, Pencil, RefreshCw, Send, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { paymentStatusLabel } from '../lib/developerListing';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { AppSubmission, DirectoryApp } from '../types';

export default function MySubmissions() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const [items, setItems] = useState<AppSubmission[]>([]);
  const [apps, setApps] = useState<DirectoryApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    const [submissionsResult, appsResult] = await Promise.all([
      supabase.from('app_submissions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('apps').select('*').eq('created_by', user.id).order('updated_at', { ascending: false })
    ]);
    setItems((submissionsResult.data ?? []) as AppSubmission[]);
    setApps((appsResult.data ?? []) as DirectoryApp[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const result = params.get('payment');
    const submissionId = params.get('submission');
    if (result === 'cancelled') setMessage(language === 'ar' ? 'تم إلغاء عملية الدفع ويمكنك استكمالها لاحقا' : 'Payment was cancelled You can continue later');
    if (result !== 'success' || !submissionId) return;
    setMessage(language === 'ar' ? 'تم الرجوع من صفحة الدفع وجار التحقق من العملية' : 'Returned from checkout Verifying payment');
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      await refresh();
      const { data } = await supabase.from('app_submissions').select('payment_status').eq('id', submissionId).maybeSingle();
      if (data?.payment_status === 'paid') {
        setMessage(language === 'ar' ? 'تم تأكيد الدفع وأصبح الطلب قيد المراجعة' : 'Payment confirmed Your request is now ready for review');
        window.clearInterval(timer);
      } else if (attempts >= 8) {
        setMessage(language === 'ar' ? 'قد يستغرق تأكيد الدفع لحظات يمكنك تحديث الحالة بعد قليل' : 'Payment confirmation may take a moment You can refresh the status shortly');
        window.clearInterval(timer);
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [language, params, refresh]);

  const continuePayment = (item: AppSubmission) => {
    setPayingId(item.id);
    setMessage(null);
    const launcherUrl = `/listing-checkout?submission=${encodeURIComponent(item.id)}`;
    const popup = window.open(launcherUrl, '_blank');
    if (!popup) window.location.assign(launcherUrl);
    setPayingId(null);
  };

  const label = (status: AppSubmission['status']) => ({ pending: language === 'ar' ? 'قيد المراجعة' : 'Pending', approved: language === 'ar' ? 'تمت الموافقة' : 'Approved', rejected: language === 'ar' ? 'مرفوض' : 'Rejected', changes_requested: language === 'ar' ? 'تعديلات مطلوبة' : 'Changes requested' })[status];
  const appStatus = (status: DirectoryApp['status']) => ({ draft: language === 'ar' ? 'مسودة' : 'Draft', published: language === 'ar' ? 'منشور' : 'Published', suspended: language === 'ar' ? 'معلق' : 'Suspended' })[status];

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Send} title={language === 'ar' ? 'تطبيقاتي وطلبات المراجعة' : 'My apps and reviews'} description={language === 'ar' ? 'عدل بيانات تطبيقاتك وتابع حالة المراجعة والدفع' : 'Update your apps and track review and payment status'} action={<button className="secondary-button" onClick={() => void refresh()}><RefreshCw className="h-5 w-5" />{language === 'ar' ? 'تحديث' : 'Refresh'}</button>} />
    {message && <div className="form-message mb-5">{message}</div>}

    {apps.length > 0 && <section className="mb-6"><h2 className="mb-3 text-sm font-black">{language === 'ar' ? 'تطبيقاتي' : 'My apps'}</h2><div className="grid gap-3 md:grid-cols-2">{apps.map((app) => <div key={app.id} className="content-panel p-4 sm:p-5"><div className="flex items-start gap-3"><div className="app-icon h-12 w-12 shrink-0 overflow-hidden rounded-xl">{app.icon_url && <img src={app.icon_url} className="h-full w-full object-cover" alt="" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{app.name}</h3><span className="pill">v{app.version || '1.0.0'}</span><span className="pill">{appStatus(app.status)}</span></div><p className="mt-1 truncate text-[11px] font-semibold text-slate-500" dir="ltr">{app.website_url}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><Link to={`/submit?app=${encodeURIComponent(app.id)}`} className="secondary-button w-full"><Pencil className="h-5 w-5" />{language === 'ar' ? 'تعديل بيانات التطبيق' : 'Update app details'}</Link>{app.status === 'published' && <Link to={`/promote?app=${encodeURIComponent(app.id)}`} className="primary-button w-full"><TrendingUp className="h-5 w-5" />{language === 'ar' ? 'تعزيز الظهور' : 'Promote app'}</Link>}</div></div>)}</div></section>}

    <h2 className="mb-3 text-sm font-black">{language === 'ar' ? 'طلبات المراجعة' : 'Review requests'}</h2>
    {loading ? <div className="empty-panel"><span className="soft-spinner" />{language === 'ar' ? 'جاري تحميل الطلبات' : 'Fetching requests'}</div> : items.length ? <div className="space-y-3">{items.map((item) => {
      const waitingPayment = item.payment_status === 'awaiting_payment';
      const readyForReview = !waitingPayment && item.payment_status !== 'payment_failed';
      return <div key={item.id} className="content-panel p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{item.app_name}</h3><span className="pill">v{item.app_version || '1.0.0'}</span><span className="pill">{item.submission_type === 'update' ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'إدراج جديد' : 'New listing')}</span></div><p className="mt-1 text-[11px] font-semibold text-slate-500" dir="ltr">{item.website_url}</p></div><span className="pill"><Clock3 className="h-3.5 w-3.5" />{waitingPayment ? paymentStatusLabel(item.payment_status, language) : label(item.status)}</span></div>
        {item.submission_type === 'new' && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="pill"><CircleDollarSign className="h-3.5 w-3.5" />{paymentStatusLabel(item.payment_status, language)}</span>{Number(item.listing_price || 0) > 0 && <span className="pill">{Number(item.listing_price).toFixed(2)} Pi</span>}</div>}
        {item.review_note && <div className="mt-3 rounded-xl bg-white/[0.035] p-3 text-xs font-semibold leading-6 text-slate-300"><FileCheck2 className="mb-2 h-4 w-4 text-cyan-300" />{item.review_note}</div>}
        {waitingPayment && <button className="primary-button mt-4 w-full sm:w-auto" disabled={payingId === item.id} onClick={() => continuePayment(item)}><CircleDollarSign className="h-5 w-5" />{payingId === item.id ? (language === 'ar' ? 'جاري تجهيز الدفع' : 'Preparing checkout') : (language === 'ar' ? 'استكمال الدفع' : 'Continue payment')}</button>}
        {!waitingPayment && !readyForReview && <p className="muted-text mt-3 text-xs font-semibold">{language === 'ar' ? 'تعذر التحقق من الدفع تواصل مع الدعم إذا تم خصم المبلغ' : 'Payment could not be verified Contact support if you were charged'}</p>}
      </div>;
    })}</div> : <div className="empty-panel">{language === 'ar' ? 'لا توجد طلبات مراجعة حتى الآن' : 'No review requests yet'}</div>}
  </div>;
}
