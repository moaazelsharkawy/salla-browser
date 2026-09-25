import { AppWindow, Check, FolderKanban, Gauge, Plus, Save, Settings2, ShieldCheck, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { normalizeUrl } from '../lib/url';
import type { AppSubmission, Category, DirectoryApp, EmbedMode, HealthStatus } from '../types';

const emptyApp = {
  id: '', slug: '', name: '', short_description_ar: '', short_description_en: '', description_ar: '', description_en: '', icon_url: '', website_url: '', privacy_url: '', developer_name: 'Salla', category_id: '', supported_countries: 'ALL', status: 'published', verified: true, featured: false, embed_mode: 'iframe' as EmbedMode, health_status: 'online' as HealthStatus, installable: true, sort_order: 100
};

export default function Admin() {
  const { language } = useLanguage();
  const [tab, setTab] = useState<'overview' | 'apps' | 'categories' | 'submissions'>('overview');
  const [apps, setApps] = useState<DirectoryApp[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submissions, setSubmissions] = useState<AppSubmission[]>([]);
  const [appForm, setAppForm] = useState({ ...emptyApp });
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ id: '', slug: '', name_ar: '', name_en: '', description_ar: '', description_en: '', icon: 'store', sort_order: 100, is_active: true });
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const [appsResult, categoriesResult, submissionsResult] = await Promise.all([
      supabase.from('apps').select('*, category:categories(*)').order('sort_order'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('app_submissions').select('*').order('created_at', { ascending: false })
    ]);
    setApps((appsResult.data ?? []) as DirectoryApp[]);
    setCategories((categoriesResult.data ?? []) as Category[]);
    setSubmissions((submissionsResult.data ?? []) as AppSubmission[]);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const stats = useMemo(() => ({ published: apps.filter((app) => app.status === 'published').length, featured: apps.filter((app) => app.featured).length, pending: submissions.filter((item) => item.status === 'pending').length, categories: categories.length }), [apps, submissions, categories]);

  const saveApp = async () => {
    setMessage(null);
    const websiteUrl = normalizeUrl(appForm.website_url);
    const iconUrl = appForm.icon_url ? normalizeUrl(appForm.icon_url) : null;
    const privacyUrl = appForm.privacy_url ? normalizeUrl(appForm.privacy_url) : null;
    if (!websiteUrl) return setMessage(language === 'ar' ? 'رابط التطبيق غير صالح.' : 'Invalid app URL.');
    const payload = {
      slug: appForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      name: appForm.name.trim(),
      short_description_ar: appForm.short_description_ar.trim(),
      short_description_en: appForm.short_description_en.trim(),
      description_ar: appForm.description_ar.trim(),
      description_en: appForm.description_en.trim(),
      icon_url: iconUrl,
      website_url: websiteUrl,
      privacy_url: privacyUrl,
      developer_name: appForm.developer_name.trim() || null,
      category_id: appForm.category_id || null,
      supported_countries: appForm.supported_countries.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean),
      status: appForm.status,
      verified: appForm.verified,
      featured: appForm.featured,
      embed_mode: appForm.embed_mode,
      health_status: appForm.health_status,
      installable: appForm.installable,
      sort_order: Number(appForm.sort_order || 100),
      published_at: appForm.status === 'published' ? new Date().toISOString() : null
    };
    const result = editingApp ? await supabase.from('apps').update(payload).eq('id', editingApp) : await supabase.from('apps').insert(payload);
    if (result.error) return setMessage(result.error.message);
    setAppForm({ ...emptyApp }); setEditingApp(null); setMessage(language === 'ar' ? 'تم حفظ التطبيق.' : 'App saved.'); await refresh();
  };

  const editApp = (app: DirectoryApp) => {
    setEditingApp(app.id);
    setAppForm({
      id: app.id, slug: app.slug, name: app.name, short_description_ar: app.short_description_ar, short_description_en: app.short_description_en, description_ar: app.description_ar, description_en: app.description_en, icon_url: app.icon_url || '', website_url: app.website_url, privacy_url: app.privacy_url || '', developer_name: app.developer_name || '', category_id: app.category_id || '', supported_countries: app.supported_countries.join(','), status: app.status, verified: app.verified, featured: app.featured, embed_mode: app.embed_mode, health_status: app.health_status, installable: app.installable, sort_order: app.sort_order
    });
    setTab('apps');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveCategory = async () => {
    const payload = { slug: categoryForm.slug.trim().toLowerCase().replace(/\s+/g, '-'), name_ar: categoryForm.name_ar.trim(), name_en: categoryForm.name_en.trim(), description_ar: categoryForm.description_ar.trim() || null, description_en: categoryForm.description_en.trim() || null, icon: categoryForm.icon.trim() || 'store', sort_order: Number(categoryForm.sort_order), is_active: categoryForm.is_active };
    const result = categoryForm.id ? await supabase.from('categories').update(payload).eq('id', categoryForm.id) : await supabase.from('categories').insert(payload);
    if (result.error) return setMessage(result.error.message);
    setCategoryForm({ id: '', slug: '', name_ar: '', name_en: '', description_ar: '', description_en: '', icon: 'store', sort_order: 100, is_active: true });
    setMessage(language === 'ar' ? 'تم حفظ القسم.' : 'Category saved.'); await refresh();
  };

  const reviewSubmission = async (submission: AppSubmission, status: AppSubmission['status']) => {
    const note = window.prompt(language === 'ar' ? 'ملاحظة المراجعة - اختياري' : 'Review note - optional', submission.review_note || '') ?? submission.review_note;
    const { data: authData } = await supabase.auth.getUser();

    if (status === 'approved') {
      const baseSlug = submission.app_name.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-').replace(/^-|-$/g, '') || 'app';
      const slug = `${baseSlug}-${submission.id.slice(0, 6)}`;
      const { error: createError } = await supabase.from('apps').insert({
        slug,
        name: submission.app_name,
        short_description_ar: submission.description_ar.slice(0, 160),
        short_description_en: submission.description_en.slice(0, 160),
        description_ar: submission.description_ar,
        description_en: submission.description_en,
        icon_url: submission.icon_url,
        website_url: submission.website_url,
        privacy_url: submission.privacy_url,
        developer_name: submission.contact_email,
        category_id: submission.category_id,
        supported_countries: submission.countries,
        status: 'draft',
        verified: false,
        featured: false,
        embed_mode: 'iframe',
        health_status: 'new',
        installable: true,
        sort_order: 100,
        created_by: submission.user_id,
      });
      if (createError) return setMessage(createError.message);
    }

    const { error } = await supabase.from('app_submissions').update({
      status,
      review_note: note || null,
      reviewed_by: authData.user?.id || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', submission.id);
    if (error) return setMessage(error.message);
    await refresh();
  };

  const tabs = [
    ['overview', Gauge, language === 'ar' ? 'نظرة عامة' : 'Overview'],
    ['apps', AppWindow, language === 'ar' ? 'التطبيقات' : 'Apps'],
    ['categories', FolderKanban, language === 'ar' ? 'الأقسام' : 'Categories'],
    ['submissions', ShieldCheck, language === 'ar' ? 'طلبات الإدراج' : 'Submissions']
  ] as const;

  return <div className="page-container py-7 sm:py-10">
    <section className="hero-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7"><div className="decor-orbit hero-orbit-a" /><div className="relative flex items-center gap-4"><div className="soft-icon flex h-14 w-14 items-center justify-center rounded-[1.4rem]"><Settings2 className="h-7 w-7" /></div><div><p className="text-xs font-black text-cyan-300">Salla Browser</p><h1 className="mt-1 text-2xl font-black">{language === 'ar' ? 'لوحة الإدارة' : 'Admin dashboard'}</h1></div></div></section>
    <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">{tabs.map(([id, Icon, label]) => <button key={id} onClick={() => setTab(id)} className={`category-chip ${tab === id ? 'category-chip-active' : ''}`}><Icon className="h-4 w-4" />{label}{id === 'submissions' && stats.pending > 0 && <span className="rounded-full bg-rose-400 px-1.5 text-[9px] text-white">{stats.pending}</span>}</button>)}</div>
    {message && <div className="form-message mt-4">{message}</div>}

    {tab === 'overview' && <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[[stats.published, language === 'ar' ? 'تطبيق منشور' : 'Published apps'], [stats.featured, language === 'ar' ? 'مميز' : 'Featured'], [stats.pending, language === 'ar' ? 'ينتظر المراجعة' : 'Pending'], [stats.categories, language === 'ar' ? 'قسم' : 'Categories']].map(([value, label]) => <div key={String(label)} className="content-panel p-5"><p className="text-3xl font-black text-cyan-300">{value}</p><p className="mt-2 text-xs font-bold text-slate-400">{label}</p></div>)}</div>}

    {tab === 'apps' && <div className="mt-5 grid gap-4 xl:grid-cols-[.95fr_1.35fr]">
      <section className="content-panel p-5"><div className="flex items-center justify-between"><h2 className="font-black">{editingApp ? (language === 'ar' ? 'تعديل التطبيق' : 'Edit app') : (language === 'ar' ? 'إضافة تطبيق' : 'Add app')}</h2>{editingApp && <button className="secondary-button" onClick={() => { setEditingApp(null); setAppForm({ ...emptyApp }); }}><X className="h-4 w-4" />{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>}</div><div className="mt-4 grid gap-3">
        {(['name','slug','website_url','icon_url','developer_name'] as const).map((key) => <label key={key} className="field-block"><span>{key}</span><input dir={key.includes('url') || key === 'slug' ? 'ltr' : undefined} value={String(appForm[key])} onChange={(e) => setAppForm((current) => ({ ...current, [key]: e.target.value }))} /></label>)}
        <label className="field-block"><span>short_description_ar</span><input value={appForm.short_description_ar} onChange={(e) => setAppForm((c) => ({ ...c, short_description_ar: e.target.value }))} /></label>
        <label className="field-block"><span>short_description_en</span><input dir="ltr" value={appForm.short_description_en} onChange={(e) => setAppForm((c) => ({ ...c, short_description_en: e.target.value }))} /></label>
        <label className="field-block"><span>description_ar</span><textarea rows={3} value={appForm.description_ar} onChange={(e) => setAppForm((c) => ({ ...c, description_ar: e.target.value }))} /></label>
        <label className="field-block"><span>description_en</span><textarea rows={3} dir="ltr" value={appForm.description_en} onChange={(e) => setAppForm((c) => ({ ...c, description_en: e.target.value }))} /></label>
        <div className="grid grid-cols-2 gap-2"><label className="field-block"><span>{language === 'ar' ? 'القسم' : 'Category'}</span><select value={appForm.category_id} onChange={(e) => setAppForm((c) => ({ ...c, category_id: e.target.value }))}><option value="">-</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_ar}</option>)}</select></label><label className="field-block"><span>sort_order</span><input type="number" value={appForm.sort_order} onChange={(e) => setAppForm((c) => ({ ...c, sort_order: Number(e.target.value) }))} /></label></div>
        <label className="field-block"><span>supported_countries</span><input dir="ltr" value={appForm.supported_countries} onChange={(e) => setAppForm((c) => ({ ...c, supported_countries: e.target.value }))} /></label>
        <div className="grid grid-cols-3 gap-2"><label className="field-block"><span>status</span><select value={appForm.status} onChange={(e) => setAppForm((c) => ({ ...c, status: e.target.value as typeof c.status }))}><option value="draft">draft</option><option value="published">published</option><option value="suspended">suspended</option></select></label><label className="field-block"><span>embed</span><select value={appForm.embed_mode} onChange={(e) => setAppForm((c) => ({ ...c, embed_mode: e.target.value as EmbedMode }))}><option value="iframe">iframe</option><option value="external">external</option></select></label><label className="field-block"><span>health</span><select value={appForm.health_status} onChange={(e) => setAppForm((c) => ({ ...c, health_status: e.target.value as HealthStatus }))}><option>online</option><option>maintenance</option><option>new</option><option>updated</option><option>offline</option></select></label></div>
        <div className="grid grid-cols-3 gap-2 text-xs font-bold">{(['verified','featured','installable'] as const).map((key) => <label key={key} className="toggle-tile"><input type="checkbox" checked={appForm[key]} onChange={(e) => setAppForm((c) => ({ ...c, [key]: e.target.checked }))} />{key}</label>)}</div>
        <button className="primary-button w-full" onClick={() => void saveApp()} disabled={!appForm.name || !appForm.slug || !appForm.website_url}><Save className="h-4 w-4" />{language === 'ar' ? 'حفظ التطبيق' : 'Save app'}</button>
      </div></section>
      <section className="space-y-2">{apps.map((app) => <div key={app.id} className="content-panel flex items-center gap-3 p-3"><div className="app-icon h-11 w-11 overflow-hidden rounded-xl">{app.icon_url && <img src={app.icon_url} className="h-full w-full object-cover" alt="" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{app.name}</p><p className="truncate text-[10px] font-semibold text-slate-500" dir="ltr">{app.website_url}</p></div><button className="secondary-button" onClick={() => editApp(app)}>{language === 'ar' ? 'تعديل' : 'Edit'}</button><button className="icon-button h-10 w-10 text-rose-300" onClick={async () => { if (confirm(language === 'ar' ? 'حذف التطبيق؟' : 'Delete app?')) { await supabase.from('apps').delete().eq('id', app.id); await refresh(); } }}><Trash2 className="h-4 w-4" /></button></div>)}</section>
    </div>}

    {tab === 'categories' && <div className="mt-5 grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><section className="content-panel p-5"><h2 className="font-black">{language === 'ar' ? 'إضافة أو تعديل قسم' : 'Add or edit category'}</h2><div className="mt-4 space-y-3">{(['slug','name_ar','name_en','icon'] as const).map((key) => <label key={key} className="field-block"><span>{key}</span><input value={String(categoryForm[key])} onChange={(e) => setCategoryForm((c) => ({ ...c, [key]: e.target.value }))} /></label>)}<label className="field-block"><span>sort_order</span><input type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm((c) => ({ ...c, sort_order: Number(e.target.value) }))} /></label><button className="primary-button w-full" onClick={() => void saveCategory()}><Save className="h-4 w-4" />{language === 'ar' ? 'حفظ القسم' : 'Save category'}</button></div></section><section className="space-y-2">{categories.map((category) => <div key={category.id} className="content-panel flex items-center gap-3 p-4"><FolderKanban className="h-5 w-5 text-cyan-300" /><div className="min-w-0 flex-1"><p className="font-black">{category.name_ar} / {category.name_en}</p><p className="text-[10px] font-semibold text-slate-500">{category.slug}</p></div><button className="secondary-button" onClick={() => setCategoryForm({ id: category.id, slug: category.slug, name_ar: category.name_ar, name_en: category.name_en, description_ar: category.description_ar || '', description_en: category.description_en || '', icon: category.icon, sort_order: category.sort_order, is_active: category.is_active })}>{language === 'ar' ? 'تعديل' : 'Edit'}</button></div>)}</section></div>}

    {tab === 'submissions' && <div className="mt-5 space-y-3">{submissions.map((item) => <section key={item.id} className="content-panel p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{item.app_name}</h3><span className="pill">{item.status}</span></div><p className="mt-1 break-all text-[10px] font-semibold text-slate-500" dir="ltr">{item.website_url}</p><p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.description_ar}</p></div><div className="flex shrink-0 flex-wrap gap-2"><button className="primary-button" onClick={() => void reviewSubmission(item, 'approved')}><Check className="h-4 w-4" />{language === 'ar' ? 'موافقة' : 'Approve'}</button><button className="secondary-button" onClick={() => void reviewSubmission(item, 'changes_requested')}>{language === 'ar' ? 'تعديلات' : 'Changes'}</button><button className="danger-button" onClick={() => void reviewSubmission(item, 'rejected')}><X className="h-4 w-4" />{language === 'ar' ? 'رفض' : 'Reject'}</button></div></div></section>)}</div>}
  </div>;
}
