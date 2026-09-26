import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { OfflinePanel } from './OfflinePanel';
import { SessionIntro } from './SessionIntro';
import { SmartInstallPrompt } from './SmartInstallPrompt';

export function AppShell() {
  const location = useLocation();
  const immersiveBrowser = location.pathname === '/browse';

  return <div className={`app-shell min-h-screen bg-app ${immersiveBrowser ? 'app-shell-browser-mode' : ''}`}>
    {!immersiveBrowser && <Header />}
    <main className={`app-main ${immersiveBrowser ? 'app-main-browser-mode' : 'app-main-fixed-header'}`}><Outlet /></main>
    {!immersiveBrowser && <BottomNav />}
    {!immersiveBrowser && <OfflinePanel />}
    {!immersiveBrowser && <SmartInstallPrompt />}
    {!immersiveBrowser && <SessionIntro />}
  </div>;
}
