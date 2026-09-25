import { CheckCircle2, Fingerprint, Loader2, ShieldCheck, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { activateDeveloperAccount } from '../lib/developerAuth';
import { getPasskeyStatus, registerPasskey } from '../lib/passkeys';

type State = 'working' | 'offer_passkey' | 'registering' | 'success' | 'error';

export default function AuthCallback() {
  const { language } = useLanguage();
  const { session, loading, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const started = useRef(false);
  const [state, setState] = useState<State>('working');
  const [message, setMessage] = useState<string | null>(null);
  const ar = language === 'ar';
  const next = params.get('next') || '/profile';

  useEffect(() => {
    if (loading || started.current) return;
    started.current = true;

    if (!session) {
      setState('error');
      setMessage(ar ? 'لم يكتمل تسجيل الدخول. أعد المحاولة من صفحة دخول المطورين.' : 'Sign-in did not complete. Please try again from developer sign in.');
      return;
    }

    void (async () => {
      try {
        await activateDeveloperAccount();
        await refreshProfile();
        try {
          const status = await getPasskeyStatus();
          if (status.hasPasskey) {
            navigate(next, { replace: true });
            return;
          }
        } catch {
          // A temporary passkey-status failure should not block the authenticated developer.
        }
        setState('offer_passkey');
      } catch (error) {
        setState('error');
        setMessage(error instanceof Error ? error.message : 'Developer account setup failed');
      }
    })();
  }, [ar, loading, navigate, next, refreshProfile, session]);

  const enablePasskey = async () => {
    try {
      setState('registering');
      setMessage(null);
      await registerPasskey(ar ? 'جهازي الحالي' : 'Current device');
      setState('success');
      window.setTimeout(() => navigate(next, { replace: true }), 650);
    } catch (error) {
      setState('offer_passkey');
      const raw = error instanceof Error ? error.message : 'PASSKEY_FAILED';
      setMessage(
        raw.includes('PASSKEY_UNSUPPORTED')
          ? (ar ? 'هذا الجهاز أو المتصفح لا يدعم Passkey حاليا. يمكنك المتابعة بدونها.' : 'This device or browser does not support passkeys right now. You can continue without it.')
          : (ar ? 'لم يتم تفعيل البصمة. يمكنك المحاولة مرة أخرى أو المتابعة بدونها.' : 'Passkey setup was not completed. Try again or continue without it.'),
      );
    }
  };

  return <div className="auth-page min-h-screen px-4 py-10">
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex justify-center"><Brand /></div>
      <section className="content-panel p-5 sm:p-7">
        <div className="soft-icon mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem]">
          {state === 'working' || state === 'registering' ? <Loader2 className="h-8 w-8 animate-spin" /> : state === 'success' ? <CheckCircle2 className="h-8 w-8 text-emerald-300" /> : <ShieldCheck className="h-8 w-8" />}
        </div>

        <h1 className="mt-5 text-center text-2xl font-black">
          {state === 'working' ? (ar ? 'جار تجهيز حساب المطور' : 'Setting up your developer account') : state === 'success' ? (ar ? 'تم تفعيل البصمة' : 'Passkey enabled') : state === 'error' ? (ar ? 'تعذر إكمال التسجيل' : 'Setup could not be completed') : (ar ? 'فعّل الدخول بالبصمة' : 'Enable passkey sign-in')}
        </h1>

        <p className="muted-text mt-2 text-center text-xs font-semibold leading-6">
          {state === 'offer_passkey' || state === 'registering'
            ? (ar ? 'استخدم بصمة الهاتف أو قفل الجهاز للدخول السريع والآمن في المرات القادمة. بيانات البصمة نفسها لا تغادر جهازك.' : 'Use your device biometrics or screen lock for fast, secure sign-in next time. Your biometric data never leaves your device.')
            : state === 'working'
              ? (ar ? 'ثوان قليلة ونجهز صلاحيات المطور ونفحص دعم Passkey.' : 'This only takes a moment while we prepare developer access and check passkey support.')
              : ''}
        </p>

        {message && <div className="form-message mt-5">{message}</div>}

        {state === 'offer_passkey' && <div className="mt-6 space-y-3">
          <button className="primary-button w-full" onClick={() => void enablePasskey()}><Fingerprint className="h-5 w-5" />{ar ? 'تفعيل البصمة الآن' : 'Enable passkey now'}</button>
          <button className="secondary-button w-full" onClick={() => navigate(next, { replace: true })}><SkipForward className="h-4 w-4" />{ar ? 'المتابعة بدونها الآن' : 'Continue without it for now'}</button>
        </div>}

        {state === 'registering' && <div className="developer-note mt-5"><Fingerprint className="h-5 w-5" /><p>{ar ? 'أكمل نافذة البصمة أو قفل الشاشة التي تظهر من نظام جهازك.' : 'Complete the biometric or screen-lock prompt shown by your device.'}</p></div>}
        {state === 'error' && <button className="primary-button mt-6 w-full" onClick={() => navigate('/login', { replace: true })}>{ar ? 'العودة لتسجيل الدخول' : 'Back to sign in'}</button>}
      </section>
    </div>
  </div>;
}
