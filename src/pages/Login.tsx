import { Fingerprint, KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { activateDeveloperAccount, signInWithGoogle } from '../lib/developerAuth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getPasskeyStatus, signInWithPasskey } from '../lib/passkeys';

function GoogleMark() {
  return <span className="google-mark" aria-hidden="true">G</span>;
}

export default function Login() {
  const { language } = useLanguage(); const ar = language === 'ar';
  const { refreshProfile } = useAuth();
  const navigate = useNavigate(); const [params] = useSearchParams();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const next = params.get('next') || '/submit';

  const google = async () => {
    try {
      setLoading(true); setMessage(null);
      await signInWithGoogle(next);
    } catch (error) {
      setLoading(false);
      setMessage(error instanceof Error ? error.message : 'Google sign-in failed');
    }
  };

  const login = async () => {
    if (!isSupabaseConfigured) return setMessage(ar ? 'أضف بيانات Supabase في .env أولا.' : 'Configure Supabase in .env first.');
    setLoading(true); setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setLoading(false); setMessage(error.message); return; }
    try {
      await activateDeveloperAccount();
      await refreshProfile();
      try {
        const passkeyStatus = await getPasskeyStatus();
        if (!passkeyStatus.hasPasskey) {
          navigate(`/auth/callback?next=${encodeURIComponent(next)}&source=email-login`, { replace: true });
          return;
        }
      } catch {
        // Passkey availability must never block a valid developer login.
      }
      navigate(next, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Developer account setup failed');
    } finally { setLoading(false); }
  };

  const passkey = async () => {
    if (!email.trim()) return setMessage(ar ? 'اكتب بريد حساب المطور المرتبط بالبصمة أولا.' : 'Enter your developer email first.');
    try { setLoading(true); setMessage(null); await signInWithPasskey(email.trim()); await activateDeveloperAccount(); await refreshProfile(); navigate(next, { replace: true }); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Passkey failed'); }
    finally { setLoading(false); }
  };

  return <div className="auth-page min-h-screen px-4 py-10"><div className="mx-auto max-w-md"><div className="mb-8 flex justify-center"><Brand /></div><section className="content-panel p-5 sm:p-7">
    <div className="soft-icon mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem]"><ShieldCheck className="h-8 w-8" /></div>
    <h1 className="mt-5 text-center text-2xl font-black">{ar ? 'دخول المطورين' : 'Developer sign in'}</h1>
    <p className="muted-text mt-2 text-center text-xs font-semibold leading-6">{ar ? 'التصفح وتثبيت التطبيقات لا يحتاجان حسابا. حساب المطور مطلوب فقط لإدراج تطبيق أو متابعة مراجعته.' : 'Browsing and pinning apps do not require an account. Developer access is only for submitting or tracking app listings.'}</p>

    <button disabled={loading} className="google-button mt-6 w-full" onClick={() => void google()}><GoogleMark />{ar ? 'المتابعة باستخدام Google' : 'Continue with Google'}</button>
    <div className="auth-divider"><span>{ar ? 'أو' : 'or'}</span></div>

    <div className="space-y-3"><label className="field-shell"><Mail className="h-4 w-4" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ar ? 'بريد المطور' : 'Developer email'} dir="ltr" /></label><label className="field-shell"><KeyRound className="h-4 w-4" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={ar ? 'كلمة المرور' : 'Password'} dir="ltr" /></label>{message && <div className="form-message">{message}</div>}<button disabled={loading} className="primary-button w-full" onClick={() => void login()}><LogIn className="h-4 w-4" />{loading ? '...' : (ar ? 'دخول المطور' : 'Developer sign in')}</button><button disabled={loading} className="secondary-button w-full" onClick={() => void passkey()}><Fingerprint className="h-5 w-5 text-cyan-300" />{ar ? 'الدخول بالبصمة أو Passkey' : 'Sign in with passkey'}</button></div>
    <p className="muted-text mt-6 text-center text-xs font-semibold">{ar ? 'تريد إدراج تطبيق لأول مرة؟' : 'Submitting an app for the first time?'} <Link to="/register" className="font-black text-cyan-300">{ar ? 'إنشاء حساب مطور' : 'Create developer account'}</Link></p>
    <Link to="/" className="mt-4 block text-center text-xs font-black text-violet-300">{ar ? 'العودة للتصفح بدون حساب' : 'Continue browsing without an account'}</Link>
  </section></div></div>;
}
