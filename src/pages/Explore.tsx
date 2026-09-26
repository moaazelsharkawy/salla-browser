import { Compass, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppCard } from '../components/AppCard';
import { CategoryStrip } from '../components/CategoryStrip';
import { CountryPickerButton, CountryPickerModal } from '../components/CountryPicker';
import { SectionTitle } from '../components/SectionTitle';
import { useCountry } from '../contexts/CountryContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDirectory } from '../hooks/useDirectory';
import { useFavorites } from '../hooks/useFavorites';

export default function Explore() {
  const { language } = useLanguage(); const { country, setCountry } = useCountry();
  const { apps, categories, loading } = useDirectory(); const { favoriteIds, toggleFavorite } = useFavorites();
  const [params] = useSearchParams();
  const [category,setCategory]=useState(params.get('category') || 'all'); const [query,setQuery]=useState(params.get('q') || ''); const [countryOpen,setCountryOpen]=useState(false);
  useEffect(()=>{setCategory(params.get('category')||'all');setQuery(params.get('q')||'');},[params]);
  const filtered=useMemo(()=>apps.filter(app=>{const c=category==='all'||app.category_id===category;const co=country==='ALL'||app.supported_countries.includes('ALL')||app.supported_countries.includes(country);const q=!query.trim()||`${app.name} ${app.short_description_ar} ${app.short_description_en}`.toLowerCase().includes(query.trim().toLowerCase());return c&&co&&q;}),[apps,category,country,query]);
  return <div className="page-container py-7 sm:py-10"><SectionTitle compact icon={Compass} title={language==='ar'?'استكشف التطبيقات':'Explore apps'} description={language==='ar'?'كل تطبيقات Salla المعتمدة في دليل واحد':'All approved Salla apps in one directory'} action={<CountryPickerButton value={country} onClick={()=>setCountryOpen(true)} compact />} />
    <div className="search-shell mb-4"><Search className="h-5 w-5 text-cyan-300" /><input value={query} onChange={e=>setQuery(e.target.value)} className="search-input min-w-0 flex-1 bg-transparent" placeholder={language==='ar'?'ابحث في الدليل':'Search the directory'} /></div>
    <CategoryStrip categories={categories} selected={category} onSelect={setCategory} />
    {loading?<div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({length:6}).map((_,i)=><div key={i} className="skeleton-card h-44 rounded-[1.45rem]" />)}</div>:filtered.length?<div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map(app=><AppCard key={app.id} app={app} favorite={favoriteIds.has(app.id)} onFavorite={()=>void toggleFavorite(app.id)} />)}</div>:<div className="empty-panel mt-5">{language==='ar'?'لا توجد نتائج مطابقة':'No matching results'}</div>}
    <CountryPickerModal open={countryOpen} value={country} onChange={setCountry} onClose={()=>setCountryOpen(false)} />
  </div>;
}
