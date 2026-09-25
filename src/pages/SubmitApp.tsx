import { Globe2, Image, Mail, Package2, Send, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { normalizeUrl } from '../lib/url';
import type { Category, DirectoryApp } from '../types';

const emptyForm = (email = '') => ({
  app_name: '',
  app_version: '1.0.0',
  website_url: '',
  icon_url: '',
  description_ar: '',
  description_en: '',
  category_id: '',
  countries: 'ALL',
  privacy_url: '',
  contact_email: email,
  notes: ''
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

  useEffect(() => {
    if (!user?.email) return;
    setForm((current) => current.contact_email ? current : { ...current, contact_email: user.email || '' });
  }, [user?.email]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  useEffect(() => {
    if (!user || !appId || !isSupabaseConfigured) {
      setLoadingApp(false);
      return;
    }
    setLoadingApp(true);
    setMessage(null);
    supabase
      .from('apps')
      .select('*')
      .eq('id', appId)
      .eq('created_by', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
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
          countries: app.supported_countries.join(','),
          privacy_url: app.privacy_url || '',
          contact_email: user.email || app.developer_name || '',
          notes: ''
        });
      })
      .finally(() => setLoadingApp(false));
  }, [appId, language, user]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const title = useMemo(() => isEdit ? (language === 'ar' ? 'تعديل بيانات التطبيق' : 'Update app details') : (language === 'ar' ? 'طلب إدراج تطبيق' : 'Submit an app'), [isEdit, language]);
  const description = useMemo(() => isEdit ? (language === 'ar' ? 'ترسل التعديلات للمراجعة ويظل التطبيق الحالي كما هو حتى الموافقة' : 'Changes are reviewed while the current live app stays unchanged until approval') : (language === 'ar' ? 'أرسل بيانات تطبيقك وسيظهر بعد المراجعة والموافقة' : 'Send your app details for review and approval'), [isEdit, language]);

  const submit = async () => {
    if (!user || !isSupabaseConfigured || (isEdit && !sourceApp)) return;
    const website = normalizeUrl(form.website_url);
    const icon = form.icon_url ? normalizeUrl(form.icon_url) : null;
    const privacy = form.privacy_url ? normalizeUrl(form.privacy_url) : null;
    const version = form.app_version.trim();
    if (!website) return setMessage(language === 'ar' ? 'رابط التطبيق غير صالح' : 'Invalid app URL');
    if (!version || version.length > 32) return setMessage(language === 'ar' ? 'اكتب إصدارا صحيحا للتطبيق' : 'Enter a valid app version');

    setLoading(true);
    setMessage(null);

    if (isEdit && appId) {
      const { data: openRequest } = await supabase
        .from('app_submissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('app_id', appId)
        .eq('submission_type', 'update')
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();
      if (openRequest) {
        setLoading(false);
        setMessage(language === 'ar' ? 'يوجد تعديل لهذا التطبيق قيد المراجعة حاليا' : 'An update for this app is already pending review');
        return;
      }
    }

    const { error } = await supabase.from('app_submissions').insert({
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
      countries: form.countries.split(/[,\s]+/).map((item) => item.trim().toUpperCase()).filter(Boolean),
      privacy_url: privacy,
      contact_email: form.contact_email.trim(),
      notes: form.notes.trim() || null
    });

    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(language === 'ar' ? (isEdit ? 'تم إرسال التعديلات للمراجعة بنجاح' : 'تم إرسال الطلب للمراجعة بنجاح') : (isEdit ? 'Update sent for review' : 'Submission sent for review'));
    if (!isEdit) setForm(emptyForm(user.email || ''));
  };

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Send} title={title} description={description} action={<Link to="/my-submissions" className="secondary-button hidden sm:inline-flex">{language === 'ar' ? 'طلباتي' : 'My submissions'}</Link>} />
    <section className="content-panel p-6 sm:p-8">
      <div className="mb-7 flex items-start gap-3 rounded-2xl bg-cyan-400/[0.06] p-4 sm:p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><p className="text-xs font-semibold leading-6 text-slate-300">{language === 'ar' ? (isEdit ? 'لن تتغير بيانات التطبيق المنشورة حتى تعتمد الإدارة هذا التحديث' : 'الإدراج ليس تلقائيا الإدارة تراجع الرابط والوصف وسياسة الخصوصية والدول قبل النشر') : (isEdit ? 'Published app data will not change until an admin approves this update' : 'Listing is not automatic Admins review the URL description privacy policy and countries before publishing')}</p></div>
      {loadingApp ? <div className="empty-panel">Loading...</div> : <div className="submission-form-grid grid gap-5 md:grid-cols-2 md:gap-x-6 md:gap-y-6">
        <label className="field-block"><span>{language === 'ar' ? 'اسم التطبيق' : 'App name'}</span><input value={form.app_name} onChange={(e) => update('app_name', e.target.value)} /></label>
        <label className="field-block"><span>{language === 'ar' ? 'إصدار التطبيق' : 'App version'}</span><div className="field-shell"><Package2 className="h-4 w-4" /><input dir="ltr" value={form.app_version} onChange={(e) => update('app_version', e.target.value)} placeholder="1.0.0" /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'رابط التطبيق' : 'App URL'}</span><div className="field-shell"><Globe2 className="h-4 w-4" /><input dir="ltr" value={form.website_url} onChange={(e) => update('website_url', e.target.value)} placeholder="https://" /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'رابط الأيقونة' : 'Icon URL'}</span><div className="field-shell"><Image className="h-4 w-4" /><input dir="ltr" value={form.icon_url} onChange={(e) => update('icon_url', e.target.value)} placeholder="https://" /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'بريد التواصل' : 'Contact email'}</span><div className="field-shell"><Mail className="h-4 w-4" /><input dir="ltr" type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'القسم' : 'Category'}</span><select value={form.category_id} onChange={(e) => update('category_id', e.target.value)}><option value="">-</option>{categories.map((category) => <option key={category.id} value={category.id}>{language === 'ar' ? category.name_ar : category.name_en}</option>)}</select></label>
        <label className="field-block md:col-span-2"><span>{language === 'ar' ? 'الدول اكتب ALL للكل أو رموز الدول' : 'Countries use ALL or country codes'}</span><input dir="ltr" value={form.countries} onChange={(e) => update('countries', e.target.value)} placeholder="ALL or EG SA AE" /></label>
        <label className="field-block md:col-span-2"><span>{language === 'ar' ? 'وصف عربي' : 'Arabic description'}</span><textarea rows={5} value={form.description_ar} onChange={(e) => update('description_ar', e.target.value)} /></label>
        <label className="field-block md:col-span-2"><span>{language === 'ar' ? 'وصف إنجليزي' : 'English description'}</span><textarea rows={5} dir="ltr" value={form.description_en} onChange={(e) => update('description_en', e.target.value)} /></label>
        <label className="field-block"><span>{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy policy'}</span><input dir="ltr" value={form.privacy_url} onChange={(e) => update('privacy_url', e.target.value)} placeholder="https://" /></label>
        <label className="field-block"><span>{language === 'ar' ? 'ملاحظات للإدارة' : 'Notes for admin'}</span><input value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>
      </div>}
      {message && <div className="form-message mt-6">{message}</div>}
      <button className="primary-button mt-7 w-full sm:w-auto" disabled={loading || loadingApp || (isEdit && !sourceApp) || !form.app_name.trim() || !form.app_version.trim() || !form.website_url.trim() || !form.contact_email.trim()} onClick={() => void submit()}><Send className="h-4 w-4" />{loading ? '...' : (language === 'ar' ? (isEdit ? 'إرسال التعديلات للمراجعة' : 'إرسال للمراجعة') : (isEdit ? 'Send update for review' : 'Send for review'))}</button>
    </section>
  </div>;
}
