import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

export function AppShell() {
  return (
    <div className="min-h-screen bg-app text-white">
      <Header />
      <main className="pb-24 md:pb-8"><Outlet /></main>
      <BottomNav />
    </div>
  );
}
