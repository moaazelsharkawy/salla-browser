import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { SessionIntro } from './SessionIntro';

export function AppShell(){return <div className="app-shell min-h-screen bg-app"><Header/><main className="app-main"><Outlet/></main><BottomNav/><SessionIntro/></div>;}
