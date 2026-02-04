import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Truck, UserCircle, LogOut, CheckCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import kabrasLogo from '@/assets/kabras-logo.png';

const driverNavigation = [
  { name: 'My Deliveries', href: '/driver/deliveries', icon: Truck },
  { name: 'Completed', href: '/driver/completed', icon: CheckCircle },
  { name: 'Profile', href: '/driver/profile', icon: UserCircle },
];

export function DriverLayout() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img 
              src={kabrasLogo} 
              alt="Kabras Sugar" 
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-sm font-semibold text-foreground">Kabras Sugar</h1>
              <p className="text-xs text-muted-foreground">Driver App</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user?.email?.split('@')[0]}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-card">
        <div className="flex justify-around py-2">
          {driverNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-6 w-6', isActive && 'text-primary')} />
                <span className="text-xs font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
