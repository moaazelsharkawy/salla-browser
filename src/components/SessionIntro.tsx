import { Bookmark, Compass, Search, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const INTRO_KEY = 'salla-browser-intro-completed-v3';

export function SessionIntro() {
  const { language } = useLanguage();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const ar = language === 'ar';

  useEffect(() => {
    if (location.pathname !== '/') return;
    try {
      if (localStorage.getItem(INTRO_KEY)) return;
      setVisible(true);
    } catch { setVisible(true); }
  }, [location.pathname]);

  if (!visible) return null;
  const finish = () => {
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* first-use helper only */ }
    setVisible(false);
  };
  const slides = [
    { Icon: Compass, title: ar ? 'كل تطبيقات Salla في مكان واحد' : 'All Salla apps in one place', text: ar ? 'استكشف التطبيقات المعتمدة حسب القسم والدولة وافتحها من تجربة واحدة خفيفة' : 'Explore reviewed apps by category and country in one lightweight experience.' },
    { Icon: Bookmark, title: ar ? 'ثبت ما تستخدمه دائما' : 'Pin what you use most', text: ar ? 'المفضلة وآخر التطبيقات تبقى محفوظة على جهازك حتى بدون إنشاء حساب' : 'Pinned and recent apps stay saved on this device without requiring an account.' },
    { Icon: Search, title: ar ? 'ابحث بسرعة من أي صفحة' : 'Search quickly from anywhere', text: ar ? 'زر البحث في الهيدر يصل للتطبيقات والأقسام والويب بدون مغادرة مكانك' : 'The header search reaches apps, categories, and the web without leaving your current page.' },
  ];
  const current = slides[slide];
  const SlideIcon = current.Icon;

  return <div className="intro-overlay" role="dialog" aria-modal="true" aria-label={ar ? 'مقدمة Salla Browser' : 'Salla Browser introduction'}>
    <div className="intro-shell intro-shell-v3">
      <button className="intro-close" onClick={finish} aria-label={ar ? 'تخطي' : 'Skip'}><X className="h-5 w-5" /></button>
      <div className="intro-v3-icon"><SlideIcon /></div>
      <div className="intro-copy"><span className="intro-kicker"><ShieldCheck className="h-4 w-4" /> Salla Browser</span><h1>{current.title}</h1><p>{current.text}</p></div>
      <div className="intro-footer"><div className="intro-dots" aria-hidden="true">{slides.map((_, index) => <span key={index} className={slide === index ? 'is-active' : ''} />)}</div><div className="intro-actions">{slide > 0 && <button className="secondary-button" onClick={() => setSlide((value) => value - 1)}>{ar ? 'السابق' : 'Back'}</button>}<button className="primary-button intro-main-button" onClick={() => slide === slides.length - 1 ? finish() : setSlide((value) => value + 1)}>{slide === slides.length - 1 ? (ar ? 'ابدأ الاستكشاف' : 'Start exploring') : (ar ? 'التالي' : 'Next')}</button></div></div>
    </div>
  </div>;
}
