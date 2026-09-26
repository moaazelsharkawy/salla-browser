import { CircleDollarSign, Globe2, Image, Mail, Package2, Send, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { DEFAULT_DEVELOPER_LISTING_SETTINGS, friendlySubmissionError, loadDeveloperListingSettings } from '../lib/developerListing';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { normalizeUrl } from '../lib/url';
import type { AppSubmission, Category, DeveloperListingSettings, DirectoryApp } from '../types';

function parseCountries(value: string) {
  const normalized = value.replace(/كل\s*الدول/gi, 'ALL').replace(/\bكل\b/gi, 'ALL');
  return normalized.split(/[,\s]+/).map((item) => item.trim().toUpperCase()).filter(Boolean);
}

const emptyForm = (email = '') => ({
  app_name: '', app_version: '1.0.0', website_url: '', icon_url: '', description_ar: '', description_en: '',
  category_id: '', countries: 'ALL', privacy_url: '', contact_email: email, notes: ''
});

export default function SubmitApp() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('app');
  const isEdit = Boolean(appId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sourceApp, setSourceApp] = useState<DirectoryApp | null>(null);
  const [form, setForm] = useState(() => emptyForm(user?.email || ''));
  const [loading, setLoading] = useState(false);
  const [loadingApp, setLoadingApp] = useState(Boolean(appId));
  const [message, setMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<DeveloperListingSettings>(DEFAULT_DEVELOPER_LISTING_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    setForm((current) => current.contact_email ? current : { ...current, contact_email: user.email || '' });
  }, [user?.email]);

  useEffect(() => {
    if (language === 'ar') setForm((current) => current.countries === 'ALL' ? { ...current, countries: 'كل الدول' } : current);
  }, [language]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      loadDeveloperListingSettings(),
    ]).then(([categoriesResult, listingSettings]) => {
      setCategories((categoriesResult.data ?? []) as Category[]);
      setSettings(listingSettings);
    }).finally(() => setSettingsLoading(false));
  }, []);

  useEffect(() => {
    if (!user || !appId || !isSupabaseConfigured) { setLoadingApp(false); return; }
    setLoadingApp(true);
    setMessage(null);
    void (async () => {
      try {
        const { data, error } = await supabase.from('apps').select('*').eq('id', appId).eq('created_by', user.id).maybeSingle();
        const app = data as DirectoryApp | null;
        if (error || !app) {
          setSourceApp(null);
          setMessage(language === 'ar' ? 'تعذر العثور على التطبيق أو لا تملك صلاحية تعديله' : 'App not found or you do not have permission to edit it');
          return;
        }
        setSourceApp(app);
        setForm({
          app_name: app.name, app_version: app.version || '1.0.0', website_url: app.website_url, icon_url: app.icon_url || '',
          description_ar: app.description_ar, description_en: app.description_en, category_id: app.category_id || '',
          countries: app.supported_countries.includes('ALL') && language === 'ar' ? 'كل الدول' : app.supported_countries.join(','), privacy_url: app.privacy_url || '', contact_email: user.email || app.developer_name || '', notes: ''
        });
      } finally { setLoadingApp(false); }
    })();
  }, [appId, language, user]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const title = useMemo(() => isEdit ? (language === 'ar' ? 'تعديل بيانات التطبيق' : 'Update app details') : (language === 'ar' ? 'طلب إدراج تطبيق' : 'Submit an app'), [isEdit, language]);
  const description = useMemo(() => isEdit ? (language === 'ar' ? 'ترسل التعديلات للمراجعة ويظل التطبيق الحالي كما هو حتى الموافقة' : 'Changes are reviewed while the current live app stays unchanged until approval') : (language === 'ar' ? 'أرسل بيانات تطبيقك وأكمل رسوم الإدراج إن كانت مفعلة ثم تبدأ المراجعة' : 'Send your app details complete the listing fee when enabled then review begins'), [isEdit, language]);
  const paymentRequired = !isEdit && settings.fee_enabled && settings.fee_amount > 0;
  const newListingsDisabled = !isEdit && !settings.listing_enabled;

  const startCheckout = async (submissionId: string, popup: Window | null) => {
    const { data, error } = await supabase.functions.invoke('create-listing-checkout', { body: { submission_id: submissionId } });
    if (error || !data?.checkout_url) throw new Error(error?.message || 'checkout_unavailable');
    if (popup && !popup.closed) popup.location.href = data.checkout_url;
    else window.location.href = data.checkout_url;
  };

  const submit = async () => {
    if (!user || !isSupabaseConfigured || (isEdit && !sourceApp) || newListingsDisabled) return;
    const website = normalizeUrl(form.website_url);
    const icon = form.icon_url ? normalizeUrl(form.icon_url) : null;
    const privacy = form.privacy_url ? normalizeUrl(form.privacy_url) : null;
    const version = form.app_version.trim();
    if (!website) return setMessage(language === 'ar' ? 'رابط التطبيق غير صالح' : 'Invalid app URL');
    if (!version || version.length > 32) return setMessage(language === 'ar' ? 'اكتب إصدارا صحيحا للتطبيق' : 'Enter a valid app version');

    const checkoutWindow = paymentRequired ? window.open('about:blank', '_blank') : null;
    setLoading(true);
    setMessage(null);

    try {
      if (isEdit && appId) {
        const { data: openRequest } = await supabase.from('app_submissions').select('id').eq('user_id', user.id).eq('app_id', appId).eq('submission_type', 'update').eq('status', 'pending').limit(1).maybeSingle();
        if (openRequest) throw new Error('developer_pending_limit');
      }

      const { data, error } = await supabase.from('app_submissions').insert({
        user_id: user.id,
        app_id: isEdit ? appId : null,
        submission_type: isEdit ? 'update' : 'new',
        app_name: form.app_name.trim(),
        app_version: version,
        website_url: website,
        icon_url: icon,
        description_ar: form.description_ar.trim(),
        description_en: form.description_en.trim(),
        category_id: form.category_id || null,
        countries: parseCountries(form.countries),
        privacy_url: privacy,
        contact_email: form.contact_email.trim(),
        notes: form.notes.trim() || null
      }).select('*').single();

      if (error || !data) throw new Error(error?.message || 'submission_failed');
      const submission = data as AppSubmission;

      if (!isEdit && submission.payment_status === 'awaiting_payment') {
        await startCheckout(submission.id, checkoutWindow);
        setMessage(language === 'ar' ? 'تم إنشاء الطلب افتح صفحة الدفع الآمنة لإكمال رسوم الإدراج' : 'Submission created Complete the listing fee in the secure checkout page');
      } else {
        checkoutWindow?.close();
        setMessage(language === 'ar' ? (isEdit ? 'تم إرسال التعديلات للمراجعة بنجاح' : 'تم إرسال الطلب للمراجعة بنجاح') : (isEdit ? 'Update sent for review' : 'Submission sent for review'));
        if (!isEdit) setForm(emptyForm(user.email || ''));
      }
    } catch (error) {
      checkoutWindow?.close();
      const raw = error instanceof Error ? error.message : '';
      setMessage(friendlySubmissionError(raw, language));
    } finally { setLoading(false); }
  };

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Send} title={title} description={description} action={<Link to="/my-submissions" className="secondary-button hidden sm:inline-flex">{language === 'ar' ? 'طلباتي' : 'My submissions'}</Link>} />

    {newListingsDisabled && <div className="developer-listing-warning mb-5"><TriangleAlert className="h-5 w-5" /><div><strong>{language === 'ar' ? 'استقبال طلبات الإدراج متوقف مؤقتا' : 'New app submissions are temporarily paused'}</strong><p>{language === 'ar' ? 'يمكنك متابعة طلباتك الحالية وتعديل التطبيقات المنشورة' : 'You can still track existing requests and update published apps'}</p></div></div>}

    <section className="content-panel p-6 sm:p-8">
      <div className="mb-7 flex items-start gap-3 rounded-2xl bg-cyan-400/[0.06] p-4 sm:p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><p className="text-xs font-semibold leading-6 text-slate-300">{language === 'ar' ? (isEdit ? 'لن تتغير بيانات التطبيق المنشورة حتى تعتمد الإدارة هذا التحديث' : 'الإدراج ليس تلقائيا تتم مراجعة بيانات التطبيق بعد إكمال الخطوات المطلوبة') : (isEdit ? 'Published app data will not change until an admin approves this update' : 'Listing is not automatic App details are reviewed after all required steps are completed')}</p></div>

      {!isEdit && !settingsLoading && <div className="listing-fee-card mb-7"><div className="flex items-center gap-3"><div className="soft-icon flex h-11 w-11 items-center justify-center rounded-2xl"><CircleDollarSign className="h-5 w-5" /></div><div><h3 className="text-sm font-black">{language === 'ar' ? 'رسوم إدراج التطبيق' : 'App listing fee'}</h3><p className="muted-text mt-1 text-[11px] font-semibold">{paymentRequired ? (language === 'ar' ? `${settings.fee_amount} Pi تدفع عبر صفحة Salla Shop الآمنة` : `${settings.fee_amount} Pi paid through the secure Salla Shop checkout`) : (language === 'ar' ? 'الإدراج متاح حاليا بدون رسوم' : 'Listing is currently available with no fee')}</p></div></div></div>}

      {loadingApp ? <div className="empty-panel"><span className="soft-spinner" />{language === 'ar' ? 'جاري تحميل بيانات التطبيق' : 'Loading app details'}</div> : <div className="submission-form-grid grid gap-5 md:grid-cols-2 md:gap-x-6 md:gap-y-6">
        <label className="field-block"><span>{language === 'ar' ? 'اسم التطبيق' : 'App name'}</span><input value={form.app_name} onChange={(e) => update('app_name', e.target.value)} /></label>
        <label className="field-block"><span>{language === 'ar' ? 'إصدار التطبيق' : 'App version'}</span><div className="field-shell"><Package2 className="h-4 w-4" /><input dir="ltr" value={form.app_version} onChange={(e) => update('app_version', e.target.value)} placeholder="1.0.0" /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'رابط التطبيق' : 'App URL'}</span><div className="field-shell"><Globe2 className="h-4 w-4" /><input dir="ltr" value={form.website_url} onChange={(e) => update('website_url', e.target.value)} placeholder="https://" /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'رابط الأيقونة' : 'Icon URL'}</span><div className="field-shell"><Image className="h-4 w-4" /><input dir="ltr" value={form.icon_url} onChange={(e) => update('icon_url', e.target.value)} placeholder="https://" /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'بريد التواصل' : 'Contact email'}</span><div className="field-shell"><Mail className="h-4 w-4" /><input dir="ltr" type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'القسم' : 'Category'}</span><select value={form.category_id} onChange={(e) => update('category_id', e.target.value)}><option value="">{language === 'ar' ? 'بدون قسم' : 'No category'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{language === 'ar' ? category.name_ar : category.name_en}</option>)}</select></label>
        <label className="field-block md:col-span-2"><span>{language === 'ar' ? 'الدول المتاحة' : 'Available countries'}</span><input dir="ltr" value={form.countries} onChange={(e) => update('countries', e.target.value)} placeholder={language === 'ar' ? 'كل الدول أو EG SA AE' : 'ALL EG SA AE'} /><small>{language === 'ar' ? 'اكتب كل الدول أو اكتب رموز الدول بمسافة' : 'Use ALL for every country or enter country codes separated by spaces'}</small></label>
        <label className="field-block md:col-span-2"><span>{language === 'ar' ? 'الوصف بالعربية' : 'Arabic description'}</span><textarea rows={5} value={form.description_ar} onChange={(e) => update('description_ar', e.target.value)} /></label>
        <label className="field-block md:col-span-2"><span>{language === 'ar' ? 'الوصف بالإنجليزية' : 'English description'}</span><textarea rows={5} dir="ltr" value={form.description_en} onChange={(e) => update('description_en', e.target.value)} /></label>
        <label className="field-block"><span>{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy policy'}</span><input dir="ltr" value={form.privacy_url} onChange={(e) => update('privacy_url', e.target.value)} placeholder="https://" /></label>
        <label className="field-block"><span>{language === 'ar' ? 'ملاحظات للإدارة' : 'Notes for admin'}</span><input value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>
      </div>}

      {message && <div className="form-message mt-6">{message}</div>}
      <button className="primary-button mt-7 w-full sm:w-auto" disabled={loading || loadingApp || settingsLoading || newListingsDisabled || (isEdit && !sourceApp) || !form.app_name.trim() || !form.app_version.trim() || !form.website_url.trim() || !form.contact_email.trim()} onClick={() => void submit()}><Send className="h-4 w-4" />{loading ? (language === 'ar' ? 'جاري الإرسال' : 'Sending') : (language === 'ar' ? (isEdit ? 'إرسال التعديلات للمراجعة' : paymentRequired ? 'المتابعة إلى الدفع' : 'إرسال للمراجعة') : (isEdit ? 'Send update for review' : paymentRequired ? 'Continue to payment' : 'Send for review'))}</button>
    </section>
  </div>;
}
