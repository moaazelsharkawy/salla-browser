import { Megaphone, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useLanguage } from '../contexts/LanguageContext';
import { createPromotionCheckout, promotionError } from '../lib/promotions';

type State = 'preparing' | 'error';
export default function PromotionCheckout() {
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const promotionId = params.get('promotion');
  const startupError = params.get('error');
  const [state, setState] = useState<State>(startupError ? 'error' : 'preparing');
  const [message, setMessage] = useState<string | null>(startupError ? (language === 'ar' ? 'تعذر تجهيز عملية الدفع' : 'Could not prepare checkout') : null);

  useEffect(() => {
    if (!promotionId || startupError) return;
    let active = true;
    void (async () => {
      try {
        const url = await createPromotionCheckout(promotionId);
        if (active) window.location.replace(url);
      } catch (error) {
        if (!active) return;
        setState('error');
        setMessage(promotionError(error instanceof Error ? error.message : '', language));
      }
    })();
    return () => { active = false; };
  }, [language, promotionId, startupError]);

  return <div className="checkout-launcher-page min-h-screen px-4 py-8"><div className="mx-auto max-w-md">
    <div className="mb-7 flex justify-center"><Brand /></div>
    <section className="content-panel p-6 text-center sm:p-8">
      <div className="checkout-launcher-icon mx-auto"><Megaphone className="h-8 w-8" /></div>
      <h1 className="mt-5 text-xl font-black">{language === 'ar' ? 'تعزيز ظهور التطبيق' : 'Promote your app'}</h1>
      {state === 'preparing' ? <>
        <div className="mt-6 flex items-center justify-center gap-3"><span className="soft-spinner" /><span className="text-sm font-black">{language === 'ar' ? 'جاري فتح صفحة الدفع الآمنة' : 'Opening secure checkout'}</span></div>
        <p className="muted-text mt-3 text-xs font-semibold leading-6">{language === 'ar' ? 'سيتم تحويلك إلى Salla Shop لإتمام الدفع' : 'You will be redirected to Salla Shop to complete payment'}</p>
      </> : <>
        <div className="form-message mt-5">{message}</div>
        <div className="mt-5 grid gap-2"><Link to="/my-submissions" className="primary-button w-full"><ExternalLink className="h-5 w-5" />{language === 'ar' ? 'العودة إلى تطبيقاتي' : 'Back to my apps'}</Link><button className="secondary-button w-full" onClick={() => window.close()}><X className="h-5 w-5" />{language === 'ar' ? 'إغلاق النافذة' : 'Close window'}</button></div>
      </>}
    </section>
  </div></div>;
}
