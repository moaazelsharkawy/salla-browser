import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { DesktopRail } from './DesktopRail';
import { Header } from './Header';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { OfflinePanel } from './OfflinePanel';
import { SessionIntro } from './SessionIntro';
import { SessionResumePrompt } from './SessionResumePrompt';
import { SmartInstallPrompt } from './SmartInstallPrompt';

export function AppShell() {
  const location = useLocation(); const immersiveBrowser = location.pathname === '/browse';
  return <div className={`app-shell min-h-screen bg-app ${immersiveBrowser ? 'app-shell-browser-mode' : ''}`}><KeyboardShortcuts/>{!immersiveBrowser && <Header />}{!immersiveBrowser && <DesktopRail/>}<main className={`app-main ${immersiveBrowser ? 'app-main-browser-mode' : 'app-main-fixed-header'}`}><Outlet /></main>{!immersiveBrowser && <BottomNav />}{!immersiveBrowser && <SessionResumePrompt/>}{!immersiveBrowser && <OfflinePanel />}{!immersiveBrowser && <SmartInstallPrompt />}{!immersiveBrowser && <SessionIntro />}</div>;
}
