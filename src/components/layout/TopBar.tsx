import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileSidebar } from './MobileSidebar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export function TopBar() {
  return (
    <header className="flex h-14 md:h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <MobileSidebar />
        
        {/* Search - hidden on small mobile */}
        <div className="relative hidden sm:block sm:w-64 md:w-80 lg:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-1 md:gap-2">
        <ThemeToggle />
        <NotificationDropdown />
      </div>
    </header>
  );
}
