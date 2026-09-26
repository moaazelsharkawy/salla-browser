import { ArrowLeft, Megaphone, Rocket, Save, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionTitle } from '../components/SectionTitle';
import { useLanguage } from '../contexts/LanguageContext';
import { DEFAULT_PROMOTION_SETTINGS, loadPromotionSettings } from '../lib/promotions';
import { supabase } from '../lib/supabase';
import type { AppPromotion, DeveloperPromotionSettings } from '../types';

export default function AdminPromotions() {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<DeveloperPromotionSettings>(DEFAULT_PROMOTION_SETTINGS);
  const [items, setItems] = useState<AppPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [cfg, promotions] = await Promise.all([
      loadPromotionSettings(),
      supabase.from('app_promotions').select('*, app:apps(*)').order('created_at', { ascending: false }).limit(100),
    ]);
    setSettings(cfg);
    setItems((promotions.data ?? []) as AppPromotion[]);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = async () => {
    setSaving(true); setMessage(null);
    const normalized: DeveloperPromotionSettings = {
      boost_enabled: Boolean(settings.boost_enabled),
      boost_daily_price: Math.max(0, Number(settings.boost_daily_price || 0)),
      boost_max_days: Math.max(1, Number(settings.boost_max_days || 1)),
      home_ad_enabled: Boolean(settings.home_ad_enabled),
      home_ad_daily_price: Math.max(0, Number(settings.home_ad_daily_price || 0)),
      home_ad_max_days: Math.max(1, Number(settings.home_ad_max_days || 1)),
      home_ad_slots: Math.max(1, Number(settings.home_ad_slots || 1)),
    };
    const { error } = await supabase.from('app_settings').upsert({ key: 'developer_promotions', value: normalized, is_public: true, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return setMessage(language === 'ar' ? 'تعذر حفظ الإعدادات' : 'Could not save settings');
    setSettings(normalized);
    setMessage(language === 'ar' ? 'تم حفظ إعدادات الترويج' : 'Promotion settings saved');
  };

  const update = (key: keyof DeveloperPromotionSettings, value: boolean | number) => setSettings((current) => ({ ...current, [key]: value }));

  return <div className="page-container py-7 sm:py-10">
    <SectionTitle icon={Settings2} title={language === 'ar' ? 'إدارة الترويج والإعلانات' : 'Promotion and ads'} description={language === 'ar' ? 'تحكم في أسعار الحملات ومددها والمساحات المتاحة' : 'Control campaign pricing duration and available slots'} action={<Link to="/admin" className="secondary-button"><ArrowLeft className="h-5 w-5" />{language === 'ar' ? 'لوحة الإدارة' : 'Admin'}</Link>} />
    {message && <div className="form-message mb-5">{message}</div>}
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="content-panel p-5 sm:p-6"><div className="flex items-center gap-3"><div className="soft-icon flex h-12 w-12 items-center justify-center rounded-2xl"><Rocket className="h-6 w-6" /></div><div><h2 className="font-black">{language === 'ar' ? 'تعزيز داخل الدليل' : 'Directory boost'}</h2><p className="muted-text mt-1 text-xs">{language === 'ar' ? 'يرفع التطبيق داخل قسمه مع شارة مروج' : 'Raises apps in category with a Promoted label'}</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="field-block"><span>{language === 'ar' ? 'سعر اليوم Pi' : 'Daily price Pi'}</span><input type="number" min="0" step="0.01" value={settings.boost_daily_price} onChange={(e) => update('boost_daily_price', Number(e.target.value))} /></label><label className="field-block"><span>{language === 'ar' ? 'الحد الأقصى بالأيام' : 'Max days'}</span><input type="number" min="1" value={settings.boost_max_days} onChange={(e) => update('boost_max_days', Number(e.target.value))} /></label></div><label className="mt-4 flex items-center gap-3 font-bold"><input type="checkbox" checked={settings.boost_enabled} onChange={(e) => update('boost_enabled', e.target.checked)} />{language === 'ar' ? 'تفعيل تعزيز التطبيقات' : 'Enable app boosts'}</label></div>
      <div className="content-panel p-5 sm:p-6"><div className="flex items-center gap-3"><div className="soft-icon flex h-12 w-12 items-center justify-center rounded-2xl"><Megaphone className="h-6 w-6" /></div><div><h2 className="font-black">{language === 'ar' ? 'إعلان الصفحة الرئيسية' : 'Home page advertising'}</h2><p className="muted-text mt-1 text-xs">{language === 'ar' ? 'مساحة منفصلة وموضحة للمستخدم كإعلان' : 'A dedicated area clearly labeled as sponsored'}</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="field-block"><span>{language === 'ar' ? 'سعر اليوم Pi' : 'Daily price Pi'}</span><input type="number" min="0" step="0.01" value={settings.home_ad_daily_price} onChange={(e) => update('home_ad_daily_price', Number(e.target.value))} /></label><label className="field-block"><span>{language === 'ar' ? 'الحد الأقصى بالأيام' : 'Max days'}</span><input type="number" min="1" value={settings.home_ad_max_days} onChange={(e) => update('home_ad_max_days', Number(e.target.value))} /></label><label className="field-block"><span>{language === 'ar' ? 'عدد المساحات' : 'Ad slots'}</span><input type="number" min="1" value={settings.home_ad_slots} onChange={(e) => update('home_ad_slots', Number(e.target.value))} /></label></div><label className="mt-4 flex items-center gap-3 font-bold"><input type="checkbox" checked={settings.home_ad_enabled} onChange={(e) => update('home_ad_enabled', e.target.checked)} />{language === 'ar' ? 'تفعيل إعلانات الرئيسية' : 'Enable home ads'}</label></div>
    </section>
    <button className="primary-button mt-5" disabled={saving} onClick={() => void save()}>{saving ? <span className="button-spinner" /> : <Save className="h-5 w-5" />}{language === 'ar' ? 'حفظ الإعدادات' : 'Save settings'}</button>

    <section className="mt-8"><h2 className="mb-3 text-sm font-black">{language === 'ar' ? 'آخر الحملات' : 'Recent campaigns'}</h2>{loading ? <div className="empty-panel"><span className="soft-spinner" />{language === 'ar' ? 'جاري تحميل الحملات' : 'Loading campaigns'}</div> : items.length ? <div className="space-y-3">{items.map((item) => <div key={item.id} className="content-panel flex flex-wrap items-center justify-between gap-3 p-4"><div><strong>{item.app?.name || item.app_id}</strong><p className="muted-text mt-1 text-xs">{item.kind === 'boost' ? (language === 'ar' ? 'تعزيز الدليل' : 'Directory boost') : (language === 'ar' ? 'إعلان الرئيسية' : 'Home ad')} · {item.duration_days} {language === 'ar' ? 'يوم' : 'days'}</p></div><div className="text-end"><span className="pill">{item.status}</span><p className="mt-1 text-xs font-black">{Number(item.amount).toFixed(2)} Pi</p></div></div>)}</div> : <div className="empty-panel">{language === 'ar' ? 'لا توجد حملات حتى الآن' : 'No campaigns yet'}</div>}</section>
  </div>;
}
