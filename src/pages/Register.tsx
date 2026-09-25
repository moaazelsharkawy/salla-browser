import { KeyRound, Mail, UserRound, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function Register() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const register = async () => {
    if (!isSupabaseConfigured) return setMessage(language === 'ar' ? 'أضف بيانات Supabase أولا.' : 'Configure Supabase first.');
    setLoading(true); setMessage(null);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() } } });
    setLoading(false);
    if (error) return setMessage(error.message);
    if (!data.session) setMessage(language === 'ar' ? 'تم إنشاء الحساب. راجع بريدك لتأكيده ثم سجل الدخول.' : 'Account created. Confirm your email, then sign in.');
    else navigate('/profile', { replace: true });
  };

  return <div className="auth-page min-h-screen px-4 py-10"><div className="mx-auto max-w-md"><div className="mb-8 flex justify-center"><Brand /></div><section className="content-panel p-5 sm:p-7">
    <div className="soft-icon mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem]"><UserPlus className="h-8 w-8" /></div>
    <h1 className="mt-5 text-center text-2xl font-black">{language === 'ar' ? 'إنشاء حساب Salla' : 'Create Salla account'}</h1>
    <p className="mt-2 text-center text-xs font-semibold leading-6 text-slate-400">{language === 'ar' ? 'حساب واحد لحفظ التطبيقات وتقديم طلبات الإدراج واستخدام Passkey.' : 'One account for pinned apps, submissions, and passkey access.'}</p>
    <div className="mt-6 space-y-3">
      <label className="field-shell"><UserRound className="h-4 w-4" /><input value={name} onChange={(e) => setName(e.target.value)} placeholder={language === 'ar' ? 'الاسم' : 'Name'} /></label>
      <label className="field-shell"><Mail className="h-4 w-4" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'} dir="ltr" /></label>
      <label className="field-shell"><KeyRound className="h-4 w-4" /><input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={language === 'ar' ? 'كلمة المرور - 8 أحرف على الأقل' : 'Password - 8+ characters'} dir="ltr" /></label>
      {message && <div className="form-message">{message}</div>}
      <button disabled={loading || password.length < 8 || !email.trim()} onClick={() => void register()} className="primary-button w-full"><UserPlus className="h-4 w-4" />{loading ? '...' : (language === 'ar' ? 'إنشاء الحساب' : 'Create account')}</button>
    </div>
    <p className="mt-6 text-center text-xs font-semibold text-slate-400">{language === 'ar' ? 'لديك حساب؟' : 'Already have an account?'} <Link to="/login" className="font-black text-cyan-300">{language === 'ar' ? 'دخول' : 'Sign in'}</Link></p>
  </section></div></div>;
}
