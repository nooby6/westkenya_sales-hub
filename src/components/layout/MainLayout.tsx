import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useIsMobile } from '@/hooks/use-mobile';

export function MainLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      {!isMobile && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
