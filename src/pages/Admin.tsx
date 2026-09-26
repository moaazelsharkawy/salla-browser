import {
  AppWindow, Blocks, BriefcaseBusiness, Check, CircleDollarSign, FolderKanban, Gamepad2, Gauge,
  Globe2, Landmark, LayoutGrid, MessageCircle, Package, Save, Settings2, ShieldCheck, ShoppingBag,
  Smartphone, Flame, Store, Ban, Trash2, UserCog, WalletCards, Wrench, X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { normalizeUrl } from '../lib/url';
import { categoryIcon } from '../lib/appIcons';
import { DEFAULT_DEVELOPER_LISTING_SETTINGS, paymentStatusLabel } from '../lib/developerListing';
import type { AppStatus, AppSubmission, Category, DeveloperListingSettings, DirectoryApp, EmbedMode, HealthStatus } from '../types';

const emptyApp = {
  id: '', slug: '', name: '', version: '1.0.0', short_description_ar: '', short_description_en: '', description_ar: '', description_en: '', icon_url: '', website_url: '', privacy_url: '', developer_name: 'Salla', category_id: '', supported_countries: 'ALL', status: 'published' as AppStatus, suspension_reason: '', verified: true, featured: false, embed_mode: 'iframe' as EmbedMode, health_status: 'online' as HealthStatus, installable: true, sort_order: 100
};

const categoryIcons = [
  ['store', Store], ['blocks', Blocks], ['shopping-bag', ShoppingBag], ['wallet', WalletCards],
  ['finance', CircleDollarSign], ['business', BriefcaseBusiness], ['social', MessageCircle], ['games', Gamepad2],
  ['tools', Wrench], ['apps', LayoutGrid], ['mobile', Smartphone], ['web', Globe2], ['services', Package],
  ['bank', Landmark], ['featured', Flame]
] as const;

const categoryIconLabels: Record<string, { ar: string; en: string }> = {
  store: { ar: 'متجر', en: 'Store' }, blocks: { ar: 'ويب 3', en: 'Web3' }, 'shopping-bag': { ar: 'تسوق', en: 'Shopping' },
  wallet: { ar: 'محفظة', en: 'Wallet' }, finance: { ar: 'مال', en: 'Finance' }, business: { ar: 'اعمال', en: 'Business' },
  social: { ar: 'اجتماعي', en: 'Social' }, games: { ar: 'العاب', en: 'Games' }, tools: { ar: 'ادوات', en: 'Tools' },
  apps: { ar: 'تطبيقات', en: 'Apps' }, mobile: { ar: 'هاتف', en: 'Mobile' }, web: { ar: 'ويب', en: 'Web' },
  services: { ar: 'خدمات', en: 'Services' }, bank: { ar: 'مصرفي', en: 'Banking' }, featured: { ar: 'مميز', en: 'Featured' }
};

function readableError(message: string, language: 'ar' | 'en') {
  const lower = message.toLowerCase();
  if (lower.includes('apps_slug_key') || lower.includes('duplicate key')) return language === 'ar' ? 'يوجد تطبيق مسجل بهذا المعرف بالفعل' : 'An app with this identifier already exists';
  if (lower.includes('not authorized') || lower.includes('permission')) return language === 'ar' ? 'لا توجد صلاحية كافية لتنفيذ هذا الاجراء' : 'You do not have permission for this action';
  if (lower.includes('payment_required')) return language === 'ar' ? 'يجب إكمال رسوم الإدراج قبل مراجعة الطلب' : 'Listing payment must be completed before review';
  return language === 'ar' ? 'تعذر إكمال العملية حاول مرة أخرى' : 'Could not complete the action Please try again';
}

export default function Admin() {
  const { language } = useLanguage();
  const [tab, setTab] = useState<'overview' | 'apps' | 'categories' | 'submissions' | 'developer'>('overview');
  const [apps, setApps] = useState<DirectoryApp[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submissions, setSubmissions] = useState<AppSubmission[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | AppSubmission['status']>('pending');
  const [appForm, setAppForm] = useState({ ...emptyApp });
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ id: '', slug: '', name_ar: '', name_en: '', description_ar: '', description_en: '', icon: 'store', sort_order: 100, is_active: true });
  const [message, setMessage] = useState<string | null>(null);
  const [developerSettings, setDeveloperSettings] = useState<DeveloperListingSettings>(DEFAULT_DEVELOPER_LISTING_SETTINGS);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const [appsResult, categoriesResult, submissionsResult, settingsResult] = await Promise.all([
      supabase.from('apps').select('*, category:categories(*)').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('app_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('app_settings').select('value').eq('key', 'developer_listing').maybeSingle()
    ]);
    setApps((appsResult.data ?? []) as DirectoryApp[]);
    setCategories((categoriesResult.data ?? []) as Category[]);
    setSubmissions((submissionsResult.data ?? []) as AppSubmission[]);
    const rawSettings = (settingsResult.data?.value || {}) as Partial<DeveloperListingSettings>;
    setDeveloperSettings({
      listing_enabled: rawSettings.listing_enabled ?? true,
      fee_enabled: rawSettings.fee_enabled ?? false,
      fee_amount: Number(rawSettings.fee_amount ?? 0),
      currency: 'pi',
      max_apps_per_developer: Math.max(1, Number(rawSettings.max_apps_per_developer ?? 5)),
      max_pending_submissions: Math.max(1, Number(rawSettings.max_pending_submissions ?? 2)),
    });
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const stats = useMemo(() => ({
    published: apps.filter((app) => app.status === 'published').length,
    suspended: apps.filter((app) => app.status === 'suspended').length,
    featured: apps.filter((app) => app.featured).length,
    pending: submissions.filter((item) => item.status === 'pending' || item.status === 'changes_requested').length,
    categories: categories.length
  }), [apps, submissions, categories]);

  const filteredSubmissions = submissionFilter === 'all' ? submissions : submissions.filter((item) => item.status === submissionFilter);

  const saveApp = async () => {
    setMessage(null);
    const websiteUrl = normalizeUrl(appForm.website_url);
    const iconUrl = appForm.icon_url ? normalizeUrl(appForm.icon_url) : null;
    const privacyUrl = appForm.privacy_url ? normalizeUrl(appForm.privacy_url) : null;
    if (!websiteUrl) return setMessage(language === 'ar' ? 'رابط التطبيق غير صالح' : 'Invalid app URL');
    if (appForm.status === 'suspended' && !appForm.suspension_reason.trim()) return setMessage(language === 'ar' ? 'اكتب سبب تعليق التطبيق' : 'Enter a suspension reason');
    const payload = {
      slug: appForm.slug.trim().toLowerCase().replace(/\s+/g, '-'), name: appForm.name.trim(), version: appForm.version.trim() || '1.0.0',
      short_description_ar: appForm.short_description_ar.trim(), short_description_en: appForm.short_description_en.trim(), description_ar: appForm.description_ar.trim(), description_en: appForm.description_en.trim(),
      icon_url: iconUrl, website_url: websiteUrl, privacy_url: privacyUrl, developer_name: appForm.developer_name.trim() || null, category_id: appForm.category_id || null,
      supported_countries: appForm.supported_countries.split(/[ ,]+/).map((v) => v.trim().toUpperCase()).filter(Boolean), status: appForm.status,
      suspension_reason: appForm.status === 'suspended' ? appForm.suspension_reason.trim() : null,
      verified: appForm.verified, featured: appForm.featured, embed_mode: appForm.embed_mode, health_status: appForm.health_status, installable: appForm.installable,
      sort_order: Number(appForm.sort_order || 100), published_at: appForm.status === 'published' ? new Date().toISOString() : (editingApp ? (apps.find((item) => item.id === editingApp)?.published_at ?? null) : null)
    };
    const result = editingApp ? await supabase.from('apps').update(payload).eq('id', editingApp) : await supabase.from('apps').insert(payload);
    if (result.error) return setMessage(readableError(result.error.message, language));
    setAppForm({ ...emptyApp }); setEditingApp(null); setMessage(language === 'ar' ? 'تم حفظ التطبيق' : 'App saved'); await refresh();
  };

  const editApp = (app: DirectoryApp) => {
    setEditingApp(app.id);
    setAppForm({
      id: app.id, slug: app.slug, name: app.name, version: app.version || '1.0.0', short_description_ar: app.short_description_ar, short_description_en: app.short_description_en,
      description_ar: app.description_ar, description_en: app.description_en, icon_url: app.icon_url || '', website_url: app.website_url, privacy_url: app.privacy_url || '', developer_name: app.developer_name || '', category_id: app.category_id || '',
      supported_countries: app.supported_countries.join(' '), status: app.status, suspension_reason: app.suspension_reason || '', verified: app.verified, featured: app.featured,
      embed_mode: app.embed_mode, health_status: app.health_status, installable: app.installable, sort_order: app.sort_order
    });
    setTab('apps'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSuspension = async (app: DirectoryApp) => {
    if (app.status === 'suspended') {
      const { error } = await supabase.from('apps').update({ status: 'published', suspension_reason: null, published_at: app.published_at || new Date().toISOString() }).eq('id', app.id);
      if (error) return setMessage(readableError(error.message, language));
      setMessage(language === 'ar' ? 'تمت اعادة تفعيل التطبيق' : 'App reactivated');
    } else {
      const reason = window.prompt(language === 'ar' ? 'اكتب سبب تعليق التطبيق' : 'Enter suspension reason', app.suspension_reason || '')?.trim();
      if (!reason) return;
      const { error } = await supabase.from('apps').update({ status: 'suspended', suspension_reason: reason }).eq('id', app.id);
      if (error) return setMessage(readableError(error.message, language));
      setMessage(language === 'ar' ? 'تم تعليق التطبيق' : 'App suspended');
    }
    await refresh();
  };

  const saveCategory = async () => {
    setMessage(null);
    const payload = { slug: categoryForm.slug.trim().toLowerCase().replace(/\s+/g, '-'), name_ar: categoryForm.name_ar.trim(), name_en: categoryForm.name_en.trim(), description_ar: categoryForm.description_ar.trim() || null, description_en: categoryForm.description_en.trim() || null, icon: categoryForm.icon || 'store', sort_order: Number(categoryForm.sort_order), is_active: categoryForm.is_active };
    const result = categoryForm.id ? await supabase.from('categories').update(payload).eq('id', categoryForm.id) : await supabase.from('categories').insert(payload);
    if (result.error) return setMessage(readableError(result.error.message, language));
    setCategoryForm({ id: '', slug: '', name_ar: '', name_en: '', description_ar: '', description_en: '', icon: 'store', sort_order: 100, is_active: true });
    setMessage(language === 'ar' ? 'تم حفظ القسم' : 'Category saved'); await refresh();
  };

  const saveDeveloperSettings = async () => {
    setMessage(null);
    const normalized: DeveloperListingSettings = {
      listing_enabled: Boolean(developerSettings.listing_enabled),
      fee_enabled: Boolean(developerSettings.fee_enabled),
      fee_amount: Math.max(0, Number(developerSettings.fee_amount || 0)),
      currency: 'pi',
      max_apps_per_developer: Math.max(1, Number(developerSettings.max_apps_per_developer || 1)),
      max_pending_submissions: Math.max(1, Number(developerSettings.max_pending_submissions || 1)),
    };
    const { error } = await supabase.from('app_settings').upsert({ key: 'developer_listing', value: normalized, is_public: true, updated_at: new Date().toISOString() });
    if (error) return setMessage(readableError(error.message, language));
    setDeveloperSettings(normalized);
    setMessage(language === 'ar' ? 'تم حفظ إعدادات المطورين' : 'Developer settings saved');
  };

  const reviewSubmission = async (submission: AppSubmission, status: AppSubmission['status']) => {
    if (submission.status === 'approved' || submission.status === 'rejected') return;
    if (submission.submission_type === 'new' && !['paid', 'not_required'].includes(submission.payment_status || 'not_required')) {
      setMessage(language === 'ar' ? 'لا يمكن مراجعة الطلب قبل إكمال رسوم الإدراج' : 'The listing fee must be completed before review');
      return;
    }
    const note = window.prompt(language === 'ar' ? 'ملاحظة المراجعة اختيارية' : 'Review note optional', submission.review_note || '') ?? submission.review_note ?? '';
    setMessage(null);
    const { error } = await supabase.rpc('review_app_submission', { p_submission_id: submission.id, p_status: status, p_note: note || null });
    if (error) return setMessage(readableError(error.message, language));
    setMessage(status === 'approved' ? (language === 'ar' ? 'تم اعتماد التطبيق ونشر التغييرات' : 'App approved and changes published') : (language === 'ar' ? 'تم تحديث حالة الطلب' : 'Submission status updated'));
    await refresh();
  };

  const tabs = [
    ['overview', Gauge, language === 'ar' ? 'نظرة عامة' : 'Overview'], ['apps', AppWindow, language === 'ar' ? 'التطبيقات' : 'Apps'],
    ['categories', FolderKanban, language === 'ar' ? 'الاقسام' : 'Categories'], ['submissions', ShieldCheck, language === 'ar' ? 'طلبات الادراج' : 'Submissions'],
    ['developer', UserCog, language === 'ar' ? 'إعدادات المطورين' : 'Developer settings']
  ] as const;

  return <div className="page-container py-7 sm:py-10">
    <section className="hero-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7"><div className="decor-orbit hero-orbit-a" /><div className="relative flex items-center gap-4"><div className="soft-icon flex h-14 w-14 items-center justify-center rounded-[1.4rem]"><Settings2 className="h-7 w-7" /></div><div><p className="text-xs font-black text-cyan-500">Salla Browser</p><h1 className="mt-1 text-2xl font-black">{language === 'ar' ? 'لوحة الادارة' : 'Admin dashboard'}</h1></div></div></section>
    <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">{tabs.map(([id, Icon, label]) => <button key={id} onClick={() => setTab(id)} className={`category-chip ${tab === id ? 'category-chip-active' : ''}`}><Icon className="h-4 w-4" />{label}{id === 'submissions' && stats.pending > 0 && <span className="rounded-full bg-rose-400 px-1.5 text-[9px] text-white">{stats.pending}</span>}</button>)}</div>
    {message && <div className="form-message mt-4">{message}</div>}

    {tab === 'overview' && <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">{[[stats.published, language === 'ar' ? 'تطبيق منشور' : 'Published'], [stats.suspended, language === 'ar' ? 'معلق' : 'Suspended'], [stats.featured, language === 'ar' ? 'مميز' : 'Featured'], [stats.pending, language === 'ar' ? 'ينتظر المراجعة' : 'Pending'], [stats.categories, language === 'ar' ? 'قسم' : 'Categories']].map(([value, label]) => <div key={String(label)} className="content-panel p-5"><p className="text-3xl font-black text-cyan-500">{value}</p><p className="mt-2 text-xs font-bold text-slate-500">{label}</p></div>)}</div>}

    {tab === 'apps' && <div className="mt-5 grid gap-4 xl:grid-cols-[.95fr_1.35fr]">
      <section className="content-panel p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-black">{editingApp ? (language === 'ar' ? 'تعديل التطبيق' : 'Edit app') : (language === 'ar' ? 'اضافة تطبيق' : 'Add app')}</h2><p className="muted-text mt-1 text-[11px]">{language === 'ar' ? 'الحقول هنا تتحكم في البيانات المنشورة للمستخدم' : 'These fields control the published app data'}</p></div>{editingApp && <button className="secondary-button" onClick={() => { setEditingApp(null); setAppForm({ ...emptyApp }); }}><X className="h-4 w-4" />{language === 'ar' ? 'الغاء' : 'Cancel'}</button>}</div>
        <div className="mt-5 grid gap-4">
          <label className="field-block"><span>{language === 'ar' ? 'اسم التطبيق' : 'App name'}</span><input value={appForm.name} onChange={(e) => setAppForm((c) => ({ ...c, name: e.target.value }))} /></label>
          <label className="field-block"><span>{language === 'ar' ? 'معرف الرابط' : 'URL identifier'}</span><input dir="ltr" value={appForm.slug} onChange={(e) => setAppForm((c) => ({ ...c, slug: e.target.value }))} /><small>{language === 'ar' ? 'مثال salla-stars ويجب ان يكون فريدا' : 'Example salla-stars and it must be unique'}</small></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="field-block"><span>{language === 'ar' ? 'اصدار التطبيق' : 'App version'}</span><input dir="ltr" value={appForm.version} onChange={(e) => setAppForm((c) => ({ ...c, version: e.target.value }))} /></label><label className="field-block"><span>{language === 'ar' ? 'اسم المطور' : 'Developer name'}</span><input value={appForm.developer_name} onChange={(e) => setAppForm((c) => ({ ...c, developer_name: e.target.value }))} /></label></div>
          <label className="field-block"><span>{language === 'ar' ? 'رابط التطبيق' : 'App URL'}</span><input dir="ltr" value={appForm.website_url} onChange={(e) => setAppForm((c) => ({ ...c, website_url: e.target.value }))} /></label>
          <label className="field-block"><span>{language === 'ar' ? 'رابط ايقونة التطبيق' : 'App icon URL'}</span><input dir="ltr" value={appForm.icon_url} onChange={(e) => setAppForm((c) => ({ ...c, icon_url: e.target.value }))} /></label>
          <label className="field-block"><span>{language === 'ar' ? 'رابط سياسة الخصوصية' : 'Privacy policy URL'}</span><input dir="ltr" value={appForm.privacy_url} onChange={(e) => setAppForm((c) => ({ ...c, privacy_url: e.target.value }))} /></label>
          <label className="field-block"><span>{language === 'ar' ? 'الوصف المختصر بالعربية' : 'Arabic short description'}</span><input value={appForm.short_description_ar} onChange={(e) => setAppForm((c) => ({ ...c, short_description_ar: e.target.value }))} /></label>
          <label className="field-block"><span>{language === 'ar' ? 'الوصف المختصر بالانجليزية' : 'English short description'}</span><input dir="ltr" value={appForm.short_description_en} onChange={(e) => setAppForm((c) => ({ ...c, short_description_en: e.target.value }))} /></label>
          <label className="field-block"><span>{language === 'ar' ? 'الوصف الكامل بالعربية' : 'Arabic description'}</span><textarea rows={3} value={appForm.description_ar} onChange={(e) => setAppForm((c) => ({ ...c, description_ar: e.target.value }))} /></label>
          <label className="field-block"><span>{language === 'ar' ? 'الوصف الكامل بالانجليزية' : 'English description'}</span><textarea rows={3} dir="ltr" value={appForm.description_en} onChange={(e) => setAppForm((c) => ({ ...c, description_en: e.target.value }))} /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="field-block"><span>{language === 'ar' ? 'القسم' : 'Category'}</span><select value={appForm.category_id} onChange={(e) => setAppForm((c) => ({ ...c, category_id: e.target.value }))}><option value="">{language === 'ar' ? 'بدون قسم' : 'No category'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{language === 'ar' ? category.name_ar : category.name_en}</option>)}</select></label><label className="field-block"><span>{language === 'ar' ? 'ترتيب الظهور' : 'Display order'}</span><input type="number" value={appForm.sort_order} onChange={(e) => setAppForm((c) => ({ ...c, sort_order: Number(e.target.value) }))} /></label></div>
          <label className="field-block"><span>{language === 'ar' ? 'الدول المتاحة' : 'Available countries'}</span><input dir="ltr" value={appForm.supported_countries} onChange={(e) => setAppForm((c) => ({ ...c, supported_countries: e.target.value }))} placeholder="ALL EG SA" /><small>{language === 'ar' ? 'اكتب ALL للكل او رموز الدول بمسافة' : 'Use ALL or country codes separated by spaces'}</small></label>
          <div className="grid gap-4 sm:grid-cols-3"><label className="field-block"><span>{language === 'ar' ? 'حالة النشر' : 'Publishing status'}</span><select value={appForm.status} onChange={(e) => setAppForm((c) => ({ ...c, status: e.target.value as AppStatus }))}><option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option><option value="published">{language === 'ar' ? 'منشور' : 'Published'}</option><option value="suspended">{language === 'ar' ? 'معلق' : 'Suspended'}</option></select></label><label className="field-block"><span>{language === 'ar' ? 'طريقة الفتح' : 'Open mode'}</span><select value={appForm.embed_mode} onChange={(e) => setAppForm((c) => ({ ...c, embed_mode: e.target.value as EmbedMode }))}><option value="iframe">{language === 'ar' ? 'داخل المتصفح' : 'Inside browser'}</option><option value="limited">{language === 'ar' ? 'توافق محدود' : 'Limited compatibility'}</option><option value="external">{language === 'ar' ? 'رابط خارجي' : 'External link'}</option></select></label><label className="field-block"><span>{language === 'ar' ? 'حالة الخدمة' : 'Service health'}</span><select value={appForm.health_status} onChange={(e) => setAppForm((c) => ({ ...c, health_status: e.target.value as HealthStatus }))}><option value="online">{language === 'ar' ? 'متاح' : 'Online'}</option><option value="maintenance">{language === 'ar' ? 'صيانة' : 'Maintenance'}</option><option value="new">{language === 'ar' ? 'جديد' : 'New'}</option><option value="updated">{language === 'ar' ? 'محدث' : 'Updated'}</option><option value="offline">{language === 'ar' ? 'غير متاح' : 'Offline'}</option></select></label></div>
          {appForm.status === 'suspended' && <label className="field-block"><span>{language === 'ar' ? 'سبب التعليق' : 'Suspension reason'}</span><textarea rows={3} value={appForm.suspension_reason} onChange={(e) => setAppForm((c) => ({ ...c, suspension_reason: e.target.value }))} /></label>}
          <div className="grid gap-2 sm:grid-cols-3 text-xs font-bold"><label className="toggle-tile"><input type="checkbox" checked={appForm.verified} onChange={(e) => setAppForm((c) => ({ ...c, verified: e.target.checked }))} />{language === 'ar' ? 'موثق' : 'Verified'}</label><label className="toggle-tile"><input type="checkbox" checked={appForm.featured} onChange={(e) => setAppForm((c) => ({ ...c, featured: e.target.checked }))} />{language === 'ar' ? 'مميز' : 'Featured'}</label><label className="toggle-tile"><input type="checkbox" checked={appForm.installable} onChange={(e) => setAppForm((c) => ({ ...c, installable: e.target.checked }))} />{language === 'ar' ? 'قابل للتثبيت' : 'Installable'}</label></div>
          <button className="primary-button w-full" onClick={() => void saveApp()} disabled={!appForm.name || !appForm.slug || !appForm.website_url}><Save className="h-4 w-4" />{language === 'ar' ? 'حفظ التطبيق' : 'Save app'}</button>
        </div>
      </section>
      <section className="space-y-2">{apps.map((app) => <div key={app.id} className="content-panel p-4"><div className="flex items-center gap-3"><div className="app-icon h-11 w-11 overflow-hidden rounded-xl">{app.icon_url && <img src={app.icon_url} className="h-full w-full object-cover" alt="" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-black">{app.name}</p><span className="pill">v{app.version || '1.0.0'}</span><span className="pill">{app.status === 'published' ? (language === 'ar' ? 'منشور' : 'Published') : app.status === 'suspended' ? (language === 'ar' ? 'معلق' : 'Suspended') : (language === 'ar' ? 'مسودة' : 'Draft')}</span></div><p className="truncate text-[10px] font-semibold text-slate-500" dir="ltr">{app.website_url}</p>{app.status === 'suspended' && app.suspension_reason && <p className="mt-1 text-[10px] font-bold text-amber-600">{app.suspension_reason}</p>}</div></div><div className="mt-3 flex flex-wrap gap-2"><button className="secondary-button" onClick={() => editApp(app)}>{language === 'ar' ? 'تعديل' : 'Edit'}</button><button className={app.status === 'suspended' ? 'secondary-button' : 'danger-button'} onClick={() => void toggleSuspension(app)}><Ban className="h-4 w-4" />{app.status === 'suspended' ? (language === 'ar' ? 'اعادة التفعيل' : 'Reactivate') : (language === 'ar' ? 'تعليق' : 'Suspend')}</button><button className="icon-button h-10 w-10 text-rose-500" onClick={async () => { if (confirm(language === 'ar' ? 'حذف التطبيق' : 'Delete app')) { await supabase.from('apps').delete().eq('id', app.id); await refresh(); } }}><Trash2 className="h-4 w-4" /></button></div></div>)}</section>
    </div>}

    {tab === 'categories' && <div className="mt-5 grid gap-4 lg:grid-cols-[.9fr_1.1fr]"><section className="content-panel p-5 sm:p-6"><h2 className="font-black">{language === 'ar' ? 'اضافة او تعديل قسم' : 'Add or edit category'}</h2><p className="muted-text mt-1 text-[11px]">{language === 'ar' ? 'اختر البيانات التي ستظهر للمستخدم في صفحة الاستكشاف' : 'Choose the data shown in Explore'}</p><div className="mt-5 space-y-4"><label className="field-block"><span>{language === 'ar' ? 'عنوان القسم في الرابط' : 'Category URL name'}</span><input dir="ltr" value={categoryForm.slug} onChange={(e) => setCategoryForm((c) => ({ ...c, slug: e.target.value }))} placeholder="web3" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="field-block"><span>{language === 'ar' ? 'الاسم بالعربية' : 'Arabic name'}</span><input value={categoryForm.name_ar} onChange={(e) => setCategoryForm((c) => ({ ...c, name_ar: e.target.value }))} /></label><label className="field-block"><span>{language === 'ar' ? 'الاسم بالانجليزية' : 'English name'}</span><input dir="ltr" value={categoryForm.name_en} onChange={(e) => setCategoryForm((c) => ({ ...c, name_en: e.target.value }))} /></label></div><label className="field-block"><span>{language === 'ar' ? 'الوصف بالعربية' : 'Arabic description'}</span><textarea rows={2} value={categoryForm.description_ar} onChange={(e) => setCategoryForm((c) => ({ ...c, description_ar: e.target.value }))} /></label><label className="field-block"><span>{language === 'ar' ? 'الوصف بالانجليزية' : 'English description'}</span><textarea rows={2} dir="ltr" value={categoryForm.description_en} onChange={(e) => setCategoryForm((c) => ({ ...c, description_en: e.target.value }))} /></label>
          <div><p className="mb-2 text-xs font-black text-slate-500">{language === 'ar' ? 'ايقونة القسم' : 'Category icon'}</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{categoryIcons.map(([id, Icon]) => <button type="button" key={id} onClick={() => setCategoryForm((c) => ({ ...c, icon: id }))} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 text-[10px] font-black transition ${categoryForm.icon === id ? 'border-cyan-400 bg-cyan-400/10 text-cyan-500' : 'border-slate-200/60 bg-slate-100/50 text-slate-500 dark:border-white/10 dark:bg-white/[0.03]'}`}><Icon className="h-5 w-5" /><span>{categoryIconLabels[id][language]}</span></button>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="field-block"><span>{language === 'ar' ? 'ترتيب الظهور' : 'Display order'}</span><input type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm((c) => ({ ...c, sort_order: Number(e.target.value) }))} /></label><label className="toggle-tile self-end"><input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm((c) => ({ ...c, is_active: e.target.checked }))} />{language === 'ar' ? 'القسم مفعل' : 'Category active'}</label></div><button className="primary-button w-full" onClick={() => void saveCategory()}><Save className="h-4 w-4" />{language === 'ar' ? 'حفظ القسم' : 'Save category'}</button></div></section><section className="space-y-2">{categories.map((category) => { const CategoryIcon = categoryIcon(category.icon); return <div key={category.id} className="content-panel flex items-center gap-3 p-4"><CategoryIcon className="h-5 w-5 text-cyan-500" /><div className="min-w-0 flex-1"><p className="font-black">{language === 'ar' ? category.name_ar : category.name_en}</p><p className="text-[10px] font-semibold text-slate-500">{category.slug} · {categoryIconLabels[category.icon]?.[language] || category.icon}</p></div><button className="secondary-button" onClick={() => setCategoryForm({ id: category.id, slug: category.slug, name_ar: category.name_ar, name_en: category.name_en, description_ar: category.description_ar || '', description_en: category.description_en || '', icon: category.icon, sort_order: category.sort_order, is_active: category.is_active })}>{language === 'ar' ? 'تعديل' : 'Edit'}</button></div>})}</section></div>}

    {tab === 'developer' && <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
      <section className="content-panel p-5 sm:p-6">
        <div className="flex items-start gap-3"><div className="soft-icon flex h-11 w-11 items-center justify-center rounded-2xl"><UserCog className="h-5 w-5" /></div><div><h2 className="font-black">{language === 'ar' ? 'إعدادات إدراج المطورين' : 'Developer listing settings'}</h2><p className="muted-text mt-1 text-[11px] font-semibold">{language === 'ar' ? 'تحكم في استقبال التطبيقات والرسوم والحدود لكل مطور' : 'Control app submissions fees and account limits'}</p></div></div>
        <div className="mt-5 space-y-4">
          <label className="toggle-tile"><input type="checkbox" checked={developerSettings.listing_enabled} onChange={(e) => setDeveloperSettings((c) => ({ ...c, listing_enabled: e.target.checked }))} />{language === 'ar' ? 'السماح بطلبات إدراج جديدة' : 'Accept new app submissions'}</label>
          <label className="toggle-tile"><input type="checkbox" checked={developerSettings.fee_enabled} onChange={(e) => setDeveloperSettings((c) => ({ ...c, fee_enabled: e.target.checked }))} />{language === 'ar' ? 'تفعيل رسوم الإدراج' : 'Enable listing fee'}</label>
          <label className="field-block"><span>{language === 'ar' ? 'رسوم الإدراج بعملة Pi' : 'Listing fee in Pi'}</span><input type="number" min="0" step="0.01" value={developerSettings.fee_amount} disabled={!developerSettings.fee_enabled} onChange={(e) => setDeveloperSettings((c) => ({ ...c, fee_amount: Number(e.target.value) }))} /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="field-block"><span>{language === 'ar' ? 'الحد الأقصى للتطبيقات لكل مطور' : 'Maximum apps per developer'}</span><input type="number" min="1" value={developerSettings.max_apps_per_developer} onChange={(e) => setDeveloperSettings((c) => ({ ...c, max_apps_per_developer: Number(e.target.value) }))} /></label><label className="field-block"><span>{language === 'ar' ? 'الحد الأقصى للطلبات النشطة' : 'Maximum active review requests'}</span><input type="number" min="1" value={developerSettings.max_pending_submissions} onChange={(e) => setDeveloperSettings((c) => ({ ...c, max_pending_submissions: Number(e.target.value) }))} /></label></div>
          <button className="primary-button w-full" onClick={() => void saveDeveloperSettings()}><Save className="h-4 w-4" />{language === 'ar' ? 'حفظ إعدادات المطورين' : 'Save developer settings'}</button>
        </div>
      </section>
      <section className="content-panel p-5 sm:p-6"><h3 className="font-black">{language === 'ar' ? 'طريقة العمل' : 'How it works'}</h3><div className="mt-4 space-y-3 text-xs font-semibold leading-6 text-slate-500"><p>{language === 'ar' ? 'رسوم الإدراج تطبق على التطبيق الجديد فقط ولا تطبق على تحديث تطبيق منشور' : 'The listing fee applies only to new apps and not updates to published apps'}</p><p>{language === 'ar' ? 'السعر يحفظ داخل الطلب عند إنشائه لذلك تغيير السعر لا يؤثر على الطلبات السابقة' : 'The fee is saved with each request so later price changes do not affect existing requests'}</p><p>{language === 'ar' ? 'طلبات الإدراج المدفوعة لا تصبح قابلة للمراجعة إلا بعد تأكيد الدفع' : 'Paid listing requests become reviewable only after payment is confirmed'}</p></div></section>
    </div>}


    {tab === 'submissions' && <div className="mt-5"><div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">{(['pending','changes_requested','approved','rejected','all'] as const).map((status) => <button key={status} onClick={() => setSubmissionFilter(status)} className={`category-chip ${submissionFilter === status ? 'category-chip-active' : ''}`}>{status === 'all' ? (language === 'ar' ? 'الكل' : 'All') : status === 'pending' ? (language === 'ar' ? 'قيد المراجعة' : 'Pending') : status === 'changes_requested' ? (language === 'ar' ? 'يحتاج تعديلات' : 'Changes requested') : status === 'approved' ? (language === 'ar' ? 'تمت الموافقة' : 'Approved') : (language === 'ar' ? 'مرفوض' : 'Rejected')}</button>)}</div><div className="space-y-3">{filteredSubmissions.map((item) => {
      const paymentReady = item.submission_type === 'update' || ['paid', 'not_required'].includes(item.payment_status || 'not_required');
      const reviewable = paymentReady && (item.status === 'pending' || item.status === 'changes_requested');
      return <section key={item.id} className="content-panel p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{item.app_name}</h3><span className="pill">v{item.app_version || '1.0.0'}</span><span className="pill">{item.submission_type === 'update' ? (language === 'ar' ? 'تحديث تطبيق' : 'App update') : (language === 'ar' ? 'ادراج جديد' : 'New listing')}</span><span className="pill">{item.status === 'pending' ? (language === 'ar' ? 'قيد المراجعة' : 'Pending') : item.status === 'changes_requested' ? (language === 'ar' ? 'يحتاج تعديلات' : 'Changes requested') : item.status === 'approved' ? (language === 'ar' ? 'تمت الموافقة' : 'Approved') : (language === 'ar' ? 'مرفوض' : 'Rejected')}</span></div><p className="mt-2 break-all text-[10px] font-semibold text-slate-500" dir="ltr">{item.website_url}</p><p className="mt-3 text-xs font-semibold leading-6 text-slate-600 dark:text-slate-300">{item.description_ar}</p><div className="mt-3 flex flex-wrap gap-2">{item.submission_type === 'new' && <><span className="pill">{language === 'ar' ? 'الدفع' : 'Payment'} {paymentStatusLabel(item.payment_status, language)}</span>{Number(item.listing_price || 0) > 0 && <span className="pill">{Number(item.listing_price).toFixed(2)} Pi</span>}</>}<span className="pill">{language === 'ar' ? 'الدول' : 'Countries'} {item.countries.map((code) => code === 'ALL' ? (language === 'ar' ? 'الكل' : 'All') : code).join(' ')}</span>{item.notes && <span className="pill">{language === 'ar' ? 'ملاحظة المطور' : 'Developer note'} {item.notes}</span>}{item.review_note && <span className="pill">{language === 'ar' ? 'ملاحظة المراجعة' : 'Review note'} {item.review_note}</span>}</div></div>{reviewable && <div className="flex shrink-0 flex-wrap gap-2"><button className="primary-button" onClick={() => void reviewSubmission(item, 'approved')}><Check className="h-4 w-4" />{language === 'ar' ? 'موافقة' : 'Approve'}</button><button className="secondary-button" onClick={() => void reviewSubmission(item, 'changes_requested')}>{language === 'ar' ? 'طلب تعديلات' : 'Request changes'}</button><button className="danger-button" onClick={() => void reviewSubmission(item, 'rejected')}><X className="h-4 w-4" />{language === 'ar' ? 'رفض' : 'Reject'}</button></div>}</div></section>;
    })}{filteredSubmissions.length === 0 && <div className="empty-panel">{language === 'ar' ? 'لا توجد طلبات في هذه الحالة' : 'No submissions in this state'}</div>}</div></div>}
  </div>;
}
