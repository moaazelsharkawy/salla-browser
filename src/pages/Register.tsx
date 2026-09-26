import { Eye, EyeOff, KeyRound, Mail, ShieldCheck, UserRound, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useLanguage } from '../contexts/LanguageContext';
import { signInWithGoogle } from '../lib/developerAuth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

function GoogleMark() { return <span className="google-mark" aria-hidden="true">G</span>; }

export default function Register() {
  const { language } = useLanguage(); const ar = language === 'ar'; const navigate = useNavigate();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const authUnavailable = ar ? 'خدمة إنشاء حسابات المطورين غير مفعلة حاليا حاول لاحقا' : 'Developer registration is not available right now. Please try again later.';

  const google = async () => {
    if (!isSupabaseConfigured) return setMessage(authUnavailable);
    try { setLoading(true); setMessage(null); await signInWithGoogle('/profile'); }
    catch (error) { setLoading(false); const raw = error instanceof Error ? error.message : ''; setMessage(raw === 'SUPABASE_NOT_CONFIGURED' ? authUnavailable : (ar ? 'تعذر إنشاء الحساب باستخدام Google حاول مرة أخرى' : 'Google sign up failed Please try again')); }
  };

  const register = async () => {
    if (!isSupabaseConfigured) return setMessage(authUnavailable);
    setLoading(true); setMessage(null);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim(), account_type: 'developer' } } });
    setLoading(false);
    if (error) return setMessage(ar ? 'تعذر إنشاء الحساب تحقق من البيانات أو استخدم بريدا آخر' : 'Account could not be created Check your details or use another email');
    if (!data.session) {
      setMessage(ar ? 'تم إنشاء حساب المطور راجع بريدك لتأكيده ثم سجل الدخول وبعدها سيظهر لك تفعيل البصمة' : 'Developer account created. Confirm your email, then sign in. Passkey setup will be offered after sign-in.');
      return;
    }
    navigate('/auth/callback?next=%2Fprofile&source=register', { replace: true });
  };

  return <div className="auth-page min-h-screen px-4 py-10"><div className="mx-auto max-w-md"><div className="mb-8 flex justify-center"><Brand /></div><section className="content-panel p-5 sm:p-7">
    <div className="soft-icon auth-hero-icon mx-auto flex h-20 w-20 items-center justify-center rounded-[1.65rem]"><UserPlus className="h-9 w-9" /></div><h1 className="mt-5 text-center text-2xl font-black">{ar ? 'إنشاء حساب مطور' : 'Create developer account'}</h1><div className="developer-note mt-3"><ShieldCheck className="h-5 w-5" /><p>{ar ? 'الحساب مخصص للمطورين وأصحاب التطبيقات فقط بعد نجاح التسجيل سنعرض تفعيل الدخول الآمن ببصمة الجهاز للدخول السريع' : 'Accounts are only for developers and app owners. After sign-up, we will offer secure device biometric sign in for faster sign-in.'}</p></div>

    <button disabled={loading} className="google-button mt-6 w-full" onClick={() => void google()}><GoogleMark />{ar ? 'إنشاء الحساب باستخدام Google' : 'Create account with Google'}</button>
    <div className="auth-divider"><span>{ar ? 'أو بالبريد' : 'or with email'}</span></div>

    <div className="space-y-3"><label className="field-shell"><UserRound className="h-4 w-4" /><input value={name} onChange={(e) => setName(e.target.value)} placeholder={ar ? 'اسم المطور أو الشركة' : 'Developer or company name'} /></label><label className="field-shell"><Mail className="h-4 w-4" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ar ? 'البريد الإلكتروني' : 'Email'} dir="ltr" /></label><label className="field-shell password-field"><KeyRound className="h-4 w-4" /><input type={showPassword ? 'text' : 'password'} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={ar ? 'كلمة المرور 8 أحرف على الأقل' : 'Password - 8+ characters'} dir="ltr" /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? (ar ? 'إخفاء كلمة المرور' : 'Hide password') : (ar ? 'إظهار كلمة المرور' : 'Show password')}>{showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}</button></label>{message && <div className="form-message">{message}</div>}<button disabled={loading || password.length < 8 || !email.trim()} onClick={() => void register()} className="primary-button w-full"><UserPlus className="h-4 w-4" />{loading ? '...' : (ar ? 'إنشاء حساب المطور' : 'Create developer account')}</button></div>
    <p className="muted-text mt-6 text-center text-xs font-semibold">{ar ? 'لديك حساب مطور' : 'Already have a developer account?'} <Link to="/login" className="font-black text-cyan-300">{ar ? 'دخول' : 'Sign in'}</Link></p><Link to="/" className="mt-4 block text-center text-xs font-black text-violet-300">{ar ? 'العودة للتصفح' : 'Back to browsing'}</Link>
  </section></div></div>;
}
