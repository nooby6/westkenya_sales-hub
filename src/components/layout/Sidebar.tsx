import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Building2,
  UserCircle,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sales Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Shipments', href: '/shipments', icon: Truck },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Sales Returns', href: '/returns', icon: RotateCcw },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

const adminNavigation = [
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Depots', href: '/depots', icon: Building2 },
  { name: 'User Management', href: '/users', icon: UserCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, role, user } = useAuth();
  const isAdminOrManager = role === 'admin' || role === 'manager';

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center transition-transform duration-300 hover:scale-110">
          <span className="text-primary-foreground font-bold text-sm">KS</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Kabras Sugar</h1>
          <p className="text-xs text-muted-foreground">Sales Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <div className="mb-2">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Main Menu
          </p>
        </div>
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 animate-fade-in',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              {item.name}
            </NavLink>
          );
        })}

        {isAdminOrManager && (
          <>
            <div className="mt-6 mb-2">
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
            </div>
            {adminNavigation.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 animate-fade-in',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
                  )}
                  style={{ animationDelay: `${(navigation.length + index) * 50}ms` }}
                >
                  <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                  {item.name}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3 animate-fade-in">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <UserCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {role?.replace('_', ' ') || 'Loading...'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
