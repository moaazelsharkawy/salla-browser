import { CircleDollarSign, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useLanguage } from '../contexts/LanguageContext';
import { createListingCheckout, friendlySubmissionError } from '../lib/developerListing';

type CheckoutState = 'waiting' | 'preparing' | 'error';

export default function ListingCheckout() {
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const submissionId = params.get('submission');
  const startupError = params.get('error');
  const [state, setState] = useState<CheckoutState>(startupError ? 'error' : submissionId ? 'preparing' : 'waiting');
  const [message, setMessage] = useState<string | null>(startupError ? (language === 'ar' ? 'تعذر إنشاء الطلب ويمكنك العودة إلى النموذج والمحاولة مرة أخرى' : 'The request could not be created You can return to the form and try again') : null);

  useEffect(() => {
    if (!submissionId || startupError) return;
    let active = true;
    setState('preparing');
    setMessage(null);
    void (async () => {
      try {
        const checkoutUrl = await createListingCheckout(submissionId);
        if (active) window.location.replace(checkoutUrl);
      } catch (error) {
        if (!active) return;
        setState('error');
        setMessage(friendlySubmissionError(error instanceof Error ? error.message : '', language));
      }
    })();
    return () => { active = false; };
  }, [language, startupError, submissionId]);

  const waitingText = state === 'waiting'
    ? (language === 'ar' ? 'جاري تجهيز طلب الدفع' : 'Preparing your payment request')
    : (language === 'ar' ? 'جاري فتح صفحة الدفع الآمنة' : 'Opening secure checkout');

  return <div className="checkout-launcher-page min-h-screen px-4 py-8">
    <div className="mx-auto max-w-md">
      <div className="mb-7 flex justify-center"><Brand /></div>
      <section className="content-panel p-6 text-center sm:p-8">
        <div className="checkout-launcher-icon mx-auto"><CircleDollarSign className="h-8 w-8" /></div>
        <h1 className="mt-5 text-xl font-black">{language === 'ar' ? 'رسوم إدراج التطبيق' : 'App listing fee'}</h1>
        {state !== 'error' ? <>
          <div className="mt-6 flex items-center justify-center gap-3"><span className="soft-spinner" /><span className="text-sm font-black">{waitingText}</span></div>
          <p className="muted-text mt-3 text-xs font-semibold leading-6">{language === 'ar' ? 'سيتم تحويلك إلى Salla Shop لإتمام الدفع بشكل آمن' : 'You will be redirected to Salla Shop to complete payment securely'}</p>
        </> : <>
          <div className="form-message mt-5">{message}</div>
          <div className="mt-5 grid gap-2">
            <Link to="/my-submissions" className="primary-button w-full"><ExternalLink className="h-5 w-5" />{language === 'ar' ? 'العودة إلى طلباتي' : 'Back to my submissions'}</Link>
            <button className="secondary-button w-full" onClick={() => window.close()}><X className="h-5 w-5" />{language === 'ar' ? 'إغلاق النافذة' : 'Close window'}</button>
          </div>
        </>}
      </section>
    </div>
  </div>;
}
