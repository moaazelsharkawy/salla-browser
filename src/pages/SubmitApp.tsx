import {
  AppWindow, CircleDollarSign, FileText, Globe2, Image, Mail, MapPinned, Package2,
  RefreshCcw, Save, Send, ShieldCheck, TriangleAlert
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DEFAULT_DEVELOPER_LISTING_SETTINGS, deleteDeveloperDraft,
  friendlySubmissionError, loadDeveloperDraft, loadDeveloperListingSettings, saveDeveloperDraft
} from '../lib/developerListing';
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

type SubmissionForm = ReturnType<typeof emptyForm>;
type DraftState = 'idle' | 'saving' | 'saved' | 'error';
const DRAFT_KEY = 'new-app-listing';

function hasDraftContent(form: SubmissionForm) {
  return Boolean(
    form.app_name.trim() || form.website_url.trim() || form.icon_url.trim() || form.description_ar.trim() ||
    form.description_en.trim() || form.category_id || form.privacy_url.trim() || form.notes.trim()
  );
}

export default function SubmitApp() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('app');
  const isEdit = Boolean(appId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sourceApp, setSourceApp] = useState<DirectoryApp | null>(null);
  const [form, setForm] = useState<SubmissionForm>(() => emptyForm(user?.email || ''));
  const [loading, setLoading] = useState(false);
  const [loadingApp, setLoadingApp] = useState(Boolean(appId));
  const [message, setMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<DeveloperListingSettings>(DEFAULT_DEVELOPER_LISTING_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [draftReady, setDraftReady] = useState(isEdit);
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setForm((current) => current.contact_email ? current : { ...current, contact_email: user.email || '' });
  }, [user?.email]);

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
          app_name: app.name,
          app_version: app.version || '1.0.0',
          website_url: app.website_url,
          icon_url: app.icon_url || '',
          description_ar: app.description_ar,
          description_en: app.description_en,
          category_id: app.category_id || '',
          countries: app.supported_countries.includes('ALL') ? 'ALL' : app.supported_countries.join(' '),
          privacy_url: app.privacy_url || '',
          contact_email: user.email || app.developer_name || '',
          notes: ''
        });
      } finally {
        setLoadingApp(false);
      }
    })();
  }, [appId, language, user]);

  useEffect(() => {
    if (isEdit || !user || !isSupabaseConfigured) { setDraftReady(true); return; }
    let active = true;
    setDraftReady(false);
    void (async () => {
      const draft = await loadDeveloperDraft<SubmissionForm>(user.id, DRAFT_KEY);
      if (!active) return;
      if (draft) {
        setForm({ ...emptyForm(user.email || ''), ...draft, contact_email: draft.contact_email || user.email || '' });
        setDraftRestored(true);
        setDraftState('saved');
      }
      setDraftReady(true);
    })();
    return () => { active = false; };
  }, [isEdit, user]);

  useEffect(() => {
    if (isEdit || !draftReady || !user || !isSupabaseConfigured) return;
    if (!hasDraftContent(form)) { setDraftState('idle'); return; }
    setDraftState('saving');
    const timer = window.setTimeout(() => {
      void saveDeveloperDraft(user.id, DRAFT_KEY, null, form)
        .then(() => setDraftState('saved'))
        .catch(() => setDraftState('error'));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftReady, form, isEdit, user]);

  const update = (key: keyof SubmissionForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const title = useMemo(() => isEdit ? (language === 'ar' ? 'تعديل بيانات التطبيق' : 'Update app details') : (language === 'ar' ? 'طلب إدراج تطبيق' : 'Submit an app'), [isEdit, language]);
  const description = useMemo(() => isEdit ? (language === 'ar' ? 'ترسل التعديلات للمراجعة ويظل التطبيق الحالي كما هو حتى الموافقة' : 'Changes are reviewed while the current live app stays unchanged until approval') : (language === 'ar' ? 'أكمل بيانات التطبيق ثم انتقل إلى الدفع إذا كانت رسوم الإدراج مفعلة' : 'Complete the app details then continue to payment when listing fees are enabled'), [isEdit, language]);
  const paymentRequired = !isEdit && settings.fee_enabled && settings.fee_amount > 0;
  const newListingsDisabled = !isEdit && !settings.listing_enabled;

  const startNew = async () => {
    if (!user) return;
    if (hasDraftContent(form) && !window.confirm(language === 'ar' ? 'سيتم حذف المسودة الحالية والبدء من جديد' : 'Your current draft will be cleared and a new form will start')) return;
    setForm(emptyForm(user.email || ''));
    setDraftRestored(false);
    setDraftState('idle');
    setMessage(null);
    if (isSupabaseConfigured) await deleteDeveloperDraft(user.id, DRAFT_KEY).catch(() => undefined);
  };

  const submit = async () => {
    if (!user || !isSupabaseConfigured || (isEdit && !sourceApp) || newListingsDisabled) return;
    const website = normalizeUrl(form.website_url);
    const icon = form.icon_url ? normalizeUrl(form.icon_url) : null;
    const privacy = form.privacy_url ? normalizeUrl(form.privacy_url) : null;
    const version = form.app_version.trim();
    if (!form.app_name.trim()) return setMessage(language === 'ar' ? 'اكتب اسم التطبيق' : 'Enter the app name');
    if (!website) return setMessage(language === 'ar' ? 'رابط التطبيق غير صالح' : 'Invalid app URL');
    if (!version || version.length > 32) return setMessage(language === 'ar' ? 'اكتب إصدارا صحيحا للتطبيق' : 'Enter a valid app version');
    if (!form.contact_email.trim()) return setMessage(language === 'ar' ? 'اكتب بريد التواصل' : 'Enter a contact email');

    const checkoutWindow = paymentRequired ? window.open('/listing-checkout', '_blank') : null;
    setLoading(true);
    setMessage(null);
    let createdSubmission: AppSubmission | null = null;

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
      createdSubmission = data as AppSubmission;

      if (!isEdit) {
        await deleteDeveloperDraft(user.id, DRAFT_KEY).catch(() => undefined);
        setDraftState('idle');
        setDraftRestored(false);
      }

      if (!isEdit && createdSubmission.payment_status === 'awaiting_payment') {
        const launcherUrl = `/listing-checkout?submission=${encodeURIComponent(createdSubmission.id)}`;
        setMessage(language === 'ar' ? 'تم فتح نافذة الدفع الآمنة' : 'Secure checkout opened');
        if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.location.replace(launcherUrl);
        else window.location.assign(launcherUrl);
        return;
      }

      if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.location.replace('/my-submissions');
      setMessage(language === 'ar' ? (isEdit ? 'تم إرسال التعديلات للمراجعة بنجاح' : 'تم إرسال الطلب للمراجعة بنجاح') : (isEdit ? 'Update sent for review' : 'Submission sent for review'));
      if (!isEdit) {
        setForm(emptyForm(user.email || ''));
        setDraftReady(true);
      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.location.replace('/listing-checkout?error=request');
      if (createdSubmission?.payment_status === 'awaiting_payment') {
        setMessage(language === 'ar'
          ? 'تم حفظ طلبك ويمكنك استكمال الدفع من صفحة طلباتي'
          : 'Your request was saved You can continue payment from My submissions');
      } else {
        setMessage(friendlySubmissionError(raw, language));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadingLabel = language === 'ar' ? 'جاري تحميل البيانات' : 'Loading data';

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle
      icon={Send}
      title={title}
      description={description}
      action={<Link to="/my-submissions" className="secondary-button hidden sm:inline-flex">{language === 'ar' ? 'طلباتي' : 'My submissions'}</Link>}
    />

    {newListingsDisabled && <div className="developer-listing-warning mb-5"><TriangleAlert className="h-6 w-6" /><div><strong>{language === 'ar' ? 'استقبال طلبات الإدراج متوقف مؤقتا' : 'New app submissions are temporarily paused'}</strong><p>{language === 'ar' ? 'يمكنك متابعة طلباتك الحالية وتعديل التطبيقات المنشورة' : 'You can still track existing requests and update published apps'}</p></div></div>}

    {!isEdit && draftReady && <div className="draft-toolbar mb-4">
      <div className="flex min-w-0 items-center gap-3"><div className="draft-status-icon"><Save className="h-5 w-5" /></div><div className="min-w-0"><strong>{draftRestored ? (language === 'ar' ? 'تم استكمال المسودة المحفوظة' : 'Saved draft restored') : (language === 'ar' ? 'حفظ تلقائي للمسودة' : 'Automatic draft saving')}</strong><p>{draftState === 'saving' ? (language === 'ar' ? 'جاري حفظ التغييرات' : 'Saving changes') : draftState === 'error' ? (language === 'ar' ? 'تعذر حفظ آخر تعديل وسيعاد المحاولة عند الكتابة' : 'The latest change could not be saved It will retry when you edit') : (language === 'ar' ? 'يمكنك مغادرة الصفحة والعودة لاحقا لاستكمال البيانات' : 'You can leave this page and continue the form later')}</p></div></div>
      <button type="button" className="secondary-button draft-reset-button" onClick={() => void startNew()}><RefreshCcw className="h-5 w-5" />{language === 'ar' ? 'بدء من جديد' : 'Start over'}</button>
    </div>}

    <section className="content-panel submission-form-panel p-4 sm:p-7">
      <div className="submission-intro"><div className="submission-intro-icon"><ShieldCheck className="h-6 w-6" /></div><div><h2>{language === 'ar' ? 'بيانات واضحة تعني مراجعة أسرع' : 'Clear details help us review faster'}</h2><p>{language === 'ar' ? (isEdit ? 'لن تتغير النسخة المنشورة حتى تعتمد الإدارة التحديث' : 'سيتم حفظ الطلب ثم تبدأ المراجعة بعد إكمال الدفع عندما تكون الرسوم مفعلة') : (isEdit ? 'The live version stays unchanged until the update is approved' : 'Your request is saved and review begins after payment when listing fees are enabled')}</p></div></div>

      {loadingApp || (!isEdit && !draftReady) ? <div className="empty-panel mt-5"><span className="soft-spinner" />{loadingLabel}</div> : <div className="mt-5 space-y-4">
        <section className="submission-section">
          <div className="submission-section-head"><div className="submission-section-icon"><AppWindow className="h-5 w-5" /></div><div><h3>{language === 'ar' ? 'البيانات الأساسية' : 'Basic information'}</h3><p>{language === 'ar' ? 'اسم التطبيق والإصدار والقسم ووسيلة التواصل' : 'App name version category and contact details'}</p></div></div>
          <div className="submission-form-grid mt-4 grid gap-4 md:grid-cols-2">
            <label className="field-block"><span>{language === 'ar' ? 'اسم التطبيق' : 'App name'}</span><input value={form.app_name} onChange={(e) => update('app_name', e.target.value)} placeholder={language === 'ar' ? 'مثال Salla Stars' : 'Example Salla Stars'} /></label>
            <label className="field-block"><span>{language === 'ar' ? 'إصدار التطبيق' : 'App version'}</span><div className="field-shell"><Package2 className="field-leading-icon" /><input dir="ltr" value={form.app_version} onChange={(e) => update('app_version', e.target.value)} placeholder="1.0.0" /></div></label>
            <label className="field-block"><span>{language === 'ar' ? 'القسم' : 'Category'}</span><select value={form.category_id} onChange={(e) => update('category_id', e.target.value)}><option value="">{language === 'ar' ? 'اختر القسم' : 'Choose a category'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{language === 'ar' ? category.name_ar : category.name_en}</option>)}</select></label>
            <label className="field-block"><span>{language === 'ar' ? 'بريد التواصل' : 'Contact email'}</span><div className="field-shell"><Mail className="field-leading-icon" /><input dir="ltr" type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} /></div></label>
          </div>
        </section>

        <section className="submission-section">
          <div className="submission-section-head"><div className="submission-section-icon"><Globe2 className="h-5 w-5" /></div><div><h3>{language === 'ar' ? 'الروابط والتوفر' : 'Links and availability'}</h3><p>{language === 'ar' ? 'أضف الروابط الرسمية وحدد الدول التي يعمل بها التطبيق' : 'Add official links and choose where the app is available'}</p></div></div>
          <div className="submission-form-grid mt-4 grid gap-4 md:grid-cols-2">
            <label className="field-block"><span>{language === 'ar' ? 'رابط التطبيق' : 'App URL'}</span><div className="field-shell"><Globe2 className="field-leading-icon" /><input dir="ltr" value={form.website_url} onChange={(e) => update('website_url', e.target.value)} placeholder="https://" /></div></label>
            <label className="field-block"><span>{language === 'ar' ? 'رابط أيقونة التطبيق' : 'App icon URL'}</span><div className="field-shell"><Image className="field-leading-icon" /><input dir="ltr" value={form.icon_url} onChange={(e) => update('icon_url', e.target.value)} placeholder="https://" /></div></label>
            <label className="field-block"><span>{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy policy'}</span><input dir="ltr" value={form.privacy_url} onChange={(e) => update('privacy_url', e.target.value)} placeholder="https://" /></label>
            <label className="field-block"><span>{language === 'ar' ? 'الدول المتاحة' : 'Available countries'}</span><div className="field-shell"><MapPinned className="field-leading-icon" /><input dir="ltr" value={language === 'ar' && form.countries === 'ALL' ? 'كل الدول' : form.countries} onChange={(e) => update('countries', e.target.value)} placeholder={language === 'ar' ? 'كل الدول أو EG SA AE' : 'ALL EG SA AE'} /></div><small>{language === 'ar' ? 'اكتب كل الدول أو رموز الدول بمسافة' : 'Use ALL for every country or enter country codes separated by spaces'}</small></label>
          </div>
        </section>

        <section className="submission-section">
          <div className="submission-section-head"><div className="submission-section-icon"><FileText className="h-5 w-5" /></div><div><h3>{language === 'ar' ? 'وصف التطبيق' : 'App description'}</h3><p>{language === 'ar' ? 'اشرح فائدة التطبيق بوضوح للمستخدمين وفريق المراجعة' : 'Explain the app clearly for users and the review team'}</p></div></div>
          <div className="submission-form-grid mt-4 grid gap-4">
            <label className="field-block"><span>{language === 'ar' ? 'الوصف بالعربية' : 'Arabic description'}</span><textarea rows={5} value={form.description_ar} onChange={(e) => update('description_ar', e.target.value)} placeholder={language === 'ar' ? 'اكتب وصفا واضحا ومختصرا للتطبيق' : 'Write a clear Arabic description'} /></label>
            <label className="field-block"><span>{language === 'ar' ? 'الوصف بالإنجليزية' : 'English description'}</span><textarea rows={5} dir="ltr" value={form.description_en} onChange={(e) => update('description_en', e.target.value)} placeholder="Write a clear English description" /></label>
            <label className="field-block"><span>{language === 'ar' ? 'ملاحظات لفريق المراجعة' : 'Notes for the review team'}</span><textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder={language === 'ar' ? 'اختياري' : 'Optional'} /></label>
          </div>
        </section>
      </div>}

      {!isEdit && !settingsLoading && <div className="listing-fee-card mt-5"><div className="flex items-center gap-3"><div className="soft-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"><CircleDollarSign className="h-6 w-6" /></div><div><h3 className="text-sm font-black">{language === 'ar' ? 'رسوم إدراج التطبيق' : 'App listing fee'}</h3><p className="muted-text mt-1 text-[11px] font-semibold leading-5">{paymentRequired ? (language === 'ar' ? `${settings.fee_amount} Pi عبر صفحة الدفع الآمنة في Salla Shop` : `${settings.fee_amount} Pi through the secure Salla Shop checkout`) : (language === 'ar' ? 'الإدراج متاح حاليا بدون رسوم' : 'Listing is currently available with no fee')}</p></div></div></div>}

      {message && <div className="form-message mt-5">{message}</div>}
      <div className="submission-actions mt-5">
        <button className="primary-button submission-main-action" disabled={loading || loadingApp || settingsLoading || newListingsDisabled || (isEdit && !sourceApp) || !form.app_name.trim() || !form.app_version.trim() || !form.website_url.trim() || !form.contact_email.trim()} onClick={() => void submit()}>
          {loading ? <span className="button-spinner" /> : <Send className="h-5 w-5" />}
          {loading ? (language === 'ar' ? (paymentRequired ? 'جاري تجهيز الدفع' : 'جاري إرسال الطلب') : (paymentRequired ? 'Preparing checkout' : 'Sending request')) : (language === 'ar' ? (isEdit ? 'إرسال التعديلات للمراجعة' : paymentRequired ? 'المتابعة إلى الدفع' : 'إرسال للمراجعة') : (isEdit ? 'Send update for review' : paymentRequired ? 'Continue to payment' : 'Send for review'))}
        </button>
        {!isEdit && <Link to="/my-submissions" className="secondary-button"><ShieldCheck className="h-5 w-5" />{language === 'ar' ? 'متابعة طلباتي' : 'Track my submissions'}</Link>}
      </div>
    </section>
  </div>;
}
