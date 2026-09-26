import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
export default function DeepLink(){const{slug}=useParams();const navigate=useNavigate();const{language}=useLanguage();useEffect(()=>{if(slug)navigate(`/browse?app=${encodeURIComponent(slug)}`,{replace:true});else navigate('/explore',{replace:true})},[slug,navigate]);return <div className="page-container py-20 text-center muted-text"><span className="soft-spinner"/>{language==='ar'?'جاري فتح التطبيق':'Opening app'}</div>}
