import { Fingerprint, KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { signInWithPasskey } from '../lib/passkeys';

export default function Login() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const next = params.get('next') || '/';

  const login = async () => {
    if (!isSupabaseConfigured) return setMessage(language === 'ar' ? 'أضف بيانات Supabase في .env أولا.' : 'Configure Supabase in .env first.');
    setLoading(true); setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setMessage(error.message); else navigate(next, { replace: true });
  };

  const passkey = async () => {
    if (!email.trim()) return setMessage(language === 'ar' ? 'اكتب البريد المرتبط بالبصمة أولا.' : 'Enter the email linked to your passkey first.');
    try {
      setLoading(true); setMessage(null);
      await signInWithPasskey(email.trim());
      navigate(next, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Passkey failed');
    } finally { setLoading(false); }
  };

  return <div className="auth-page min-h-screen px-4 py-10">
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex justify-center"><Brand /></div>
      <section className="content-panel p-5 sm:p-7">
        <div className="soft-icon mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem]"><ShieldCheck className="h-8 w-8" /></div>
        <h1 className="mt-5 text-center text-2xl font-black">{language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</h1>
        <p className="mt-2 text-center text-xs font-semibold leading-6 text-slate-400">{language === 'ar' ? 'ادخل إلى تطبيقاتك المثبتة وطلبات الإدراج وإعداداتك.' : 'Access your pinned apps, submissions, and settings.'}</p>

        <div className="mt-6 space-y-3">
          <label className="field-shell"><Mail className="h-4 w-4" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'} dir="ltr" /></label>
          <label className="field-shell"><KeyRound className="h-4 w-4" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'} dir="ltr" /></label>
          {message && <div className="form-message">{message}</div>}
          <button disabled={loading} className="primary-button w-full" onClick={() => void login()}><LogIn className="h-4 w-4" />{loading ? '...' : (language === 'ar' ? 'دخول' : 'Sign in')}</button>
          <button disabled={loading} className="secondary-button w-full" onClick={() => void passkey()}><Fingerprint className="h-5 w-5 text-cyan-300" />{language === 'ar' ? 'الدخول بالبصمة أو Passkey' : 'Sign in with passkey'}</button>
        </div>
        <p className="mt-6 text-center text-xs font-semibold text-slate-400">{language === 'ar' ? 'ليس لديك حساب؟' : 'No account?'} <Link to="/register" className="font-black text-cyan-300">{language === 'ar' ? 'إنشاء حساب' : 'Create one'}</Link></p>
      </section>
    </div>
  </div>;
}
