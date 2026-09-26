import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { SessionIntro } from './SessionIntro';

export function AppShell() {
  const location = useLocation();
  const immersiveBrowser = location.pathname === '/browse';
  return <div className={`app-shell min-h-screen bg-app ${immersiveBrowser ? 'app-shell-browser-mode' : ''}`}>
    <Header />
    <main className={`app-main ${immersiveBrowser ? 'app-main-browser-mode' : ''}`}><Outlet /></main>
    {!immersiveBrowser && <BottomNav />}
    {!immersiveBrowser && <SessionIntro />}
  </div>;
}
