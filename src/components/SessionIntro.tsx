import { Blocks, Download, Globe2, Search, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePwaInstall } from '../hooks/usePwaInstall';

const SESSION_KEY = 'salla-browser-intro-seen-v1';

export function SessionIntro() {
  const { language } = useLanguage();
  const location = useLocation();
  const { canInstall, install } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (location.pathname !== '/') return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, '1');
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [location.pathname]);

  if (!visible) return null;

  const ar = language === 'ar';
  const close = () => setVisible(false);

  return (
    <div className="intro-overlay" role="dialog" aria-modal="true" aria-label={ar ? 'مقدمة Salla Browser' : 'Salla Browser introduction'}>
      <div className="intro-shell">
        <button className="intro-close" onClick={close} aria-label={ar ? 'تخطي' : 'Skip'}>
          <X className="h-5 w-5" />
        </button>

        <div className="intro-visual" aria-hidden="true">
          <img src="/icons/salla-browser-mark.svg" className="intro-logo" alt="" />
          <span className="intro-node intro-node-a"><Blocks className="h-5 w-5" /></span>
          <span className="intro-node intro-node-b"><Globe2 className="h-5 w-5" /></span>
          <span className="intro-node intro-node-c"><ShieldCheck className="h-5 w-5" /></span>
        </div>

        {slide === 0 ? (
          <div className="intro-copy">
            <span className="intro-kicker">Salla Browser</span>
            <h1>{ar ? 'بوابتك إلى تطبيقات Salla والويب' : 'Your gateway to Salla apps and the web'}</h1>
            <p>
              {ar
                ? 'دليل تطبيقات معتمد بتجربة Web3 حديثة وهوية سريعة وخفيفة على الهاتف والكمبيوتر.'
                : 'An approved app directory with a modern Web3 identity built to stay fast on mobile and desktop.'}
            </p>
            <div className="intro-feature-row">
              <span><ShieldCheck className="h-4 w-4" />{ar ? 'مراجعة قبل النشر' : 'Reviewed apps'}</span>
              <span><Blocks className="h-4 w-4" />Web3</span>
            </div>
          </div>
        ) : (
          <div className="intro-copy">
            <span className="intro-kicker">{ar ? 'بحث واحد أسرع' : 'One faster search'}</span>
            <h1>{ar ? 'ابدأ بالدليل وانتقل للويب عند الحاجة' : 'Start with the directory, use the web when needed'}</h1>
            <p>
              {ar
                ? 'ابحث في تطبيقات Salla مباشرة. ولو احتجت الويب نفتح بحث Google خارج الإطار المضمن بدون صفحات محظورة.'
                : 'Search Salla apps instantly. When you need the wider web, Google opens externally without blocked embedded pages.'}
            </p>
            <div className="intro-search-demo">
              <Search className="h-5 w-5" />
              <span>{ar ? 'ابحث في التطبيقات أو الويب' : 'Search apps or the web'}</span>
            </div>
          </div>
        )}

        <div className="intro-footer">
          <div className="intro-dots" aria-hidden="true">
            <span className={slide === 0 ? 'is-active' : ''} />
            <span className={slide === 1 ? 'is-active' : ''} />
          </div>
          <div className="intro-actions">
            {slide === 0 ? (
              <button className="primary-button intro-main-button" onClick={() => setSlide(1)}>
                {ar ? 'التالي' : 'Next'}
              </button>
            ) : (
              <>
                {canInstall && (
                  <button className="secondary-button" onClick={() => void install()}>
                    <Download className="h-4 w-4" />
                    {ar ? 'تثبيت' : 'Install'}
                  </button>
                )}
                <button className="primary-button intro-main-button" onClick={close}>
                  {ar ? 'ابدأ الآن' : 'Get started'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
