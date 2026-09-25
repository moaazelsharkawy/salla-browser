import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
export default function NotFound() { const { language } = useLanguage(); return <div className="page-container py-24 text-center"><h1 className="text-5xl font-black text-cyan-300">404</h1><p className="mt-3 text-sm font-semibold text-slate-400">{language === 'ar' ? 'الصفحة غير موجودة.' : 'Page not found.'}</p><Link to="/" className="primary-button mt-5 inline-flex"><Home className="h-4 w-4" />{language === 'ar' ? 'الرئيسية' : 'Home'}</Link></div>; }
