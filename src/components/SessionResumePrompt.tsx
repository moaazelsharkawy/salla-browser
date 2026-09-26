import { Clock3, Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { clearLastBrowseSession, getLastBrowseSession, type LastBrowseSession } from '../lib/recent';

export function SessionResumePrompt(){const{language}=useLanguage();const{pathname}=useLocation();const ar=language==='ar';const[session,setSession]=useState<LastBrowseSession|null>(null);useEffect(()=>{if(pathname!=='/')return;const s=getLastBrowseSession();if(!s)return;const age=Date.now()-new Date(s.opened_at).getTime();if(age<7*24*60*60*1000)setSession(s)},[pathname]);if(!session)return null;return <div className="resume-session-card"><div className="resume-session-icon">{session.icon_url?<img src={session.icon_url} alt=""/>:<Clock3/>}</div><div className="min-w-0 flex-1"><strong>{ar?'متابعة آخر جلسة':'Continue last session'}</strong><p>{session.name}</p></div><Link className="primary-button compact-action" to={`/browse?app=${encodeURIComponent(session.slug)}`} onClick={()=>setSession(null)}><Play/>{ar?'متابعة':'Continue'}</Link><button className="icon-button h-10 w-10" onClick={()=>{clearLastBrowseSession();setSession(null)}}><X/></button></div>}
