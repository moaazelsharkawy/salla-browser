import { CalendarDays, Crown, Megaphone, Rocket, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createPromotionRequest, DEFAULT_PROMOTION_SETTINGS, loadPromotionSettings, promotionError } from '../lib/promotions';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { AppPromotion, DeveloperPromotionSettings, DirectoryApp, PromotionKind } from '../types';

export default function PromoteApp() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const appId = params.get('app') || '';
  const paymentResult = params.get('payment');
  const promotionParam = params.get('promotion');
  const [app, setApp] = useState<DirectoryApp | null>(null);
  const [settings, setSettings] = useState<DeveloperPromotionSettings>(DEFAULT_PROMOTION_SETTINGS);
  const [history, setHistory] = useState<AppPromotion[]>([]);
  const [kind, setKind] = useState<PromotionKind>('boost');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !appId || !isSupabaseConfigured) return;
    const [appResult, promoResult, cfg] = await Promise.all([
      supabase.from('apps').select('*').eq('id', appId).eq('created_by', user.id).maybeSingle(),
      supabase.from('app_promotions').select('*').eq('app_id', appId).eq('user_id', user.id).order('created_at', { ascending: false }),
      loadPromotionSettings(),
    ]);
    setApp((appResult.data as DirectoryApp | null) ?? null);
    setHistory((promoResult.data ?? []) as AppPromotion[]);
    setSettings(cfg);
    setLoading(false);
  }, [appId, user]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (paymentResult === 'cancelled') setMessage(language === 'ar' ? 'تم إلغاء الدفع ويمكنك المحاولة لاحقا' : 'Payment was cancelled You can try again later');
    if (paymentResult !== 'success' || !promotionParam) return;
    setMessage(language === 'ar' ? 'تم الرجوع من صفحة الدفع وجار انتظار تأكيد العملية' : 'Returned from checkout Waiting for payment confirmation');
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      const { data } = await supabase.from('app_promotions').select('status').eq('id', promotionParam).maybeSingle();
      if (data?.status === 'active') {
        setMessage(language === 'ar' ? 'تم تأكيد الدفع وتفعيل الحملة بنجاح' : 'Payment confirmed Promotion is now active');
        window.clearInterval(timer);
        await refresh();
      } else if (attempts >= 8) {
        setMessage(language === 'ar' ? 'لم يصل تأكيد الدفع بعد يمكنك تحديث الصفحة لاحقا' : 'Payment confirmation has not arrived yet You can refresh later');
        window.clearInterval(timer);
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [language, paymentResult, promotionParam, refresh]);

  const enabled = kind === 'boost' ? settings.boost_enabled : settings.home_ad_enabled;
  const dailyPrice = kind === 'boost' ? settings.boost_daily_price : settings.home_ad_daily_price;
  const maxDays = kind === 'boost' ? settings.boost_max_days : settings.home_ad_max_days;
  const total = useMemo(() => Math.max(1, days) * dailyPrice, [dailyPrice, days]);

  const start = async () => {
    if (!app || !enabled) return;
    const checkoutWindow = window.open('/promotion-checkout', '_blank');
    setBusy(true); setMessage(null);
    try {
      const promotionId = await createPromotionRequest(app.id, kind, days);
      const launcher = `/promotion-checkout?promotion=${encodeURIComponent(promotionId)}`;
      if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.location.replace(launcher);
      else window.location.assign(launcher);
    } catch (error) {
      if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.location.replace('/promotion-checkout?error=request');
      setMessage(promotionError(error instanceof Error ? error.message : '', language));
    } finally { setBusy(false); }
  };

  if (loading) return <div className="page-container py-20 text-center"><span className="soft-spinner" />{language === 'ar' ? 'جاري تحميل إعدادات الترويج' : 'Loading promotion settings'}</div>;
  if (!app) return <div className="page-container py-20"><div className="empty-panel">{language === 'ar' ? 'التطبيق غير موجود أو لا تملك صلاحية إدارته' : 'App not found or you cannot manage it'}</div></div>;

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Rocket} title={language === 'ar' ? 'تعزيز ظهور التطبيق' : 'Promote app'} description={language === 'ar' ? 'اختر حملة واضحة للمستخدم مع الدفع عبر Salla Shop' : 'Choose a clearly labeled promotion and pay through Salla Shop'} action={<Link to="/my-submissions" className="secondary-button">{language === 'ar' ? 'تطبيقاتي' : 'My apps'}</Link>} />
    {message && <div className="form-message mb-5">{message}</div>}
    <section className="content-panel p-5 sm:p-7">
      <div className="flex items-center gap-3"><div className="app-icon h-14 w-14 overflow-hidden rounded-2xl">{app.icon_url && <img src={app.icon_url} className="h-full w-full object-cover" alt="" />}</div><div><h2 className="text-lg font-black">{app.name}</h2><p className="muted-text mt-1 text-xs">{language === 'ar' ? 'الترويج لا يغير التقييم العضوي للتطبيق' : 'Promotion does not alter the app rating'}</p></div></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setKind('boost')} className={`promotion-choice ${kind === 'boost' ? 'promotion-choice-active' : ''}`}><Rocket className="h-6 w-6" /><div><strong>{language === 'ar' ? 'تعزيز داخل الدليل' : 'Directory boost'}</strong><p>{language === 'ar' ? 'يرفع التطبيق داخل قسمه مع شارة مروج واضحة' : 'Moves the app higher in its category with a Promoted label'}</p></div></button>
        <button type="button" onClick={() => setKind('home_ad')} className={`promotion-choice ${kind === 'home_ad' ? 'promotion-choice-active' : ''}`}><Megaphone className="h-6 w-6" /><div><strong>{language === 'ar' ? 'إعلان الصفحة الرئيسية' : 'Home page ad'}</strong><p>{language === 'ar' ? 'يظهر في مساحة إعلانات مميزة على الرئيسية' : 'Appears in a dedicated sponsored area on the home page'}</p></div></button>
      </div>
      {!enabled && <div className="developer-listing-warning mt-5"><ShieldCheck className="h-5 w-5" /><div><strong>{language === 'ar' ? 'هذه الحملة متوقفة مؤقتا' : 'This promotion type is temporarily unavailable'}</strong></div></div>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="field-block"><span>{language === 'ar' ? 'مدة الحملة بالأيام' : 'Campaign duration in days'}</span><div className="field-shell"><CalendarDays className="field-leading-icon" /><input type="number" min={1} max={maxDays} value={days} onChange={(e) => setDays(Math.max(1, Math.min(maxDays, Number(e.target.value) || 1)))} /></div><small>{language === 'ar' ? `الحد الأقصى ${maxDays} يوم` : `Maximum ${maxDays} days`}</small></label><div className="promotion-total"><Crown className="h-6 w-6" /><div><span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span><strong>{total.toFixed(2)} Pi</strong><small>{dailyPrice.toFixed(2)} Pi {language === 'ar' ? 'لليوم' : 'per day'}</small></div></div></div>
      <button className="primary-button mt-6 w-full sm:w-auto" disabled={!enabled || busy || days < 1 || days > maxDays} onClick={() => void start()}>{busy ? <span className="button-spinner" /> : <Rocket className="h-5 w-5" />}{language === 'ar' ? 'الدفع وبدء الحملة' : 'Pay and start campaign'}</button>
    </section>
    {history.length > 0 && <section className="mt-6"><h2 className="mb-3 text-sm font-black">{language === 'ar' ? 'سجل الحملات' : 'Campaign history'}</h2><div className="space-y-3">{history.map((item) => <div key={item.id} className="content-panel flex flex-wrap items-center justify-between gap-3 p-4"><div><strong>{item.kind === 'boost' ? (language === 'ar' ? 'تعزيز الدليل' : 'Directory boost') : (language === 'ar' ? 'إعلان الرئيسية' : 'Home ad')}</strong><p className="muted-text mt-1 text-xs">{item.duration_days} {language === 'ar' ? 'يوم' : 'days'} · {Number(item.amount).toFixed(2)} Pi</p></div><span className="pill">{{ awaiting_payment: language === 'ar' ? 'بانتظار الدفع' : 'Awaiting payment', active: language === 'ar' ? 'نشط' : 'Active', expired: language === 'ar' ? 'منتهي' : 'Expired', refunded: language === 'ar' ? 'مسترد' : 'Refunded', payment_failed: language === 'ar' ? 'تعذر الدفع' : 'Payment failed' }[item.status]}</span></div>)}</div></section>}
  </div>;
}
