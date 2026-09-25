import { Globe2, Image, Mail, Send, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { normalizeUrl } from '../lib/url';
import type { Category } from '../types';

export default function SubmitApp() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ app_name: '', website_url: '', icon_url: '', description_ar: '', description_en: '', category_id: '', countries: 'ALL', privacy_url: '', contact_email: user?.email || '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!user || !isSupabaseConfigured) return;
    const website = normalizeUrl(form.website_url);
    const icon = form.icon_url ? normalizeUrl(form.icon_url) : null;
    const privacy = form.privacy_url ? normalizeUrl(form.privacy_url) : null;
    if (!website) return setMessage(language === 'ar' ? 'رابط التطبيق غير صالح.' : 'Invalid app URL.');
    setLoading(true); setMessage(null);
    const { error } = await supabase.from('app_submissions').insert({
      user_id: user.id,
      app_name: form.app_name.trim(),
      website_url: website,
      icon_url: icon,
      description_ar: form.description_ar.trim(),
      description_en: form.description_en.trim(),
      category_id: form.category_id || null,
      countries: form.countries.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean),
      privacy_url: privacy,
      contact_email: form.contact_email.trim(),
      notes: form.notes.trim() || null
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else {
      setMessage(language === 'ar' ? 'تم إرسال الطلب للمراجعة بنجاح.' : 'Submission sent for review.');
      setForm((current) => ({ ...current, app_name: '', website_url: '', icon_url: '', description_ar: '', description_en: '', privacy_url: '', notes: '' }));
    }
  };

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Send} title={language === 'ar' ? 'طلب إدراج تطبيق' : 'Submit an app'} description={language === 'ar' ? 'أرسل بيانات تطبيقك وسيظهر بعد المراجعة والموافقة' : 'Send your app details for review and approval'} action={<Link to="/my-submissions" className="secondary-button hidden sm:inline-flex">{language === 'ar' ? 'طلباتي' : 'My submissions'}</Link>} />
    <section className="content-panel p-5 sm:p-7">
      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-cyan-400/[0.06] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" /><p className="text-xs font-semibold leading-6 text-slate-300">{language === 'ar' ? 'الإدراج ليس تلقائيا. الإدارة تراجع الرابط والوصف وسياسة الخصوصية والدول قبل النشر.' : 'Listing is not automatic. Admins review the URL, description, privacy policy, and countries before publishing.'}</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="field-block"><span>{language === 'ar' ? 'اسم التطبيق' : 'App name'}</span><input value={form.app_name} onChange={(e) => update('app_name', e.target.value)} /></label>
        <label className="field-block"><span>{language === 'ar' ? 'رابط التطبيق' : 'App URL'}</span><div className="field-shell"><Globe2 className="h-4 w-4" /><input dir="ltr" value={form.website_url} onChange={(e) => update('website_url', e.target.value)} placeholder="https://" /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'رابط الأيقونة' : 'Icon URL'}</span><div className="field-shell"><Image className="h-4 w-4" /><input dir="ltr" value={form.icon_url} onChange={(e) => update('icon_url', e.target.value)} placeholder="https://" /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'بريد التواصل' : 'Contact email'}</span><div className="field-shell"><Mail className="h-4 w-4" /><input dir="ltr" type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} /></div></label>
        <label className="field-block"><span>{language === 'ar' ? 'القسم' : 'Category'}</span><select value={form.category_id} onChange={(e) => update('category_id', e.target.value)}><option value="">-</option>{categories.map((category) => <option key={category.id} value={category.id}>{language === 'ar' ? category.name_ar : category.name_en}</option>)}</select></label>
        <label className="field-block"><span>{language === 'ar' ? 'الدول - رموز مفصولة بفاصلة' : 'Countries - comma-separated codes'}</span><input dir="ltr" value={form.countries} onChange={(e) => update('countries', e.target.value)} placeholder="ALL or EG,SA,AE" /></label>
        <label className="field-block md:col-span-2"><span>{language === 'ar' ? 'وصف عربي' : 'Arabic description'}</span><textarea rows={4} value={form.description_ar} onChange={(e) => update('description_ar', e.target.value)} /></label>
        <label className="field-block md:col-span-2"><span>{language === 'ar' ? 'وصف إنجليزي' : 'English description'}</span><textarea rows={4} dir="ltr" value={form.description_en} onChange={(e) => update('description_en', e.target.value)} /></label>
        <label className="field-block"><span>{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy policy'}</span><input dir="ltr" value={form.privacy_url} onChange={(e) => update('privacy_url', e.target.value)} placeholder="https://" /></label>
        <label className="field-block"><span>{language === 'ar' ? 'ملاحظات للإدارة' : 'Notes for admin'}</span><input value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>
      </div>
      {message && <div className="form-message mt-4">{message}</div>}
      <button className="primary-button mt-5 w-full sm:w-auto" disabled={loading || !form.app_name.trim() || !form.website_url.trim() || !form.contact_email.trim()} onClick={() => void submit()}><Send className="h-4 w-4" />{loading ? '...' : (language === 'ar' ? 'إرسال للمراجعة' : 'Send for review')}</button>
    </section>
  </div>;
}
