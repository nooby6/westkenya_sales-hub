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
  RotateCcw,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import kabrasLogo from '@/assets/kabras-logo.png';
import { useState } from 'react';

// Navigation items for different role groups
const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sales Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Shipments', href: '/shipments', icon: Truck },
  { name: 'Sales Returns', href: '/sales-returns', icon: RotateCcw },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
];

const adminNavigation = [
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Depots', href: '/depots', icon: Building2 },
  { name: 'User Management', href: '/users', icon: UserCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const roleLabels: Record<string, string> = {
  ceo: 'CEO',
  manager: 'Manager',
  supervisor: 'Supervisor',
  sales_rep: 'Sales Rep',
  driver: 'Driver',
};

export function MobileSidebar() {
  const location = useLocation();
  const { signOut, role, user, isManagerOrHigher, isSupervisorOrHigher, canViewReports } = useAuth();
  const [open, setOpen] = useState(false);

  // Filter navigation based on role permissions
  const getVisibleNavigation = () => {
    const items = [];

    // Dashboard - visible to supervisor and higher
    if (isSupervisorOrHigher) {
      items.push(mainNavigation[0]); // Dashboard
    }

    // Sales Orders - visible to sales rep and higher
    if (role !== 'driver') {
      items.push(mainNavigation[1]); // Sales Orders
    }

    // Inventory - visible to supervisor and higher
    if (isSupervisorOrHigher) {
      items.push(mainNavigation[2]); // Inventory
    }

    // Shipments - visible to supervisor and higher (drivers use dedicated app)
    if (isSupervisorOrHigher) {
      items.push(mainNavigation[3]); // Shipments
    }

    // Sales Returns - visible to supervisor and higher
    if (isSupervisorOrHigher) {
      items.push(mainNavigation[4]); // Sales Returns
    }

    // Customers - visible to sales rep and higher
    if (role !== 'driver') {
      items.push(mainNavigation[5]); // Customers
    }

    // Reports - visible to supervisor and higher
    if (canViewReports) {
      items.push(mainNavigation[6]); // Reports
    }

    // Incidents - visible to supervisor and higher
    if (isSupervisorOrHigher) {
      items.push(mainNavigation[7]); // Incidents
    }

    return items;
  };

  const visibleNavigation = getVisibleNavigation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="flex h-16 items-center gap-2 px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <img 
              src={kabrasLogo} 
              alt="Kabras Sugar Logo" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <SheetTitle className="text-lg font-semibold text-foreground text-left">Kabras Sugar</SheetTitle>
              <p className="text-xs text-muted-foreground">Sales Management</p>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          <div className="mb-2">
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Main Menu
            </p>
          </div>
          {visibleNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <SheetClose asChild key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                  {item.name}
                </NavLink>
              </SheetClose>
            );
          })}

          {isManagerOrHigher && (
            <>
              <div className="mt-6 mb-2">
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Administration
                </p>
              </div>
              {adminNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SheetClose asChild key={item.name}>
                    <NavLink
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                      {item.name}
                    </NavLink>
                  </SheetClose>
                );
              })}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 bg-background">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {role ? roleLabels[role] : 'Loading...'}
              </p>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
