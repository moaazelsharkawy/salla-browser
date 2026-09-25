import { Fingerprint, Globe2, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { registerPasskey } from '../lib/passkeys';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const [name, setName] = useState(profile?.display_name || '');
  const [country, setCountry] = useState(profile?.country_code || 'EG');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  useEffect(() => { setName(profile?.display_name || ''); setCountry(profile?.country_code || 'EG'); }, [profile]);

  const save = async () => {
    if (!user || !isSupabaseConfigured) return;
    setSaving(true); setMessage(null);
    const { error } = await supabase.from('profiles').update({ display_name: name.trim(), country_code: country }).eq('id', user.id);
    setSaving(false);
    if (error) setMessage(error.message); else { await refreshProfile(); setMessage(language === 'ar' ? 'تم حفظ الإعدادات.' : 'Settings saved.'); }
  };

  const addPasskey = async () => {
    try { setPasskeyLoading(true); setMessage(null); await registerPasskey(); setMessage(language === 'ar' ? 'تم تفعيل البصمة/Passkey لهذا الجهاز.' : 'Passkey enabled on this device.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Passkey failed'); }
    finally { setPasskeyLoading(false); }
  };

  return <div className="page-container py-7 sm:py-10">
    <section className="hero-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7"><div className="decor-orbit hero-orbit-a" /><div className="relative flex items-center gap-4"><div className="soft-icon flex h-16 w-16 items-center justify-center rounded-[1.5rem]"><UserRound className="h-8 w-8" /></div><div className="min-w-0"><p className="text-xs font-bold text-cyan-300">{language === 'ar' ? 'حساب Salla Browser' : 'Salla Browser account'}</p><h1 className="mt-1 truncate text-2xl font-black">{profile?.display_name || user?.email}</h1><p className="mt-1 truncate text-xs font-semibold text-slate-400">{user?.email}</p></div></div></section>
    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.85fr]">
      <section className="content-panel p-5 sm:p-6"><h2 className="text-lg font-black">{language === 'ar' ? 'إعدادات الحساب' : 'Account settings'}</h2><div className="mt-5 space-y-3"><label className="field-shell"><UserRound className="h-4 w-4" /><input value={name} onChange={(e) => setName(e.target.value)} placeholder={language === 'ar' ? 'الاسم' : 'Name'} /></label><label className="field-shell opacity-70"><Mail className="h-4 w-4" /><input value={user?.email || ''} readOnly dir="ltr" /></label><label className="field-shell"><Globe2 className="h-4 w-4" /><select value={country} onChange={(e) => setCountry(e.target.value)}><option value="EG">Egypt</option><option value="SA">Saudi Arabia</option><option value="AE">UAE</option><option value="US">Global</option></select></label><button className="primary-button w-full" disabled={saving} onClick={() => void save()}><Save className="h-4 w-4" />{saving ? '...' : (language === 'ar' ? 'حفظ' : 'Save')}</button></div></section>
      <section className="content-panel p-5 sm:p-6"><div className="flex items-center gap-3"><div className="soft-icon flex h-11 w-11 items-center justify-center rounded-2xl"><Fingerprint className="h-6 w-6" /></div><div><h2 className="text-base font-black">{language === 'ar' ? 'الدخول بالبصمة' : 'Passkey sign-in'}</h2><p className="mt-1 text-[11px] font-semibold text-slate-400">{language === 'ar' ? 'استخدم بصمة الهاتف أو قفل الجهاز بدل كلمة المرور.' : 'Use device biometrics instead of your password.'}</p></div></div><button className="secondary-button mt-5 w-full" disabled={passkeyLoading} onClick={() => void addPasskey()}><ShieldCheck className="h-4 w-4 text-emerald-300" />{passkeyLoading ? '...' : (language === 'ar' ? 'تفعيل Passkey على هذا الجهاز' : 'Enable passkey on this device')}</button><p className="mt-3 text-[10px] font-semibold leading-5 text-slate-500">{language === 'ar' ? 'يتطلب HTTPS ونشر Edge Function المسماة passkey وإعداد PASSKEY_RP_ID وPASSKEY_ORIGIN.' : 'Requires HTTPS and the passkey Edge Function with PASSKEY_RP_ID and PASSKEY_ORIGIN.'}</p></section>
    </div>
    {message && <div className="form-message mt-4">{message}</div>}
  </div>;
}
